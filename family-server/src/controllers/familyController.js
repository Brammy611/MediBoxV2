const createError = require('http-errors');
const mongoose = require('mongoose');
const FamilyAccount = require('../models/FamilyAccount');
const MedicationHistory = require('../models/MedicationHistory');
const FamilyAlert = require('../models/FamilyAlert');
const BoxStatus = require('../models/BoxStatus');
const User = require('../models/User');
const { buildEnvironmentAlerts } = require('../utils/boxStatus');

const parseLimit = (value, fallback = 50) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, 200);
};

const getMonitoredUserIds = (familyAccount) => {
  if (!familyAccount?.monitoredUsers) {
    return [];
  }
  return familyAccount.monitoredUsers
    .map((entry) => entry?.user?._id || entry?.user)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
};

const hydrateLinkedUsers = async (familyAccount) => {
  if (!familyAccount) return [];

  const ids = getMonitoredUserIds(familyAccount);
  if (ids.length === 0) {
    return [];
  }

  const users = await User.find({ _id: { $in: ids } });
  const userMap = new Map(users.map((doc) => [doc._id.toString(), doc]));

  return familyAccount.monitoredUsers.map((entry) => {
    const resolved = userMap.get(entry.user?._id?.toString() || entry.user?.toString());
    return {
      userId: resolved?._id || entry.user,
      name: resolved?.name || entry.userName,
      email: resolved?.email,
      relationship: entry.relationship,
      medications: entry.medications || [],
      user: resolved,
    };
  });
};

const getMedicationHistory = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const monitoredIds = getMonitoredUserIds(req.familyAccount);

    if (monitoredIds.length === 0) {
      return res.json([]);
    }

    const history = await MedicationHistory.find({
      user: { $in: monitoredIds },
    })
      .sort({ takenTime: -1, scheduledTime: -1, createdAt: -1 })
      .limit(limit)
      .lean({ virtuals: true });

    const enriched = history.map((item) => ({
      id: item._id,
      user_id: item.user,
      user_name: item.userName,
      medicine_name: item.medicineName,
      dosage: item.dosage,
      scheduled_time: item.scheduledTime,
      taken_time: item.takenTime,
      status: item.status,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    return res.json(enriched);
  } catch (error) {
    return next(error);
  }
};

const getFamilyAlerts = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 25);
    const familyAccount = req.familyAccount;

    const alerts = await FamilyAlert.find({ family: familyAccount._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .lean();

    const formatted = alerts.map((alert) => ({
      id: alert._id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      source: alert.source,
      created_at: alert.createdAt,
      user_id: alert.user?._id,
      user_name: alert.user?.name,
      details: alert.details,
    }));

    return res.json(formatted);
  } catch (error) {
    return next(error);
  }
};

const getFamilyProfile = async (req, res, next) => {
  try {
    const familyAccount = await FamilyAccount.findById(req.familyAccount._id).lean();
    if (!familyAccount) {
      throw createError(404, 'Family account not found');
    }

    const linkedUsers = await hydrateLinkedUsers(req.familyAccount);

    return res.json({
      id: familyAccount._id,
      relationship: familyAccount.relationship,
      contactNumber: familyAccount.contactNumber,
      notes: familyAccount.notes,
      notificationChannel: familyAccount.notificationChannel,
      alertCount: familyAccount.alertCount,
      joinedAt: familyAccount.createdAt,
      linkedUsers,
    });
  } catch (error) {
    return next(error);
  }
};

const updateFamilyProfile = async (req, res, next) => {
  try {
    const payload = {
      relationship: req.body.relationship,
      contactNumber: req.body.contactNumber,
      notes: req.body.notes,
    };

    const familyAccount = await FamilyAccount.findByIdAndUpdate(
      req.familyAccount._id,
      {
        ...payload,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!familyAccount) {
      throw createError(404, 'Family account not found');
    }

    req.familyAccount = familyAccount;

    const response = await getFamilyProfile(req, res, next);
    return response;
  } catch (error) {
    return next(error);
  }
};

const getBoxStatus = async (req, res, next) => {
  try {
    const monitoredIds = getMonitoredUserIds(req.familyAccount);
    if (monitoredIds.length === 0) {
      return res.json({ devices: [], trend: { temperature: [], humidity: [] }, generated_at: new Date() });
    }

    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const latestRecords = await BoxStatus.aggregate([
      { $match: { user: { $in: monitoredIds } } },
      { $sort: { user: 1, recordedAt: -1 } },
      {
        $group: {
          _id: '$user',
          humidity: { $first: '$humidity' },
          temperature: { $first: '$temperature' },
          light_duration: { $first: '$lightDuration' },
          motion: { $first: '$motion' },
          recorded_at: { $first: '$recordedAt' },
        },
      },
    ]);

    const trendRecords = await BoxStatus.find({
      user: { $in: monitoredIds },
      recordedAt: { $gte: windowStart },
    })
      .sort({ recordedAt: 1 })
      .lean();

    const users = await User.find({ _id: { $in: monitoredIds } }, 'name email').lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const devices = latestRecords.map((record) => {
      const userDoc = userMap.get(record._id.toString());
      const alerts = buildEnvironmentAlerts({
        humidity: record.humidity,
        temperature: record.temperature,
        motion: record.motion,
      });

      return {
        user_id: record._id,
        user_name: userDoc?.name,
        humidity: record.humidity,
        temperature: record.temperature,
        light_duration: record.light_duration,
        motion: record.motion,
        recorded_at: record.recorded_at,
        alerts,
      };
    });

    const temperatureTrend = trendRecords.map((item) => ({
      user_id: item.user,
      recorded_at: item.recordedAt,
      value: item.temperature,
    }));

    const humidityTrend = trendRecords.map((item) => ({
      user_id: item.user,
      recorded_at: item.recordedAt,
      value: item.humidity,
    }));

    return res.json({
      devices,
      trend: {
        temperature: temperatureTrend,
        humidity: humidityTrend,
      },
      generated_at: new Date(),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMedicationHistory,
  getFamilyAlerts,
  getFamilyProfile,
  updateFamilyProfile,
  getBoxStatus,
};

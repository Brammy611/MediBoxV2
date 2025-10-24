const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const FamilyAccount = require('../models/FamilyAccount');
const User = require('../models/User');

const extractToken = (authorizationHeader = '') => {
  if (authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.slice(7);
  }
  return null;
};

const resolveUserIdFromToken = (payload) => {
  if (!payload) return null;
  return (
    payload.sub
    || payload.id
    || payload.userId
    || payload.user_id
    || payload.user?.id
    || null
  );
};

const resolveRoleFromToken = (payload) => (
  payload?.role
  || payload?.user_role
  || payload?.user?.role
  || null
);

const ensureFamilyAccount = async (user) => {
  let familyAccount = await FamilyAccount.findOne({ account: user._id });
  if (!familyAccount) {
    familyAccount = await FamilyAccount.create({
      account: user._id,
      relationship: user.relationship,
    });
  }
  return familyAccount;
};

const familyAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = extractToken(header);

    if (!token) {
      throw createError(401, 'Authentication token missing');
    }

  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!secret) {
      throw createError(500, 'JWT secret is not configured');
    }

    const payload = jwt.verify(token, secret);
    const userId = resolveUserIdFromToken(payload);
    if (!userId) {
      throw createError(401, 'Invalid token payload');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError(401, 'User not found');
    }

    const roleFromToken = resolveRoleFromToken(payload);
    const effectiveRole = user.role || roleFromToken;
    if (effectiveRole !== 'family') {
      throw createError(403, 'Family role is required');
    }

    const familyAccount = await ensureFamilyAccount(user);
    await familyAccount.populate('monitoredUsers.user', 'name email role medicalHistory');

    req.auth = {
      token,
      payload,
      user,
      role: effectiveRole,
    };
    req.familyAccount = familyAccount;

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(createError(401, error.message));
    }
    return next(error);
  }
};

module.exports = {
  familyAuth,
};

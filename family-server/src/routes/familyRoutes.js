const express = require('express');
const {
  getMedicationHistory,
  getFamilyAlerts,
  getFamilyProfile,
  updateFamilyProfile,
  getBoxStatus,
} = require('../controllers/familyController');
const { familyAuth } = require('../middleware/auth');

const router = express.Router();

router.use(familyAuth);

router.get('/history', getMedicationHistory);
router.get('/alerts', getFamilyAlerts);
router.get('/profile', getFamilyProfile);
router.put('/profile', updateFamilyProfile);
router.get('/box-status', getBoxStatus);

module.exports = router;

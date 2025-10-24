const HUMIDITY_THRESHOLD = 80;
const TEMPERATURE_THRESHOLD = 30;

const buildEnvironmentAlerts = (record) => {
  if (!record) return [];
  const alerts = [];

  if (typeof record.humidity === 'number' && record.humidity > HUMIDITY_THRESHOLD) {
    alerts.push('Too Humid – Risk of medication spoilage');
  }

  if (typeof record.temperature === 'number' && record.temperature > TEMPERATURE_THRESHOLD) {
    alerts.push('High Temperature – Keep box in a cooler place');
  }

  if (record.motion === 1) {
    alerts.push('Motion detected – Box opened recently');
  }

  return alerts;
};

module.exports = {
  HUMIDITY_THRESHOLD,
  TEMPERATURE_THRESHOLD,
  buildEnvironmentAlerts,
};

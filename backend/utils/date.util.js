const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const diffDaysInclusive = (targetDate, fromDate = new Date()) => {
  const ms = new Date(targetDate).getTime() - new Date(fromDate).getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
};

module.exports = { addMonths, startOfDay, endOfDay, diffDaysInclusive };

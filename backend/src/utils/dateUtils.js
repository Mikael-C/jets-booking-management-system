const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

const formatDateTime = (date) => {
  if (!date) return '';
  return dayjs(date).format('DD MMM YYYY, HH:mm');
};

const formatDateISO = (date) => {
  if (!date) return '';
  return dayjs(date).toISOString();
};

const isExpired = (dateString) => {
  if (!dateString) return false;
  return dayjs(dateString).isBefore(dayjs());
};

const isExpiringSoon = (dateString, daysThreshold = 30) => {
  if (!dateString) return false;
  const expiry = dayjs(dateString);
  const threshold = dayjs().add(daysThreshold, 'day');
  return expiry.isBefore(threshold) && expiry.isAfter(dayjs());
};

const daysUntilExpiry = (dateString) => {
  if (!dateString) return null;
  return dayjs(dateString).diff(dayjs(), 'day');
};

const formatFlightDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const addDays = (date, days) => {
  return dayjs(date).add(days, 'day').toDate();
};

const startOfMonth = (date) => dayjs(date).startOf('month').toDate();
const endOfMonth = (date) => dayjs(date).endOf('month').toDate();
const startOfDay = (date) => dayjs(date).startOf('day').toDate();
const endOfDay = (date) => dayjs(date).endOf('day').toDate();

const getMonthRange = (monthsBack = 0) => {
  const target = dayjs().subtract(monthsBack, 'month');
  return {
    start: target.startOf('month').toDate(),
    end: target.endOf('month').toDate(),
    label: target.format('MMM YYYY'),
  };
};

const getLast12Months = () => {
  return Array.from({ length: 12 }, (_, i) => getMonthRange(11 - i));
};

module.exports = {
  dayjs,
  formatDate,
  formatDateTime,
  formatDateISO,
  isExpired,
  isExpiringSoon,
  daysUntilExpiry,
  formatFlightDuration,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getMonthRange,
  getLast12Months,
};

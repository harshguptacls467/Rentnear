/**
 * Booking Constants & Enums
 * Centralized source of truth for booking status strings, time conversions, and limits.
 */
const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  AWAITING_HANDOVER: 'awaiting_handover',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISPUTED: 'disputed'
};

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const BOOKING_CONFIG = {
  HANDOVER_OTP_EXPIRY_MINUTES: 10,
  AUTO_CANCEL_EXPIRE_HOURS: 24,
  DISPUTE_WINDOW_HOURS: 48,
  DEFAULT_DISCOUNT_PERK_POINTS: 100
};

module.exports = {
  BOOKING_STATUS,
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_HOUR,
  MS_PER_DAY,
  BOOKING_CONFIG
};

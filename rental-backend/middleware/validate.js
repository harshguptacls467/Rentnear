/**
 * validate.js — Dependency-free request validation middleware
 *
 * Validates req.body, req.params, and req.query against a plain-object schema.
 * Returns 400 with field-level errors before any controller logic runs.
 *
 * Usage:
 *   const { validate, rules } = require('../middleware/validate');
 *   router.post('/', authenticate, validate({ body: { ... } }), controller.handler);
 *
 * Schema shape:
 *   {
 *     body:   { fieldName: [rule1, rule2, ...] },
 *     params: { fieldName: [rule1, rule2, ...] },
 *     query:  { fieldName: [rule1, rule2, ...] },
 *   }
 */

// ── Built-in validation rules ──────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
const AADHAAR_REGEX = /^\d{12}$/;

const rules = {
  /**
   * Field must be present and not null/undefined/empty-string.
   */
  required: (label) => (value) => {
    if (value === undefined || value === null || value === '') {
      return `${label} is required.`;
    }
  },

  /**
   * Field must be a valid UUID v4.
   */
  uuid: (label) => (value) => {
    if (value !== undefined && value !== null && value !== '' && !UUID_REGEX.test(String(value))) {
      return `${label} must be a valid UUID.`;
    }
  },

  /**
   * Field must be a valid ISO 8601 date string.
   */
  isoDate: (label) => (value) => {
    if (value !== undefined && value !== '') {
      const d = new Date(value);
      if (!ISO_DATE_REGEX.test(String(value)) || isNaN(d.getTime())) {
        return `${label} must be a valid ISO 8601 date (e.g. 2024-08-15).`;
      }
    }
  },

  /**
   * Field must be a positive number (greater than 0).
   */
  positiveNumber: (label) => (value) => {
    if (value !== undefined && value !== null && value !== '') {
      const n = Number(value);
      if (isNaN(n) || n <= 0) {
        return `${label} must be a positive number.`;
      }
    }
  },

  /**
   * Field must be a non-empty string after trimming.
   */
  nonEmptyString: (label) => (value) => {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string' || value.trim() === '') {
        return `${label} must be a non-empty string.`;
      }
    }
  },

  /**
   * Field value must be one of the allowed enum values.
   */
  oneOf: (label, allowed) => (value) => {
    if (value !== undefined && value !== null && value !== '') {
      if (!allowed.includes(value)) {
        return `${label} must be one of: ${allowed.join(', ')}.`;
      }
    }
  },

  /**
   * Integer in [min, max] range (inclusive).
   */
  intRange: (label, min, max) => (value) => {
    if (value !== undefined && value !== null && value !== '') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < min || n > max) {
        return `${label} must be an integer between ${min} and ${max}.`;
      }
    }
  },

  /**
   * String must match the 12-digit Aadhaar format.
   */
  aadhaar: (label) => (value) => {
    if (value !== undefined && value !== null) {
      const clean = String(value).replace(/\s+/g, '');
      if (!AADHAAR_REGEX.test(clean)) {
        return `${label} must be a valid 12-digit Aadhaar number.`;
      }
    }
  },

  /**
   * Field must be a non-empty array.
   */
  nonEmptyArray: (label) => (value) => {
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value) || value.length === 0) {
        return `${label} must be a non-empty array.`;
      }
    }
  },
};

// ── Core middleware factory ─────────────────────────────────────────────────────

/**
 * validate(schema) — returns an Express middleware that validates the request.
 *
 * @param {Object} schema - { body, params, query } each mapping field names to arrays of rule functions
 * @returns Express middleware
 */
const validate = (schema = {}) => (req, res, next) => {
  const errors = [];

  const sources = {
    body:   req.body   || {},
    params: req.params || {},
    query:  req.query  || {},
  };

  for (const [source, fieldRules] of Object.entries(schema)) {
    const data = sources[source] || {};

    for (const [field, ruleFns] of Object.entries(fieldRules)) {
      const value = data[field];

      for (const ruleFn of ruleFns) {
        const errorMsg = ruleFn(value);
        if (errorMsg) {
          errors.push({ field: `${source}.${field}`, message: errorMsg });
          break; // Stop at first error per field — don't pile on
        }
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed. Please check your input.',
        status: 400,
        fields: errors,
      },
    });
  }

  next();
};

module.exports = { validate, rules };

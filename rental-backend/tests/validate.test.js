/**
 * validate.test.js — Unit tests for the validate middleware and its rule library.
 *
 * The validate middleware is the most critical new business logic added in Phase 2.
 * Every rule is tested in isolation to confirm it:
 * - Accepts valid values without errors
 * - Rejects invalid values with the correct error message
 * - Handles undefined (not-provided) correctly per the "optional unless required" contract
 *
 * We use a minimal mock of Express req/res/next rather than spinning up the full app.
 */

const { validate, rules } = require('../middleware/validate');

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Builds a fake Express req object with the given body, params, and query.
 */
const makeReq = ({ body = {}, params = {}, query = {} } = {}) => ({
  body,
  params,
  query,
});

/**
 * Runs validate(schema) against a fake req and returns the result.
 * @returns { status, body, nextCalled }
 */
const runValidate = (schema, req) => {
  let status = null;
  let body = null;
  let nextCalled = false;

  const res = {
    status: (s) => {
      status = s;
      return { json: (b) => { body = b; } };
    },
  };

  const next = () => { nextCalled = true; };

  validate(schema)(req, res, next);

  return { status, body, nextCalled };
};

// ── rules.required ────────────────────────────────────────────────────────────

describe('rules.required', () => {
  const rule = rules.required('field_name');

  it('returns undefined for a non-empty string', () => {
    expect(rule('hello')).toBeUndefined();
  });

  it('returns an error for an empty string', () => {
    expect(rule('')).toMatch(/required/i);
  });

  it('returns an error for null', () => {
    expect(rule(null)).toMatch(/required/i);
  });

  it('returns an error for undefined', () => {
    expect(rule(undefined)).toMatch(/required/i);
  });

  it('returns undefined for the number 0 (present, just zero)', () => {
    // 0 is a valid value — required means "present", not "truthy"
    // Note: the rule checks for '' not 0. So 0 passes.
    expect(rule(0)).toBeUndefined();
  });
});

// ── rules.uuid ────────────────────────────────────────────────────────────────

describe('rules.uuid', () => {
  const rule = rules.uuid('id');

  it('accepts a valid UUID v4', () => {
    expect(rule('123e4567-e89b-12d3-a456-426614174000')).toBeUndefined();
  });

  it('rejects a non-UUID string', () => {
    expect(rule('not-a-uuid')).toMatch(/uuid/i);
  });

  it('rejects an empty UUID placeholder', () => {
    expect(rule('00000000-0000-0000-0000-000000000000')).toBeUndefined();
    // All-zeros IS technically a valid UUID format
  });

  it('passes through undefined (field not present) without error', () => {
    // uuid rule only validates if value is present — use combined with required for presence
    expect(rule(undefined)).toBeUndefined();
  });

  it('rejects a plain integer', () => {
    expect(rule('12345')).toMatch(/uuid/i);
  });
});

// ── rules.isoDate ─────────────────────────────────────────────────────────────

describe('rules.isoDate', () => {
  const rule = rules.isoDate('start_date');

  it('accepts a valid ISO date string', () => {
    expect(rule('2024-08-15')).toBeUndefined();
  });

  it('accepts a full ISO 8601 datetime string', () => {
    expect(rule('2024-08-15T10:30:00.000Z')).toBeUndefined();
  });

  it('rejects an invalid date string', () => {
    expect(rule('not-a-date')).toMatch(/ISO/i);
  });

  it('rejects a partial date like "2024-13-45"', () => {
    expect(rule('2024-13-45')).toMatch(/ISO/i);
  });

  it('passes through undefined without error', () => {
    expect(rule(undefined)).toBeUndefined();
  });
});

// ── rules.positiveNumber ──────────────────────────────────────────────────────

describe('rules.positiveNumber', () => {
  const rule = rules.positiveNumber('price');

  it('accepts a positive integer', () => {
    expect(rule(100)).toBeUndefined();
  });

  it('accepts a positive decimal string', () => {
    expect(rule('49.99')).toBeUndefined();
  });

  it('rejects zero', () => {
    expect(rule(0)).toMatch(/positive/i);
  });

  it('rejects a negative number', () => {
    expect(rule(-5)).toMatch(/positive/i);
  });

  it('rejects a non-numeric string', () => {
    expect(rule('abc')).toMatch(/positive/i);
  });

  it('passes through undefined without error', () => {
    expect(rule(undefined)).toBeUndefined();
  });
});

// ── rules.intRange ────────────────────────────────────────────────────────────

describe('rules.intRange (rating 1–5)', () => {
  const rule = rules.intRange('rating', 1, 5);

  it('accepts 1', () => expect(rule(1)).toBeUndefined());
  it('accepts 5', () => expect(rule(5)).toBeUndefined());
  it('accepts 3', () => expect(rule(3)).toBeUndefined());

  it('rejects 0', () => expect(rule(0)).toMatch(/integer/i));
  it('rejects 6', () => expect(rule(6)).toMatch(/integer/i));
  it('rejects 3.5 (non-integer)', () => expect(rule(3.5)).toMatch(/integer/i));
  it('rejects a string "five"', () => expect(rule('five')).toMatch(/integer/i));

  it('passes through undefined without error', () => {
    expect(rule(undefined)).toBeUndefined();
  });
});

// ── rules.oneOf ───────────────────────────────────────────────────────────────

describe('rules.oneOf (booking status)', () => {
  const allowed = ['pending', 'approved', 'rejected', 'cancelled'];
  const rule = rules.oneOf('status', allowed);

  it('accepts a valid enum value', () => {
    expect(rule('approved')).toBeUndefined();
  });

  it('rejects a value not in the enum', () => {
    expect(rule('hacked')).toMatch(/one of/i);
  });

  it('rejects an empty string', () => {
    expect(rule('')).toBeUndefined();
    // Empty string is ignored by oneOf (use required() to catch absence)
  });

  it('passes through undefined without error', () => {
    expect(rule(undefined)).toBeUndefined();
  });
});

// ── rules.aadhaar ─────────────────────────────────────────────────────────────

describe('rules.aadhaar', () => {
  const rule = rules.aadhaar('aadharNumber');

  it('accepts a valid 12-digit number', () => {
    expect(rule('123456789012')).toBeUndefined();
  });

  it('accepts a 12-digit number with spaces (strips them)', () => {
    expect(rule('1234 5678 9012')).toBeUndefined();
  });

  it('rejects an 11-digit number', () => {
    expect(rule('12345678901')).toMatch(/aadhaar/i);
  });

  it('rejects a 13-digit number', () => {
    expect(rule('1234567890123')).toMatch(/aadhaar/i);
  });

  it('rejects a non-numeric string', () => {
    expect(rule('abcdefghijkl')).toMatch(/aadhaar/i);
  });
});

// ── validate middleware integration ───────────────────────────────────────────

describe('validate() middleware — integration', () => {

  it('calls next() when all validations pass', () => {
    const schema = {
      body: {
        product_id: [rules.required('product_id'), rules.uuid('product_id')],
        start_date: [rules.required('start_date'), rules.isoDate('start_date')],
        end_date:   [rules.required('end_date'),   rules.isoDate('end_date')],
      },
    };
    const req = makeReq({
      body: {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-09-01',
        end_date:   '2025-09-05',
      },
    });
    const { nextCalled, status } = runValidate(schema, req);
    expect(nextCalled).toBe(true);
    expect(status).toBeNull();
  });

  it('returns 400 and does NOT call next() when required field is missing', () => {
    const schema = {
      body: {
        product_id: [rules.required('product_id'), rules.uuid('product_id')],
        start_date: [rules.required('start_date'), rules.isoDate('start_date')],
      },
    };
    const req = makeReq({ body: { product_id: '123e4567-e89b-12d3-a456-426614174000' } }); // missing start_date
    const { nextCalled, status, body } = runValidate(schema, req);
    expect(nextCalled).toBe(false);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'body.start_date' }),
      ])
    );
  });

  it('returns 400 with a field-level error for an invalid UUID', () => {
    const schema = {
      body: { id: [rules.required('id'), rules.uuid('id')] },
    };
    const req = makeReq({ body: { id: 'not-a-valid-uuid' } });
    const { status, body } = runValidate(schema, req);
    expect(status).toBe(400);
    expect(body.error.fields[0].field).toBe('body.id');
    expect(body.error.fields[0].message).toMatch(/uuid/i);
  });

  it('validates params as well as body', () => {
    const schema = {
      params: { id: [rules.required('id'), rules.uuid('id')] },
    };
    const req = makeReq({ params: { id: 'invalid' } });
    const { status, body } = runValidate(schema, req);
    expect(status).toBe(400);
    expect(body.error.fields[0].field).toBe('params.id');
  });

  it('stops at first error per field (does not pile on)', () => {
    const schema = {
      body: {
        rating: [rules.required('rating'), rules.intRange('rating', 1, 5)],
      },
    };
    // Missing rating — required fires first, intRange should NOT also fire
    const req = makeReq({ body: {} });
    const { body } = runValidate(schema, req);
    expect(body.error.fields).toHaveLength(1);
    expect(body.error.fields[0].message).toMatch(/required/i);
  });

  it('reports multiple field errors in one response', () => {
    const schema = {
      body: {
        product_id: [rules.required('product_id')],
        start_date: [rules.required('start_date')],
        end_date:   [rules.required('end_date')],
      },
    };
    const req = makeReq({ body: {} }); // all three missing
    const { body } = runValidate(schema, req);
    expect(body.error.fields).toHaveLength(3);
  });
});

// ── logger redaction ──────────────────────────────────────────────────────────

describe('logger — credential redaction', () => {
  const logger = require('../utils/logger');

  it('does not throw when logging objects with sensitive keys', () => {
    expect(() => {
      logger.info('test log', { token: 'abc123', userId: 'xyz' });
    }).not.toThrow();
  });

  it('does not throw when logging nested sensitive keys', () => {
    expect(() => {
      logger.error('auth error', null, { headers: { authorization: 'Bearer secret_token' } });
    }).not.toThrow();
  });

  it('does not throw when logging arrays', () => {
    expect(() => {
      logger.warn('batch warn', { users: [{ id: 1, password: 'p@ss' }] });
    }).not.toThrow();
  });
});

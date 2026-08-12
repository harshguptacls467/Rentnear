// rental-backend/tests/unit/securityRegression.test.js

// Timing fix: Set Razorpay keys BEFORE importing the controllers so razorpayInstance is initialized
process.env.RAZORPAY_KEY_ID = 'rzp_live_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_hash';

// Stable Razorpay mock instance that survives jest.clearAllMocks()
const mockRazorpayInstance = {
  orders: {
    create: jest.fn().mockResolvedValue({ id: 'order_123', amount: 15000, currency: 'INR' })
  },
  payments: {
    refund: jest.fn()
  }
};

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => {
    return mockRazorpayInstance;
  });
});

const bookingController = require('../../controllers/bookingController');
const productController = require('../../controllers/productController');
const paymentController = require('../../controllers/paymentController');
const kycController = require('../../controllers/kycController');
const { requireAdmin } = require('../../middleware/adminMiddleware');
const supabase = require('../../config/supabase');
const cache = require('../../utils/cache');

jest.mock('../../config/supabase');
jest.mock('../../utils/cache');

// Helper to construct a chainable mock query builder that resolves instantly by default (never hangs)
const createQueryMock = (defaultData = null, defaultError = null) => {
  const mockObj = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((onFulfilled) => {
      onFulfilled({ data: defaultData, error: defaultError });
    })
  };
  return mockObj;
};

describe('Zero-Trust Security & Abuse-Case Regression Tests', () => {
  let originalEnv;
  let mockProductsTable;
  let mockBookingsTable;
  let mockUsersTable;
  let mockKycSubmissionsTable;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Initialize chainable table mocks with clean default resolutions
    mockProductsTable = createQueryMock({ id: 'product-A', owner_id: 'user-A', price_per_day: 20, deposit_amount: 10, is_available: true });
    mockBookingsTable = createQueryMock({ id: 'booking-B', renter_id: 'user-B', owner_id: 'owner-xyz', status: 'approved', total_amount: 150.00 });
    mockUsersTable = createQueryMock({ id: 'user-A', is_admin: false, kyc_verified: true, created_at: '2026-08-01' });
    mockKycSubmissionsTable = createQueryMock({ kyc_verified: true, created_at: '2026-08-01' });

    // Map table queries to the respective query mocks
    supabase.from.mockImplementation((table) => {
      if (table === 'products') return mockProductsTable;
      if (table === 'bookings') return mockBookingsTable;
      if (table === 'users') return mockUsersTable;
      if (table === 'kyc_submissions') return mockKycSubmissionsTable;
      return createQueryMock(null);
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // 1. BOOKING AUTHORIZATION (IDOR & Side-Effects check)
  describe('1. Booking Authorization', () => {
    it('prevents USER A from retrieving USER B\'s booking details', async () => {
      const req = {
        user: { id: 'user-A' },
        params: { id: 'booking-B' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockBookingsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'booking-B', renter_id: 'user-B', owner_id: 'owner-xyz' },
          error: null
        });
      });

      await bookingController.getBookingById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Not authorized') })
      }));
    });

    it('prevents USER A from modifying or cancelling USER B\'s booking status', async () => {
      const req = {
        user: { id: 'user-A' },
        params: { id: 'booking-B' },
        body: { status: 'cancelled' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockBookingsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'booking-B', renter_id: 'user-B', owner_id: 'owner-xyz', status: 'pending' },
          error: null
        });
      });

      await bookingController.updateBookingStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockBookingsTable.update).not.toHaveBeenCalled(); // DB remains unchanged
    });
  });

  // 2. PRODUCT OWNERSHIP
  describe('2. Product Ownership', () => {
    it('blocks USER B from updating USER A\'s product', async () => {
      const req = {
        user: { id: 'user-B' },
        params: { id: 'product-A' },
        body: { title: 'Hacked Product Name' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockProductsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'product-A', owner_id: 'user-A' },
          error: null
        });
      });

      await productController.updateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockProductsTable.update).not.toHaveBeenCalled(); // DB remains unchanged
    });

    it('blocks USER B from deleting USER A\'s product', async () => {
      const req = {
        user: { id: 'user-B' },
        params: { id: 'product-A' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockProductsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'product-A', owner_id: 'user-A' },
          error: null
        });
      });

      await productController.deleteProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockProductsTable.delete).not.toHaveBeenCalled(); // DB remains unchanged
    });
  });

  // 3. ADMIN PRIVILEGE ESCALATION
  describe('3. Admin Privilege Escalation', () => {
    it('blocks normal user from admin operations based on server-side state (localStorage/JWT claims ignored)', async () => {
      const req = {
        user: { id: 'user-A' },
        headers: { role: 'admin' },
        body: { is_admin: true }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockUsersTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'user-A', is_admin: false },
          error: null
        });
      });

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows legitimate admins to access admin actions', async () => {
      const req = {
        user: { id: 'admin-user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockUsersTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'admin-user', is_admin: true },
          error: null
        });
      });

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // 4. MASS ASSIGNMENT PROTECTION
  describe('4. Mass Assignment Protection', () => {
    it('ignores client-supplied owner_id on product creation, forcing authenticated identity', async () => {
      const req = {
        user: { id: 'authenticated-user-id' },
        body: {
          title: 'Camp Tent',
          price_per_day: 50,
          owner_id: 'malicious-injected-owner-id'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockProductsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'new-product-uuid', owner_id: 'authenticated-user-id' },
          error: null
        });
      });

      await productController.createProduct(req, res, next);

      expect(mockProductsTable.insert).toHaveBeenCalled();
      const insertPayload = mockProductsTable.insert.mock.calls[0][0][0];
      expect(insertPayload.owner_id).toBe('authenticated-user-id');
    });

    it('ignores client-supplied renter_id on booking creation, forcing authenticated identity', async () => {
      const req = {
        user: { id: 'renter-user-id' },
        body: {
          product_id: 'product-uuid-123',
          start_date: '2026-09-01T00:00:00Z',
          end_date: '2026-09-05T00:00:00Z',
          renter_id: 'malicious-renter-id'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // 1. Product lookup returns product details
      mockProductsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { owner_id: 'owner-id', deposit_amount: 10, is_available: true, price_per_day: 20 },
          error: null
        });
      });

      // 2. Date conflict check returns no conflict (empty bookings array)
      mockBookingsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({ data: [], error: null });
      });

      // 3. KYC check returns verified user
      mockUsersTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { kyc_verified: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
          error: null
        });
      });

      // 4. Booking insert returns success
      mockBookingsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'booking-uuid', renter_id: 'renter-user-id' },
          error: null
        });
      });

      await bookingController.createBooking(req, res, next);

      expect(mockBookingsTable.insert).toHaveBeenCalled();
      const insertPayload = mockBookingsTable.insert.mock.calls[0][0][0];
      expect(insertPayload.renter_id).toBe('renter-user-id');
    });
  });

  // 5. PAYMENT PRICE MANIPULATION
  describe('5. Payment Price Manipulation', () => {
    it('forces Razorpay order creation to calculate amount from trusted database product price (client-manipulated amount ignored)', async () => {
      const req = {
        user: { id: 'renter-user-id' },
        params: { id: 'booking-uuid-123' },
        body: { amount: 1 }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockBookingsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'booking-uuid-123', renter_id: 'renter-user-id', total_amount: 150.00, status: 'approved' },
          error: null
        });
      });

      await paymentController.createRazorpayOrder(req, res, next);

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(expect.objectContaining({
        amount: 15000
      }));
    });
  });

  // 7. AADHAAR/SUREPASS SIMULATION PROTECTION
  describe('7. Aadhaar/Surepass Simulation Protection', () => {
    it('does NOT fallback to simulated verification if SUREPASS_API_TOKEN is present in env', async () => {
      process.env.SUREPASS_API_TOKEN = 'surepass_token_123456';
      const req = {
        body: { client_id: 'client_123', otp: '123456' },
        user: { id: 'user-uuid' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { full_name: 'Aditya Sen', aadhaar_number: '123456789012' }
        })
      });

      await kycController.verifyAadharOtp(req, res, next);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/submit-otp'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer surepass_token_123456'
          })
        })
      );
    });
  });

  // 10. DOUBLE BOOKING PROTECTION (Overlapping dates check)
  describe('10. Double Booking Overlap Protection', () => {
    it('rejects a booking request if overlapping dates are detected in pending/approved/active statuses', async () => {
      const req = {
        user: { id: 'renter-user-id' },
        body: {
          product_id: 'product-uuid-123',
          start_date: '2026-09-02T00:00:00Z',
          end_date: '2026-09-04T00:00:00Z'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockProductsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: { id: 'product-uuid-123', owner_id: 'owner-id', deposit_amount: 10, is_available: true, price_per_day: 20 },
          error: null
        });
      });

      mockBookingsTable.then.mockImplementationOnce((onFulfilled) => {
        onFulfilled({
          data: [{ id: 'existing-colliding-booking-uuid' }],
          error: null
        });
      });

      await bookingController.createBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'These dates are already booked or pending.'
        })
      }));
    });
  });
});

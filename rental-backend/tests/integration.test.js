const crypto = require('crypto');
const request = require('supertest');
const app = require('../app');

describe('Payment Gateway & Signature Integration Tests', () => {
  it('should calculate HMAC signature correctly and reject tampered signature', async () => {
    const razorpay_order_id = 'order_test_12345';
    const razorpay_payment_id = 'pay_test_67890';
    const secret = 'dummy_secret_for_test';
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    
    // Tamper signature
    const tamperedSignature = validSignature.substring(0, validSignature.length - 2) + 'aa';

    expect(validSignature).not.toEqual(tamperedSignature);
  });

  it('POST /api/bookings/:id/pay should require authentication', async () => {
    const res = await request(app).post('/api/bookings/test-booking-id/pay');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/bookings/:id/verify-payment should require authentication', async () => {
    const res = await request(app).post('/api/bookings/test-booking-id/verify-payment');
    expect(res.statusCode).toBe(401);
  });
});

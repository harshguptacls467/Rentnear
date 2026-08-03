const schedulingController = require('../../controllers/schedulingController');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('Delivery & Pickup Scheduling Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('returns 400 if date query parameter is missing', async () => {
      const req = { params: { productId: 'prod-123' }, query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await schedulingController.getAvailableSlots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('filters out taken slots for target date', async () => {
      const req = { params: { productId: 'prod-123' }, query: { date: '2026-08-03' } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { handover_date: '2026-08-03', handover_time_slot: '09:00 - 11:00', return_date: '2026-08-04', return_time_slot: '11:00 - 13:00' },
            { handover_date: '2026-08-02', handover_time_slot: '13:00 - 15:00', return_date: '2026-08-03', return_time_slot: '17:00 - 19:00' }
          ],
          error: null
        })
      });

      await schedulingController.getAvailableSlots(req, res, next);
      
      const slots = res.json.mock.calls[0][0].slots;
      // 09:00 - 11:00 should be taken
      expect(slots.find(s => s.slot === '09:00 - 11:00').available).toBe(false);
      // 17:00 - 19:00 should be taken
      expect(slots.find(s => s.slot === '17:00 - 19:00').available).toBe(false);
      // 11:00 - 13:00 should be available (since return was on 08-04, not 08-03)
      expect(slots.find(s => s.slot === '11:00 - 13:00').available).toBe(true);
    });
  });

  describe('bookSchedule', () => {
    it('returns 409 conflict when target slot overlaps with existing schedules on same product', async () => {
      const req = {
        user: { id: 'renter-123' },
        body: {
          bookingId: 'book-new',
          handoverMethod: 'home_delivery',
          handoverDate: '2026-08-03',
          handoverTimeSlot: '11:00 - 13:00',
          handoverAddress: '456 Delivery St',
          returnMethod: 'self_return',
          returnDate: '2026-08-05',
          returnTimeSlot: '15:00 - 17:00'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // 1. Mock booking lookup (renter authorized)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'book-new', renter_id: 'renter-123', product_id: 'prod-999' },
          error: null
        })
      });

      // 2. Mock conflict check (finds overlap on same time slot)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [
            { id: 'sched-old', handover_time_slot: '11:00 - 13:00', return_time_slot: '17:00 - 19:00', booking: { product_id: 'prod-999' } }
          ],
          error: null
        })
      });

      await schedulingController.bookSchedule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('already booked') })
      }));
    });
  });
});

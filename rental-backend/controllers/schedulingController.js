const supabase = require('../config/supabase');
const { haversineKm } = require('../utils/geo');

const TIME_SLOTS = [
  '09:00 - 11:00',
  '11:00 - 13:00',
  '13:00 - 15:00',
  '15:00 - 17:00',
  '17:00 - 19:00'
];

const schedulingController = {
  // GET /api/scheduling/slots/:productId?date=YYYY-MM-DD
  getAvailableSlots: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ success: false, error: { message: 'Date query parameter is required.' } });
      }

      // Find other bookings for this product on the same date that have booked schedules
      // to remove those slots.
      const { data: overlappingSchedules, error: schedErr } = await supabase
        .from('booking_schedules')
        .select('handover_time_slot, return_time_slot, handover_date, return_date, booking:bookings!inner(product_id)')
        .eq('booking.product_id', productId);

      if (schedErr) throw schedErr;

      const takenSlots = new Set();
      (overlappingSchedules || []).forEach(sched => {
        if (sched.handover_date === date) {
          takenSlots.add(sched.handover_time_slot);
        }
        if (sched.return_date === date) {
          takenSlots.add(sched.return_time_slot);
        }
      });

      const availableSlots = TIME_SLOTS.map(slot => ({
        slot,
        available: !takenSlots.has(slot)
      }));

      res.json({ success: true, slots: availableSlots });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/scheduling/booking/:bookingId
  getSchedule: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;

      const { data: schedule, error: schedErr } = await supabase
        .from('booking_schedules')
        .select(`
          *,
          booking:bookings!inner(
            id, renter_id, owner_id, status,
            product:products(id, title, latitude, longitude, location)
          )
        `)
        .eq('booking_id', bookingId)
        .single();

      if (schedErr || !schedule) {
        return res.status(404).json({ success: false, error: { message: 'Schedule details not found.' } });
      }

      // Security authorization check
      if (schedule.booking.renter_id !== userId && schedule.booking.owner_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Not authorized to view schedule details.' } });
      }

      // Calculate distance and ETA (mock routing info for visual maps)
      const startLat = schedule.booking.product.latitude || 12.9716;
      const startLng = schedule.booking.product.longitude || 77.5946;
      const endLat = schedule.handover_latitude || 12.9279;
      const endLng = schedule.handover_longitude || 77.6271;

      // Distance using Haversine
      const distance = haversineKm(startLat, startLng, endLat, endLng);
      const etaMinutes = Math.round(distance * 3); // Simple 3 min/km mock

      res.json({
        success: true,
        schedule,
        routing: {
          distance,
          etaMinutes,
          startCoordinates: [startLat, startLng],
          endCoordinates: [endLat, endLng]
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/scheduling/book
  bookSchedule: async (req, res, next) => {
    try {
      const {
        bookingId,
        handoverMethod,
        handoverDate,
        handoverTimeSlot,
        handoverAddress,
        handoverLatitude,
        handoverLongitude,
        returnMethod,
        returnDate,
        returnTimeSlot
      } = req.body;

      const userId = req.user.id;

      // 1. Fetch booking to verify existence and auth
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingErr || !booking) {
        return res.status(404).json({ success: false, error: { message: 'Booking not found.' } });
      }

      if (booking.renter_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Only the renter can book pickup/delivery slots.' } });
      }

      // 2. Prevent slot overlapping for same product on same dates
      const { data: conflict } = await supabase
        .from('booking_schedules')
        .select('id, handover_time_slot, return_time_slot, booking:bookings!inner(product_id)')
        .eq('booking.product_id', booking.product_id)
        .neq('booking_id', bookingId)
        .or(`handover_date.eq.${handoverDate},return_date.eq.${returnDate}`);

      const hasConflict = (conflict || []).some(sched => 
        (sched.handover_time_slot === handoverTimeSlot) || (sched.return_time_slot === returnTimeSlot)
      );

      if (hasConflict) {
        return res.status(409).json({ success: false, error: { message: 'Selected time slot is already booked for this item. Please select a different slot.' } });
      }

      // 3. Upsert scheduling record
      const { data: newSchedule, error: upsertErr } = await supabase
        .from('booking_schedules')
        .upsert({
          booking_id: bookingId,
          handover_method: handoverMethod,
          handover_date: handoverDate,
          handover_time_slot: handoverTimeSlot,
          handover_address: handoverAddress,
          handover_latitude: handoverLatitude || 12.9279,
          handover_longitude: handoverLongitude || 77.6271,
          return_method: returnMethod,
          return_date: returnDate,
          return_time_slot: returnTimeSlot,
          status: 'scheduled'
        }, { onConflict: 'booking_id' })
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      res.status(201).json({ success: true, schedule: newSchedule });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/scheduling/:id/status
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!['scheduled', 'in_transit', 'arrived', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, error: { message: 'Invalid delivery status.' } });
      }

      const { data: schedule, error: fetchErr } = await supabase
        .from('booking_schedules')
        .select(`
          *,
          booking:bookings!inner(renter_id, owner_id)
        `)
        .eq('id', id)
        .single();

      if (fetchErr || !schedule) {
        return res.status(404).json({ success: false, error: { message: 'Schedule details not found.' } });
      }

      if (schedule.booking.renter_id !== userId && schedule.booking.owner_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ success: false, error: { message: 'Not authorized to change delivery status.' } });
      }

      const { data: updatedSchedule, error: updateErr } = await supabase
        .from('booking_schedules')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      res.json({ success: true, schedule: updatedSchedule });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = schedulingController;

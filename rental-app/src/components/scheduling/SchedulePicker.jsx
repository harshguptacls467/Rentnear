import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Truck, ChevronRight } from 'lucide-react';
import Button from '../Button';
import { schedulingService } from '../../api/schedulingService';

const SchedulePicker = ({ booking, token, isMock, onComplete }) => {
  const [handoverMethod, setHandoverMethod] = useState('self_pickup');
  const [handoverDate, setHandoverDate] = useState('');
  const [handoverSlot, setHandoverSlot] = useState('');
  const [handoverSlots, setHandoverSlots] = useState([]);
  
  const [returnMethod, setReturnMethod] = useState('self_return');
  const [returnDate, setReturnDate] = useState('');
  const [returnSlot, setReturnSlot] = useState('');
  const [returnSlots, setReturnSlots] = useState([]);

  const [address, setAddress] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set default dates aligned with booking start and end
  useEffect(() => {
    if (booking) {
      const start = new Date(booking.start_date).toISOString().split('T')[0];
      const end = new Date(booking.end_date).toISOString().split('T')[0];
      setHandoverDate(start);
      setReturnDate(end);
    }
  }, [booking]);

  // Fetch available slots for Handover Date
  useEffect(() => {
    const fetchHandoverSlots = async () => {
      if (!booking?.product_id || !handoverDate) return;
      try {
        setLoadingSlots(true);
        if (token && !isMock) {
          const res = await schedulingService.getAvailableSlots(booking.product_id, handoverDate, token);
          if (res.success) {
            setHandoverSlots(res.slots);
          }
        } else {
          // Mock slots
          setHandoverSlots([
            { slot: '09:00 - 11:00', available: true },
            { slot: '11:00 - 13:00', available: true },
            { slot: '13:00 - 15:00', available: false },
            { slot: '15:00 - 17:00', available: true },
            { slot: '17:00 - 19:00', available: true }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchHandoverSlots();
  }, [booking, handoverDate, token, isMock]);

  // Fetch available slots for Return Date
  useEffect(() => {
    const fetchReturnSlots = async () => {
      if (!booking?.product_id || !returnDate) return;
      try {
        setLoadingSlots(true);
        if (token && !isMock) {
          const res = await schedulingService.getAvailableSlots(booking.product_id, returnDate, token);
          if (res.success) {
            setReturnSlots(res.slots);
          }
        } else {
          setReturnSlots([
            { slot: '09:00 - 11:00', available: true },
            { slot: '11:00 - 13:00', available: true },
            { slot: '13:00 - 15:00', available: true },
            { slot: '15:00 - 17:00', available: false },
            { slot: '17:00 - 19:00', available: true }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchReturnSlots();
  }, [booking, returnDate, token, isMock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handoverSlot || !returnSlot) {
      alert('Please select slot windows for both handover and return.');
      return;
    }
    if (handoverMethod === 'home_delivery' && !address) {
      alert('Please enter a delivery address.');
      return;
    }

    try {
      setSubmitting(true);
      const schedulePayload = {
        bookingId: booking.id,
        handoverMethod,
        handoverDate,
        handoverTimeSlot: handoverSlot,
        handoverAddress: handoverMethod === 'home_delivery' ? address : 'Self Pickup at Item Location',
        returnMethod,
        returnDate,
        returnTimeSlot: returnSlot
      };

      if (token && !isMock) {
        const res = await schedulingService.bookSchedule(schedulePayload, token);
        if (res.success) {
          onComplete(res.schedule);
        }
      } else {
        // Mock successful save
        onComplete({
          ...schedulePayload,
          id: 'mock-sched-123',
          status: 'scheduled'
        });
      }
    } catch (err) {
      alert(err.message || 'Scheduling failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-sm space-y-6">
      <div>
        <h4 className="text-lg font-black text-navy flex items-center gap-2">
          <Truck className="text-primary" size={22} /> Coordinate Pickup & Delivery
        </h4>
        <p className="text-xs text-gray-500 mt-1">Select how and when you want to receive and return this item.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Handover Scheduling */}
        <div className="space-y-4">
          <h5 className="font-extrabold text-sm text-navy uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
            <ChevronRight size={16} className="text-primary" /> 1. Receiving Handover
          </h5>

          {/* Method Select */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHandoverMethod('self_pickup')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                handoverMethod === 'self_pickup' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MapPin size={16} />
              Self Pickup
            </button>
            <button
              type="button"
              onClick={() => setHandoverMethod('home_delivery')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                handoverMethod === 'home_delivery' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Truck size={16} />
              Home Delivery
            </button>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Handover Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-full pl-10 border border-gray-250 rounded-xl py-2.5 px-3 text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Time Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {handoverSlots.map(({ slot, available }) => (
                <button
                  type="button"
                  key={slot}
                  disabled={!available}
                  onClick={() => setHandoverSlot(slot)}
                  className={`py-2 px-2.5 rounded-lg border text-[11px] font-bold text-center transition-all ${
                    !available ? 'bg-gray-100 border-gray-200 text-gray-350 cursor-not-allowed' :
                    handoverSlot === slot ? 'border-primary bg-primary/5 text-primary' :
                    'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Return Scheduling */}
        <div className="space-y-4">
          <h5 className="font-extrabold text-sm text-navy uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
            <ChevronRight size={16} className="text-primary" /> 2. Returning Handover
          </h5>

          {/* Method Select */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReturnMethod('self_return')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                returnMethod === 'self_return' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MapPin size={16} />
              Self Return
            </button>
            <button
              type="button"
              onClick={() => setReturnMethod('home_pickup')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                returnMethod === 'home_pickup' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Truck size={16} />
              Home Pickup
            </button>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Return Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full pl-10 border border-gray-250 rounded-xl py-2.5 px-3 text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Time Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {returnSlots.map(({ slot, available }) => (
                <button
                  type="button"
                  key={slot}
                  disabled={!available}
                  onClick={() => setReturnSlot(slot)}
                  className={`py-2 px-2.5 rounded-lg border text-[11px] font-bold text-center transition-all ${
                    !available ? 'bg-gray-100 border-gray-200 text-gray-350 cursor-not-allowed' :
                    returnSlot === slot ? 'border-primary bg-primary/5 text-primary' :
                    'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Address Confirmation (if delivery) */}
      {handoverMethod === 'home_delivery' && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={14} className="text-primary" /> Delivery Address Details
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter home/office delivery street address"
            className="w-full border border-gray-250 rounded-xl py-3 px-4 text-xs font-semibold text-gray-750 focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      )}

      {/* Confirm Scheduling */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={submitting || loadingSlots}
          className="w-full sm:w-auto font-black text-xs uppercase px-8 py-3 bg-gradient-to-r from-primary to-indigo-600 border-transparent shadow-lg text-white"
        >
          {submitting ? 'Confirming...' : 'Save & Confirm Schedule'}
        </Button>
      </div>
    </form>
  );
};

export default SchedulePicker;

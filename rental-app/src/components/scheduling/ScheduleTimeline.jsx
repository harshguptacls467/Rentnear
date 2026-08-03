import React from 'react';
import { Clock, Truck, Home, CheckCircle2, ChevronRight } from 'lucide-react';
import Button from '../Button';

const ScheduleTimeline = ({ schedule, onStatusUpdate, updating, isRenter, isOwner }) => {
  if (!schedule) return null;

  const steps = [
    { label: 'Scheduled', icon: Clock, statusKey: 'scheduled' },
    { label: 'In Transit', icon: Truck, statusKey: 'in_transit' },
    { label: 'Arrived', icon: Home, statusKey: 'arrived' },
    { label: 'Handover Completed', icon: CheckCircle2, statusKey: 'completed' }
  ];

  const currentStepIdx = steps.findIndex(step => step.statusKey === schedule.status);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm uppercase tracking-widest font-black text-gray-400">Schedule Status</h4>
          <div className="text-xl font-black text-navy mt-1">Delivery Tracker</div>
        </div>

        {/* Action Controls based on Roles */}
        <div className="flex gap-2">
          {schedule.status === 'scheduled' && isOwner && (
            <Button
              onClick={() => onStatusUpdate('in_transit')}
              disabled={updating}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
            >
              🚚 Start Transit / Delivery
            </Button>
          )}
          {schedule.status === 'in_transit' && isOwner && (
            <Button
              onClick={() => onStatusUpdate('arrived')}
              disabled={updating}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white border-transparent"
            >
              📍 Mark as Arrived
            </Button>
          )}
          {schedule.status === 'arrived' && isRenter && (
            <Button
              onClick={() => onStatusUpdate('completed')}
              disabled={updating}
              className="text-xs bg-green-500 hover:bg-green-600 text-white border-transparent"
            >
              ✓ Confirm Handover Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Progress Line */}
      <div className="relative flex justify-between items-center py-4">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = currentStepIdx >= idx;
          const isActive = currentStepIdx === idx;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${
                isActive ? 'bg-indigo-600 border-white text-white scale-110 shadow-lg shadow-indigo-600/20' :
                isDone ? 'bg-indigo-100 border-white text-indigo-600' :
                'bg-white border-gray-250 text-gray-350'
              }`}>
                <Icon size={16} />
              </div>
              <span className={`text-[10px] font-black mt-2 uppercase tracking-wide ${
                isActive ? 'text-indigo-600' : isDone ? 'text-navy' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Schedule Metadata details info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-xs text-gray-600">
        <div>
          <div className="font-extrabold text-navy uppercase text-[10px] tracking-wider mb-2">Handover Details</div>
          <p>Method: <strong className="text-gray-900">{schedule.handover_method.replace('_', ' ')}</strong></p>
          <p>Date: <strong className="text-gray-900">{new Date(schedule.handover_date).toLocaleDateString()}</strong></p>
          <p>Time Slot: <strong className="text-gray-900">{schedule.handover_time_slot}</strong></p>
          <p>Address: <strong className="text-gray-900">{schedule.handover_address}</strong></p>
        </div>
        <div>
          <div className="font-extrabold text-navy uppercase text-[10px] tracking-wider mb-2">Return Details</div>
          <p>Method: <strong className="text-gray-900">{schedule.return_method.replace('_', ' ')}</strong></p>
          <p>Date: <strong className="text-gray-900">{new Date(schedule.return_date).toLocaleDateString()}</strong></p>
          <p>Time Slot: <strong className="text-gray-900">{schedule.return_time_slot}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTimeline;

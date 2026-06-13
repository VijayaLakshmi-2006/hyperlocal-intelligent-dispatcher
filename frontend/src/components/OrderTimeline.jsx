import React from 'react';
import { CheckCircle2, Clock, Package, Check, User, Truck, Home } from 'lucide-react';

const STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: Package },
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: Check },
  { key: 'AGENT_ASSIGNED', label: 'Agent Assigned', icon: User },
  { key: 'PICKED_UP', label: 'Picked Up', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

const getStepIndex = (status) => {
  if (status === 'CANCELLED') return -1;
  const idx = STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

export default function OrderTimeline({ currentStatus, order, agentDetails, etaMinutes }) {
  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-semibold text-center">
        🚫 This order was cancelled.
      </div>
    );
  }

  return (
    <div className="py-4 pl-4 pr-2">
      <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
        
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          const Icon = step.icon;

          // Determine the timestamp to show if completed
          let timestamp = null;
          if (isDone || isActive) {
            if (step.key === 'PLACED' && order?.createdAt) timestamp = new Date(order.createdAt);
            if (step.key === 'AGENT_ASSIGNED' && order?.assignedAt) timestamp = new Date(order.assignedAt);
            if (step.key === 'PICKED_UP' && order?.pickedUpAt) timestamp = new Date(order.pickedUpAt);
            if (step.key === 'DELIVERED' && order?.deliveredAt) timestamp = new Date(order.deliveredAt);
            // Default to now if simulating quickly
            if (!timestamp) timestamp = new Date(); 
          }

          return (
            <div key={step.key} className="relative pl-8">
              {/* Timeline dot/icon */}
              <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${
                isDone ? 'bg-green-500 text-white' : 
                isActive ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 
                'bg-gray-200 text-gray-400'
              }`}>
                {isDone ? <CheckCircle2 size={16} /> : <Icon size={14} />}
              </div>

              {/* Content */}
              <div className={`flex flex-col ${isPending ? 'opacity-50' : ''}`}>
                <h4 className={`text-base font-bold ${isActive ? 'text-primary-700' : isDone ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.label}
                </h4>
                
                {/* Subtext based on step and status */}
                {isDone && (
                  <div className="flex items-center text-xs text-green-600 font-medium mt-1">
                    <CheckCircle2 size={12} className="mr-1" /> Completed {timestamp ? `at ${timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
                  </div>
                )}

                {isActive && step.key === 'OUT_FOR_DELIVERY' && (
                  <div className="flex items-center text-sm text-orange-600 font-medium mt-1 bg-orange-50 px-2 py-1 rounded w-max">
                    <Clock size={14} className="mr-1" /> ETA: {etaMinutes} mins
                  </div>
                )}

                {(isActive || isDone) && step.key === 'AGENT_ASSIGNED' && agentDetails && (
                  <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 w-max">
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {agentDetails.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{agentDetails.name}</p>
                      <p className="text-xs text-gray-500">{agentDetails.phone}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
        
      </div>
    </div>
  );
}

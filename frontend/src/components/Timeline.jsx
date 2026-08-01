import React from 'react';
import { Check, Clock, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

const steps = [
  { status: 'raised', label: 'Complaint Raised' },
  { status: 'assigned', label: 'Department Assigned' },
  { status: 'worker_assigned', label: 'Worker Assigned' },
  { status: 'worker_reached', label: 'Worker Reached Site' },
  { status: 'work_started', label: 'Work Started' },
  { status: 'completed', label: 'Repair Completed' },
  { status: 'citizen_verified', label: 'Verified by Citizen' },
  { status: 'closed', label: 'Approved & Closed' }
];

const Timeline = ({ currentStatus }) => {
  // Find current step index
  const getStepIndex = (status) => {
    if (status === 'supervisor_approved') return 7; // legacy fallback
    return steps.findIndex(s => s.status === status);
  };

  const currentIndex = getStepIndex(currentStatus);

  const getStepIcon = (index, stepStatus) => {
    if (index < currentIndex || currentStatus === 'closed') {
      return <Check className="w-4 h-4 text-white" />;
    }
    if (index === currentIndex) {
      if (stepStatus === 'completed') return <ShieldCheck className="w-5 h-5 text-white animate-pulse" />;
      if (stepStatus === 'supervisor_approved') return <UserCheck className="w-5 h-5 text-white animate-pulse" />;
      return <Clock className="w-4 h-4 text-white animate-spin" />;
    }
    return <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full" />;
  };

  const getStepStyles = (index) => {
    if (index < currentIndex || currentStatus === 'closed') {
      return 'bg-emerald-500 border-emerald-500 text-white';
    }
    if (index === currentIndex) {
      return 'bg-brand-500 border-brand-500 ring-4 ring-brand-100 dark:ring-brand-950 text-white scale-110 shadow-lg';
    }
    return 'bg-slate-100 dark:bg-darkbg-800 border-slate-300 dark:border-slate-700';
  };

  return (
    <div className="w-full py-6">
      {/* Mobile Vertical Timeline */}
      <div className="sm:hidden flex flex-col gap-6">
        {steps.map((step, idx) => {
          const isPassed = idx <= currentIndex || currentStatus === 'closed';
          return (
            <div key={step.status} className="flex gap-4 items-start relative">
              {idx !== steps.length - 1 && (
                <div className={`absolute left-4 top-8 bottom-[-24px] w-0.5 ${
                  isPassed && idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`} />
              )}
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold z-10 ${getStepStyles(idx)}`}>
                {getStepIcon(idx, step.status)}
              </div>

              <div className="flex flex-col pt-0.5">
                <span className={`text-sm font-bold ${
                  idx === currentIndex ? 'text-brand-500' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {idx < currentIndex ? 'Completed' : idx === currentIndex ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Horizontal Timeline */}
      <div className="hidden sm:flex items-center justify-between w-full relative px-2">
        {/* Track Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 z-0" />
        
        {/* Active Track Line progress */}
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
          style={{ 
            width: `${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 92 : 0}%` 
          }}
        />

        {steps.map((step, idx) => {
          return (
            <div key={step.status} className="flex flex-col items-center gap-3 relative z-10 w-24">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition z-10 ${getStepStyles(idx)}`}>
                {getStepIcon(idx, step.status)}
              </div>

              <div className="text-center flex flex-col">
                <span className={`text-[10px] font-extrabold tracking-wide uppercase ${
                  idx === currentIndex ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {step.label.replace('Site', '')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;

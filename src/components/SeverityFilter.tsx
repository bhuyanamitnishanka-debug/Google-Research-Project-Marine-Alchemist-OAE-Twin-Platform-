import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { EventSeverity } from '../types';

export type SeverityToggleState = Record<EventSeverity, boolean>;

interface SeverityFilterProps {
  activeFilters: SeverityToggleState;
  onToggleSeverity: (severity: EventSeverity) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  counts: Record<EventSeverity, number>;
  totalCount: number;
}

export const SeverityFilter: React.FC<SeverityFilterProps> = ({
  activeFilters,
  onToggleSeverity,
  onSelectAll,
  onClearAll,
  counts,
  totalCount,
}) => {
  const SEVERITY_CONFIG: {
    key: EventSeverity;
    label: string;
    activeClass: string;
    inactiveClass: string;
    badgeActive: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'critical',
      label: 'Critical',
      activeClass: 'bg-[#EA4335] text-white border-[#EA4335] shadow-sm',
      inactiveClass: 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-[#EA4335]/50 hover:text-[#EA4335]',
      badgeActive: 'bg-red-950 text-red-200 border border-red-800',
      icon: <AlertOctagon className="w-3 h-3 text-current" />,
    },
    {
      key: 'warning',
      label: 'Warning',
      activeClass: 'bg-[#FBBC05] text-slate-950 font-bold border-[#FBBC05] shadow-sm',
      inactiveClass: 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-[#FBBC05]/50 hover:text-[#FBBC05]',
      badgeActive: 'bg-amber-950 text-amber-200 border border-amber-800',
      icon: <AlertTriangle className="w-3 h-3 text-current" />,
    },
    {
      key: 'resolved',
      label: 'Resolved',
      activeClass: 'bg-[#34A853] text-white border-[#34A853] shadow-sm',
      inactiveClass: 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-[#34A853]/50 hover:text-[#34A853]',
      badgeActive: 'bg-emerald-950 text-emerald-200 border border-emerald-800',
      icon: <CheckCircle2 className="w-3 h-3 text-current" />,
    },
    {
      key: 'nominal',
      label: 'Nominal',
      activeClass: 'bg-[#4285F4] text-white border-[#4285F4] shadow-sm',
      inactiveClass: 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-[#4285F4]/50 hover:text-[#4285F4]',
      badgeActive: 'bg-blue-950 text-blue-200 border border-blue-800',
      icon: <ShieldCheck className="w-3 h-3 text-current" />,
    },
  ];

  const allActive =
    activeFilters.critical &&
    activeFilters.warning &&
    activeFilters.resolved &&
    activeFilters.nominal;

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-slate-950/90 rounded-lg border border-slate-800/90 font-mono text-[11px]">
      <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <SlidersHorizontal className="w-3 h-3 text-[#4285F4]" />
          <span>SEVERITY FILTER</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={allActive ? onClearAll : onSelectAll}
            className="text-[9px] text-[#4285F4] hover:text-blue-300 hover:underline transition"
          >
            {allActive ? 'Uncheck All' : 'Select All'}
          </button>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500 text-[9px]">{totalCount} Total</span>
        </div>
      </div>

      {/* Filter Toggle Buttons Grid */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {SEVERITY_CONFIG.map(({ key, label, activeClass, inactiveClass, badgeActive, icon }) => {
          const isToggled = activeFilters[key];
          const count = counts[key] || 0;

          return (
            <button
              key={key}
              onClick={() => onToggleSeverity(key)}
              className={`flex items-center justify-between px-2 py-1.5 rounded border transition-all text-[10px] ${
                isToggled ? activeClass : inactiveClass
              }`}
              title={`Toggle ${label} events visibility`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] transition ${
                    isToggled
                      ? 'bg-black/20 border-white/40 text-white'
                      : 'border-slate-700 bg-slate-950/60 text-transparent'
                  }`}
                >
                  {isToggled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                {icon}
                <span className="font-semibold tracking-wide">{label}</span>
              </div>

              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                  isToggled ? badgeActive : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

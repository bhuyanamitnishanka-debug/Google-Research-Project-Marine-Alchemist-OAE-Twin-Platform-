import React from 'react';
import { ViewPreset, VisualMode } from '../types';

interface BlueprintOverlayProps {
  showLabels: boolean;
  visualMode: VisualMode;
  onSelectSubsystem: (subsystemId: string) => void;
  onSelectPreset: (preset: ViewPreset) => void;
}

export const BlueprintOverlay: React.FC<BlueprintOverlayProps> = ({
  showLabels,
  visualMode,
  onSelectSubsystem,
  onSelectPreset,
}) => {
  if (!showLabels) return null;

  const isBlueprintMode = visualMode === 'blueprint';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* Blueprint Grid Lines (when blueprint mode is active) */}
      {isBlueprintMode && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      )}

      {/* Crosshair Corner Markers */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

      {/* Floating Blueprint Callout Pins (Interactive!) */}
      {/* 1. DATA & CONTROL CENTER */}
      <div className="absolute top-[22%] right-[22%] pointer-events-auto transform -translate-x-1/2">
        <button
          onClick={() => {
            onSelectSubsystem('control_center');
            onSelectPreset('control_center');
          }}
          className="group flex flex-col items-start text-left focus:outline-none transition-all duration-200"
          title="Click to inspect Data & Control Center"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/85 hover:bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded text-[11px] font-mono tracking-wider shadow-lg backdrop-blur-sm transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold">DATA & CONTROL CENTER</span>
          </div>
          <div className="w-px h-6 bg-cyan-500/60 ml-3" />
          <div className="w-2 h-2 rounded-full border border-cyan-400 bg-cyan-500/40 ml-[9px] -mt-1" />
        </button>
      </div>

      {/* 2. MODULAR DOSING PODS (TOP PERIMETER) */}
      <div className="absolute top-[32%] left-[34%] pointer-events-auto transform -translate-x-1/2">
        <button
          onClick={() => {
            onSelectSubsystem('pod_1');
            onSelectPreset('dosing_pods');
          }}
          className="group flex flex-col items-center focus:outline-none transition-all duration-200"
          title="Click to inspect Modular Dosing Pods"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/85 hover:bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 rounded text-[11px] font-mono tracking-wider shadow-lg backdrop-blur-sm transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">MODULAR DOSING PODS (3.8m × 1.5m)</span>
          </div>
          <div className="w-px h-7 bg-emerald-500/60" />
          <div className="w-2 h-2 rounded-full border border-emerald-400 bg-emerald-500/40 -mt-1" />
        </button>
      </div>

      {/* 3. STAINLESS SEAWATER INTAKE */}
      <div className="absolute bottom-[36%] left-[16%] pointer-events-auto">
        <button
          onClick={() => {
            onSelectSubsystem('intake');
            onSelectPreset('intake');
          }}
          className="group flex flex-col items-start focus:outline-none transition-all duration-200"
          title="Click to inspect Seawater Intake System"
        >
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/85 hover:bg-blue-950/90 text-blue-300 border border-blue-500/50 hover:border-blue-400 rounded text-[10px] font-mono tracking-wide shadow-lg backdrop-blur-sm transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>STAINLESS SEAWATER INTAKE</span>
          </div>
          <div className="w-px h-8 bg-blue-500/50 ml-4" />
          <div className="w-2 h-2 rounded-full border border-blue-400 bg-blue-500/40 ml-[13px] -mt-1" />
        </button>
      </div>

      {/* 4. SENSOR & ALKALINITY PROBES (FRONT) */}
      <div className="absolute bottom-[24%] right-[32%] pointer-events-auto">
        <button
          onClick={() => {
            onSelectSubsystem('probe_ta_1');
            onSelectPreset('basin');
          }}
          className="group flex flex-col items-start focus:outline-none transition-all duration-200"
          title="Click to inspect Alkalinity & pH Probes"
        >
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/85 hover:bg-amber-950/90 text-amber-300 border border-amber-500/50 hover:border-amber-400 rounded text-[10px] font-mono tracking-wide shadow-lg backdrop-blur-sm transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>ALKALINITY & pH PROBES</span>
          </div>
          <div className="w-px h-6 bg-amber-500/50 ml-3" />
          <div className="w-2 h-2 rounded-full border border-amber-400 bg-amber-500/40 ml-[9px] -mt-1" />
        </button>
      </div>

      {/* 5. Architectural Dimension Callouts on Apron Border */}
      <div className="absolute bottom-[8%] right-[16%] flex items-center gap-2 text-slate-400 font-mono text-[11px] pointer-events-none">
        <span className="w-12 h-px bg-slate-500/60 inline-block" />
        <span>20.0M BASIN SPAN</span>
        <span className="w-12 h-px bg-slate-500/60 inline-block" />
        <span className="text-slate-500">|</span>
        <span>15.0M WIDTH</span>
      </div>

      {/* 6. Technical Engineering Blueprint Title Block (Bottom Right, matching reference image) */}
      <div className="absolute bottom-5 right-5 pointer-events-auto bg-slate-950/90 border border-cyan-500/40 rounded p-2.5 font-mono text-[10px] shadow-2xl backdrop-blur-md max-w-[260px]">
        <div className="flex justify-between items-center border-b border-cyan-800/60 pb-1 mb-1.5">
          <span className="font-bold text-cyan-400 tracking-wider">COASTAL OAE RESEARCH UNIT</span>
          <span className="text-[9px] text-slate-400">SPEC-REV 4.2</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300 text-[9px]">
          <div>FACILITY: <span className="text-cyan-200">SEROS LAB 01</span></div>
          <div>DISP: <span className="text-emerald-400">ACTIVE DOSING</span></div>
          <div>BASIN: <span className="text-cyan-200">20M × 15M × 3.5M</span></div>
          <div>INSPECTION: <span className="text-amber-400">ONLINE</span></div>
        </div>
        <div className="mt-1.5 pt-1 border-t border-slate-800 flex justify-between text-[8px] text-slate-500">
          <span>LAT: 34.025° N | LON: 119.82° W</span>
          <span>DATUM: WGS84</span>
        </div>
      </div>
    </div>
  );
};

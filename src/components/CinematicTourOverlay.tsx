import React from 'react';
import {
  Film,
  Play,
  Pause,
  SkipForward,
  Compass,
  Layers,
  ChevronRight,
  Sparkles,
  Maximize2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CinematicTourState, CinematicTourStage, DosingPod, ChemicalState } from '../types';

interface CinematicTourOverlayProps {
  tourState: CinematicTourState;
  onToggleTour: () => void;
  onNextStage: () => void;
  onToggleAutoCycle: () => void;
  onChangeSpeed: (speed: number) => void;
  activePods: DosingPod[];
  chemicalState: ChemicalState;
}

export const CinematicTourOverlay: React.FC<CinematicTourOverlayProps> = ({
  tourState,
  onToggleTour,
  onNextStage,
  onToggleAutoCycle,
  onChangeSpeed,
  activePods,
  chemicalState,
}) => {
  if (!tourState.isActive) return null;

  const STAGE_TITLES: Record<CinematicTourStage, { title: string; subtitle: string; chapter: number }> = {
    orbital_overview: {
      title: 'Facility Panoramic Orbit',
      subtitle: 'Mesocosm perimeter and shoreline ocean intake array',
      chapter: 1,
    },
    pod_focus: {
      title: tourState.targetPodLabel || 'Active Dosing Pod Injection Array',
      subtitle: 'Submerged high-pressure slurry injector & cavitation diffuser',
      chapter: 2,
    },
    subsurface_plume: {
      title: 'Chemical Dispersion Plume Front',
      subtitle: 'Volumetric turbulence, advection gradient & dissolution front',
      chapter: 3,
    },
    intake_shoreline: {
      title: 'Ocean Seawater Pumping Shoreline',
      subtitle: '250 L/s intake pipeline & coastal bathymetric boundary',
      chapter: 4,
    },
    control_lab: {
      title: 'Biogeochemical Digital Twin Center',
      subtitle: 'Telemetry streaming matrix & automated alkalinity governance',
      chapter: 5,
    },
  };

  const currentStageInfo = STAGE_TITLES[tourState.stage] || STAGE_TITLES.orbital_overview;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* Cinematic Top Letterbox Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 md:h-12 bg-gradient-to-b from-black/90 to-transparent pointer-events-auto flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/90 text-white font-mono text-[11px] font-bold tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            CINEMATIC TOUR
          </span>
          <span className="text-xs font-mono text-cyan-400">
            STAGE: {currentStageInfo.chapter}/5 • {currentStageInfo.title}
          </span>
        </div>

        {/* Top Controls: Exit Tour & Camera cycle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNextStage}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-xs font-mono text-slate-200 hover:text-white hover:bg-slate-800 transition"
            title="Jump to Next Waypoint"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next Target</span>
          </button>

          <button
            onClick={onToggleTour}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/80 border border-red-700/80 text-xs font-mono text-red-200 hover:bg-red-900 transition"
            title="Exit Cinematic Camera Mode"
          >
            <X className="w-3.5 h-3.5" />
            <span>EXIT TOUR</span>
          </button>
        </div>
      </div>

      {/* Target Focus HUD (Crosshairs & Coordinates overlay) */}
      <div className="pointer-events-none self-center my-auto flex flex-col items-center">
        <div className="relative w-28 h-28 border border-cyan-400/30 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          <div className="absolute top-0 w-3 h-0.5 bg-cyan-400" />
          <div className="absolute bottom-0 w-3 h-0.5 bg-cyan-400" />
          <div className="absolute left-0 w-0.5 h-3 bg-cyan-400" />
          <div className="absolute right-0 w-0.5 h-3 bg-cyan-400" />
        </div>
        {tourState.targetPodLabel && (
          <div className="mt-2 px-2.5 py-1 rounded bg-slate-950/80 border border-cyan-500/50 backdrop-blur-md text-[11px] font-mono text-cyan-300 shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            TRACKING: {tourState.targetPodLabel}
          </div>
        )}
      </div>

      {/* Bottom Cinematic Graphic Novel Narrative Card & Controls */}
      <div className="pointer-events-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-4 w-full max-w-4xl mx-auto z-40">
        {/* Narrative Chapter Box */}
        <div className="w-full md:w-auto flex-1 bg-slate-950/90 border-2 border-cyan-500/60 rounded-xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-800">
                CH. 0{currentStageInfo.chapter}
              </span>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                {currentStageInfo.title}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              PROGRESS {Math.round(tourState.stageProgress * 100)}%
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
            {tourState.stage === 'orbital_overview' && (
              <>
                The Google Research marine mesocosm facility conducts continuous multi-point Ocean Alkalinity
                Enhancement (OAE). Autonomous camera drones track volumetric fluid plumes and surface kinetics.
              </>
            )}
            {tourState.stage === 'pod_focus' && (
              <>
                Zooming in on <strong>{tourState.targetPodLabel || 'Active Injector'}</strong>. Ultrafine mineral slurry is
                metered through high-velocity venturi nozzles, generating localized alkalinity while mitigating secondary
                carbonate precipitation.
              </>
            )}
            {tourState.stage === 'subsurface_plume' && (
              <>
                Observing the advective chemical dispersion plume. Real-time GPU particle advection visualizes the
                concentration decay boundary from core injection to ambient seawater dilution.
              </>
            )}
            {tourState.stage === 'intake_shoreline' && (
              <>
                Seawater intake pipelines continuously draw pristine coastal seawater at 250 L/s, buffering the artificial
                mesocosm basin and powering the geothermal cooling circuit for onsite edge compute.
              </>
            )}
            {tourState.stage === 'control_lab' && (
              <>
                The autonomous digital twin center streams sensor telemetry across 4 analytical probes, ensuring continuous
                sequestration yield tracking ({chemicalState.cumulativeCO2SequesteredKg.toFixed(1)} kg CO₂ sequestered).
              </>
            )}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${tourState.stageProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Floating Quick Camera Controls */}
        <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md shrink-0">
          <button
            onClick={onToggleAutoCycle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
              tourState.autoCycleEnabled
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Automatic Camera Waypoint Cycling"
          >
            {tourState.autoCycleEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{tourState.autoCycleEnabled ? 'AUTO' : 'MANUAL'}</span>
          </button>

          <button
            onClick={onNextStage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition"
            title="Cycle to next cinematic camera viewpoint"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>NEXT</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400">SPEED:</span>
            {[0.5, 1.0, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                  tourState.cameraSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

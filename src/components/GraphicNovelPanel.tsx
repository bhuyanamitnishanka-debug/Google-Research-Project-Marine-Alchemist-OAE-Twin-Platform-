import React, { useState } from 'react';
import {
  BookOpen,
  Film,
  Camera,
  Play,
  Pause,
  SkipForward,
  Activity,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CinematicTourState, CinematicTourStage, DosingPod, ChemicalState } from '../types';

interface GraphicNovelPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tourState: CinematicTourState;
  onToggleTour: () => void;
  onNextStage: () => void;
  onSetStage: (stage: CinematicTourStage, podId?: string) => void;
  dosingPods: DosingPod[];
  chemicalState: ChemicalState;
}

export const GraphicNovelPanel: React.FC<GraphicNovelPanelProps> = ({
  isOpen,
  onClose,
  tourState,
  onToggleTour,
  onNextStage,
  onSetStage,
  dosingPods,
  chemicalState,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  if (!isOpen) return null;

  const activePods = dosingPods.filter((p) => p.active);

  const CHAPTERS = [
    {
      id: 1,
      stage: 'orbital_overview' as CinematicTourStage,
      title: 'THE ALKALINE FRONTIER',
      subtitle: 'Shoreline Hydrodynamics & Carbon Removal',
      description:
        "The pumps humming along the shoreline are moving 250 liters of seawater per second into the coastal mesocosm basin. Deep within the artificial reactor, the injection arrays are balancing the ocean's chemistry, binding dissolved carbon dioxide pollution into stable oceanic bicarbonate.",
      alert: null,
      metric: 'Intake: 250 L/s • Flow: 1,200 m³/hr',
    },
    {
      id: 2,
      stage: 'pod_focus' as CinematicTourStage,
      title: 'ACTIVE DOSING INJECTORS',
      subtitle: 'High-Precision Slurry Metering Array',
      description:
        'Targeting active dosing pods along the basin perimeter. High-velocity slurry injectors disperse ultrafine micronized calcium hydroxide and brucite suspensions, maintaining saturation limits under strict geochemical thresholds to prevent calcite runaway.',
      alert:
        chemicalState.precipitationRisk !== 'none'
          ? `[⚠️ DATA ANOMALY CHECK]: Calcite saturation Omega=${chemicalState.aragoniteSaturation.toFixed(2)}. Remediation threshold triggered.`
          : '[SYSTEM NOMINAL]: Zero secondary precipitation detected across injector boundary.',
      metric: `${activePods.length} Active Pods • Dosing: 45 kg/hr/pod`,
    },
    {
      id: 3,
      stage: 'subsurface_plume' as CinematicTourStage,
      title: 'VOLUMETRIC PLUME DISPERSION',
      subtitle: 'GPU-Driven Kinetic Advection & Dissolution',
      description:
        'Tracking particle advection and vortex turbulence fronts. Slurry particles decelerate from the high-momentum injector nozzles into laminar seaward drift, dissolving into dissolved ions with active color-coded concentration gradients.',
      alert: null,
      metric: `Decay Half-Life: 5.0s • pH Front: ${chemicalState.pH.toFixed(2)}`,
    },
    {
      id: 4,
      stage: 'intake_shoreline' as CinematicTourStage,
      title: 'THE SEAWATER CORRIDOR',
      subtitle: 'Submerged Pipeline Array & Coastal Bathymetry',
      description:
        'Cold deep ocean intake feeds both the biogeochemical reaction basin and geothermal micro-datacenter cooling loops. Ocean water enters at natural salinity, buffering the system before clean enriched seawater returns safely to coastal currents.',
      alert: null,
      metric: 'Salinity: 35.1 PSU • Temp: 16.4°C',
    },
    {
      id: 5,
      stage: 'control_lab' as CinematicTourStage,
      title: 'THE DIGITAL TWIN ARCHIVE',
      subtitle: 'AI Research Log Matrix & Sequestration Telemetry',
      description:
        'Autonomous monitoring stations process real-time spectroscopic logs. Digital twin predictive models calculate irreversible carbon drawdown, verifying marine ecosystem safety and permanent atmospheric CO₂ removal.',
      alert: `Cumulative Sequestered: ${chemicalState.cumulativeCO2SequesteredKg.toFixed(1)} kg CO₂ • Yield: ${chemicalState.sequestrationRateTonsPerDay.toFixed(2)} t/day`,
      metric: 'Status: Fully Synchronized • Latency: <15ms',
    },
  ];

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] bg-[#0b0f19] border-l-2 border-[#4285F4] text-slate-200 shadow-2xl flex flex-col font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#4285F4] bg-[#070b14]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#4285F4]" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Google Research // Marine Alchemist
            </h2>
            <p className="text-[10px] text-slate-400">Engineering Graphic Novel v1.0</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cinematic Mode Quick Toggle */}
      <div className="p-3 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              tourState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="text-[11px] text-slate-300 font-semibold">
            {tourState.isActive ? 'Cinematic Drone Active' : 'Cinematic Tour Paused'}
          </span>
        </div>

        <button
          onClick={onToggleTour}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide transition ${
            tourState.isActive
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-[#34A853] text-white hover:bg-emerald-500 shadow-lg'
          }`}
        >
          {tourState.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{tourState.isActive ? 'Stop Drone' : 'Launch Tour'}</span>
        </button>
      </div>

      {/* Story Chapters List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {CHAPTERS.map((ch) => {
          const isCurrentInTour = tourState.isActive && tourState.stage === ch.stage;
          return (
            <div
              key={ch.id}
              onClick={() => {
                setSelectedChapter(ch.id);
                onSetStage(ch.stage);
              }}
              className={`p-3.5 rounded-lg border-2 cursor-pointer transition relative group ${
                isCurrentInTour
                  ? 'border-[#4285F4] bg-[#4285F4]/10 shadow-[4px_4px_0px_#4285F4]'
                  : selectedChapter === ch.id
                  ? 'border-cyan-400 bg-slate-900 shadow-[3px_3px_0px_#06b6d4]'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/60 shadow-[3px_3px_0px_rgba(255,255,255,0.05)]'
              }`}
            >
              {/* Chapter Tag */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#4285F4] uppercase tracking-wider">
                  CHAPTER {ch.id}: {ch.title}
                </span>
                {isCurrentInTour && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE CAMERA
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-white mb-2">{ch.subtitle}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-3">{ch.description}</p>

              {/* Alert or Metric Box */}
              {ch.alert && (
                <div className="p-2 mb-2 rounded bg-red-950/40 border border-red-500/50 text-[10px] text-red-300 leading-tight">
                  {ch.alert}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                <span>{ch.metric}</span>
                <span className="text-[#4285F4] group-hover:underline flex items-center gap-0.5">
                  Focus Camera <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}

        {/* Active Pod Quick Target Selector */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/90">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Active Pod Close-up Targets ({activePods.length})
            </span>
            <span className="text-[10px] text-cyan-400">Click to Zoom</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {dosingPods.map((pod) => (
              <button
                key={pod.id}
                onClick={() => onSetStage('pod_focus', pod.id)}
                className={`p-1.5 rounded text-left text-[10px] font-mono border transition flex items-center justify-between ${
                  tourState.targetPodId === pod.id && tourState.stage === 'pod_focus'
                    ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                    : pod.active
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    : 'border-slate-900 bg-slate-950/40 text-slate-500'
                }`}
              >
                <span className="truncate">{pod.label.split('(')[0]}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    pod.active ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t-2 border-[#4285F4] bg-[#070b14]">
        <button
          onClick={onNextStage}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-[#34A853] hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-[0.98]"
        >
          <Film className="w-4 h-4" />
          <span>🎬 Cycle Cinematic Drone Frame</span>
        </button>
      </div>
    </aside>
  );
};

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Camera,
  Download,
  Activity,
  Flame,
  Moon,
  Compass,
  FileCode2,
  Film,
  BookOpen,
} from 'lucide-react';
import { VisualMode, ViewPreset, ChemicalState } from '../types';

interface HeaderProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  visualMode: VisualMode;
  onChangeVisualMode: (mode: VisualMode) => void;
  viewPreset: ViewPreset;
  onSelectPreset: (preset: ViewPreset) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  isMuted: boolean;
  onToggleAudio: () => void;
  onExportData: () => void;
  chemicalState: ChemicalState;
  isCinematicTourActive: boolean;
  onToggleCinematicTour: () => void;
  isGraphicNovelOpen: boolean;
  onToggleGraphicNovel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onTogglePlay,
  onReset,
  simSpeed,
  onChangeSimSpeed,
  visualMode,
  onChangeVisualMode,
  viewPreset,
  onSelectPreset,
  showLabels,
  onToggleLabels,
  isMuted,
  onToggleAudio,
  onExportData,
  chemicalState,
  isCinematicTourActive,
  onToggleCinematicTour,
  isGraphicNovelOpen,
  onToggleGraphicNovel,
}) => {
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 text-slate-200 backdrop-blur-md shadow-md">
      {/* Brand Identity & Live Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-inner">
          <Activity className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white font-mono">
              COASTAL OAE RESEARCH UNIT
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              SEROS LAB-01
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans hidden md:block">
            Ocean Alkalinity Enhancement (mCDR) • 3D Biogeochemical Reactor Simulator
          </p>
        </div>
      </div>

      {/* Center: Playback & Simulation Speed Controls */}
      <div className="flex items-center gap-2 bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-mono transition-all ${
            isRunning
              ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/40'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
          }`}
          title={isRunning ? 'Pause simulation' : 'Run simulation'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? 'PAUSE' : 'RUN'}</span>
        </button>

        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          title="Reset to baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Speed multiplier selector */}
        <div className="flex items-center gap-1">
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSimSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition ${
                simSpeed === s
                  ? 'bg-cyan-600/40 text-cyan-300 border border-cyan-500/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: View Presets, Visual Modes, Annotations, Audio, Export */}
      <div className="flex items-center gap-2">
        {/* Camera Preset Dropdown */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs">
          <Camera className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <select
            value={viewPreset}
            onChange={(e) => onSelectPreset(e.target.value as ViewPreset)}
            className="bg-transparent text-slate-200 text-xs font-mono py-0.5 px-1 focus:outline-none cursor-pointer"
          >
            <option value="overview" className="bg-slate-900 text-slate-200">View: Overview (Isometric)</option>
            <option value="basin" className="bg-slate-900 text-slate-200">View: Seawater Basin</option>
            <option value="dosing_pods" className="bg-slate-900 text-slate-200">View: Dosing Pods Array</option>
            <option value="control_center" className="bg-slate-900 text-slate-200">View: Control Center Lab</option>
            <option value="intake" className="bg-slate-900 text-slate-200">View: Ocean Intake Pipes</option>
            <option value="blueprint_top" className="bg-slate-900 text-slate-200">View: Top-Down Plan</option>
          </select>
        </div>

        {/* Visual Shading Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeVisualMode('realistic')}
            className={`p-1.5 rounded transition ${
              visualMode === 'realistic' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Realistic Coastal Daylight"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeVisualMode('blueprint')}
            className={`p-1.5 rounded transition ${
              visualMode === 'blueprint' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="CAD Blueprint Mode"
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeVisualMode('heatmap')}
            className={`p-1.5 rounded transition ${
              visualMode === 'heatmap' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Alkalinity / pH Heatmap Mode"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeVisualMode('night_hud')}
            className={`p-1.5 rounded transition ${
              visualMode === 'night_hud' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Night HUD Mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Blueprint Callout Pins Toggle */}
        <button
          onClick={onToggleLabels}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition ${
            showLabels
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle Blueprint Callout Pins"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">LABELS</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded border transition ${
            !isMuted
              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={isMuted ? 'Enable ambient ocean sound' : 'Mute sound'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Cinematic Camera Tour Button */}
        <button
          onClick={onToggleCinematicTour}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition border ${
            isCinematicTourActive
              ? 'bg-red-600/90 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
              : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60 hover:bg-cyan-900/80 hover:border-cyan-500'
          }`}
          title="Automated Cinematic Camera Tour with Drone Orbit & Pod Zoom"
        >
          <Film className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isCinematicTourActive ? 'STOP TOUR' : 'CINEMATIC'}</span>
        </button>

        {/* Graphic Novel / Research Story Panel Toggle */}
        <button
          onClick={onToggleGraphicNovel}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition border ${
            isGraphicNovelOpen
              ? 'bg-[#4285F4] text-white border-blue-300 shadow-[0_0_12px_rgba(66,133,244,0.5)]'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-[#4285F4]/60 hover:text-white'
          }`}
          title="Open Engineering Graphic Novel & Research Narrative"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#4285F4]" />
          <span className="hidden md:inline">NOVEL</span>
        </button>

        {/* Export Data */}
        <button
          onClick={onExportData}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition"
          title="Export Run Telemetry Log"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">EXPORT</span>
        </button>
      </div>
    </header>
  );
};

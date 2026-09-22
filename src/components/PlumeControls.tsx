import React from 'react';
import {
  Sparkles,
  Droplets,
  Activity,
  Sliders,
  Wind,
  Layers,
  Palette,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { PlumeSimulationConfig, FeedstockType } from '../types';
import { FEEDSTOCKS } from '../simulation/geochemistry';

interface PlumeControlsProps {
  config: PlumeSimulationConfig;
  onChangeConfig: (updates: Partial<PlumeSimulationConfig>) => void;
  feedstock: FeedstockType;
  onResetPlumes: () => void;
}

export const PlumeControls: React.FC<PlumeControlsProps> = ({
  config,
  onChangeConfig,
  feedstock,
  onResetPlumes,
}) => {
  const currentFeedstockInfo = FEEDSTOCKS[feedstock];

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Plume Master Toggle & Reset */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono font-bold text-[11px] text-emerald-300 uppercase tracking-wide">
            Chemical Dispersion Plumes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetPlumes}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition"
            title="Reset plume dynamics to default"
          >
            <RotateCcw className="w-3 h-3" />
            Default
          </button>
          <button
            onClick={() => onChangeConfig({ enabled: !config.enabled })}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
              config.enabled
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {config.enabled ? 'ACTIVE' : 'MUTED'}
          </button>
        </div>
      </div>

      {/* Feedstock Chemical Context */}
      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: currentFeedstockInfo.color }}
          />
          <div>
            <div className="font-semibold text-slate-200">{currentFeedstockInfo.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              Solubility: {currentFeedstockInfo.solubilityLimit} g/L • {currentFeedstockInfo.co2DrawdownRatio} CO₂ Drawdown Ratio
            </div>
          </div>
        </div>
        <span className="font-mono text-cyan-400 text-[10px] bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
          {currentFeedstockInfo.chemicalFormula}
        </span>
      </div>

      {/* Concentration Gradient Color Mode */}
      <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          Gradient Color Mapping
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onChangeConfig({ colorMode: 'concentration' })}
            className={`p-1.5 rounded text-left border text-[10px] font-mono transition flex flex-col justify-between ${
              config.colorMode === 'concentration'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-semibold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Concentration</span>
            <span className="text-[8px] text-slate-500 font-sans mt-0.5">Heatmap multi-spectrum</span>
          </button>
          <button
            onClick={() => onChangeConfig({ colorMode: 'gradient' })}
            className={`p-1.5 rounded text-left border text-[10px] font-mono transition flex flex-col justify-between ${
              config.colorMode === 'gradient'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-semibold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Dissolution</span>
            <span className="text-[8px] text-slate-500 font-sans mt-0.5">Slurry core → ambient</span>
          </button>
          <button
            onClick={() => onChangeConfig({ colorMode: 'feedstock' })}
            className={`p-1.5 rounded text-left border text-[10px] font-mono transition flex flex-col justify-between ${
              config.colorMode === 'feedstock'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-semibold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Feedstock</span>
            <span className="text-[8px] text-slate-500 font-sans mt-0.5">Mineral hue signature</span>
          </button>
        </div>

        {/* Gradient Visual Bar */}
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>NOZZLE CORE (HIGH CONC)</span>
            <span>REACTION FRONT</span>
            <span>DILUTED SEAWATER</span>
          </div>
          {config.colorMode === 'concentration' ? (
            <div className="h-2 w-full rounded bg-gradient-to-r from-yellow-300 via-emerald-400 to-sky-600" />
          ) : config.colorMode === 'gradient' ? (
            <div className="h-2 w-full rounded bg-gradient-to-r from-amber-100 via-teal-400 to-blue-700" />
          ) : (
            <div
              className="h-2 w-full rounded"
              style={{
                background: `linear-gradient(to right, ${currentFeedstockInfo.color}, #0284c7)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Particle Density & Size */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Particles / Pod</span>
            <span className="font-mono text-emerald-400">{config.particleCountPerPod}</span>
          </div>
          <input
            type="range"
            min="100"
            max="600"
            step="50"
            value={config.particleCountPerPod}
            onChange={(e) => onChangeConfig({ particleCountPerPod: parseInt(e.target.value) })}
            className="w-full accent-emerald-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Particle Size</span>
            <span className="font-mono text-cyan-400">{config.particleSize.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="0.15"
            max="0.65"
            step="0.05"
            value={config.particleSize}
            onChange={(e) => onChangeConfig({ particleSize: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Dispersion Speed & Advection */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            Advective Flow & Drift Rate
          </span>
          <span className="font-mono text-cyan-400">{config.dispersionSpeed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.4"
          max="3.0"
          step="0.1"
          value={config.dispersionSpeed}
          onChange={(e) => onChangeConfig({ dispersionSpeed: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Stagnant (0.4x)</span>
          <span>Basin Flow (1.0x)</span>
          <span>Fast Current (3.0x)</span>
        </div>
      </div>

      {/* Micro-Turbulence (Brownian & Vortex Eddies) */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Turbulence & Vortex Eddies
          </span>
          <span className="font-mono text-purple-400">{config.turbulence.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={config.turbulence}
          onChange={(e) => onChangeConfig({ turbulence: parseFloat(e.target.value) })}
          className="w-full accent-purple-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Laminar (0.2)</span>
          <span>Nominal (1.0)</span>
          <span>High Vorticity (3.0)</span>
        </div>
      </div>

      {/* Particle Lifetime (Dissolution Horizon) */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300">Dissolution Horizon (Lifetime)</span>
          <span className="font-mono text-emerald-400">{config.lifetimeSeconds.toFixed(1)} s</span>
        </div>
        <input
          type="range"
          min="2.0"
          max="10.0"
          step="0.5"
          value={config.lifetimeSeconds}
          onChange={(e) => onChangeConfig({ lifetimeSeconds: parseFloat(e.target.value) })}
          className="w-full accent-emerald-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Rapid Dilution (2.0s)</span>
          <span>Nominal (5.0s)</span>
          <span>Extended Plume (10.0s)</span>
        </div>
      </div>

      {/* Mineral Particle Settling / Buoyancy */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300">Vertical Settling Drift</span>
          <span className="font-mono text-cyan-400">
            {config.buoyancyEffect < 0 ? 'Sinking' : config.buoyancyEffect > 0 ? 'Rising' : 'Neutral'} (
            {config.buoyancyEffect.toFixed(1)})
          </span>
        </div>
        <input
          type="range"
          min="-1.5"
          max="1.5"
          step="0.1"
          value={config.buoyancyEffect}
          onChange={(e) => onChangeConfig({ buoyancyEffect: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Mineral Sinking (-1.5)</span>
          <span>Neutral (0.0)</span>
          <span>Surface Float (+1.5)</span>
        </div>
      </div>
    </div>
  );
};

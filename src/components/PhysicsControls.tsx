import React from 'react';
import {
  Compass,
  RotateCcw,
  Sparkles,
  Droplets,
  Activity,
  Sliders,
  Anchor,
} from 'lucide-react';
import { PhysicsParams } from '../types';

interface PhysicsControlsProps {
  params: PhysicsParams;
  onChangeParams: (updates: Partial<PhysicsParams>) => void;
  onResetPhysics: () => void;
}

export const PhysicsControls: React.FC<PhysicsControlsProps> = ({
  params,
  onChangeParams,
  onResetPhysics,
}) => {
  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
        <span className="text-[10px] font-mono uppercase text-slate-400">
          Rigid Body & Hydrodynamics
        </span>
        <button
          onClick={onResetPhysics}
          className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300"
          title="Reset to ocean standard defaults"
        >
          <RotateCcw className="w-3 h-3" />
          Default
        </button>
      </div>

      {/* Gravity Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5 text-cyan-400" />
            Gravity Acceleration
          </span>
          <span className="font-mono text-cyan-400">{params.gravity.toFixed(1)} m/s²</span>
        </div>
        <input
          type="range"
          min="-25.0"
          max="-1.0"
          step="0.5"
          value={params.gravity}
          onChange={(e) => onChangeParams({ gravity: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Low (-1.0)</span>
          <span>Earth Standard (-9.82)</span>
          <span>Heavy (-25)</span>
        </div>
      </div>

      {/* Seawater Buoyancy Multiplier */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-emerald-400" />
            Seawater Buoyancy (Archimedes)
          </span>
          <span className="font-mono text-emerald-400">{params.buoyancy.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.05"
          value={params.buoyancy}
          onChange={(e) => onChangeParams({ buoyancy: parseFloat(e.target.value) })}
          className="w-full accent-emerald-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Sink (0.2x)</span>
          <span>Neutral (1.0x)</span>
          <span>High Float (3.0x)</span>
        </div>
      </div>

      {/* Linear Hydrodynamic Damping (Fluid Drag) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300">Fluid Drag (Linear Damping)</span>
          <span className="font-mono text-cyan-400">{params.linearDamping.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="0.95"
          step="0.05"
          value={params.linearDamping}
          onChange={(e) => onChangeParams({ linearDamping: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
        />
      </div>

      {/* Surface Friction & Restitution */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Restitution (Bounce)</span>
            <span className="font-mono text-cyan-400">{params.restitution.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.9"
            step="0.05"
            value={params.restitution}
            onChange={(e) => onChangeParams({ restitution: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Basin Friction</span>
            <span className="font-mono text-cyan-400">{params.friction.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={params.friction}
            onChange={(e) => onChangeParams({ friction: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Interactive Hint */}
      <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-mono">
        💡 <strong className="text-slate-300">Physics Interactions:</strong> Click on floating buoys, gliders, or uploaded 3D models in the 3D scene to apply an impulse push force.
      </div>
    </div>
  );
};

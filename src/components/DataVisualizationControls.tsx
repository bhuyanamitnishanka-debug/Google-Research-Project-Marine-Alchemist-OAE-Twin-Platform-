import React from 'react';
import {
  Compass,
  Wind,
  Layers,
  Sparkles,
  Droplets,
  Activity,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DataOverlayConfig, DataOverlayType, HeatmapMetric } from '../types';

interface DataVisualizationControlsProps {
  config: DataOverlayConfig;
  onChangeConfig: (updates: Partial<DataOverlayConfig>) => void;
}

export const DataVisualizationControls: React.FC<DataVisualizationControlsProps> = ({
  config,
  onChangeConfig,
}) => {
  const overlayModes: { id: DataOverlayType; label: string; desc: string }[] = [
    { id: 'none', label: 'Off', desc: 'Standard 3D view' },
    { id: 'heatmap', label: 'Heatmap', desc: 'Biogeochemical gradient' },
    { id: 'vector_field', label: 'Vector Field', desc: 'Hydrodynamic flow vectors' },
    { id: 'sensor_iso', label: 'Sensor Isolines', desc: 'Dispersion contour rings' },
  ];

  const metrics: { id: HeatmapMetric; label: string; unit: string }[] = [
    { id: 'pH', label: 'Seawater pH', unit: 'pH units (8.0-8.8)' },
    { id: 'alkalinity', label: 'Total Alkalinity', unit: 'μmol/kg (2300-2900)' },
    { id: 'pCO2', label: 'Aqueous pCO₂', unit: 'μatm (150-420)' },
    { id: 'dissolution_rate', label: 'Mineral Dissolution', unit: 'Normalized %' },
  ];

  const palettes: { id: 'turbo' | 'viridis' | 'ocean' | 'thermal'; label: string }[] = [
    { id: 'turbo', label: 'Turbo (Rainbow)' },
    { id: 'viridis', label: 'Viridis' },
    { id: 'ocean', label: 'Oceanic' },
    { id: 'thermal', label: 'Thermal' },
  ];

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Overlay Type Mode Buttons */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Overlay Visualization Layer
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {overlayModes.map((mode) => {
            const isSelected = config.type === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onChangeConfig({ type: mode.id })}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="font-semibold text-[11px] font-mono">{mode.label}</span>
                <span className="text-[9px] text-slate-400 leading-tight mt-0.5">{mode.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* When Heatmap or Isolines are active, show Metric selection */}
      {config.type !== 'none' && config.type !== 'vector_field' && (
        <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Biogeochemical Scalar Metric
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {metrics.map((m) => {
              const isSelected = config.metric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChangeConfig({ metric: m.id })}
                  className={`p-1.5 rounded text-left border text-[11px] transition ${
                    isSelected
                      ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200 font-semibold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">{m.label}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{m.unit}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colormap & Opacity Controls */}
      {config.type !== 'none' && (
        <div className="flex flex-col gap-2.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Color Palette</span>
            <div className="flex items-center gap-1">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChangeConfig({ colorScale: p.id })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                    config.colorScale === p.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Overlay Opacity</span>
              <span className="font-mono text-cyan-400">{Math.round(config.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.opacity}
              onChange={(e) => onChangeConfig({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Real-time Legend Indicator */}
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>MIN CONC</span>
              <span>MEDIAN</span>
              <span>PEAK SATURATION</span>
            </div>
            <div className="h-2 w-full rounded bg-gradient-to-r from-blue-600 via-emerald-400 to-rose-500" />
          </div>
        </div>
      )}
    </div>
  );
};

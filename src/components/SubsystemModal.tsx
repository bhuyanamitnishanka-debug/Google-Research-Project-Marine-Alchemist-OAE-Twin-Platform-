import React from 'react';
import {
  X,
  Cpu,
  Droplet,
  Gauge,
  Sun,
  Radio,
  CheckCircle,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { DosingPod, SensorProbe, FeedstockConfig, FacilityState } from '../types';

interface SubsystemModalProps {
  subsystemId: string | null;
  onClose: () => void;
  dosingPods: DosingPod[];
  sensorProbes: SensorProbe[];
  feedstock: FeedstockConfig;
  facilityState: FacilityState;
  onTogglePod: (podId: string) => void;
}

export const SubsystemModal: React.FC<SubsystemModalProps> = ({
  subsystemId,
  onClose,
  dosingPods,
  sensorProbes,
  feedstock,
  facilityState,
  onTogglePod,
}) => {
  if (!subsystemId) return null;

  // Check if it's a dosing pod
  const pod = dosingPods.find((p) => p.id === subsystemId || subsystemId.includes(p.id));
  const probe = sensorProbes.find((pr) => pr.id === subsystemId);
  const isControlCenter = subsystemId === 'control_center';
  const isIntake = subsystemId === 'intake' || subsystemId === 'seawater_intake';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider uppercase">
              SUBSYSTEM SPECIFICATION & TELEMETRY
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* DOSING POD VIEW */}
          {pod && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-emerald-400" />
                    {pod.label} (SEROS LAB DOSING POD)
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Dimensions: 3.8m × 1.5m Modular Dispersion Pod with status halo
                  </p>
                </div>
                <button
                  onClick={() => onTogglePod(pod.id)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                    pod.active
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pod.active ? 'POD ONLINE' : 'POD STANDBY'}
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">CURRENT FEEDSTOCK</span>
                  <span className="font-bold text-emerald-300">{feedstock.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DISPENSING RATE</span>
                  <span className="font-bold text-cyan-300">{pod.active ? `${pod.rateKgPerHour} kg/hr` : '0 kg/hr'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">NOZZLE PRESSURE</span>
                  <span className="font-bold text-slate-200">{pod.nozzlePressureBar} bar</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">INTERNAL SLURRY TANK</span>
                  <span className="font-bold text-slate-200">{pod.slurryLevelPercent}% (980 L)</span>
                </div>
              </div>

              <div className="bg-slate-950/40 p-3 rounded border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                <span className="text-emerald-400 font-bold block mb-1">PLUME DYNAMICS & INJECTION</span>
                Fine-bore hydrodynamic nozzles inject micronized alkaline suspension 1.2m below the basin water surface.
                Integrated vortex vanes accelerate particle dissolution and avoid localized over-saturation spikes.
              </div>
            </div>
          )}

          {/* CONTROL CENTER LAB VIEW */}
          {isControlCenter && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  DATA & CONTROL CENTER
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Climate-controlled research container laboratory with observation deck
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">COMPUTE CLUSTER</span>
                  <span className="font-bold text-cyan-300">5x High-Density Blade Racks</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">AI SIMULATION WORKLOAD</span>
                  <span className="font-bold text-emerald-300">Real-time CFD & Air-Sea Model</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ROOF SOLAR POWER</span>
                  <span className="font-bold text-amber-300">{facilityState.solarGenerationKw} kW Generation</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">FACILITY NET DRAW</span>
                  <span className="font-bold text-slate-200">{facilityState.facilityPowerDrawKw} kW</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                <span className="text-cyan-400 font-bold">INTEGRATED RESEARCH SYSTEMS</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Floor-to-ceiling tempered observation window facing the 20m x 15m testing basin.</li>
                  <li>Direct optical data fiber trunk links to all pH and Alkalinity probes.</li>
                  <li>Seawater cooling intake circuit with titanium heat exchangers for computing racks.</li>
                </ul>
              </div>
            </div>
          )}

          {/* INTAKE SYSTEM VIEW */}
          {isIntake && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  STAINLESS SEAWATER INTAKE SYSTEM
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Dual 316L stainless steel pipes connecting testing basin to open coastal surf
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">CURRENT FLOW RATE</span>
                  <span className="font-bold text-blue-300">{facilityState.intakeFlowM3PerHour} m³/hr</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SUBMERSIBLE PUMPS</span>
                  <span className="font-bold text-emerald-300">Dual VFD Centrifugal Units</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">INTAKE PIPE DIAMETER</span>
                  <span className="font-bold text-slate-200">Ø 420mm (16.5")</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">BIO-SCREENING</span>
                  <span className="font-bold text-slate-200">2mm Wedge-wire + Ultrasonic Anti-foul</span>
                </div>
              </div>

              <div className="bg-slate-950/40 p-3 rounded border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                <span className="text-blue-400 font-bold block mb-1">CONTINUOUS COASTAL EXCHANGE</span>
                Delivers unconditioned, ambient coastal seawater to simulate natural hydrodynamics.
                Velocity caps at 0.15 m/s at the inlet screen prevent marine organism impingement.
              </div>
            </div>
          )}

          {/* SENSOR PROBE VIEW */}
          {probe && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  {probe.label}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  High-frequency oceanographic biogeochemical sensor probe
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">CURRENT READING</span>
                  <span className="font-bold text-amber-300 text-sm">
                    {probe.currentValue} {probe.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">CALIBRATION STATUS</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Certified Nominal
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SAMPLING FREQUENCY</span>
                  <span className="font-bold text-slate-200">10 Hz High-Speed Telemetry</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">TARGET SAFE ENVELOPE</span>
                  <span className="font-bold text-slate-200">
                    {probe.targetRange[0]} - {probe.targetRange[1]} {probe.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback or Dynamic Physics Asset View */}
          {!pod && !isControlCenter && !isIntake && !probe && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  DYNAMIC RESEARCH ASSET: {subsystemId}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  PHYSICS DYNAMIC
                </span>
              </div>
              <p className="text-slate-300 text-xs">
                Asset actively interacting with Cannon-ES physics engine and Archimedean hydrodynamic buoyant forces in the seawater basin.
              </p>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">HYDRODYNAMIC STATUS</span>
                  <span className="font-bold text-emerald-400">Floating in Seawater</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SIMULATION ENGINE</span>
                  <span className="font-bold text-cyan-400">Cannon-ES (60 Hz)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">COLLISION RESPONSE</span>
                  <span className="font-bold text-slate-200">Basin Walls & Floor</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">INTERACTION IMPULSE</span>
                  <span className="font-bold text-amber-300">Click in 3D to Nudge</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-xs font-medium transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

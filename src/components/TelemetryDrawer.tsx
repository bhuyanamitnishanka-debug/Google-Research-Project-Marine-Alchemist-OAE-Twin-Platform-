import React, { useState } from 'react';
import {
  Activity,
  Flame,
  Wind,
  Sun,
  ShieldCheck,
  AlertOctagon,
  TrendingDown,
  Waves,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ChemicalState, FacilityState, SensorProbe, ChemicalLogEvent } from '../types';
import { SimulationHistoryLog } from './SimulationHistoryLog';

interface TelemetryDrawerProps {
  chemicalState: ChemicalState;
  facilityState: FacilityState;
  sensorProbes: SensorProbe[];
  historyPoints: { time: string; pH: number; TA: number; co2Rate: number }[];
  historyEvents?: ChemicalLogEvent[];
  onTriggerOaeSpike?: () => void;
  onTriggerRemediation?: () => void;
  onStepStorySequence?: () => void;
  onClearHistoryEvents?: () => void;
  onLiveAIInference?: () => Promise<void>;
  apiKey?: string;
  initialTab?: 'telemetry' | 'history';
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  chemicalState,
  facilityState,
  sensorProbes,
  historyPoints,
  historyEvents = [],
  onTriggerOaeSpike = () => {},
  onTriggerRemediation = () => {},
  onStepStorySequence = () => {},
  onClearHistoryEvents = () => {},
  onLiveAIInference,
  apiKey,
  initialTab = 'telemetry',
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'history'>(initialTab);

  const criticalCount = historyEvents.filter((e) => e.severity === 'critical').length;
  const warningCount = historyEvents.filter((e) => e.severity === 'warning').length;

  return (
    <div className="flex flex-col gap-3 p-4 text-slate-200 overflow-y-auto max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-300">
            Biogeochemical Telemetry
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          TELEMETRY STREAMING
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition ${
            activeTab === 'telemetry'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition relative ${
            activeTab === 'history'
              ? 'bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#4285F4]" />
          <span>Simulation History Log</span>
          {criticalCount > 0 ? (
            <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#EA4335] text-white text-[9px] font-bold animate-pulse">
              {criticalCount}
            </span>
          ) : historyEvents.length > 0 ? (
            <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-slate-800 text-slate-300 text-[9px]">
              {historyEvents.length}
            </span>
          ) : null}
        </button>
      </div>

      {/* Tab 1: Live Telemetry Metrics */}
      {activeTab === 'telemetry' && (
        <>
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Current pH */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>SEAWATER pH</span>
                <span className="font-mono text-[10px] text-slate-500">Base: {chemicalState.baselinePH}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-bold font-mono ${
                    chemicalState.pH > 8.65
                      ? 'text-rose-400'
                      : chemicalState.pH > 8.35
                      ? 'text-emerald-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {chemicalState.pH.toFixed(3)}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {chemicalState.pH >= chemicalState.baselinePH ? '+' : ''}
                  {(chemicalState.pH - chemicalState.baselinePH).toFixed(3)}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                {/* Visual scale from 7.8 to 9.0 */}
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((chemicalState.pH - 7.8) / (9.0 - 7.8)) * 100))}%`,
                  }}
                />
              </div>
            </div>

        {/* Total Alkalinity (TA) */}
        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>TOTAL ALKALINITY</span>
            <span className="font-mono text-[10px] text-slate-500">μmol/kg</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {chemicalState.totalAlkalinity}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              +{chemicalState.totalAlkalinity - chemicalState.baselineTA}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, ((chemicalState.totalAlkalinity - 2200) / 1200) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* CO2 Drawdown Rate */}
        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>CO₂ DRAWDOWN</span>
            <span className="font-mono text-[10px] text-emerald-400">mCDR RATE</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {chemicalState.sequestrationRateTonsPerDay.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">Tons / Day</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            <span>Total: {chemicalState.cumulativeCO2SequesteredKg.toFixed(1)} kg CO₂</span>
          </div>
        </div>

        {/* pCO2 Plume Drawdown */}
        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>SEAWATER pCO₂</span>
            <span className="font-mono text-[10px] text-slate-500">μatm</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {chemicalState.pCO2}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              -{(chemicalState.baselinePCO2 - chemicalState.pCO2)} μatm
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Atmospheric air-sea flux: Active Influx
          </div>
        </div>
      </div>

      {/* Aragonite Saturation & Precipitation Envelope */}
      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Aragonite Saturation State (Ω_arag)
          </span>
          <span
            className={`font-mono text-xs font-bold ${
              chemicalState.aragoniteSaturation > 4.5
                ? 'text-rose-400'
                : chemicalState.aragoniteSaturation > 3.8
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            Ω = {chemicalState.aragoniteSaturation.toFixed(2)}
          </span>
        </div>

        {/* Saturation Gauge Bar */}
        <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              chemicalState.aragoniteSaturation > 4.5
                ? 'bg-rose-500'
                : chemicalState.aragoniteSaturation > 3.8
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{
              width: `${Math.min(100, (chemicalState.aragoniteSaturation / 5.5) * 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>Baseline (2.6)</span>
          <span>Optimal Envelope (3.2 - 4.0)</span>
          <span className="text-rose-400">Precipitation Threshold (&gt;4.5)</span>
        </div>
      </div>

      {/* Carbonate Speciation Balance (DIC Fractions) */}
      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Carbonate System Speciation</span>
          <span className="font-mono text-[10px] text-cyan-400">DIC: {chemicalState.dic} μmol/kg</span>
        </div>

        {/* Multi-segment stacked bar */}
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800 text-[9px] font-mono text-slate-900 font-bold">
          <div
            style={{ width: `${chemicalState.bicarbonateFraction}%` }}
            className="bg-cyan-400 flex items-center justify-center transition-all duration-300"
            title={`Bicarbonate HCO3-: ${chemicalState.bicarbonateFraction}%`}
          />
          <div
            style={{ width: `${chemicalState.carbonateFraction}%` }}
            className="bg-emerald-400 flex items-center justify-center transition-all duration-300"
            title={`Carbonate CO3(2-): ${chemicalState.carbonateFraction}%`}
          />
          <div
            style={{ width: `${chemicalState.aqueousCO2Fraction}%` }}
            className="bg-indigo-300 flex items-center justify-center transition-all duration-300"
            title={`Aqueous CO2(aq): ${chemicalState.aqueousCO2Fraction}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-cyan-400 inline-block" />
            <span>HCO₃⁻: {chemicalState.bicarbonateFraction}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-400 inline-block" />
            <span>CO₃²⁻: {chemicalState.carbonateFraction}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-indigo-300 inline-block" />
            <span>CO₂(aq): {chemicalState.aqueousCO2Fraction}%</span>
          </div>
        </div>
      </div>

      {/* Telemetry History Sparkline / Chart */}
      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Run Dynamics (pH & TA)</span>
          <span className="text-[10px] font-mono text-slate-500">Recent 15 intervals</span>
        </div>
        <div className="h-16 flex items-end gap-1.5 pt-2 border-b border-slate-800">
          {historyPoints.map((pt, i) => {
            const heightPercent = Math.min(100, Math.max(10, ((pt.pH - 7.9) / (8.8 - 7.9)) * 100));
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                <div
                  className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                  style={{ height: `${heightPercent}%` }}
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-7 hidden group-hover:block bg-slate-950 text-slate-200 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap z-30 shadow">
                  pH: {pt.pH.toFixed(2)} | TA: {pt.TA}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environmental & Facility Power Status */}
      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-300">Coastal Site Conditions</span>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
            <Waves className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <div className="text-[9px] text-slate-500">WATER TEMP</div>
              <div className="font-bold text-slate-200">{facilityState.waterTemperatureC} °C</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <div className="text-[9px] text-slate-500">SALINITY</div>
              <div className="font-bold text-slate-200">{facilityState.salinityPSU} PSU</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <div className="text-[9px] text-slate-500">ROOF SOLAR GEN</div>
              <div className="font-bold text-amber-300">{facilityState.solarGenerationKw} kW</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <div>
              <div className="text-[9px] text-slate-500">WIND (EXCHANGE)</div>
              <div className="font-bold text-slate-200">{facilityState.windSpeedKnots} kts</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

  {/* Tab 2: Simulation History Log Feed */}
  {activeTab === 'history' && (
    <SimulationHistoryLog
      events={historyEvents}
      onTriggerOaeSpike={onTriggerOaeSpike}
      onTriggerRemediation={onTriggerRemediation}
      onStepStorySequence={onStepStorySequence}
      onClearEvents={onClearHistoryEvents}
      currentChemicalState={chemicalState}
      onLiveAIInference={onLiveAIInference}
      apiKey={apiKey}
    />
  )}
</div>
  );
};

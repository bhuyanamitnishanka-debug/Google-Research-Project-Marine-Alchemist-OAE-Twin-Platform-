import React, { useState } from 'react';
import {
  Sliders,
  Droplet,
  Gauge,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Box,
  Layers,
  Anchor,
} from 'lucide-react';
import {
  FeedstockType,
  FeedstockConfig,
  DosingPod,
  ChemicalState,
  ExperimentScenario,
  PhysicsParams,
  UserUploadedModel,
  DataOverlayConfig,
  PlumeSimulationConfig,
} from '../types';
import { FEEDSTOCKS } from '../simulation/geochemistry';
import { PhysicsControls } from './PhysicsControls';
import { ModelUploadManager } from './ModelUploadManager';
import { DataVisualizationControls } from './DataVisualizationControls';
import { PlumeControls } from './PlumeControls';
import * as THREE from 'three';

interface ControlPanelProps {
  currentFeedstock: FeedstockType;
  onChangeFeedstock: (feedstock: FeedstockType) => void;
  masterDosingRate: number;
  onChangeMasterDosingRate: (rate: number) => void;
  dosingPods: DosingPod[];
  onTogglePod: (podId: string) => void;
  onToggleAllPods: (enable: boolean) => void;
  intakeFlow: number;
  onChangeIntakeFlow: (flow: number) => void;
  chemicalState: ChemicalState;
  onLoadScenario: (scenario: ExperimentScenario) => void;

  // Physics Props
  physicsParams: PhysicsParams;
  onChangePhysicsParams: (updates: Partial<PhysicsParams>) => void;
  onResetPhysics: () => void;

  // 3D Model Upload Props
  uploadedModels: UserUploadedModel[];
  onAddModel: (model: UserUploadedModel, object3D: THREE.Group) => void;
  onUpdateModel: (id: string, updates: Partial<UserUploadedModel>) => void;
  onRemoveModel: (id: string) => void;
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;

  // Data Visualization Props
  dataOverlay: DataOverlayConfig;
  onChangeDataOverlay: (updates: Partial<DataOverlayConfig>) => void;

  // Chemical Dispersion Plume Simulation Props
  plumeConfig: PlumeSimulationConfig;
  onChangePlumeConfig: (updates: Partial<PlumeSimulationConfig>) => void;
  onResetPlumes: () => void;
}

const EXPERIMENT_SCENARIOS: ExperimentScenario[] = [
  {
    id: 'steady_state',
    title: 'Optimal Steady-State OAE',
    description: 'Continuous balanced dosing of Ca(OH)₂ with high turnover. Max CO₂ drawdown with zero precipitation risk.',
    feedstock: 'slaked_lime',
    dosingRateKgHr: 45,
    intakeFlow: 650,
    activePodsCount: 7,
  },
  {
    id: 'brucite_buffer',
    title: 'Low-Risk Brucite Infusion',
    description: 'Magnesium hydroxide buffering to mitigate local pH spikes while sustaining long-term alkalinity enrichment.',
    feedstock: 'brucite',
    dosingRateKgHr: 60,
    intakeFlow: 500,
    activePodsCount: 5,
  },
  {
    id: 'olivine_weathering',
    title: 'Ultramafic Olivine Dissolution',
    description: 'Natural mineral weathering test studying multi-equivalent silicate and magnesium release dynamics.',
    feedstock: 'olivine',
    dosingRateKgHr: 75,
    intakeFlow: 400,
    activePodsCount: 7,
  },
  {
    id: 'stress_test',
    title: 'Saturation Limit Stress Test',
    description: 'High-concentration pulse evaluating runaway aragonite precipitation threshold (Ω_arag > 4.5).',
    feedstock: 'slaked_lime',
    dosingRateKgHr: 95,
    intakeFlow: 180,
    activePodsCount: 7,
  },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentFeedstock,
  onChangeFeedstock,
  masterDosingRate,
  onChangeMasterDosingRate,
  dosingPods,
  onTogglePod,
  onToggleAllPods,
  intakeFlow,
  onChangeIntakeFlow,
  chemicalState,
  onLoadScenario,
  physicsParams,
  onChangePhysicsParams,
  onResetPhysics,
  uploadedModels,
  onAddModel,
  onUpdateModel,
  onRemoveModel,
  selectedModelId,
  onSelectModel,
  dataOverlay,
  onChangeDataOverlay,
  plumeConfig,
  onChangePlumeConfig,
  onResetPlumes,
}) => {
  const [activeTab, setActiveTab] = useState<'dosing' | 'physics' | 'models' | 'visualize' | 'plumes'>('dosing');
  const activePodsCount = dosingPods.filter((p) => p.active).length;
  const feedstockInfo: FeedstockConfig = FEEDSTOCKS[currentFeedstock];

  return (
    <div className="flex flex-col h-full text-slate-200 overflow-hidden">
      {/* Category Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/80 shrink-0 px-2 pt-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dosing')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'dosing'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Dosing & Flow
        </button>

        <button
          onClick={() => setActiveTab('plumes')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'plumes'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Plumes
        </button>

        <button
          onClick={() => setActiveTab('physics')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'physics'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Anchor className="w-3.5 h-3.5 text-amber-400" />
          Physics
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'models'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-emerald-400" />
          3D Models ({uploadedModels.length})
        </button>

        <button
          onClick={() => setActiveTab('visualize')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'visualize'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          Overlays
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* TAB 1: DOSING & FLOW */}
        {activeTab === 'dosing' && (
          <>
            {/* Safety Alert (if secondary precipitation risk detected) */}
            {chemicalState.precipitationRisk !== 'none' && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  chemicalState.precipitationRisk === 'critical'
                    ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                    : 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold font-mono uppercase tracking-wide">
                    {chemicalState.precipitationRisk === 'critical' ? 'Precipitation Threshold Exceeded' : 'Elevated Saturation Warning'}
                  </div>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                    Ω_arag is currently {chemicalState.aragoniteSaturation}. Increase seawater turnover flow or reduce dosing rate to prevent CaCO₃ precipitation.
                  </p>
                </div>
              </div>
            )}

            {/* Feedstock Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                  Alkalinity Feedstock Mineral
                </span>
                <span className="text-[10px] font-mono text-cyan-400">{feedstockInfo.chemicalFormula}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(FEEDSTOCKS) as FeedstockType[]).map((key) => {
                  const item = FEEDSTOCKS[key];
                  const isSelected = currentFeedstock === key;
                  return (
                    <button
                      key={key}
                      onClick={() => onChangeFeedstock(key)}
                      className={`p-2 rounded-lg text-left border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold">{item.chemicalFormula}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-1">{item.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <Info className="w-3 h-3 text-cyan-400 inline mr-1" />
                {feedstockInfo.description}
              </p>
            </div>

            {/* Master Dosing Rate Slider */}
            <div className="flex flex-col gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  Master Dosing Rate (per pod)
                </span>
                <span className="font-mono text-cyan-400 font-bold">{masterDosingRate} kg/hr</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={masterDosingRate}
                onChange={(e) => onChangeMasterDosingRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0 (Off)</span>
                <span>Total: {masterDosingRate * activePodsCount} kg/hr</span>
                <span>100 (Max)</span>
              </div>
            </div>

            {/* Dosing Pod Matrix Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Active Injection Pods ({activePodsCount}/{dosingPods.length})
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleAllPods(true)}
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    ALL ON
                  </button>
                  <button
                    onClick={() => onToggleAllPods(false)}
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    ALL OFF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {dosingPods.map((pod) => (
                  <div
                    key={pod.id}
                    onClick={() => onTogglePod(pod.id)}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition ${
                      pod.active
                        ? 'bg-slate-900/90 border-cyan-500/40 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          pod.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-xs font-mono">{pod.label.replace('Dosing Pod ', 'Pod ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400">
                        {pod.active ? `${pod.rateKgPerHour} kg/h` : 'OFF'}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          pod.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pod.active ? 'ACTIVE' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seawater Intake Flow */}
            <div className="flex flex-col gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  Seawater Ocean Turnover Intake
                </span>
                <span className="font-mono text-blue-400 font-bold">{intakeFlow} m³/hr</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={intakeFlow}
                onChange={(e) => onChangeIntakeFlow(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>100 m³/h</span>
                <span>Basin Vol: 1050 m³ (~{((1050 / Math.max(1, intakeFlow))).toFixed(1)}h Turnover)</span>
                <span>1500 m³/h</span>
              </div>
            </div>

            {/* Research Experiment Presets */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                OAE Research Test Scenarios
              </label>
              <div className="flex flex-col gap-2">
                {EXPERIMENT_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => onLoadScenario(sc)}
                    className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                        {sc.title}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                        LOAD
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sc.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: PHYSICS ENGINE CONTROLS */}
        {activeTab === 'physics' && (
          <PhysicsControls
            params={physicsParams}
            onChangeParams={onChangePhysicsParams}
            onResetPhysics={onResetPhysics}
          />
        )}

        {/* TAB 3: 3D MODEL UPLOADER & ASSETS */}
        {activeTab === 'models' && (
          <ModelUploadManager
            models={uploadedModels}
            onAddModel={onAddModel}
            onUpdateModel={onUpdateModel}
            onRemoveModel={onRemoveModel}
            selectedModelId={selectedModelId}
            onSelectModel={onSelectModel}
          />
        )}

        {/* TAB 4: DATA VISUALIZATION OVERLAYS */}
        {activeTab === 'visualize' && (
          <DataVisualizationControls
            config={dataOverlay}
            onChangeConfig={onChangeDataOverlay}
          />
        )}

        {/* TAB 5: CHEMICAL DISPERSION PLUMES */}
        {activeTab === 'plumes' && (
          <PlumeControls
            config={plumeConfig}
            onChangeConfig={onChangePlumeConfig}
            feedstock={currentFeedstock}
            onResetPlumes={onResetPlumes}
          />
        )}
      </div>
    </div>
  );
};

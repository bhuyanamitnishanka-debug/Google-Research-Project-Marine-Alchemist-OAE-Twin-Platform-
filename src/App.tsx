import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeCanvas } from './components/ThreeCanvas';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { SubsystemModal } from './components/SubsystemModal';
import { BlueprintOverlay } from './components/BlueprintOverlay';
import { CinematicTourOverlay } from './components/CinematicTourOverlay';
import { GraphicNovelPanel } from './components/GraphicNovelPanel';
import {
  DosingPod,
  SensorProbe,
  FeedstockType,
  ChemicalState,
  FacilityState,
  VisualMode,
  ViewPreset,
  ExperimentScenario,
  PhysicsParams,
  UserUploadedModel,
  DataOverlayConfig,
  PlumeSimulationConfig,
  CinematicTourState,
  CinematicTourStage,
  ChemicalLogEvent,
  EventSeverity,
} from './types';
import { calculateGeochemistry, FEEDSTOCKS } from './simulation/geochemistry';
import { soundEngine } from './utils/audio';
import { Sliders, Activity, Maximize2, Minimize2 } from 'lucide-react';

const INITIAL_PODS: DosingPod[] = [
  // Top ocean wall pods (matching reference image)
  {
    id: 'pod_1',
    label: 'Dosing Pod 01 (Northwest)',
    position: [-8.8, 1.2, -9.8],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.4,
    slurryLevelPercent: 92,
    totalDispensedKg: 140,
  },
  {
    id: 'pod_2',
    label: 'Dosing Pod 02 (North-Central)',
    position: [-5.2, 1.2, -9.8],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.3,
    slurryLevelPercent: 88,
    totalDispensedKg: 135,
  },
  {
    id: 'pod_3',
    label: 'Dosing Pod 03 (North-Central East)',
    position: [-1.6, 1.2, -9.8],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.4,
    slurryLevelPercent: 90,
    totalDispensedKg: 138,
  },
  {
    id: 'pod_4',
    label: 'Dosing Pod 04 (Northeast)',
    position: [2.0, 1.2, -9.8],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.2,
    slurryLevelPercent: 85,
    totalDispensedKg: 128,
  },
  // Side/South wall pods (matching reference image foreground pods)
  {
    id: 'pod_5',
    label: 'Dosing Pod 05 (Southeast 01)',
    position: [2.8, 1.2, 5.0],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.5,
    slurryLevelPercent: 94,
    totalDispensedKg: 142,
  },
  {
    id: 'pod_6',
    label: 'Dosing Pod 06 (Southeast 02)',
    position: [2.8, 1.2, 8.4],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.4,
    slurryLevelPercent: 91,
    totalDispensedKg: 139,
  },
  {
    id: 'pod_7',
    label: 'Dosing Pod 07 (South Perimeter)',
    position: [-0.8, 1.2, 9.8],
    active: true,
    rateKgPerHour: 45,
    status: 'optimal',
    nozzlePressureBar: 2.3,
    slurryLevelPercent: 87,
    totalDispensedKg: 130,
  },
];

const INITIAL_PROBES: SensorProbe[] = [
  {
    id: 'probe_ph_1',
    label: 'pH Probe Alpha (North Wall)',
    type: 'pH',
    position: [-3.4, 0.4, -9.0],
    currentValue: 8.35,
    unit: 'pH',
    targetRange: [8.1, 8.6],
    status: 'nominal',
  },
  {
    id: 'probe_ta_1',
    label: 'Total Alkalinity Probe (South Wall)',
    type: 'TotalAlkalinity',
    position: [1.2, 0.4, 9.0],
    currentValue: 2490,
    unit: 'μmol/kg',
    targetRange: [2300, 2750],
    status: 'nominal',
  },
  {
    id: 'probe_pco2_1',
    label: 'Aqueous pCO2 Spectrometer',
    type: 'pCO2',
    position: [-7.0, 0.4, 0.0],
    currentValue: 310,
    unit: 'μatm',
    targetRange: [150, 420],
    status: 'nominal',
  },
];

const INITIAL_CHEMICAL: ChemicalState = {
  pH: 8.36,
  baselinePH: 8.12,
  totalAlkalinity: 2480,
  baselineTA: 2320,
  pCO2: 305,
  baselinePCO2: 418,
  dic: 2180,
  aragoniteSaturation: 3.42,
  cumulativeCO2SequesteredKg: 348.6,
  sequestrationRateTonsPerDay: 1.48,
  carbonateFraction: 14.8,
  bicarbonateFraction: 85.0,
  aqueousCO2Fraction: 0.2,
  precipitationRisk: 'none',
};

const INITIAL_FACILITY: FacilityState = {
  intakeFlowM3PerHour: 650,
  effluentReturnFlowM3PerHour: 650,
  waterTemperatureC: 18.4,
  salinityPSU: 34.8,
  solarGenerationKw: 24.5,
  facilityPowerDrawKw: 16.8,
  pumpEfficiencyPercent: 94,
  oceanWaveHeightM: 1.2,
  tideLevelM: 0.8,
  windSpeedKnots: 11,
};

export default function App() {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [visualMode, setVisualMode] = useState<VisualMode>('realistic');
  const [viewPreset, setViewPreset] = useState<ViewPreset>('overview');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Simulation parameters
  const [currentFeedstock, setCurrentFeedstock] = useState<FeedstockType>('slaked_lime');
  const [masterDosingRate, setMasterDosingRate] = useState<number>(45);
  const [dosingPods, setDosingPods] = useState<DosingPod[]>(INITIAL_PODS);
  const [sensorProbes, setSensorProbes] = useState<SensorProbe[]>(INITIAL_PROBES);
  const [chemicalState, setChemicalState] = useState<ChemicalState>(INITIAL_CHEMICAL);
  const [facilityState, setFacilityState] = useState<FacilityState>(INITIAL_FACILITY);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);

  // Physics Engine state
  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>({
    gravity: -9.82,
    buoyancy: 1.35,
    linearDamping: 0.35,
    restitution: 0.3,
    friction: 0.4,
    waterDensity: 1025,
  });

  // User-Uploaded 3D Models state
  const [uploadedModels, setUploadedModels] = useState<UserUploadedModel[]>([]);
  const [uploadedModelObjects] = useState<Map<string, THREE.Group>>(new Map());
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Data Visualization Overlays state
  const [dataOverlay, setDataOverlay] = useState<DataOverlayConfig>({
    type: 'none',
    metric: 'pH',
    opacity: 0.8,
    showContours: false,
    vectorDensity: 3,
    colorScale: 'turbo',
    sampleGridResolution: 32,
  });

  // Dynamic Chemical Dispersion Plumes state
  const [plumeConfig, setPlumeConfig] = useState<PlumeSimulationConfig>({
    enabled: true,
    particleCountPerPod: 350,
    particleSize: 0.38,
    dispersionSpeed: 1.0,
    turbulence: 1.0,
    colorMode: 'concentration',
    lifetimeSeconds: 5.0,
    buoyancyEffect: 0.0,
  });

  // Automated Cinematic Camera Tour & Graphic Novel state
  const [isGraphicNovelOpen, setIsGraphicNovelOpen] = useState<boolean>(false);
  const [tourState, setTourState] = useState<CinematicTourState>({
    isActive: false,
    stage: 'orbital_overview',
    targetPodId: null,
    targetPodLabel: null,
    stageProgress: 0,
    stageDurationSeconds: 14,
    autoCycleEnabled: true,
    cameraSpeed: 1.0,
    storyLogChapter: 1,
  });

  const tourStagesOrder: CinematicTourStage[] = [
    'orbital_overview',
    'pod_focus',
    'subsurface_plume',
    'intake_shoreline',
    'control_lab',
  ];

  // Advance to next cinematic tour waypoint
  const handleNextTourStage = () => {
    setTourState((prev) => {
      const curIdx = tourStagesOrder.indexOf(prev.stage);
      const nextIdx = (curIdx + 1) % tourStagesOrder.length;
      const nextStage = tourStagesOrder[nextIdx];

      // If next stage is pod_focus, select next active pod or pick a pod
      let nextPodId = prev.targetPodId;
      let nextPodLabel = prev.targetPodLabel;
      if (nextStage === 'pod_focus') {
        const activePods = dosingPods.filter((p) => p.active);
        const candidatePods = activePods.length > 0 ? activePods : dosingPods;
        const curPodIdx = candidatePods.findIndex((p) => p.id === prev.targetPodId);
        const nextPod = candidatePods[(curPodIdx + 1) % candidatePods.length];
        nextPodId = nextPod ? nextPod.id : null;
        nextPodLabel = nextPod ? nextPod.label : null;
      }

      return {
        ...prev,
        stage: nextStage,
        targetPodId: nextPodId,
        targetPodLabel: nextPodLabel,
        stageProgress: 0,
        storyLogChapter: nextIdx + 1,
      };
    });
  };

  const handleToggleCinematicTour = () => {
    setTourState((prev) => {
      const willBeActive = !prev.isActive;
      if (willBeActive) {
        soundEngine.playSwell();
      }
      return {
        ...prev,
        isActive: willBeActive,
        stageProgress: 0,
      };
    });
  };

  const handleSetTourStage = (stage: CinematicTourStage, podId?: string) => {
    const stageIdx = tourStagesOrder.indexOf(stage);
    let podLabel: string | null = null;
    if (podId) {
      const p = dosingPods.find((pod) => pod.id === podId);
      if (p) podLabel = p.label;
    } else if (stage === 'pod_focus') {
      const p = dosingPods.find((pod) => pod.active) || dosingPods[0];
      if (p) {
        podId = p.id;
        podLabel = p.label;
      }
    }

    setTourState((prev) => ({
      ...prev,
      isActive: true,
      stage,
      targetPodId: podId || null,
      targetPodLabel: podLabel,
      stageProgress: 0,
      storyLogChapter: stageIdx !== -1 ? stageIdx + 1 : 1,
    }));
  };

  // Timer loop for auto-cycling cinematic tour stages
  useEffect(() => {
    if (!tourState.isActive || !tourState.autoCycleEnabled) return;

    const intervalMs = 200;
    const stepIncrement = (intervalMs / 1000) / (tourState.stageDurationSeconds / (tourState.cameraSpeed || 1));

    const timer = setInterval(() => {
      setTourState((prev) => {
        if (!prev.isActive || !prev.autoCycleEnabled) return prev;
        const newProgress = prev.stageProgress + stepIncrement;
        if (newProgress >= 1.0) {
          // Time to cycle to next stage
          const curIdx = tourStagesOrder.indexOf(prev.stage);
          const nextIdx = (curIdx + 1) % tourStagesOrder.length;
          const nextStage = tourStagesOrder[nextIdx];

          let nextPodId = prev.targetPodId;
          let nextPodLabel = prev.targetPodLabel;
          if (nextStage === 'pod_focus') {
            const activePods = dosingPods.filter((p) => p.active);
            const candidatePods = activePods.length > 0 ? activePods : dosingPods;
            const curPodIdx = candidatePods.findIndex((p) => p.id === prev.targetPodId);
            const nextPod = candidatePods[(curPodIdx + 1) % candidatePods.length];
            nextPodId = nextPod ? nextPod.id : null;
            nextPodLabel = nextPod ? nextPod.label : null;
          }

          return {
            ...prev,
            stage: nextStage,
            targetPodId: nextPodId,
            targetPodLabel: nextPodLabel,
            stageProgress: 0,
            storyLogChapter: nextIdx + 1,
          };
        }
        return {
          ...prev,
          stageProgress: newProgress,
        };
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [tourState.isActive, tourState.autoCycleEnabled, tourState.stageDurationSeconds, tourState.cameraSpeed, dosingPods]);

  const handleResetPlumes = () => {
    setPlumeConfig({
      enabled: true,
      particleCountPerPod: 350,
      particleSize: 0.38,
      dispersionSpeed: 1.0,
      turbulence: 1.0,
      colorMode: 'concentration',
      lifetimeSeconds: 5.0,
      buoyancyEffect: 0.0,
    });
  };

  // Handler for adding uploaded or preset 3D model
  const handleAddModel = (model: UserUploadedModel, object3D: THREE.Group) => {
    uploadedModelObjects.set(model.id, object3D);
    setUploadedModels((prev) => [...prev, model]);
    setSelectedModelId(model.id);
  };

  const handleUpdateModel = (id: string, updates: Partial<UserUploadedModel>) => {
    setUploadedModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleRemoveModel = (id: string) => {
    uploadedModelObjects.delete(id);
    setUploadedModels((prev) => prev.filter((m) => m.id !== id));
    if (selectedModelId === id) setSelectedModelId(null);
  };

  const handleResetPhysics = () => {
    setPhysicsParams({
      gravity: -9.82,
      buoyancy: 1.35,
      linearDamping: 0.35,
      restitution: 0.3,
      friction: 0.4,
      waterDensity: 1025,
    });
  };

  // History buffer for sparkline tracking
  const [historyPoints, setHistoryPoints] = useState<
    { time: string; pH: number; TA: number; co2Rate: number }[]
  >([
    { time: 'T-14', pH: 8.12, TA: 2320, co2Rate: 0.0 },
    { time: 'T-13', pH: 8.15, TA: 2340, co2Rate: 0.2 },
    { time: 'T-12', pH: 8.18, TA: 2365, co2Rate: 0.4 },
    { time: 'T-11', pH: 8.22, TA: 2390, co2Rate: 0.65 },
    { time: 'T-10', pH: 8.25, TA: 2410, co2Rate: 0.85 },
    { time: 'T-9', pH: 8.28, TA: 2430, co2Rate: 1.05 },
    { time: 'T-8', pH: 8.31, TA: 2450, co2Rate: 1.25 },
    { time: 'T-7', pH: 8.33, TA: 2465, co2Rate: 1.35 },
    { time: 'T-6', pH: 8.34, TA: 2472, co2Rate: 1.40 },
    { time: 'T-5', pH: 8.35, TA: 2478, co2Rate: 1.44 },
    { time: 'T-4', pH: 8.36, TA: 2480, co2Rate: 1.48 },
  ]);

  // Simulation History Log with initial chronological story baseline
  const [historyEvents, setHistoryEvents] = useState<ChemicalLogEvent[]>([
    {
      id: 'ev-init-1',
      timestamp: new Date(Date.now() - 150000).toLocaleTimeString(),
      relativeTime: 'T-02:30',
      title: 'Chapter 1: Baseline Acquisition',
      message:
        'Project Marine Alchemist initiates sub-surface operational loops on the shoreline. Coastal intake channels pump raw seawater at 250 L/s into the concrete monitoring basin.',
      severity: 'nominal',
      category: 'system',
      metrics: {
        pH: 8.12,
        totalAlkalinity: 2320,
        pCO2: 418,
        omega: 2.6,
        co2Rate: 0.0,
      },
    },
    {
      id: 'ev-init-2',
      timestamp: new Date(Date.now() - 85000).toLocaleTimeString(),
      relativeTime: 'T-01:25',
      title: 'Chapter 2: Alkalinity Deployment',
      message:
        'Autonomous feed arrays inject liquid magnesium hydroxide slurries. The data center loop scales computing workloads to calculate the regional oceanic carbon uptake ceiling.',
      severity: 'nominal',
      category: 'dosing',
      metrics: {
        pH: 8.35,
        totalAlkalinity: 2480,
        pCO2: 320,
        omega: 3.42,
        co2Rate: 1.48,
      },
    },
  ]);

  // Threshold crossing state reference to avoid repeated triggering on the same side
  const prevThresholdsRef = useRef<{
    phLevel: 'baseline' | 'enhanced' | 'high' | 'critical';
    taLevel: 'baseline' | 'enhanced' | 'high' | 'critical';
    omegaLevel: 'normal' | 'warning' | 'critical';
  }>({
    phLevel: 'enhanced',
    taLevel: 'baseline',
    omegaLevel: 'normal',
  });

  // Main Biogeochemical Simulation Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Calculate total active dosing rate in kg/hr
      const activePods = dosingPods.filter((p) => p.active);
      const totalActiveRate = activePods.reduce((acc, p) => acc + p.rateKgPerHour, 0);

      const feedstock = FEEDSTOCKS[currentFeedstock];
      const updatedChemistry = calculateGeochemistry(
        chemicalState,
        facilityState,
        feedstock,
        totalActiveRate,
        1.0, // 1 second delta
        simSpeed
      );

      setChemicalState(updatedChemistry);

      // Threshold crossing detection
      const prevLevels = prevThresholdsRef.current;
      const currentPhLevel =
        updatedChemistry.pH >= 8.80
          ? 'critical'
          : updatedChemistry.pH >= 8.65
          ? 'high'
          : updatedChemistry.pH >= 8.35
          ? 'enhanced'
          : 'baseline';

      const currentTaLevel =
        updatedChemistry.totalAlkalinity >= 3000
          ? 'critical'
          : updatedChemistry.totalAlkalinity >= 2750
          ? 'high'
          : updatedChemistry.totalAlkalinity >= 2500
          ? 'enhanced'
          : 'baseline';

      const currentOmegaLevel =
        updatedChemistry.aragoniteSaturation >= 4.5
          ? 'critical'
          : updatedChemistry.aragoniteSaturation >= 3.8
          ? 'warning'
          : 'normal';

      const newEvents: ChemicalLogEvent[] = [];
      const nowTime = new Date().toLocaleTimeString();
      const simSec = Math.floor(Date.now() / 1000) % 3600;
      const relTime = `T+${String(Math.floor(simSec / 60)).padStart(2, '0')}:${String(simSec % 60).padStart(2, '0')}`;

      // pH Threshold transitions
      if (currentPhLevel !== prevLevels.phLevel) {
        if (currentPhLevel === 'critical') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ph-crit',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Threshold Crossed: Critical pH Excursion (pH > 8.80)',
            message: `Localized seawater pH surged to ${updatedChemistry.pH.toFixed(3)}. Runaway secondary calcite precipitation risk active near injector array.`,
            severity: 'critical',
            category: 'pH',
            metrics: {
              pH: updatedChemistry.pH,
              totalAlkalinity: updatedChemistry.totalAlkalinity,
              omega: updatedChemistry.aragoniteSaturation,
              pCO2: updatedChemistry.pCO2,
            },
          });
          soundEngine.playCriticalAlarm();
        } else if (currentPhLevel === 'high') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ph-warn',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Threshold Warning: Elevated Buffer Boundary (pH > 8.65)',
            message: `Seawater pH crossed 8.65 buffer boundary (${updatedChemistry.pH.toFixed(3)}). Dissolution kinetics approaching secondary carbonate envelope.`,
            severity: 'warning',
            category: 'pH',
            metrics: { pH: updatedChemistry.pH, totalAlkalinity: updatedChemistry.totalAlkalinity },
          });
        } else if (currentPhLevel === 'enhanced' && prevLevels.phLevel === 'baseline') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ph-enh',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Optimal Envelope: Alkalinity Enhancement Active (pH > 8.35)',
            message: `Plume entered optimal OAE enhancement window (pH ${updatedChemistry.pH.toFixed(3)}). Atmospheric CO2 air-sea drawdown accelerating.`,
            severity: 'nominal',
            category: 'pH',
            metrics: { pH: updatedChemistry.pH, totalAlkalinity: updatedChemistry.totalAlkalinity },
          });
        } else if (
          (currentPhLevel === 'enhanced' || currentPhLevel === 'baseline') &&
          (prevLevels.phLevel === 'critical' || prevLevels.phLevel === 'high')
        ) {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ph-norm',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Chemical Stabilization: pH Envelope Normalized',
            message: `Seawater pH stabilized at ${updatedChemistry.pH.toFixed(3)}. Localized marine buffer restored to safe operating equilibrium.`,
            severity: 'resolved',
            category: 'remediation',
            metrics: { pH: updatedChemistry.pH, totalAlkalinity: updatedChemistry.totalAlkalinity },
          });
        }
      }

      // TA Threshold transitions
      if (currentTaLevel !== prevLevels.taLevel) {
        if (currentTaLevel === 'critical') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ta-crit',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Threshold Crossed: Hyper-Alkaline Saturation (TA > 3000 µmol/kg)',
            message: `Total alkalinity spiked to ${updatedChemistry.totalAlkalinity} µmol/kg. Extreme mineral saturation detected across active sensor array.`,
            severity: 'critical',
            category: 'alkalinity',
            metrics: { totalAlkalinity: updatedChemistry.totalAlkalinity, pH: updatedChemistry.pH },
          });
          soundEngine.playCriticalAlarm();
        } else if (currentTaLevel === 'high') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ta-warn',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Threshold Warning: High Alkalinity Influx (TA > 2750 µmol/kg)',
            message: `Dense alkaline front detected. Dilution manifold pacing advised to maintain ecological envelope.`,
            severity: 'warning',
            category: 'alkalinity',
            metrics: { totalAlkalinity: updatedChemistry.totalAlkalinity, pH: updatedChemistry.pH },
          });
        } else if (currentTaLevel === 'enhanced' && prevLevels.taLevel === 'baseline') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-ta-enh',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Threshold Milestone: Enhanced Carbon Capacity (TA > 2500 µmol/kg)',
            message: `Net alkalinity elevated to ${updatedChemistry.totalAlkalinity} µmol/kg (+${updatedChemistry.totalAlkalinity - updatedChemistry.baselineTA} above ambient). Sequestration yield increasing.`,
            severity: 'nominal',
            category: 'alkalinity',
            metrics: { totalAlkalinity: updatedChemistry.totalAlkalinity, co2Rate: updatedChemistry.sequestrationRateTonsPerDay },
          });
        }
      }

      // Omega Aragonite Saturation transitions
      if (currentOmegaLevel !== prevLevels.omegaLevel) {
        if (currentOmegaLevel === 'critical') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-omega-crit',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'CRITICAL ANOMALY: Secondary Carbonate Precipitation Risk (Ω > 4.5)',
            message: `Aragonite saturation index exceeded 4.5 critical threshold (Ω = ${updatedChemistry.aragoniteSaturation.toFixed(2)}). Secondary precipitation warning active.`,
            severity: 'critical',
            category: 'saturation',
            metrics: { omega: updatedChemistry.aragoniteSaturation, pH: updatedChemistry.pH },
          });
          soundEngine.playCriticalAlarm();
        } else if (currentOmegaLevel === 'warning') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-omega-warn',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Saturation Warning: Elevated Aragonite Saturation (Ω > 3.8)',
            message: `Mineral saturation approaching precipitation limits. AI adjusting slurry flow velocity.`,
            severity: 'warning',
            category: 'saturation',
            metrics: { omega: updatedChemistry.aragoniteSaturation },
          });
        } else if (currentOmegaLevel === 'normal' && prevLevels.omegaLevel === 'critical') {
          newEvents.push({
            id: 'ev-' + Date.now() + '-omega-res',
            timestamp: nowTime,
            relativeTime: relTime,
            title: 'Precipitation Risk Remediation: Saturation Normalized',
            message: `Aragonite saturation returned below 4.0 threshold (Ω = ${updatedChemistry.aragoniteSaturation.toFixed(2)}). Chemical carbonate loss prevented.`,
            severity: 'resolved',
            category: 'remediation',
            metrics: { omega: updatedChemistry.aragoniteSaturation },
          });
        }
      }

      prevThresholdsRef.current = {
        phLevel: currentPhLevel,
        taLevel: currentTaLevel,
        omegaLevel: currentOmegaLevel,
      };

      if (newEvents.length > 0) {
        setHistoryEvents((prev) => [...prev, ...newEvents]);
      }

      // Update Probes readings
      setSensorProbes((prev) =>
        prev.map((pr) => {
          if (pr.type === 'pH') return { ...pr, currentValue: updatedChemistry.pH };
          if (pr.type === 'TotalAlkalinity') return { ...pr, currentValue: updatedChemistry.totalAlkalinity };
          if (pr.type === 'pCO2') return { ...pr, currentValue: updatedChemistry.pCO2 };
          return pr;
        })
      );

      // Add to history points buffer (every few ticks)
      setHistoryPoints((prev) => {
        const next = [
          ...prev.slice(-14),
          {
            time: new Date().toLocaleTimeString().slice(3, 8),
            pH: updatedChemistry.pH,
            TA: updatedChemistry.totalAlkalinity,
            co2Rate: updatedChemistry.sequestrationRateTonsPerDay,
          },
        ];
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, simSpeed, currentFeedstock, dosingPods, facilityState, chemicalState]);

  // Pod Toggles
  const handleTogglePod = (podId: string) => {
    setDosingPods((prev) =>
      prev.map((pod) => (pod.id === podId ? { ...pod, active: !pod.active } : pod))
    );
  };

  const handleToggleAllPods = (enable: boolean) => {
    setDosingPods((prev) => prev.map((pod) => ({ ...pod, active: enable })));
  };

  const handleMasterDosingRate = (rate: number) => {
    setMasterDosingRate(rate);
    setDosingPods((prev) => prev.map((pod) => ({ ...pod, rateKgPerHour: rate })));
  };

  const handleReset = () => {
    setChemicalState(INITIAL_CHEMICAL);
    setDosingPods(INITIAL_PODS);
    setFacilityState(INITIAL_FACILITY);
  };

  const handleAudioToggle = () => {
    const isMutedNow = soundEngine.toggleMute();
    setIsMuted(isMutedNow);
  };

  const handleLoadScenario = (scenario: ExperimentScenario) => {
    setCurrentFeedstock(scenario.feedstock);
    setMasterDosingRate(scenario.dosingRateKgHr);
    setFacilityState((prev) => ({ ...prev, intakeFlowM3PerHour: scenario.intakeFlow }));
    setDosingPods((prev) =>
      prev.map((pod, i) => ({
        ...pod,
        active: i < scenario.activePodsCount,
        rateKgPerHour: scenario.dosingRateKgHr,
      }))
    );
  };

  const handleExportData = () => {
    const dataReport = {
      facility: 'COASTAL OAE RESEARCH UNIT - SEROS LAB 01',
      timestamp: new Date().toISOString(),
      feedstock: FEEDSTOCKS[currentFeedstock],
      chemicalState,
      facilityState,
      activePods: dosingPods.filter((p) => p.active),
      historyLog: historyPoints,
    };

    const blob = new Blob([JSON.stringify(dataReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OAE_Simulation_Telemetry_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const storyStepRef = useRef<number>(1);

  // Trigger OAE Chemical Spike (Chapter 3 Critical Excursion)
  const handleTriggerOaeSpike = () => {
    soundEngine.playCriticalAlarm();
    storyStepRef.current = 2; // Chapter 3
    setViewPreset('dosing_pods');
    setChemicalState((prev) => ({
      ...prev,
      pH: 8.82,
      totalAlkalinity: 3120,
      pCO2: 190,
      aragoniteSaturation: 4.65,
      carbonateFraction: 26.5,
      bicarbonateFraction: 73.4,
      aqueousCO2Fraction: 0.1,
      precipitationRisk: 'critical',
      sequestrationRateTonsPerDay: 2.85,
    }));
    setDosingPods((prev) =>
      prev.map((p, idx) => (idx === 0 ? { ...p, active: true, rateKgPerHour: 95 } : p))
    );

    const nowTime = new Date().toLocaleTimeString();
    const simSec = Math.floor(Date.now() / 1000) % 3600;
    const relTime = `T+${String(Math.floor(simSec / 60)).padStart(2, '0')}:${String(simSec % 60).padStart(2, '0')}`;

    const spikeEvent: ChemicalLogEvent = {
      id: 'ev-' + Date.now() + '-spike',
      timestamp: nowTime,
      relativeTime: relTime,
      title: 'Chapter 3: Extreme Saturation Boundary',
      message:
        'CRITICAL ANOMALY: Highly localized chemical overloading detected near Dosing Pod 01. Secondary carbonate precipitation warning issued. AI heuristics computing counter-balance profiles.',
      severity: 'critical',
      category: 'saturation',
      metrics: {
        pH: 8.82,
        totalAlkalinity: 3120,
        pCO2: 190,
        omega: 4.65,
      },
    };
    setHistoryEvents((prev) => [...prev, spikeEvent]);
  };

  // Trigger AI Remediation Stabilization (Chapter 4)
  const handleTriggerRemediation = () => {
    soundEngine.playSwell();
    storyStepRef.current = 3; // Chapter 4
    setViewPreset('overview');
    setChemicalState((prev) => ({
      ...prev,
      pH: 8.40,
      totalAlkalinity: 2520,
      pCO2: 240,
      aragoniteSaturation: 3.45,
      carbonateFraction: 15.2,
      bicarbonateFraction: 84.6,
      aqueousCO2Fraction: 0.2,
      precipitationRisk: 'none',
      sequestrationRateTonsPerDay: 1.65,
    }));
    setDosingPods((prev) => prev.map((p) => ({ ...p, rateKgPerHour: 45 })));

    const nowTime = new Date().toLocaleTimeString();
    const simSec = Math.floor(Date.now() / 1000) % 3600;
    const relTime = `T+${String(Math.floor(simSec / 60)).padStart(2, '0')}:${String(simSec % 60).padStart(2, '0')}`;

    const remEvent: ChemicalLogEvent = {
      id: 'ev-' + Date.now() + '-remediation',
      timestamp: nowTime,
      relativeTime: relTime,
      title: 'Chapter 4: AI Heuristic Remediation',
      message:
        'Remediation matrix successful. Google AI neural nodes safely regulated fluid flow bypass. Carbon sequestered cleanly while preserving local shoreline ecological guardrails.',
      severity: 'resolved',
      category: 'remediation',
      metrics: {
        pH: 8.40,
        totalAlkalinity: 2520,
        pCO2: 240,
        omega: 3.45,
        co2Rate: 1.65,
      },
    };
    setHistoryEvents((prev) => [...prev, remEvent]);
  };

  // Step story sequence through AI Studio Novel Schema
  const handleStepStorySequence = () => {
    const aiStudioNovelSchema = [
      {
        chapterId: 'CH_01_BOOT',
        title: 'Chapter 1: Baseline Acquisition',
        narrative:
          'Project Marine Alchemist initiates sub-surface operational loops on the shoreline. Coastal intake channels pump raw seawater at 250 L/s into the concrete monitoring basin.',
        systemStatus: 'NOMINAL' as const,
        telemetryModifier: { ph: 8.15, pco2: 395, ta: 2340, omega: 2.75, targetCamera: 'overview' as ViewPreset },
      },
      {
        chapterId: 'CH_02_DOSING',
        title: 'Chapter 2: Alkalinity Deployment',
        narrative:
          'Autonomous feed arrays inject liquid magnesium hydroxide slurries. The data center loop scales computing workloads to calculate the regional oceanic carbon uptake ceiling.',
        systemStatus: 'NOMINAL' as const,
        telemetryModifier: { ph: 8.45, pco2: 320, ta: 2580, omega: 3.52, targetCamera: 'dosing_pods' as ViewPreset },
      },
      {
        chapterId: 'CH_03_EXCURSION',
        title: 'Chapter 3: Extreme Saturation Boundary',
        narrative:
          'CRITICAL ANOMALY: Highly localized chemical overloading detected near Dosing Pod 01. Secondary carbonate precipitation warning issued. AI heuristics computing counter-balance profiles.',
        systemStatus: 'CRITICAL' as const,
        telemetryModifier: { ph: 8.82, pco2: 190, ta: 3120, omega: 4.65, targetCamera: 'basin' as ViewPreset },
      },
      {
        chapterId: 'CH_04_STABILIZATION',
        title: 'Chapter 4: AI Heuristic Remediation',
        narrative:
          'Remediation matrix successful. Google AI neural nodes safely regulated fluid flow bypass. Carbon sequestered cleanly while preserving local shoreline ecological guardrails.',
        systemStatus: 'RESOLVED' as const,
        telemetryModifier: { ph: 8.40, pco2: 240, ta: 2520, omega: 3.45, targetCamera: 'overview' as ViewPreset },
      },
    ];

    const nextIdx = (storyStepRef.current + 1) % aiStudioNovelSchema.length;
    storyStepRef.current = nextIdx;
    const node = aiStudioNovelSchema[nextIdx];

    setChemicalState((prev) => ({
      ...prev,
      pH: node.telemetryModifier.ph,
      pCO2: node.telemetryModifier.pco2,
      totalAlkalinity: node.telemetryModifier.ta,
      aragoniteSaturation: node.telemetryModifier.omega,
    }));
    setViewPreset(node.telemetryModifier.targetCamera);

    if (node.systemStatus === 'CRITICAL') {
      soundEngine.playCriticalAlarm();
    } else {
      soundEngine.playSwell();
    }

    const nowTime = new Date().toLocaleTimeString();
    const simSec = Math.floor(Date.now() / 1000) % 3600;
    const relTime = `T+${String(Math.floor(simSec / 60)).padStart(2, '0')}:${String(simSec % 60).padStart(2, '0')}`;

    const severity: EventSeverity =
      node.systemStatus === 'CRITICAL'
        ? 'critical'
        : node.systemStatus === 'RESOLVED'
        ? 'resolved'
        : 'nominal';

    const newEvent: ChemicalLogEvent = {
      id: 'ev-' + Date.now() + '-' + node.chapterId,
      timestamp: nowTime,
      relativeTime: relTime,
      title: node.title,
      message: node.narrative,
      severity,
      category:
        node.systemStatus === 'CRITICAL'
          ? 'saturation'
          : node.systemStatus === 'RESOLVED'
          ? 'remediation'
          : 'dosing',
      metrics: {
        pH: node.telemetryModifier.ph,
        totalAlkalinity: node.telemetryModifier.ta,
        pCO2: node.telemetryModifier.pco2,
        omega: node.telemetryModifier.omega,
      },
    };

    setHistoryEvents((prev) => [...prev, newEvent]);
  };

  const handleClearHistoryEvents = () => {
    setHistoryEvents([]);
  };

  // Live AI Studio Inference Handler using Gemini Model Endpoint
  const handleLiveAIInference = async () => {
    const statusHUD = document.getElementById('engine-status');
    if (statusHUD) {
      statusHUD.innerText = '⏳ TRANSMITTING TELEMETRY...';
      statusHUD.style.color = '#FBBC05'; // var(--g-yellow)
    }

    try {
      // Execute inference via utility or fallback
      const { executeLiveAIStudioInference } = await import('./utils/aiStudioInference');
      const updateNode = await executeLiveAIStudioInference({
        apiKey: 'THEIR_PERSONAL_EVALUATOR_KEY',
        chemicalState,
        onStatusChange: (statusText, color) => {
          if (statusHUD) {
            statusHUD.innerText = statusText;
            statusHUD.style.color = color;
          }
        },
      });

      // Apply returned telemetry modifier and update camera
      setChemicalState((prev) => ({
        ...prev,
        pH: updateNode.telemetryModifier.ph,
        pCO2: updateNode.telemetryModifier.pco2,
        totalAlkalinity: updateNode.telemetryModifier.ta,
        aragoniteSaturation: updateNode.telemetryModifier.omega,
      }));
      setViewPreset(updateNode.telemetryModifier.targetCamera);

      if (updateNode.systemStatus === 'CRITICAL') {
        soundEngine.playCriticalAlarm();
      } else {
        soundEngine.playSwell();
      }

      const nowTime = new Date().toLocaleTimeString();
      const simSec = Math.floor(Date.now() / 1000) % 3600;
      const relTime = `T+${String(Math.floor(simSec / 60)).padStart(2, '0')}:${String(simSec % 60).padStart(2, '0')}`;

      const severity: EventSeverity =
        updateNode.systemStatus === 'CRITICAL'
          ? 'critical'
          : updateNode.systemStatus === 'RESOLVED'
          ? 'resolved'
          : updateNode.systemStatus === 'WARNING'
          ? 'warning'
          : 'nominal';

      const newEvent: ChemicalLogEvent = {
        id: 'ev-ai-' + Date.now() + '-' + updateNode.chapterId,
        timestamp: nowTime,
        relativeTime: relTime,
        title: updateNode.title,
        message: updateNode.narrative,
        severity,
        category:
          updateNode.systemStatus === 'CRITICAL'
            ? 'saturation'
            : updateNode.systemStatus === 'RESOLVED'
            ? 'remediation'
            : 'dosing',
        metrics: {
          pH: updateNode.telemetryModifier.ph,
          totalAlkalinity: updateNode.telemetryModifier.ta,
          pCO2: updateNode.telemetryModifier.pco2,
          omega: updateNode.telemetryModifier.omega,
        },
      };

      setHistoryEvents((prev) => [...prev, newEvent]);

      if (statusHUD) {
        statusHUD.innerText = '● AGENT SYNCED';
        statusHUD.style.color = '#34A853'; // var(--g-green)
      }
    } catch (networkError) {
      console.error('❌ CRITICAL INFERENCE HANDLER COLLAPSE:', networkError);
      if (statusHUD) {
        statusHUD.innerText = '● SYSTEM OFFLINE / DISCONNECTED';
        statusHUD.style.color = '#EA4335'; // var(--g-red)
      }
    }
  };

  // Expose automated payload wrapper engine and inference to window for console/external automation
  useEffect(() => {
    (window as any).triggerAISpikeSimulation = handleTriggerOaeSpike;
    (window as any).executeLiveAIStudioInference = handleLiveAIInference;
    (window as any).generateAIStudioPayloadWrapper = () => {
      const activeTelemetryFrame = {
        timestamp: new Date().toISOString(),
        physicalEnclosure: {
          pondVolumeCubicMeters: 1350,
          currentWaterDisplacementY: (-0.12).toFixed(4),
          currentMaterialRoughness: (0.15).toFixed(4),
        },
        sensorArrayNode: {
          phValue: chemicalState.pH.toFixed(2),
          pco2Value: `${chemicalState.pCO2} ppm`,
          intakeRateLs: (facilityState.intakeFlowM3PerHour / 3.6).toFixed(1),
        },
        cameraMatrix: {
          vectorX: (32.5).toFixed(2),
          vectorY: (28.0).toFixed(2),
          vectorZ: (45.0).toFixed(2),
        },
      };

      const googleAIStudioPayload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze this real-time Ocean Alkalinity Enhancement (OAE) digital twin telemetry frame and return a predictive system stability assessment matching the narrative structure schema:\n\n${JSON.stringify(
                  activeTelemetryFrame,
                  null,
                  2
                )}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
        },
      };

      console.log('==> GOOGLE AI STUDIO PAYLOAD WRAPPER PACKET GENERATED ==>');
      console.log(JSON.stringify(googleAIStudioPayload));
      return googleAIStudioPayload;
    };
  }, [chemicalState, facilityState]);

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <Header
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        simSpeed={simSpeed}
        onChangeSimSpeed={setSimSpeed}
        visualMode={visualMode}
        onChangeVisualMode={setVisualMode}
        viewPreset={viewPreset}
        onSelectPreset={setViewPreset}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        isMuted={isMuted}
        onToggleAudio={handleAudioToggle}
        onExportData={handleExportData}
        chemicalState={chemicalState}
        isCinematicTourActive={tourState.isActive}
        onToggleCinematicTour={handleToggleCinematicTour}
        isGraphicNovelOpen={isGraphicNovelOpen}
        onToggleGraphicNovel={() => setIsGraphicNovelOpen(!isGraphicNovelOpen)}
      />

      {/* Main 3D Simulation Stage with Sidebar Panels */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden">
        {/* Left Control Panel */}
        {showLeftPanel && !tourState.isActive && (
          <aside className="relative z-20 w-80 md:w-88 h-full bg-slate-950/92 border-r border-slate-800/90 backdrop-blur-md shadow-2xl flex flex-col shrink-0">
            <ControlPanel
              currentFeedstock={currentFeedstock}
              onChangeFeedstock={setCurrentFeedstock}
              masterDosingRate={masterDosingRate}
              onChangeMasterDosingRate={handleMasterDosingRate}
              dosingPods={dosingPods}
              onTogglePod={handleTogglePod}
              onToggleAllPods={handleToggleAllPods}
              intakeFlow={facilityState.intakeFlowM3PerHour}
              onChangeIntakeFlow={(flow) =>
                setFacilityState((prev) => ({ ...prev, intakeFlowM3PerHour: flow }))
              }
              chemicalState={chemicalState}
              onLoadScenario={handleLoadScenario}
              physicsParams={physicsParams}
              onChangePhysicsParams={(updates) =>
                setPhysicsParams((prev) => ({ ...prev, ...updates }))
              }
              onResetPhysics={handleResetPhysics}
              uploadedModels={uploadedModels}
              onAddModel={handleAddModel}
              onUpdateModel={handleUpdateModel}
              onRemoveModel={handleRemoveModel}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              dataOverlay={dataOverlay}
              onChangeDataOverlay={(updates) =>
                setDataOverlay((prev) => ({ ...prev, ...updates }))
              }
              plumeConfig={plumeConfig}
              onChangePlumeConfig={(updates) =>
                setPlumeConfig((prev) => ({ ...prev, ...updates }))
              }
              onResetPlumes={handleResetPlumes}
            />
          </aside>
        )}

        {/* 3D Canvas Center Stage */}
        <main className="relative flex-1 w-full h-full bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50">
          <ThreeCanvas
            dosingPods={dosingPods}
            sensorProbes={sensorProbes}
            visualMode={visualMode}
            viewPreset={viewPreset}
            chemicalState={chemicalState}
            onSelectSubsystem={setSelectedSubsystemId}
            selectedSubsystemId={selectedSubsystemId}
            isRunning={isRunning}
            simSpeed={simSpeed}
            physicsParams={physicsParams}
            uploadedModels={uploadedModels}
            uploadedModelObjects={uploadedModelObjects}
            dataOverlay={dataOverlay}
            plumeConfig={plumeConfig}
            feedstock={currentFeedstock}
            tourState={tourState}
          />

          {/* Blueprint Engineering Overlay & Annotations (when not in cinematic tour) */}
          {!tourState.isActive && (
            <BlueprintOverlay
              showLabels={showLabels}
              visualMode={visualMode}
              onSelectSubsystem={setSelectedSubsystemId}
              onSelectPreset={setViewPreset}
            />
          )}

          {/* Cinematic Tour Drone Camera Overlay */}
          <CinematicTourOverlay
            tourState={tourState}
            onToggleTour={handleToggleCinematicTour}
            onNextStage={handleNextTourStage}
            onToggleAutoCycle={() =>
              setTourState((prev) => ({ ...prev, autoCycleEnabled: !prev.autoCycleEnabled }))
            }
            onChangeSpeed={(spd) => setTourState((prev) => ({ ...prev, cameraSpeed: spd }))}
            activePods={dosingPods.filter((p) => p.active)}
            chemicalState={chemicalState}
          />

          {/* Panel Toggle Floating Buttons (hidden when cinematic tour is active) */}
          {!tourState.isActive && (
            <>
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                <button
                  onClick={() => setShowLeftPanel(!showLeftPanel)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md text-xs font-mono transition"
                  title={showLeftPanel ? 'Hide Controls Panel' : 'Show Controls Panel'}
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">{showLeftPanel ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}</span>
                </button>
              </div>

              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md text-xs font-mono transition"
                  title={showRightPanel ? 'Hide Telemetry Panel' : 'Show Telemetry Panel'}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{showRightPanel ? 'HIDE TELEMETRY' : 'SHOW TELEMETRY'}</span>
                </button>
              </div>
            </>
          )}
        </main>

        {/* Right Telemetry Drawer Panel */}
        {showRightPanel && !tourState.isActive && (
          <aside className="relative z-20 w-80 md:w-92 h-full bg-slate-950/92 border-l border-slate-800/90 backdrop-blur-md shadow-2xl flex flex-col shrink-0">
            <TelemetryDrawer
              chemicalState={chemicalState}
              facilityState={facilityState}
              sensorProbes={sensorProbes}
              historyPoints={historyPoints}
              historyEvents={historyEvents}
              onTriggerOaeSpike={handleTriggerOaeSpike}
              onTriggerRemediation={handleTriggerRemediation}
              onStepStorySequence={handleStepStorySequence}
              onClearHistoryEvents={handleClearHistoryEvents}
              onLiveAIInference={handleLiveAIInference}
              apiKey="THEIR_PERSONAL_EVALUATOR_KEY"
            />
          </aside>
        )}
      </div>

      {/* Graphic Novel & Research Narrative Drawer */}
      <GraphicNovelPanel
        isOpen={isGraphicNovelOpen}
        onClose={() => setIsGraphicNovelOpen(false)}
        tourState={tourState}
        onToggleTour={handleToggleCinematicTour}
        onNextStage={handleNextTourStage}
        onSetStage={handleSetTourStage}
        dosingPods={dosingPods}
        chemicalState={chemicalState}
      />

      {/* Subsystem Technical Inspection Modal */}
      <SubsystemModal
        subsystemId={selectedSubsystemId}
        onClose={() => setSelectedSubsystemId(null)}
        dosingPods={dosingPods}
        sensorProbes={sensorProbes}
        feedstock={FEEDSTOCKS[currentFeedstock]}
        facilityState={facilityState}
        onTogglePod={handleTogglePod}
      />
    </div>
  );
}

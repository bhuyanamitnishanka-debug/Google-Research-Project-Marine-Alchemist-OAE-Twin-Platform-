export type FeedstockType = 'slaked_lime' | 'brucite' | 'olivine' | 'sodium_bicarbonate';

export interface FeedstockConfig {
  id: FeedstockType;
  name: string;
  chemicalFormula: string;
  dissolutionRate: number; // relative rate 0-1
  co2DrawdownRatio: number; // mol CO2 per mol mineral
  solubilityLimit: number; // g/L
  slurryDensity: number; // kg/m^3
  color: string;
  description: string;
}

export interface DosingPod {
  id: string;
  label: string;
  position: [number, number, number]; // 3D world coordinates
  active: boolean;
  rateKgPerHour: number; // 0 to 100 kg/hr
  status: 'optimal' | 'warning' | 'standby' | 'calibrating';
  nozzlePressureBar: number;
  slurryLevelPercent: number;
  totalDispensedKg: number;
}

export interface SensorProbe {
  id: string;
  label: string;
  type: 'pH' | 'TotalAlkalinity' | 'Temperature' | 'pCO2' | 'Salinity';
  position: [number, number, number];
  currentValue: number;
  unit: string;
  targetRange: [number, number];
  status: 'nominal' | 'alert' | 'calibrating';
}

export interface ChemicalState {
  pH: number;
  baselinePH: number;
  totalAlkalinity: number; // umol / kg
  baselineTA: number;
  pCO2: number; // uatm
  baselinePCO2: number;
  dic: number; // umol / kg (Dissolved Inorganic Carbon)
  aragoniteSaturation: number; // Omega arag
  cumulativeCO2SequesteredKg: number;
  sequestrationRateTonsPerDay: number;
  carbonateFraction: number; // % CO3(2-)
  bicarbonateFraction: number; // % HCO3(-)
  aqueousCO2Fraction: number; // % CO2(aq)
  precipitationRisk: 'none' | 'moderate' | 'critical';
}

export interface FacilityState {
  intakeFlowM3PerHour: number;
  effluentReturnFlowM3PerHour: number;
  waterTemperatureC: number;
  salinityPSU: number;
  solarGenerationKw: number;
  facilityPowerDrawKw: number;
  pumpEfficiencyPercent: number;
  oceanWaveHeightM: number;
  tideLevelM: number;
  windSpeedKnots: number;
}

export type ViewPreset = 'overview' | 'basin' | 'dosing_pods' | 'control_center' | 'intake' | 'blueprint_top';
export type VisualMode = 'realistic' | 'blueprint' | 'heatmap' | 'night_hud';

// Cinematic Camera Tour Configuration
export type CinematicTourStage = 
  | 'orbital_overview' 
  | 'intake_shoreline' 
  | 'pod_focus' 
  | 'subsurface_plume' 
  | 'control_lab';

export interface CinematicTourState {
  isActive: boolean;
  stage: CinematicTourStage;
  targetPodId: string | null;
  targetPodLabel: string | null;
  stageProgress: number; // 0 to 1 progress within current waypoint
  stageDurationSeconds: number;
  autoCycleEnabled: boolean;
  cameraSpeed: number; // 0.5x to 2x
  storyLogChapter: number;
}

// Physics Configuration
export interface PhysicsParams {
  gravity: number; // m/s^2, default -9.82
  buoyancy: number; // water upward force multiplier, default 1.2
  linearDamping: number; // fluid resistance, default 0.4
  restitution: number; // bounce/elasticity, default 0.3
  friction: number; // surface friction, default 0.3
  waterDensity: number; // kg/m^3, default 1025
}

// User-Uploaded 3D Models
export interface UserUploadedModel {
  id: string;
  name: string;
  format: 'obj' | 'fbx' | 'gltf';
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  visible: boolean;
  wireframe: boolean;
  color: string;
  isPhysicsActive: boolean;
  mass: number;
  vertexCount: number;
  triangleCount: number;
}

// Data Visualization Overlay Modes
export type DataOverlayType = 'none' | 'heatmap' | 'vector_field' | 'particle_stream' | 'sensor_iso';
export type HeatmapMetric = 'pH' | 'alkalinity' | 'pCO2' | 'dissolution_rate' | 'temperature';

export interface DataOverlayConfig {
  type: DataOverlayType;
  metric: HeatmapMetric;
  opacity: number;
  showContours: boolean;
  vectorDensity: number; // 1-5 scale
  colorScale: 'turbo' | 'viridis' | 'ocean' | 'thermal';
  sampleGridResolution: number; // e.g. 24x24
}

// Chemical Dispersion Plume Simulation Configuration
export interface PlumeSimulationConfig {
  enabled: boolean;
  particleCountPerPod: number; // e.g. 150 - 600
  particleSize: number; // 0.15 - 0.7
  dispersionSpeed: number; // advection/dissolution drift multiplier
  turbulence: number; // Brownian & vortex jitter
  colorMode: 'concentration' | 'feedstock' | 'gradient'; // gradient from high conc to ambient
  lifetimeSeconds: number; // average particle life
  buoyancyEffect: number; // negative/positive settling of mineral particles
}

export interface ExperimentScenario {
  id: string;
  title: string;
  description: string;
  feedstock: FeedstockType;
  dosingRateKgHr: number;
  intakeFlow: number;
  activePodsCount: number;
}

// Simulation History & Chemical Threshold Events
export type EventSeverity = 'info' | 'nominal' | 'warning' | 'critical' | 'resolved';

export interface ChemicalLogEvent {
  id: string;
  timestamp: string; // e.g. "10:42:15"
  relativeTime: string; // e.g. "T+01:24"
  title: string;
  message: string;
  severity: EventSeverity;
  category: 'pH' | 'alkalinity' | 'saturation' | 'dosing' | 'remediation' | 'system';
  metrics?: {
    pH?: number;
    totalAlkalinity?: number;
    pCO2?: number;
    omega?: number;
    co2Rate?: number;
  };
}

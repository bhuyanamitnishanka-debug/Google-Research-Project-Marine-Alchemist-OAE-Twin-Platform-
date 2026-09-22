import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  DosingPod,
  SensorProbe,
  VisualMode,
  ViewPreset,
  ChemicalState,
  PhysicsParams,
  UserUploadedModel,
  DataOverlayConfig,
  PlumeSimulationConfig,
  FeedstockType,
  CinematicTourState,
} from '../types';
import { PhysicsEngine } from '../simulation/physicsEngine';
import { DataVisualizationManager } from '../simulation/dataVisualization';
import { PlumeParticleManager } from '../simulation/plumeSystem';
import { createPresetResearchModel } from '../simulation/modelLoader';

interface ThreeCanvasProps {
  dosingPods: DosingPod[];
  sensorProbes: SensorProbe[];
  visualMode: VisualMode;
  viewPreset: ViewPreset;
  chemicalState: ChemicalState;
  onSelectSubsystem: (subsystemId: string) => void;
  selectedSubsystemId: string | null;
  isRunning: boolean;
  simSpeed: number;
  physicsParams?: PhysicsParams;
  uploadedModels?: UserUploadedModel[];
  uploadedModelObjects?: Map<string, THREE.Group>;
  dataOverlay?: DataOverlayConfig;
  plumeConfig?: PlumeSimulationConfig;
  feedstock?: FeedstockType;
  onInteractObject?: (id: string, name: string) => void;
  tourState?: CinematicTourState;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  dosingPods,
  sensorProbes,
  visualMode,
  viewPreset,
  chemicalState,
  onSelectSubsystem,
  selectedSubsystemId,
  isRunning,
  simSpeed,
  physicsParams,
  uploadedModels = [],
  uploadedModelObjects,
  dataOverlay = {
    type: 'none',
    metric: 'pH',
    opacity: 0.8,
    showContours: false,
    vectorDensity: 3,
    colorScale: 'turbo',
    sampleGridResolution: 32,
  },
  plumeConfig = {
    enabled: true,
    particleCountPerPod: 350,
    particleSize: 0.38,
    dispersionSpeed: 1.0,
    turbulence: 1.0,
    colorMode: 'concentration',
    lifetimeSeconds: 5.0,
    buoyancyEffect: 0.0,
  },
  feedstock = 'slaked_lime',
  onInteractObject,
  tourState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Physics, Visualization, and Plume managers
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  const dataVisManagerRef = useRef<DataVisualizationManager | null>(null);
  const plumeManagerRef = useRef<PlumeParticleManager | null>(null);
  const userModelsGroupRef = useRef<THREE.Group | null>(null);
  const interactivePhysicsObjectsRef = useRef<Map<string, { group: THREE.Group; type: string }>>(new Map());
  
  // Animation & Object References
  const animFrameIdRef = useRef<number>(0);
  const basinWaterMeshRef = useRef<THREE.Mesh | null>(null);
  const oceanMeshRef = useRef<THREE.Mesh | null>(null);
  const particleSystemsRef = useRef<{ id: string; points: THREE.Points; velocities: Float32Array }[]>([]);
  const podMeshesRef = useRef<Map<string, { group: THREE.Group; ringMaterial: THREE.MeshStandardMaterial }>>(new Map());
  const serverLedsRef = useRef<THREE.PointLight[]>([]);
  const probeIndicatorsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Interactive controls
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 0));
  const cameraSphericalRef = useRef({ radius: 36, theta: Math.PI / 4, phi: Math.PI / 3.4 });
  const targetSphericalRef = useRef({ radius: 36, theta: Math.PI / 4, phi: Math.PI / 3.4 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1.5, 0));
  const tourStateRef = useRef<CinematicTourState | undefined>(tourState);
  const dosingPodsRef = useRef<DosingPod[]>(dosingPods);

  useEffect(() => {
    tourStateRef.current = tourState;
  }, [tourState]);

  useEffect(() => {
    dosingPodsRef.current = dosingPods;
  }, [dosingPods]);

  // Raycaster for clicking 3D interactive objects
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());

  // Camera presets
  const applyViewPreset = (preset: ViewPreset) => {
    switch (preset) {
      case 'overview': // Matches exact isometric perspective of the uploaded image
        targetSphericalRef.current = { radius: 38, theta: 0.88, phi: 1.05 };
        targetLookAtRef.current.set(1.5, 1.0, 0);
        break;
      case 'basin':
        targetSphericalRef.current = { radius: 24, theta: 0.65, phi: 0.85 };
        targetLookAtRef.current.set(-2, 0.5, 1);
        break;
      case 'dosing_pods':
        targetSphericalRef.current = { radius: 15, theta: 0.42, phi: 1.15 };
        targetLookAtRef.current.set(-4, 1.8, -6.8);
        break;
      case 'control_center':
        targetSphericalRef.current = { radius: 16, theta: 1.45, phi: 1.18 };
        targetLookAtRef.current.set(8.5, 2.8, -1.5);
        break;
      case 'intake':
        targetSphericalRef.current = { radius: 20, theta: -0.3, phi: 1.25 };
        targetLookAtRef.current.set(-13, 0.2, 3);
        break;
      case 'blueprint_top':
        targetSphericalRef.current = { radius: 42, theta: 0.01, phi: 0.05 };
        targetLookAtRef.current.set(0, 0, 0);
        break;
    }
  };

  useEffect(() => {
    applyViewPreset(viewPreset);
  }, [viewPreset]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 500);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    sunLight.name = 'sunLight';
    sunLight.position.set(35, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const skyFillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    skyFillLight.name = 'skyFillLight';
    skyFillLight.position.set(-25, 20, -20);
    scene.add(skyFillLight);

    // 5. Environment & Ground Construction
    // A. Concrete Foundation Deck (Main research apron)
    const apronGeo = new THREE.BoxGeometry(34, 1.2, 28);
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.85,
      metalness: 0.1,
    });
    const apronMesh = new THREE.Mesh(apronGeo, concreteMat);
    apronMesh.position.set(2, -0.6, 0);
    apronMesh.receiveShadow = true;
    scene.add(apronMesh);

    // B. Beach Sand terrain (slopes towards left where ocean is)
    const sandGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
    const sandPos = sandGeo.attributes.position;
    for (let i = 0; i < sandPos.count; i++) {
      const vx = sandPos.getX(i);
      const vy = sandPos.getY(i);
      // create natural beach undulation
      const noise = Math.sin(vx * 0.1) * Math.cos(vy * 0.1) * 0.4;
      // slope down to ocean on left (negative x)
      const slope = vx < -5 ? (vx + 5) * 0.15 : 0;
      sandPos.setZ(i, noise + slope);
    }
    sandGeo.computeVertexNormals();
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xf6d8ae,
      roughness: 0.95,
      metalness: 0.05,
    });
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.rotation.x = -Math.PI / 2;
    sandMesh.position.set(-15, -1.1, 0);
    sandMesh.receiveShadow = true;
    scene.add(sandMesh);

    // C. Coastal Rock Formations (at water's edge)
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x57534e,
      roughness: 0.9,
      metalness: 0.2,
    });
    const rockCoords: [number, number, number, number][] = [
      [-17, -0.8, -12, 2.5],
      [-19, -1.0, -8, 3.2],
      [-21, -1.1, 4, 3.0],
      [-18, -0.9, 10, 2.8],
      [-22, -1.3, 14, 3.6],
      [-16, -0.8, 16, 2.2],
    ];
    rockCoords.forEach(([rx, ry, rz, scale]) => {
      const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      rockMesh.position.set(rx, ry, rz);
      rockMesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      scene.add(rockMesh);
    });

    // D. Ocean Water Plane (Left & Background)
    const oceanGeo = new THREE.PlaneGeometry(160, 160, 64, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.15,
      metalness: 0.7,
      transparent: true,
      opacity: 0.88,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.set(-45, -1.8, 0);
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);
    oceanMeshRef.current = oceanMesh;

    // 6. Coastal OAE Seawater Basin (20m x 15m)
    // Basin interior cutout & retaining walls
    const basinLength = 19.5; // Z
    const basinWidth = 14.5;  // X
    const wallThick = 0.8;
    const wallHeight = 1.6;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.7,
      metalness: 0.15,
    });

    // Basin Outer Wall Group
    const basinWallGroup = new THREE.Group();
    basinWallGroup.name = 'basin_wall';

    // North Wall (Z negative)
    const nWallGeo = new THREE.BoxGeometry(basinWidth + wallThick * 2, wallHeight, wallThick);
    const nWall = new THREE.Mesh(nWallGeo, wallMat);
    nWall.position.set(-3.5, wallHeight / 2 - 0.2, -basinLength / 2);
    nWall.castShadow = true;
    nWall.receiveShadow = true;
    basinWallGroup.add(nWall);

    // South Wall (Z positive)
    const sWall = new THREE.Mesh(nWallGeo, wallMat);
    sWall.position.set(-3.5, wallHeight / 2 - 0.2, basinLength / 2);
    sWall.castShadow = true;
    sWall.receiveShadow = true;
    basinWallGroup.add(sWall);

    // West Wall (Ocean side - X negative)
    const wWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, basinLength);
    const wWall = new THREE.Mesh(wWallGeo, wallMat);
    wWall.position.set(-3.5 - basinWidth / 2 - wallThick / 2, wallHeight / 2 - 0.2, 0);
    wWall.castShadow = true;
    wWall.receiveShadow = true;
    basinWallGroup.add(wWall);

    // East Wall (Lab side - X positive)
    const eWall = new THREE.Mesh(wWallGeo, wallMat);
    eWall.position.set(-3.5 + basinWidth / 2 + wallThick / 2, wallHeight / 2 - 0.2, 0);
    eWall.castShadow = true;
    eWall.receiveShadow = true;
    basinWallGroup.add(eWall);

    // Basin Floor
    const floorGeo = new THREE.BoxGeometry(basinWidth, 0.4, basinLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
    });
    const basinFloor = new THREE.Mesh(floorGeo, floorMat);
    basinFloor.position.set(-3.5, -0.2, 0);
    basinFloor.receiveShadow = true;
    basinWallGroup.add(basinFloor);

    scene.add(basinWallGroup);

    // Basin Seawater Mesh
    const basinWaterGeo = new THREE.PlaneGeometry(basinWidth - 0.1, basinLength - 0.1, 48, 48);
    const basinWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const basinWaterMesh = new THREE.Mesh(basinWaterGeo, basinWaterMat);
    basinWaterMesh.rotation.x = -Math.PI / 2;
    basinWaterMesh.position.set(-3.5, 0.9, 0);
    scene.add(basinWaterMesh);
    basinWaterMeshRef.current = basinWaterMesh;

    // 7. Data & Control Center (Container Research Laboratory)
    const labGroup = new THREE.Group();
    labGroup.name = 'control_center';
    labGroup.userData = { subsystemId: 'control_center', title: 'Data & Control Center' };

    // Container Shell
    const labLength = 16.0; // Z
    const labWidth = 5.2;   // X
    const labHeight = 4.0;  // Y

    // Main Lab body (White high-tech container)
    const labBodyGeo = new THREE.BoxGeometry(labWidth, labHeight, labLength);
    const labBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.2,
    });
    const labBody = new THREE.Mesh(labBodyGeo, labBodyMat);
    labBody.position.set(8.5, labHeight / 2, 0);
    labBody.castShadow = true;
    labBody.receiveShadow = true;
    labGroup.add(labBody);

    // Front Glass Window Facing Basin
    const glassGeo = new THREE.PlaneGeometry(labLength - 2.5, labHeight - 1.2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transmission: 0.85,
      opacity: 0.4,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
    });
    const frontGlass = new THREE.Mesh(glassGeo, glassMat);
    frontGlass.rotation.y = -Math.PI / 2;
    frontGlass.position.set(8.5 - labWidth / 2 - 0.02, labHeight / 2, 0);
    labGroup.add(frontGlass);

    // Interior Server Racks (visible through glass)
    const serverMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    for (let rackIdx = 0; rackIdx < 5; rackIdx++) {
      const rackGeo = new THREE.BoxGeometry(1.4, 2.8, 1.6);
      const rackMesh = new THREE.Mesh(rackGeo, serverMat);
      const rackZ = -4.5 + rackIdx * 2.3;
      rackMesh.position.set(9.2, 1.4, rackZ);
      labGroup.add(rackMesh);

      // Blinking status lights on racks
      const ledLight = new THREE.PointLight(rackIdx % 2 === 0 ? 0x06b6d4 : 0x10b981, 1.2, 4);
      ledLight.position.set(8.0, 1.8, rackZ);
      labGroup.add(ledLight);
      serverLedsRef.current.push(ledLight);
    }

    // Roof Solar Panels Array (2 large rows)
    const solarGeo = new THREE.BoxGeometry(3.6, 0.12, 5.8);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.15,
      metalness: 0.85,
    });
    const solar1 = new THREE.Mesh(solarGeo, solarMat);
    solar1.position.set(8.5, labHeight + 0.1, -3.2);
    solar1.castShadow = true;
    labGroup.add(solar1);

    const solar2 = new THREE.Mesh(solarGeo, solarMat);
    solar2.position.set(8.5, labHeight + 0.1, 3.2);
    solar2.castShadow = true;
    labGroup.add(solar2);

    // Roof HVAC & Seawater Cooling Intake Manifold on rear/side
    const hvacGeo = new THREE.BoxGeometry(2.0, 1.0, 2.5);
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const hvac = new THREE.Mesh(hvacGeo, hvacMat);
    hvac.position.set(8.5, labHeight + 0.5, 6.8);
    labGroup.add(hvac);

    // Manifold & Cooling Pipes along side
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.25,
      metalness: 0.9,
    });
    const pipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8.5 + labWidth / 2 + 0.2, 0.4, 2),
      new THREE.Vector3(8.5 + labWidth / 2 + 0.6, 1.8, 2),
      new THREE.Vector3(8.5 + labWidth / 2 + 0.6, 2.8, -2),
      new THREE.Vector3(8.5 + labWidth / 2 + 0.2, 2.8, -4),
    ]);
    const pipeGeo = new THREE.TubeGeometry(pipeCurve, 20, 0.18, 12, false);
    const manifoldPipe = new THREE.Mesh(pipeGeo, pipeMat);
    labGroup.add(manifoldPipe);

    scene.add(labGroup);

    // 8. Stainless Seawater Intake System (Dual large intake pipes extending to ocean)
    const intakeGroup = new THREE.Group();
    intakeGroup.name = 'seawater_intake';
    intakeGroup.userData = { subsystemId: 'intake', title: 'Stainless Seawater Intake' };

    const pipeZOffsets = [-3.8, 3.8];
    pipeZOffsets.forEach((pz) => {
      // Pipe path from basin west wall down across sand into ocean
      const intakeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-11.0, 0.6, pz),
        new THREE.Vector3(-12.8, 0.5, pz),
        new THREE.Vector3(-16.0, -0.4, pz + 0.3),
        new THREE.Vector3(-21.0, -1.3, pz + 0.6),
        new THREE.Vector3(-25.0, -2.1, pz + 0.8),
      ]);
      const intakePipeGeo = new THREE.TubeGeometry(intakeCurve, 32, 0.42, 16, false);
      const intakePipe = new THREE.Mesh(intakePipeGeo, pipeMat);
      intakePipe.castShadow = true;
      intakePipe.receiveShadow = true;
      intakeGroup.add(intakePipe);

      // Submersible intake pump housing at pipe ocean terminus
      const pumpGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.5, 16);
      const pumpMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.3,
        metalness: 0.8,
      });
      const pumpMesh = new THREE.Mesh(pumpGeo, pumpMat);
      pumpMesh.position.set(-25.0, -2.1, pz + 0.8);
      pumpMesh.rotation.z = Math.PI / 3;
      intakeGroup.add(pumpMesh);
    });

    scene.add(intakeGroup);

    // 9. Modular Dosing Pods Array (Constructing high-tech cylindrical pods)
    const podMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.6,
    });
    const podCapMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.7,
    });

    dosingPods.forEach((pod) => {
      const podGroup = new THREE.Group();
      podGroup.position.set(...pod.position);
      podGroup.name = `pod_${pod.id}`;
      podGroup.userData = { subsystemId: pod.id, title: pod.label };

      // Pod cylindrical body (1.5m diameter, 2.2m height)
      const bodyGeo = new THREE.CylinderGeometry(0.72, 0.72, 2.2, 24);
      const bodyMesh = new THREE.Mesh(bodyGeo, podMaterial);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      podGroup.add(bodyMesh);

      // Top Cap
      const capGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.3, 24);
      const capMesh = new THREE.Mesh(capGeo, podCapMat);
      capMesh.position.y = 1.15;
      podGroup.add(capMesh);

      // Glowing LED Status Ring (Green when optimal, cyan/lime for feedstocks)
      const ringGeo = new THREE.TorusGeometry(0.74, 0.07, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.6;
      podGroup.add(ringMesh);

      // Lower Dosing Stem / Injector Tube down into basin water
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12);
      const stemMesh = new THREE.Mesh(stemGeo, pipeMat);
      stemMesh.position.set(0, -1.2, 0);
      podGroup.add(stemMesh);

      scene.add(podGroup);
      podMeshesRef.current.set(pod.id, { group: podGroup, ringMaterial: ringMat });
    });

    // 10. Sensor Probes (pH & Alkalinity vertical probes along wall perimeter)
    sensorProbes.forEach((probe) => {
      const probeGroup = new THREE.Group();
      probeGroup.position.set(...probe.position);
      probeGroup.userData = { subsystemId: probe.id, title: probe.label };

      // Mast
      const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 12);
      const mastMesh = new THREE.Mesh(mastGeo, pipeMat);
      probeGroup.add(mastMesh);

      // Transmitter Head
      const headGeo = new THREE.BoxGeometry(0.35, 0.5, 0.35);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 1.0;
      probeGroup.add(headMesh);

      scene.add(probeGroup);
      probeIndicatorsRef.current.set(probe.id, headMesh);
    });

    // 10B. Setup Physics Engine and Dynamic Research Objects
    const physicsEngine = new PhysicsEngine(physicsParams);
    physicsEngineRef.current = physicsEngine;

    // A group for user-uploaded models and research probes
    const userModelsGroup = new THREE.Group();
    userModelsGroup.name = 'user_models_group';
    scene.add(userModelsGroup);
    userModelsGroupRef.current = userModelsGroup;

    // Add Preset Research Objects to Physics Simulation (buoy and sensor pod)
    const buoyGroup = createPresetResearchModel('oae_buoy');
    buoyGroup.position.set(-2.0, 1.2, -2.5);
    buoyGroup.userData = { subsystemId: 'physics_buoy', title: 'Oceanographic Spar Buoy (Physics Dynamic)' };
    scene.add(buoyGroup);
    physicsEngine.addDynamicBody('physics_buoy', buoyGroup, {
      mass: 8.0,
      shapeType: 'cylinder',
      dimensions: [0.5, 0.7, 0.5],
      position: [-2.0, 1.2, -2.5],
      isFloating: true,
      waterLevelY: 0.6,
      buoyancyFactor: 1.45,
    });
    interactivePhysicsObjectsRef.current.set('physics_buoy', { group: buoyGroup, type: 'buoy' });

    const sensorGliderGroup = createPresetResearchModel('sensor_pod');
    sensorGliderGroup.position.set(-5.5, 1.0, 3.0);
    sensorGliderGroup.userData = { subsystemId: 'physics_glider', title: 'Autonomous Micro-Glider (Physics Dynamic)' };
    scene.add(sensorGliderGroup);
    physicsEngine.addDynamicBody('physics_glider', sensorGliderGroup, {
      mass: 4.5,
      shapeType: 'box',
      dimensions: [0.6, 0.35, 0.9],
      position: [-5.5, 1.0, 3.0],
      isFloating: true,
      waterLevelY: 0.6,
      buoyancyFactor: 1.35,
    });
    interactivePhysicsObjectsRef.current.set('physics_glider', { group: sensorGliderGroup, type: 'glider' });

    // 10C. Setup Data Visualization Manager (Heatmaps, Vector Fields, Isolines)
    const dataVisManager = new DataVisualizationManager();
    dataVisManagerRef.current = dataVisManager;
    scene.add(dataVisManager.overlayGroup);

    // 10D. Setup Chemical Dispersion Plume Particle Manager
    const plumeManager = new PlumeParticleManager(plumeConfig.particleCountPerPod);
    plumeManagerRef.current = plumeManager;
    plumeManager.syncPods(dosingPods, plumeConfig.particleCountPerPod);
    scene.add(plumeManager.plumeGroup);

    // 11. Mouse & Interaction Handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isDraggingRef.current = true;
      if (e.button === 2) isPanningRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      if (isDraggingRef.current) {
        targetSphericalRef.current.theta -= deltaX * 0.007;
        targetSphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.04, targetSphericalRef.current.phi - deltaY * 0.007)
        );
      } else if (isPanningRef.current) {
        const panSpeed = 0.035;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        
        targetLookAtRef.current.addScaledVector(right, -deltaX * panSpeed);
        targetLookAtRef.current.y += deltaY * panSpeed;
      }

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetSphericalRef.current.radius = Math.max(
        8,
        Math.min(75, targetSphericalRef.current.radius + e.deltaY * 0.03)
      );
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // Click handler for 3D hotspots
    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if (cur.userData && cur.userData.subsystemId) {
            const subId = cur.userData.subsystemId;
            // If it's a physics body, apply a splash/nudge impulse force
            if (physicsEngineRef.current && physicsEngineRef.current.syncItems.has(subId)) {
              // Upward and outward nudge impulse
              const impulseX = (Math.random() - 0.5) * 4.0;
              const impulseY = 4.5;
              const impulseZ = (Math.random() - 0.5) * 4.0;
              physicsEngineRef.current.applyForce(subId, [impulseX, impulseY, impulseZ]);
              if (onInteractObject) {
                onInteractObject(subId, cur.userData.title || 'Dynamic Asset');
              }
            }
            onSelectSubsystem(subId);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('contextmenu', handleContextMenu);
    domElement.addEventListener('click', handleClick);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Initial camera position calculation
    const sph = cameraSphericalRef.current;
    camera.position.set(
      sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta),
      sph.radius * Math.cos(sph.phi),
      sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta)
    ).add(cameraTargetRef.current);
    camera.lookAt(cameraTargetRef.current);

    // 12. Main Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera interpolation: Cinematic Tour Mode or Interactive Orbit Controls
      const currentTour = tourStateRef.current;
      if (currentTour && currentTour.isActive) {
        const speed = currentTour.cameraSpeed || 1.0;
        const tourClock = elapsedTime * 0.25 * speed;

        switch (currentTour.stage) {
          case 'orbital_overview': {
            // Sweeping panoramic facility orbit at gentle elevation
            const orbitRadius = 40 + Math.sin(tourClock * 0.4) * 4;
            const orbitTheta = tourClock * 0.6;
            const orbitPhi = 1.05 + Math.cos(tourClock * 0.3) * 0.12;

            targetSphericalRef.current.radius = orbitRadius;
            targetSphericalRef.current.theta = orbitTheta;
            targetSphericalRef.current.phi = orbitPhi;
            targetLookAtRef.current.set(0.5, 1.2, 0);
            break;
          }
          case 'pod_focus': {
            // Locate target pod or find first active pod
            const pods = dosingPodsRef.current;
            const targetPod =
              pods.find((p) => p.id === currentTour.targetPodId) ||
              pods.find((p) => p.active) ||
              pods[0];

            if (targetPod) {
              const [px, py, pz] = targetPod.position;
              // Close dynamic zoom with slight floating sway
              targetSphericalRef.current.radius = 10.5 + Math.sin(tourClock * 1.2) * 1.5;
              targetSphericalRef.current.theta = 0.5 + Math.sin(tourClock * 0.5) * 0.35;
              targetSphericalRef.current.phi = 1.2 + Math.cos(tourClock * 0.4) * 0.08;
              targetLookAtRef.current.set(px, py - 0.2, pz);
            }
            break;
          }
          case 'subsurface_plume': {
            // Shallow angled close-up view looking across active slurry jets
            targetSphericalRef.current.radius = 14 + Math.sin(tourClock * 0.8) * 2;
            targetSphericalRef.current.theta = 1.1 + Math.sin(tourClock * 0.3) * 0.4;
            targetSphericalRef.current.phi = 1.35; // low skimming angle near water line
            targetLookAtRef.current.set(-3.0, 0.4, -4.0);
            break;
          }
          case 'intake_shoreline': {
            // Coastal shoreline bathymetry & seawater pumps view
            targetSphericalRef.current.radius = 22 + Math.sin(tourClock * 0.5) * 2;
            targetSphericalRef.current.theta = -0.4 + Math.sin(tourClock * 0.3) * 0.25;
            targetSphericalRef.current.phi = 1.22;
            targetLookAtRef.current.set(-13.5, 0.2, 2.5);
            break;
          }
          case 'control_lab': {
            // Digital twin telemetry servers and research building
            targetSphericalRef.current.radius = 15 + Math.cos(tourClock * 0.6) * 1.5;
            targetSphericalRef.current.theta = 1.55 + Math.sin(tourClock * 0.4) * 0.3;
            targetSphericalRef.current.phi = 1.16;
            targetLookAtRef.current.set(8.5, 2.5, -1.5);
            break;
          }
        }
      }

      // Camera smooth interpolation (damping)
      const lerpFactor = currentTour?.isActive ? 0.045 : 0.08;
      cameraSphericalRef.current.radius +=
        (targetSphericalRef.current.radius - cameraSphericalRef.current.radius) * lerpFactor;
      cameraSphericalRef.current.theta +=
        (targetSphericalRef.current.theta - cameraSphericalRef.current.theta) * lerpFactor;
      cameraSphericalRef.current.phi +=
        (targetSphericalRef.current.phi - cameraSphericalRef.current.phi) * lerpFactor;

      cameraTargetRef.current.lerp(targetLookAtRef.current, lerpFactor);

      const s = cameraSphericalRef.current;
      camera.position.set(
        s.radius * Math.sin(s.phi) * Math.sin(s.theta) + cameraTargetRef.current.x,
        s.radius * Math.cos(s.phi) + cameraTargetRef.current.y,
        s.radius * Math.sin(s.phi) * Math.cos(s.theta) + cameraTargetRef.current.z
      );
      camera.lookAt(cameraTargetRef.current);

      // Animate Basin Water Caustics / Waves
      if (basinWaterMeshRef.current) {
        const waterGeo = basinWaterMeshRef.current.geometry;
        const pos = waterGeo.attributes.position;
        const waveSpeed = elapsedTime * 2.2;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz =
            Math.sin(vx * 1.5 + waveSpeed) * 0.05 +
            Math.cos(vy * 1.2 + waveSpeed * 1.4) * 0.04;
          pos.setZ(i, vz);
        }
        waterGeo.computeVertexNormals();
        pos.needsUpdate = true;
      }

      // Animate Ocean Waves
      if (oceanMeshRef.current) {
        const oceanGeo = oceanMeshRef.current.geometry;
        const pos = oceanGeo.attributes.position;
        const oceanSpeed = elapsedTime * 1.6;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const zWave =
            Math.sin(vx * 0.35 + oceanSpeed) * 0.35 +
            Math.cos(vy * 0.25 + oceanSpeed * 0.8) * 0.25;
          pos.setZ(i, zWave);
        }
        oceanGeo.computeVertexNormals();
        pos.needsUpdate = true;
      }

      // Animate Dynamic Chemical Dispersion Plumes (Particle System)
      if (plumeManagerRef.current && isRunning) {
        plumeManagerRef.current.update(
          dosingPods,
          feedstock,
          plumeConfig,
          chemicalState,
          delta,
          simSpeed,
          elapsedTime
        );
      }

      // Animate Lab Blade Server LEDs
      serverLedsRef.current.forEach((light, i) => {
        const blink = Math.sin(elapsedTime * 6 + i * 2.5) > 0.2 ? 1.6 : 0.3;
        light.intensity = blink;
      });

      // 13. Step Physics Simulation
      if (physicsEngineRef.current && isRunning) {
        physicsEngineRef.current.step(delta * simSpeed);
      }

      // 14. Update Real-Time Data Visualization Overlay (Heatmaps, Flow Vectors, Isolines)
      if (dataVisManagerRef.current) {
        dataVisManagerRef.current.update(
          dataOverlay,
          chemicalState,
          dosingPods,
          sensorProbes,
          elapsedTime
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('contextmenu', handleContextMenu);
      domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (plumeManagerRef.current) {
        plumeManagerRef.current.dispose();
      }
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
    };
  }, []);

  // Update Visual Mode (Realistic vs Blueprint vs Heatmap vs Night HUD)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ambientLight = scene.getObjectByName('ambientLight') as THREE.AmbientLight;
    const sunLight = scene.getObjectByName('sunLight') as THREE.DirectionalLight;
    const basinWater = basinWaterMeshRef.current;

    if (!ambientLight || !sunLight || !basinWater) return;

    if (visualMode === 'realistic') {
      scene.background = null; // transparent canvas showing sky gradient
      ambientLight.color.setHex(0xdbeafe);
      ambientLight.intensity = 1.2;
      sunLight.color.setHex(0xfffbeb);
      sunLight.intensity = 2.4;
      (basinWater.material as THREE.MeshStandardMaterial).color.setHex(0x0ea5e9);
      (basinWater.material as THREE.MeshStandardMaterial).opacity = 0.82;
    } else if (visualMode === 'blueprint') {
      scene.background = new THREE.Color(0x0b192c);
      ambientLight.color.setHex(0x38bdf8);
      ambientLight.intensity = 2.0;
      sunLight.color.setHex(0x7dd3fc);
      sunLight.intensity = 1.0;
      (basinWater.material as THREE.MeshStandardMaterial).color.setHex(0x0284c7);
      (basinWater.material as THREE.MeshStandardMaterial).opacity = 0.7;
    } else if (visualMode === 'heatmap') {
      scene.background = new THREE.Color(0x0f172a);
      ambientLight.color.setHex(0x94a3b8);
      ambientLight.intensity = 1.0;
      sunLight.intensity = 1.2;

      // Color water based on pH: green (optimal 8.3-8.5), cyan (8.1), red/amber if critical (>8.65)
      const phColor = chemicalState.pH > 8.65 ? 0xef4444 : chemicalState.pH > 8.3 ? 0x10b981 : 0x06b6d4;
      (basinWater.material as THREE.MeshStandardMaterial).color.setHex(phColor);
      (basinWater.material as THREE.MeshStandardMaterial).opacity = 0.92;
    } else if (visualMode === 'night_hud') {
      scene.background = new THREE.Color(0x030712);
      ambientLight.color.setHex(0x1e293b);
      ambientLight.intensity = 0.6;
      sunLight.color.setHex(0x60a5fa);
      sunLight.intensity = 0.4;
      (basinWater.material as THREE.MeshStandardMaterial).color.setHex(0x0369a1);
      (basinWater.material as THREE.MeshStandardMaterial).opacity = 0.85;
    }
  }, [visualMode, chemicalState.pH]);

  // Update Pod Glowing LED Status Rings when pods change
  useEffect(() => {
    dosingPods.forEach((pod) => {
      const podObj = podMeshesRef.current.get(pod.id);
      if (podObj) {
        if (!pod.active) {
          podObj.ringMaterial.color.setHex(0x64748b);
          podObj.ringMaterial.emissive.setHex(0x334155);
          podObj.ringMaterial.emissiveIntensity = 0.2;
        } else if (pod.status === 'warning') {
          podObj.ringMaterial.color.setHex(0xf59e0b);
          podObj.ringMaterial.emissive.setHex(0xf59e0b);
          podObj.ringMaterial.emissiveIntensity = 2.2;
        } else {
          podObj.ringMaterial.color.setHex(0x10b981);
          podObj.ringMaterial.emissive.setHex(0x10b981);
          podObj.ringMaterial.emissiveIntensity = 2.0;
        }
      }
    });
  }, [dosingPods]);

  // Update Physics Parameters dynamically from UI controls
  useEffect(() => {
    if (physicsEngineRef.current && physicsParams) {
      physicsEngineRef.current.updateParameters(physicsParams);
    }
  }, [physicsParams]);

  // Sync Chemical Plume Manager when pods or particle count change
  useEffect(() => {
    if (plumeManagerRef.current && plumeConfig) {
      plumeManagerRef.current.syncPods(dosingPods, plumeConfig.particleCountPerPod);
    }
  }, [dosingPods, plumeConfig.particleCountPerPod]);

  // Sync user-uploaded 3D models with scene and physics engine
  useEffect(() => {
    const scene = sceneRef.current;
    const userModelsGroup = userModelsGroupRef.current;
    const physics = physicsEngineRef.current;
    if (!scene || !userModelsGroup || !physics) return;

    // Synchronize each model in state
    uploadedModels.forEach((model) => {
      let group = userModelsGroup.getObjectByName(model.id) as THREE.Group | undefined;

      if (!group && uploadedModelObjects && uploadedModelObjects.has(model.id)) {
        group = uploadedModelObjects.get(model.id);
        if (group) {
          group.name = model.id;
          group.userData = { subsystemId: model.id, title: model.name };
          userModelsGroup.add(group);

          // Add to physics engine
          if (model.isPhysicsActive) {
            physics.addDynamicBody(model.id, group, {
              mass: model.mass,
              position: model.position,
              dimensions: [0.5 * model.scale, 0.5 * model.scale, 0.5 * model.scale],
              isFloating: true,
              waterLevelY: 0.6,
            });
          }
        }
      }

      if (group) {
        group.visible = model.visible;
        group.scale.setScalar(model.scale);

        // If physics is off, set manual coordinates
        if (!model.isPhysicsActive) {
          group.position.set(...model.position);
          group.rotation.set(...model.rotation);
        }

        // Apply wireframe toggle and custom color if specified
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const applyMat = (m: THREE.Material) => {
                if ('wireframe' in m) {
                  (m as THREE.MeshStandardMaterial).wireframe = model.wireframe;
                }
                if (model.color && 'color' in m) {
                  (m as THREE.MeshStandardMaterial).color.set(model.color);
                }
              };

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(applyMat);
              } else {
                applyMat(mesh.material);
              }
            }
          }
        });
      }
    });
  }, [uploadedModels, uploadedModelObjects]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
    >
      {/* 3D Scene Controls Hint */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-3 text-xs bg-slate-900/80 backdrop-blur-md text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
        <span className="flex items-center gap-1 font-mono">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px]">Left Drag</kbd> Orbit
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 font-mono">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px]">Right Drag</kbd> Pan
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 font-mono">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px]">Scroll</kbd> Zoom
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-emerald-400 font-mono text-[11px]">Click any facility asset to inspect</span>
      </div>
    </div>
  );
};

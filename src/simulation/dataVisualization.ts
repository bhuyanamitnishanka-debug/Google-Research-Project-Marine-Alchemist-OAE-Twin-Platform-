import * as THREE from 'three';
import { DataOverlayConfig, HeatmapMetric, ChemicalState, DosingPod, SensorProbe } from '../types';

export class DataVisualizationManager {
  public overlayGroup: THREE.Group;
  private heatmapMesh: THREE.Mesh | null = null;
  private heatmapTexture: THREE.DataTexture | null = null;
  private vectorFieldGroup: THREE.Group | null = null;
  private sensorContourGroup: THREE.Group | null = null;

  // Basin dimensions matching ThreeCanvas
  private basinBounds = {
    minX: -10.5,
    maxX: 3.5,
    minZ: -9.5,
    maxZ: 9.5,
    y: 0.65, // just above water level
  };

  private gridResolution = 32;

  constructor() {
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'data_visualization_overlays';

    this.createHeatmapMesh();
    this.createVectorField();
    this.createSensorIsolines();
  }

  private createHeatmapMesh() {
    const width = this.basinBounds.maxX - this.basinBounds.minX;
    const length = this.basinBounds.maxZ - this.basinBounds.minZ;

    const geo = new THREE.PlaneGeometry(width, length, this.gridResolution, this.gridResolution);
    geo.rotateX(-Math.PI / 2);

    // Initial RGBA texture
    const size = this.gridResolution;
    const data = new Uint8Array(size * size * 4);
    this.heatmapTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    this.heatmapTexture.needsUpdate = true;

    const mat = new THREE.MeshBasicMaterial({
      map: this.heatmapTexture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });

    this.heatmapMesh = new THREE.Mesh(geo, mat);
    this.heatmapMesh.position.set(
      (this.basinBounds.minX + this.basinBounds.maxX) / 2,
      this.basinBounds.y,
      (this.basinBounds.minZ + this.basinBounds.maxZ) / 2
    );
    this.heatmapMesh.visible = false;
    this.overlayGroup.add(this.heatmapMesh);
  }

  private createVectorField() {
    this.vectorFieldGroup = new THREE.Group();
    this.vectorFieldGroup.name = 'vector_field_arrows';
    this.vectorFieldGroup.visible = false;

    // Create a 12x12 grid of 3D flow direction arrows
    const cols = 12;
    const rows = 12;
    const width = this.basinBounds.maxX - this.basinBounds.minX;
    const length = this.basinBounds.maxZ - this.basinBounds.minZ;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = this.basinBounds.minX + (i / (cols - 1)) * width;
        const z = this.basinBounds.minZ + (j / (rows - 1)) * length;

        // Direction arrow
        const dir = new THREE.Vector3(0.7, 0, 0.3).normalize();
        const origin = new THREE.Vector3(x, this.basinBounds.y + 0.1, z);
        const lengthArrow = 0.85;
        const color = 0x38bdf8;

        const arrow = new THREE.ArrowHelper(dir, origin, lengthArrow, color, 0.3, 0.15);
        this.vectorFieldGroup.add(arrow);
      }
    }

    this.overlayGroup.add(this.vectorFieldGroup);
  }

  private createSensorIsolines() {
    this.sensorContourGroup = new THREE.Group();
    this.sensorContourGroup.name = 'sensor_isolines';
    this.sensorContourGroup.visible = false;
    this.overlayGroup.add(this.sensorContourGroup);
  }

  /**
   * Color mapping helpers (Turbo and Viridis colormaps)
   */
  private getColorFromNormalizedVal(val: number, palette: 'turbo' | 'viridis' | 'ocean' | 'thermal'): [number, number, number] {
    const t = Math.max(0, Math.min(1, val));

    if (palette === 'ocean') {
      // Deep blue (0) -> Cyan -> Emerald green (1)
      return [
        Math.floor(10 + t * 40),
        Math.floor(80 + t * 170),
        Math.floor(160 + (1 - t) * 80),
      ];
    } else if (palette === 'thermal') {
      // Blue -> Purple -> Yellow -> Red/White
      return [
        Math.floor(Math.min(255, t * 1.8 * 255)),
        Math.floor(Math.sin(t * Math.PI) * 220),
        Math.floor((1 - t) * 255),
      ];
    } else if (palette === 'viridis') {
      // Purple -> Blue -> Green -> Yellow
      const r = Math.floor((Math.sin((t - 0.2) * Math.PI) * 0.5 + 0.5) * 220);
      const g = Math.floor(t * 240);
      const b = Math.floor((1 - t * 0.8) * 220);
      return [r, g, b];
    } else {
      // Turbo default
      const r = Math.floor(Math.sin(t * Math.PI * 1.5 - 0.5) * 127 + 128);
      const g = Math.floor(Math.sin(t * Math.PI) * 255);
      const b = Math.floor(Math.cos(t * Math.PI * 1.2) * 127 + 128);
      return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
    }
  }

  /**
   * Updates overlay representations based on real-time geochemistry and pod states
   */
  public update(
    config: DataOverlayConfig,
    chemicalState: ChemicalState,
    dosingPods: DosingPod[],
    sensorProbes: SensorProbe[],
    elapsedTime: number
  ) {
    if (!this.heatmapMesh || !this.heatmapTexture || !this.vectorFieldGroup || !this.sensorContourGroup) return;

    // Set overall visibility
    this.heatmapMesh.visible = config.type === 'heatmap' || config.type === 'sensor_iso';
    this.vectorFieldGroup.visible = config.type === 'vector_field';
    this.sensorContourGroup.visible = config.type === 'sensor_iso' || config.showContours;

    if (config.type === 'none') {
      this.overlayGroup.visible = false;
      return;
    }
    this.overlayGroup.visible = true;

    // 1. Update Heatmap texture data
    if (this.heatmapMesh.visible) {
      const size = this.gridResolution;
      const data = this.heatmapTexture.image.data;
      if (!data) return;

      const width = this.basinBounds.maxX - this.basinBounds.minX;
      const length = this.basinBounds.maxZ - this.basinBounds.minZ;

      // Active pod positions and discharge weights
      const activePods = dosingPods.filter((p) => p.active);

      for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
          const idx = (j * size + i) * 4;
          const worldX = this.basinBounds.minX + (i / (size - 1)) * width;
          const worldZ = this.basinBounds.minZ + (j / (size - 1)) * length;

          // Compute geochemical dispersion gradient from active dosing nozzles
          let dispersionIntensity = 0;
          for (const pod of activePods) {
            const dx = worldX - pod.position[0];
            const dz = worldZ - pod.position[2];
            const dist = Math.sqrt(dx * dx + dz * dz);
            // Gaussian plume kernel with advection towards center
            const influence = Math.exp(-dist * 0.45) * (pod.rateKgPerHour / 50);
            dispersionIntensity += influence;
          }

          // Ambient subtle wave noise
          const flowNoise = Math.sin(worldX * 0.6 + elapsedTime * 1.5) * 0.08;

          // Normalized scalar based on selected metric
          let norm = 0;
          if (config.metric === 'pH') {
            const localPH = chemicalState.pH + dispersionIntensity * 0.35 + flowNoise;
            norm = (localPH - 8.0) / (8.8 - 8.0);
          } else if (config.metric === 'alkalinity') {
            const localTA = chemicalState.totalAlkalinity + dispersionIntensity * 320;
            norm = (localTA - 2300) / (2900 - 2300);
          } else if (config.metric === 'pCO2') {
            // As alkalinity increases, aqueous pCO2 drops
            const localPCO2 = Math.max(120, chemicalState.pCO2 - dispersionIntensity * 140);
            norm = (localPCO2 - 150) / (420 - 150);
          } else {
            norm = Math.min(1, dispersionIntensity * 0.8 + 0.2);
          }

          norm = Math.max(0, Math.min(1, norm));
          const [r, g, b] = this.getColorFromNormalizedVal(norm, config.colorScale);

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = Math.floor(config.opacity * 255 * (0.4 + norm * 0.6));
        }
      }
      this.heatmapTexture.needsUpdate = true;
      (this.heatmapMesh.material as THREE.MeshBasicMaterial).opacity = config.opacity;
    }

    // 2. Update Vector Field (advection & vortex circulation inside basin)
    if (this.vectorFieldGroup.visible) {
      let arrowIdx = 0;
      this.vectorFieldGroup.children.forEach((child) => {
        if (child instanceof THREE.ArrowHelper) {
          const pos = child.position;
          // Calculate vortex flow around center (-3.5, 0) caused by wall jets
          const cx = -3.5;
          const cz = 0;
          const dx = pos.x - cx;
          const dz = pos.z - cz;

          // Tangential circulation
          const vx = -dz * 0.15 + Math.sin(pos.z * 0.5 + elapsedTime * 2) * 0.2;
          const vz = dx * 0.15 + Math.cos(pos.x * 0.5 + elapsedTime * 1.8) * 0.2;
          const dir = new THREE.Vector3(vx, 0, vz).normalize();

          child.setDirection(dir);
          const speed = Math.sqrt(vx * vx + vz * vz);
          child.setLength(0.6 + speed * 0.8, 0.25, 0.12);

          // Colorize vectors based on velocity
          const arrowColor = speed > 0.35 ? 0x38bdf8 : speed > 0.2 ? 0x34d399 : 0x818cf8;
          child.setColor(new THREE.Color(arrowColor));
          arrowIdx++;
        }
      });
    }

    // 3. Update Sensor Isolines
    if (this.sensorContourGroup.visible) {
      // Clear previous and redraw concentric rings at sensors
      while (this.sensorContourGroup.children.length > 0) {
        const obj = this.sensorContourGroup.children.pop();
        if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
        }
      }

      sensorProbes.forEach((probe) => {
        for (let r = 1.0; r <= 3.2; r += 1.1) {
          const pts: THREE.Vector3[] = [];
          const segs = 32;
          for (let s = 0; s <= segs; s++) {
            const theta = (s / segs) * Math.PI * 2;
            pts.push(
              new THREE.Vector3(
                probe.position[0] + Math.cos(theta) * r,
                this.basinBounds.y + 0.05,
                probe.position[2] + Math.sin(theta) * r
              )
            );
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.55 / r,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          this.sensorContourGroup?.add(line);
        }
      });
    }
  }

  public dispose() {
    if (this.heatmapTexture) this.heatmapTexture.dispose();
    if (this.heatmapMesh) {
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
    }
  }
}

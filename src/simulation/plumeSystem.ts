import * as THREE from 'three';
import { DosingPod, ChemicalState, FeedstockType, PlumeSimulationConfig } from '../types';
import { FEEDSTOCKS } from './geochemistry';

// Individual particle representation inside an advection plume
interface PlumeParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  maxAge: number;
  concentration: number; // 1.0 (pure slurry nozzle injection) down to 0.0 (diluted ambient)
  baseSize: number;
}

// Particle system instance per dosing pod
interface PodPlumeSystem {
  podId: string;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  particles: PlumeParticle[];
  origin: [number, number, number];
}

export class PlumeParticleManager {
  public plumeGroup: THREE.Group;
  private podSystems: Map<string, PodPlumeSystem> = new Map();
  private maxParticlesPerPod: number;
  private basinBounds = {
    minX: -9.5,
    maxX: 3.5,
    minZ: -9.5,
    maxZ: 5.5,
    waterSurfaceY: 0.7,
    basinFloorY: 0.1,
  };

  // Color gradient lookup for concentration visualization:
  // High concentration (near nozzle): Pure luminous magenta/coral or bright feedstock color
  // Mid concentration: Vibrant cyan/emerald active reaction halo
  // Low concentration (diluted): Soft azure/deep sea ambient fade
  private colorStops: Record<FeedstockType, { high: THREE.Color; mid: THREE.Color; low: THREE.Color }> = {
    slaked_lime: {
      high: new THREE.Color(0xfff3b0), // Dense milky Ca(OH)2 slurry core
      mid: new THREE.Color(0x34d399),  // Active dissociation emerald
      low: new THREE.Color(0x0284c7),  // Dilute seawater alkaline blue
    },
    brucite: {
      high: new THREE.Color(0xfef08a), // Pale magnesium hydroxide
      mid: new THREE.Color(0x22d3ee),  // Aqua dissolution
      low: new THREE.Color(0x0369a1),
    },
    olivine: {
      high: new THREE.Color(0xa3e635), // Silicate greenish-gold
      mid: new THREE.Color(0x10b981),
      low: new THREE.Color(0x0e7490),
    },
    sodium_bicarbonate: {
      high: new THREE.Color(0x93c5fd), // Clear soluble buffer blue
      mid: new THREE.Color(0x38bdf8),
      low: new THREE.Color(0x1e40af),
    },
  };

  constructor(maxParticlesPerPod: number = 400) {
    this.maxParticlesPerPod = maxParticlesPerPod;
    this.plumeGroup = new THREE.Group();
    this.plumeGroup.name = 'chemical_dispersion_plumes';
  }

  /**
   * Initialize or sync plume particle systems for each active dosing pod
   */
  public syncPods(dosingPods: DosingPod[], particleCount: number = 350) {
    this.maxParticlesPerPod = particleCount;

    // Remove obsolete pods
    const currentPodIds = new Set(dosingPods.map((p) => p.id));
    for (const [id, sys] of this.podSystems.entries()) {
      if (!currentPodIds.has(id)) {
        this.plumeGroup.remove(sys.points);
        sys.geometry.dispose();
        sys.material.dispose();
        this.podSystems.delete(id);
      }
    }

    // Initialize or re-target for each pod
    dosingPods.forEach((pod) => {
      let sys = this.podSystems.get(pod.id);
      const nozzleOrigin: [number, number, number] = [
        pod.position[0],
        0.35, // submerged at lower nozzle level below pod
        pod.position[2] + 0.35, // inject slightly towards basin interior
      ];

      if (!sys) {
        const particles: PlumeParticle[] = [];
        const positions = new Float32Array(this.maxParticlesPerPod * 3);
        const colors = new Float32Array(this.maxParticlesPerPod * 3);
        const sizes = new Float32Array(this.maxParticlesPerPod);

        for (let i = 0; i < this.maxParticlesPerPod; i++) {
          const p = this.createParticle(nozzleOrigin, pod.rateKgPerHour, true);
          particles.push(p);

          positions[i * 3] = p.x;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z;

          colors[i * 3] = 0.2;
          colors[i * 3 + 1] = 0.8;
          colors[i * 3 + 2] = 0.9;

          sizes[i] = p.baseSize;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create glowing radial sprite texture for soft volumetric dispersion
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
          grad.addColorStop(0.3, 'rgba(200, 245, 255, 0.7)');
          grad.addColorStop(0.7, 'rgba(80, 200, 240, 0.25)');
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 64, 64);
        }
        const spriteTexture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
          size: 0.35,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          map: spriteTexture,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const points = new THREE.Points(geometry, material);
        points.name = `plume_${pod.id}`;
        this.plumeGroup.add(points);

        sys = {
          podId: pod.id,
          points,
          geometry,
          material,
          particles,
          origin: nozzleOrigin,
        };
        this.podSystems.set(pod.id, sys);
      } else {
        sys.origin = nozzleOrigin;
      }
    });
  }

  /**
   * Create an individual particle with nozzle momentum and chemical dispersion properties
   */
  private createParticle(
    origin: [number, number, number],
    rateKgPerHour: number,
    initialRandomAge: boolean = false
  ): PlumeParticle {
    const rateFactor = Math.max(0.2, rateKgPerHour / 45);
    const maxAge = 3.5 + Math.random() * 2.5; // 3.5 - 6.0 seconds lifetime
    const age = initialRandomAge ? Math.random() * maxAge : 0;

    // Initial injection nozzle jet: angled downwards and outwards into the pool
    // In our coordinate system, pods are along Z=-9.8, so outward flow is +Z
    const jetAngle = (Math.random() - 0.5) * 0.6;
    const jetSpeed = (0.35 + Math.random() * 0.45) * rateFactor;

    const vx = Math.sin(jetAngle) * jetSpeed * 0.4;
    const vy = (Math.random() - 0.4) * 0.08; // slightly neutral/sinking
    const vz = Math.cos(jetAngle) * jetSpeed; // forward into pool

    // Initial position tightly clustered around nozzle orifice
    const x = origin[0] + (Math.random() - 0.5) * 0.15;
    const y = origin[1] + (Math.random() - 0.5) * 0.1;
    const z = origin[2] + (Math.random() - 0.5) * 0.15;

    return {
      x,
      y,
      z,
      vx,
      vy,
      vz,
      age,
      maxAge,
      concentration: 1.0,
      baseSize: 0.2 + Math.random() * 0.2,
    };
  }

  /**
   * Main Physics & Chemical Dispersion Step
   * Models:
   * 1. High-momentum turbulent jet at injector nozzle
   * 2. Momentum decay and transition to ambient advection & vortex circulation
   * 3. Chemical dilution gradient (C = C0 * exp(-k * age))
   * 4. Multi-stop color interpolation along the concentration gradient
   */
  public update(
    dosingPods: DosingPod[],
    feedstock: FeedstockType,
    config: PlumeSimulationConfig,
    chemicalState: ChemicalState,
    delta: number,
    simSpeed: number,
    elapsedTime: number
  ) {
    if (!config.enabled) {
      this.plumeGroup.visible = false;
      return;
    }
    this.plumeGroup.visible = true;

    const stops = this.colorStops[feedstock] || this.colorStops.slaked_lime;
    const effDelta = Math.min(0.08, delta) * simSpeed * config.dispersionSpeed;

    dosingPods.forEach((pod) => {
      const sys = this.podSystems.get(pod.id);
      if (!sys) return;

      const isPodActive = pod.active && pod.rateKgPerHour > 0;
      sys.points.visible = true;

      // Adjust particle material size
      sys.material.size = config.particleSize;

      const posAttr = sys.geometry.attributes.position as THREE.BufferAttribute;
      const colAttr = sys.geometry.attributes.color as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const colors = colAttr.array as Float32Array;

      const rateMultiplier = isPodActive ? pod.rateKgPerHour / 50 : 0;

      for (let i = 0; i < sys.particles.length; i++) {
        const p = sys.particles[i];

        if (!isPodActive) {
          // If pod is shut off, slowly dilute and sink existing plume particles
          p.age += effDelta * 2.0;
          p.concentration = Math.max(0, p.concentration - effDelta * 0.5);
          p.y -= 0.005 * effDelta;
          if (p.age >= p.maxAge) {
            // Hide beneath basin
            positions[i * 3 + 1] = -10;
            continue;
          }
        } else {
          p.age += effDelta;
        }

        // Particle Respawn Condition
        const distFromOrigin = Math.hypot(p.x - sys.origin[0], p.z - sys.origin[2]);
        const isOutOfBasin =
          p.x < this.basinBounds.minX ||
          p.x > this.basinBounds.maxX ||
          p.z < this.basinBounds.minZ ||
          p.z > this.basinBounds.maxZ ||
          p.y < this.basinBounds.basinFloorY ||
          p.y > this.basinBounds.waterSurfaceY;

        if (p.age >= p.maxAge || (isOutOfBasin && distFromOrigin > 1.0)) {
          if (isPodActive) {
            const fresh = this.createParticle(sys.origin, pod.rateKgPerHour, false);
            p.x = fresh.x;
            p.y = fresh.y;
            p.z = fresh.z;
            p.vx = fresh.vx;
            p.vy = fresh.vy;
            p.vz = fresh.vz;
            p.age = 0;
            p.maxAge = fresh.maxAge * (config.lifetimeSeconds / 4.5);
            p.concentration = 1.0;
          } else {
            positions[i * 3 + 1] = -10;
            continue;
          }
        }

        // --- Hydrodynamic Forces & Fluid Advection ---
        // 1. Vortex circulation inside coastal basin
        const basinCenterX = -3.0;
        const basinCenterZ = -2.0;
        const dx = p.x - basinCenterX;
        const dz = p.z - basinCenterZ;
        const r = Math.sqrt(dx * dx + dz * dz) + 0.1;

        // Tangential swirl velocity around center of pool
        const swirlStrength = 0.18 / (1 + r * 0.4);
        const swirlVx = -dz * swirlStrength;
        const swirlVz = dx * swirlStrength;

        // 2. Turbulent micro-eddies (Brownian jitter)
        const turbulenceFreq = 1.8;
        const noiseX = Math.sin(p.z * 1.5 + elapsedTime * turbulenceFreq) * 0.05 * config.turbulence;
        const noiseZ = Math.cos(p.x * 1.5 + elapsedTime * turbulenceFreq) * 0.05 * config.turbulence;
        const noiseY = Math.sin((p.x + p.z) * 2.0 + elapsedTime * 2.0) * 0.02 * config.turbulence;

        // 3. Fluid drag: decelerates the high initial nozzle velocity
        const drag = 0.94;
        p.vx = p.vx * drag + (swirlVx + noiseX) * 0.06;
        p.vz = p.vz * drag + (swirlVz + noiseZ) * 0.06;

        // Buoyancy / Settling effect: mineral slurries (olivine/quicklime) have slight negative buoyancy
        const buoyancyForce = config.buoyancyEffect * 0.01 + noiseY * 0.05;
        p.vy = p.vy * 0.9 + buoyancyForce;

        // Step coordinates
        p.x += p.vx * effDelta * 4.0;
        p.y += p.vy * effDelta * 4.0;
        p.z += p.vz * effDelta * 4.0;

        // Keep inside water boundaries
        p.y = Math.max(this.basinBounds.basinFloorY + 0.02, Math.min(this.basinBounds.waterSurfaceY - 0.02, p.y));

        // --- Concentration Gradient Decay (Dissolution Kinetics) ---
        // Normalized age 0.0 (fresh from nozzle) -> 1.0 (fully dispersed)
        const progress = p.age / p.maxAge;
        // Exponential concentration decay: C(t) = C0 * exp(-2.5 * progress)
        p.concentration = Math.max(0.02, Math.exp(-2.8 * progress) * rateMultiplier);

        // --- Color Gradient Visualization ---
        // Concentration > 0.65: High concentration nozzle core (Bright slurry / reactive glow)
        // 0.25 <= Concentration <= 0.65: Active dissolution zone (Vibrant reaction green/cyan)
        // Concentration < 0.25: Diluted ambient ocean dispersion (Soft azure blue)
        let cr = 0;
        let cg = 0;
        let cb = 0;

        if (config.colorMode === 'concentration') {
          // Heatmap rainbow concentration scale: High = Red/Yellow, Mid = Green/Cyan, Low = Blue
          if (p.concentration > 0.6) {
            const t = (p.concentration - 0.6) / 0.4;
            cr = THREE.MathUtils.lerp(0.2, 1.0, t);
            cg = THREE.MathUtils.lerp(1.0, 0.4, t);
            cb = THREE.MathUtils.lerp(0.3, 0.1, t);
          } else if (p.concentration > 0.25) {
            const t = (p.concentration - 0.25) / 0.35;
            cr = THREE.MathUtils.lerp(0.05, 0.2, t);
            cg = THREE.MathUtils.lerp(0.7, 1.0, t);
            cb = THREE.MathUtils.lerp(0.9, 0.3, t);
          } else {
            const t = p.concentration / 0.25;
            cr = THREE.MathUtils.lerp(0.02, 0.05, t);
            cg = THREE.MathUtils.lerp(0.3, 0.7, t);
            cb = THREE.MathUtils.lerp(0.85, 0.9, t);
          }
        } else if (config.colorMode === 'gradient') {
          // Continuous 3-stop interpolation with high-visibility core
          if (p.concentration > 0.5) {
            const t = (p.concentration - 0.5) / 0.5;
            cr = THREE.MathUtils.lerp(stops.mid.r, stops.high.r, t);
            cg = THREE.MathUtils.lerp(stops.mid.g, stops.high.g, t);
            cb = THREE.MathUtils.lerp(stops.mid.b, stops.high.b, t);
          } else {
            const t = p.concentration / 0.5;
            cr = THREE.MathUtils.lerp(stops.low.r, stops.mid.r, t);
            cg = THREE.MathUtils.lerp(stops.low.g, stops.mid.g, t);
            cb = THREE.MathUtils.lerp(stops.low.b, stops.mid.b, t);
          }
        } else {
          // Pure Feedstock Mineral Signature
          const fInfo = FEEDSTOCKS[feedstock];
          const baseCol = new THREE.Color(fInfo.color);
          const t = p.concentration;
          cr = THREE.MathUtils.lerp(0.1, baseCol.r, t);
          cg = THREE.MathUtils.lerp(0.4, baseCol.g, t);
          cb = THREE.MathUtils.lerp(0.8, baseCol.b, t);
        }

        // Enhance luminescence near core
        const brightness = 0.5 + p.concentration * 0.7;

        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;

        colors[i * 3] = cr * brightness;
        colors[i * 3 + 1] = cg * brightness;
        colors[i * 3 + 2] = cb * brightness;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    });
  }

  public dispose() {
    for (const sys of this.podSystems.values()) {
      this.plumeGroup.remove(sys.points);
      sys.geometry.dispose();
      sys.material.dispose();
    }
    this.podSystems.clear();
  }
}

import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PhysicsParams } from '../types';

export interface PhysicsSyncItem {
  id: string;
  body: CANNON.Body;
  mesh: THREE.Object3D;
  isFloatingInWater?: boolean;
  waterLevelY?: number;
  buoyancyFactor?: number;
  initialPos?: [number, number, number];
}

export class PhysicsEngine {
  public world: CANNON.World;
  public syncItems: Map<string, PhysicsSyncItem> = new Map();
  public params: PhysicsParams;

  private defaultMaterial: CANNON.Material;
  private groundMaterial: CANNON.Material;
  private contactMaterial: CANNON.ContactMaterial;

  constructor(initialParams?: Partial<PhysicsParams>) {
    this.params = {
      gravity: -9.82,
      buoyancy: 1.25,
      linearDamping: 0.35,
      restitution: 0.3,
      friction: 0.4,
      waterDensity: 1025,
      ...initialParams,
    };

    this.world = new CANNON.World();
    this.world.gravity.set(0, this.params.gravity, 0);

    // Collision materials
    this.defaultMaterial = new CANNON.Material('default');
    this.groundMaterial = new CANNON.Material('ground');
    this.contactMaterial = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.defaultMaterial,
      {
        friction: this.params.friction,
        restitution: this.params.restitution,
      }
    );
    this.world.addContactMaterial(this.contactMaterial);

    this.setupStaticBoundaries();
  }

  /**
   * Sets up static physics bodies for the concrete apron, basin walls, and basin floor.
   */
  private setupStaticBoundaries() {
    // 1. Concrete Ground Apron Plane
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: this.groundMaterial,
    });
    // CANNON planes face +Z by default, rotate -90 deg around X to face +Y up
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, 0, 0);
    this.world.addBody(groundBody);

    // 2. Basin Interior Floor (-1.4m depth)
    const basinFloor = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(7.25, 0.4, 9.75)), // half extents
      position: new CANNON.Vec3(-3.5, -1.2, 0),
      material: this.groundMaterial,
    });
    this.world.addBody(basinFloor);

    // 3. Basin North Wall
    const nWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(8.0, 0.8, 0.4)),
      position: new CANNON.Vec3(-3.5, 0.6, -9.75),
    });
    this.world.addBody(nWall);

    // 4. Basin South Wall
    const sWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(8.0, 0.8, 0.4)),
      position: new CANNON.Vec3(-3.5, 0.6, 9.75),
    });
    this.world.addBody(sWall);

    // 5. Basin West Wall (Ocean side)
    const wWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.8, 9.75)),
      position: new CANNON.Vec3(-11.15, 0.6, 0),
    });
    this.world.addBody(wWall);

    // 6. Basin East Wall (Facility deck side)
    const eWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.8, 9.75)),
      position: new CANNON.Vec3(4.15, 0.6, 0),
    });
    this.world.addBody(eWall);
  }

  /**
   * Update physics parameter settings dynamically
   */
  public updateParameters(newParams: Partial<PhysicsParams>) {
    this.params = { ...this.params, ...newParams };
    this.world.gravity.set(0, this.params.gravity, 0);
    this.contactMaterial.friction = this.params.friction;
    this.contactMaterial.restitution = this.params.restitution;
  }

  /**
   * Add a dynamic physical object (e.g. buoy, uploaded model, floating sensor)
   */
  public addDynamicBody(
    id: string,
    mesh: THREE.Object3D,
    options: {
      mass?: number;
      shapeType?: 'box' | 'sphere' | 'cylinder';
      dimensions?: [number, number, number]; // half-extents or radius/height
      position?: [number, number, number];
      isFloating?: boolean;
      waterLevelY?: number;
      buoyancyFactor?: number;
    } = {}
  ): CANNON.Body {
    // Remove if already exists
    this.removeBody(id);

    const mass = options.mass !== undefined ? options.mass : 5.0;
    const pos = options.position || [mesh.position.x, mesh.position.y, mesh.position.z];
    const shapeType = options.shapeType || 'box';
    const dims = options.dimensions || [0.4, 0.4, 0.4];

    let shape: CANNON.Shape;
    if (shapeType === 'sphere') {
      shape = new CANNON.Sphere(dims[0]);
    } else if (shapeType === 'cylinder') {
      shape = new CANNON.Cylinder(dims[0], dims[0], dims[1] * 2, 12);
    } else {
      shape = new CANNON.Box(new CANNON.Vec3(dims[0], dims[1], dims[2]));
    }

    const body = new CANNON.Body({
      mass,
      shape,
      material: this.defaultMaterial,
      linearDamping: this.params.linearDamping,
      angularDamping: 0.3,
    });

    body.position.set(pos[0], pos[1], pos[2]);
    this.world.addBody(body);

    this.syncItems.set(id, {
      id,
      body,
      mesh,
      isFloatingInWater: options.isFloating ?? true,
      waterLevelY: options.waterLevelY ?? 0.6,
      buoyancyFactor: options.buoyancyFactor ?? 1.3,
      initialPos: [pos[0], pos[1], pos[2]],
    });

    return body;
  }

  /**
   * Applies an impulse / push force to an object (e.g., user interaction)
   */
  public applyForce(id: string, forceVector: [number, number, number], worldPoint?: [number, number, number]) {
    const item = this.syncItems.get(id);
    if (!item) return;

    const f = new CANNON.Vec3(forceVector[0], forceVector[1], forceVector[2]);
    const p = worldPoint
      ? new CANNON.Vec3(worldPoint[0], worldPoint[1], worldPoint[2])
      : item.body.position;
    item.body.applyImpulse(f, p);
  }

  /**
   * Reset position of a dynamic item back to its start
   */
  public resetBodyPosition(id: string, pos?: [number, number, number]) {
    const item = this.syncItems.get(id);
    if (!item) return;

    const target = pos || item.initialPos || [0, 3, 0];
    item.body.position.set(target[0], target[1], target[2]);
    item.body.velocity.set(0, 0, 0);
    item.body.angularVelocity.set(0, 0, 0);
    item.mesh.position.set(target[0], target[1], target[2]);
  }

  public removeBody(id: string) {
    const existing = this.syncItems.get(id);
    if (existing) {
      this.world.removeBody(existing.body);
      this.syncItems.delete(id);
    }
  }

  /**
   * Physics simulation step with hydrodynamic buoyancy calculation
   */
  public step(deltaTime: number) {
    // 1. Hydrodynamic Buoyancy and Water Viscosity for objects immersed in seawater
    const waterY = 0.6; // Basin water surface level

    this.syncItems.forEach((item) => {
      if (item.isFloatingInWater) {
        const body = item.body;
        const submergeDepth = waterY - body.position.y;

        if (submergeDepth > 0) {
          // Immersed in seawater
          // Upward Archimedean buoyant force: F = rho * g * V * multiplier
          const buoyancyForce =
            Math.abs(this.params.gravity) *
            body.mass *
            this.params.buoyancy *
            Math.min(submergeDepth + 0.5, 2.0);

          body.applyForce(new CANNON.Vec3(0, buoyancyForce, 0), body.position);

          // Hydrodynamic drag (water is more viscous than air)
          body.velocity.x *= 0.96;
          body.velocity.y *= 0.93;
          body.velocity.z *= 0.96;
          body.angularVelocity.scale(0.94, body.angularVelocity);
        }
      }
    });

    // 2. Step the Cannon physics world
    const fixedTimeStep = 1 / 60;
    const clampedDelta = Math.min(deltaTime, 0.1);
    this.world.step(fixedTimeStep, clampedDelta, 3);

    // 3. Synchronize Three.js visual meshes with physical bodies
    this.syncItems.forEach((item) => {
      item.mesh.position.set(item.body.position.x, item.body.position.y, item.body.position.z);
      item.mesh.quaternion.set(
        item.body.quaternion.x,
        item.body.quaternion.y,
        item.body.quaternion.z,
        item.body.quaternion.w
      );
    });
  }
}

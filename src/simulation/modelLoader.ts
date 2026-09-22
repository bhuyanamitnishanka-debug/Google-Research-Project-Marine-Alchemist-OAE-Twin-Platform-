import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export interface ModelParseResult {
  group: THREE.Group;
  vertexCount: number;
  triangleCount: number;
}

/**
 * Parses user-uploaded 3D model files (OBJ or FBX or text) into a Three.js Group.
 * Centers and normalizes the geometry bounds automatically for ideal initial rendering.
 */
export async function parseModelFile(file: File): Promise<ModelParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'obj') {
    const text = await file.text();
    const loader = new OBJLoader();
    const group = loader.parse(text);
    return postProcessModel(group);
  } else if (extension === 'fbx') {
    const buffer = await file.arrayBuffer();
    const loader = new FBXLoader();
    const group = loader.parse(buffer, '');
    return postProcessModel(group);
  } else {
    throw new Error(`Unsupported model format: .${extension}. Please upload an .obj or .fbx model.`);
  }
}

/**
 * Generates built-in research sample 3D models for immediate inspection and physics interaction
 */
export function createPresetResearchModel(type: 'oae_buoy' | 'sensor_pod' | 'diffuser_ring' | 'sample_cube'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'oae_buoy') {
    // Oceanographic spar buoy with antenna & ballast
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // safety amber
      roughness: 0.3,
      metalness: 0.4,
    });
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.4, 16), hullMat);
    hull.position.y = 0.7;
    hull.castShadow = true;
    group.add(hull);

    // Ballast bottom
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const ballast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16), ballastMat);
    ballast.position.y = 0.05;
    ballast.castShadow = true;
    group.add(ballast);

    // Mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    mast.position.y = 1.8;
    group.add(mast);

    // Strobe beacon
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 })
    );
    beacon.position.y = 2.4;
    group.add(beacon);
  } else if (type === 'diffuser_ring') {
    // Slurry diffuser vortex nozzle
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.7,
      roughness: 0.25,
    });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.18, 16, 32), ringMat);
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 0.2;
    torus.castShadow = true;
    group.add(torus);

    // Radial vanes
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.3, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      vane.position.set(Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4);
      vane.rotation.y = angle;
      group.add(vane);
    }
  } else if (type === 'sensor_pod') {
    // Autonomous underwater micro-sensor glider body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green
      roughness: 0.3,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 16, 16), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 1.8), wingMat);
    wing.position.set(0, 0.4, 0);
    group.add(wing);
  } else {
    // Mineral rock sample cube / block
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.6,
      metalness: 0.3,
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), blockMat);
    cube.position.y = 0.4;
    cube.castShadow = true;
    group.add(cube);
  }

  return group;
}

function postProcessModel(group: THREE.Group): ModelParseResult {
  let vertexCount = 0;
  let triangleCount = 0;

  // Compute bounding box to normalize scale and center pivot
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Center group children at origin
  group.position.x = -center.x;
  group.position.y = -box.min.y; // Sit on ground plane
  group.position.z = -center.z;

  // Fit within a reasonable 2m-3m bounding size if huge or minuscule
  const maxDim = Math.max(size.x, size.y, size.z);
  const targetSize = 2.2;
  const scaleMultiplier = maxDim > 0 ? targetSize / maxDim : 1;

  const wrapper = new THREE.Group();
  group.scale.setScalar(scaleMultiplier);
  wrapper.add(group);

  // Traverse meshes to ensure shadows, material visibility, and count vertices
  wrapper.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (mesh.geometry) {
        if (mesh.geometry.attributes.position) {
          vertexCount += mesh.geometry.attributes.position.count;
        }
        if (mesh.geometry.index) {
          triangleCount += mesh.geometry.index.count / 3;
        } else if (mesh.geometry.attributes.position) {
          triangleCount += mesh.geometry.attributes.position.count / 3;
        }
      }

      // Ensure material renders properly with default lighting
      if (!mesh.material) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.4,
          metalness: 0.3,
        });
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            mat.needsUpdate = true;
          }
        });
      }
    }
  });

  return {
    group: wrapper,
    vertexCount,
    triangleCount: Math.round(triangleCount),
  };
}

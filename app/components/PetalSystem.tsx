"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useScene } from "../lib/scene";

const petalVertex = `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vPhase;
  void main() {
    vPhase = aPhase;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + aPhase * 6.2831);
    gl_PointSize = aSize * (340.0 / -mvPosition.z) * twinkle;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const petalFragment = `
  varying float vPhase;
  uniform vec3 uTint;
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float radius = length(center);
    float edge = smoothstep(0.5, 0.16, radius);
    float streak = 1.0 - abs(center.y) * 1.4;
    vec3 color = uTint * (1.0 - radius * 0.4);
    float alpha = edge * (0.5 + 0.5 * streak) * (0.75 + 0.25 * sin(vPhase * 6.2831));
    gl_FragColor = vec4(color, alpha);
    if (alpha < 0.02) discard;
  }
`;

type PetalData = {
  count: number;
  positions: Float32Array;
  velocities: Float32Array;
  phases: Float32Array;
  sizes: Float32Array;
  lives: Float32Array;
};

function createPetals(count: number, cameraZ: number): PetalData {
  let seed = 8127;
  const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const lives = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 36;
    positions[index * 3 + 1] = random() * 9 + 1;
    positions[index * 3 + 2] = cameraZ - 40 + random() * 220;
    velocities[index * 3] = (random() - 0.5) * 0.6;
    velocities[index * 3 + 1] = -0.12 - random() * 0.3;
    velocities[index * 3 + 2] = -0.3 - random() * 0.9;
    phases[index] = random();
    sizes[index] = 0.9 + random() * 1.6;
    lives[index] = 0;
  }
  return { count, positions, velocities, phases, sizes, lives };
}

const ZONE_TINTS = [
  new THREE.Color("#9fd8ff"),
  new THREE.Color("#ffe3f0"),
  new THREE.Color("#7dffe6"),
  new THREE.Color("#ffd0e0"),
  new THREE.Color("#ffd9b8"),
];

export default function PetalSystem() {
  const store = useScene();
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useRef<THREE.BufferGeometry>(null);

  const petals = useMemo(() => {
    const isLowPower =
      typeof navigator !== "undefined" &&
      (typeof window === "undefined" || window.innerWidth < 980 ||
        (navigator.deviceMemory !== undefined && navigator.deviceMemory < 8));
    return createPetals(isLowPower ? 5200 : 15000, 0);
  }, []);

  const positionAttribute = useMemo(
    () => new THREE.BufferAttribute(petals.positions, 3),
    [petals],
  );

  const tintTarget = useMemo(() => new THREE.Color(ZONE_TINTS[0]), []);
  const tintCurrent = useMemo(() => new THREE.Color(ZONE_TINTS[0]), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const { positions, velocities, phases, lives, count } = petals;
    const cameraZ = store.current.cameraZ;
    const speed = Math.min(3, Math.abs(store.current.velocity) * 40);
    const pointerX = store.current.pointerX * 16;
    const pointerY = store.current.pointerY * 9 + 4;

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const x = positions[offset];
      const y = positions[offset + 1];
      const z = positions[offset + 2];

      if (lives[index] <= 0) {
        positions[offset] = ((index * 7919) % 1000) / 1000 * 36 - 18;
        positions[offset + 1] = 5 + ((index * 3571) % 1000) / 1000 * 8;
        positions[offset + 2] = cameraZ - 30 + ((index * 1163) % 1000) / 1000 * 240;
        velocities[offset] = (Math.sin(index) + 0.5) * 0.7;
        velocities[offset + 1] = -0.15 - (index % 7) * 0.05;
        velocities[offset + 2] = -0.4 - (index % 11) * 0.085;
        lives[index] = 1;
        continue;
      }

      const phase = phases[index] * Math.PI * 2;
      const windX = Math.sin(time * 0.4 + z * 0.013 + phase) * 1.1 + Math.sin(time * 0.9 + x * 0.05) * 0.35;
      const windZ = Math.cos(time * 0.32 + x * 0.017 + phase) * 0.7 - 0.4;
      const gust = speed * 2.2;

      const dx = pointerX - x;
      const dy = pointerY - y;
      const dd = Math.sqrt(dx * dx + dy * dy);
      const attraction = dd > 0.001 ? Math.min(0.05, 0.32 / (dd * dd)) : 0;

      velocities[offset] += (windX + dx * attraction) * dt * 1.4 - velocities[offset] * dt * 0.55;
      velocities[offset + 1] += (-0.4 + dy * attraction) * dt;
      velocities[offset + 2] += (windZ * 1.1 + gust * 0.12 - z * 0.0008) * dt - velocities[offset + 2] * dt * 0.24;

      positions[offset] += velocities[offset] * dt;
      positions[offset + 1] += velocities[offset + 1] * dt + Math.sin(time * 0.5 + phase) * dt * 0.35;
      positions[offset + 2] += velocities[offset + 2] * dt;

      lives[index] -= dt * 0.22;
    }

    positionAttribute.needsUpdate = true;

    const zoneIndex = Math.max(0, Math.min(ZONE_TINTS.length - 1, Math.round(store.current.zoneTransition * (ZONE_TINTS.length - 1))));
    tintTarget.copy(ZONE_TINTS[zoneIndex]);
    tintCurrent.lerp(tintTarget, 0.03);
    if (material.current) {
      material.current.uniforms.uTint.value.copy(tintCurrent);
      material.current.uniforms.uTime.value = time;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[petals.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[petals.sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[petals.phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={petalVertex}
        fragmentShader={petalFragment}
        uniforms={{
          uTime: { value: 0 },
          uTint: { value: tintCurrent },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
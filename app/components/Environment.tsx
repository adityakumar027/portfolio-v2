"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { generateEnvData } from "../lib/envData";
import { useScene } from "../lib/scene";
import { ZONES } from "../lib/spline";

const ZONE_SKY = ["#0a0f2e", "#1a0f3a", "#0d2a2a", "#1a0d2e", "#2a0d1a"];

const skyVertex = `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec3 vWorld;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 0.6 + 0.5, 0.0, 1.0);
    vec3 base = mix(uBottom, uTop, pow(h, 1.6));
    float star = step(0.9992, hash(floor(vWorld.xz * 3.0)));
    base += vec3(0.9, 0.95, 1.0) * star * pow(h, 2.0) * 0.6;
    gl_FragColor = vec4(base, 1.0);
  }
`;

const windowShader = `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vec2 cell = floor(vUv * 8.0);
    float lit = step(0.78, fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453));
    gl_FragColor = vec4(0.02, 0.04, 0.06, 1.0) + vec4(0.44, 0.95, 0.83, 1.0) * lit * 0.22;
  }
`;

function makeWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = "#02040a";
  context.fillRect(0, 0, 64, 64);
  let seed = 3737;
  const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let index = 0; index < 40; index += 1) {
    const x = Math.floor(random() * 8) * 8;
    const y = Math.floor(random() * 8) * 8;
    context.fillStyle = random() > 0.35 ? "#71f5d4" : "#fff3e0";
    context.globalAlpha = 0.22 + random() * 0.5;
    context.fillRect(x + 2, y + 2, 4, 4);
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

const scratchMatrix = new THREE.Matrix4();
const scratchScale = new THREE.Vector3();
const scratchPos = new THREE.Vector3();

export default function Environment() {
  const store = useScene();
  const skyMaterial = useRef<THREE.ShaderMaterial>(null);
  const skyTarget = useMemo(() => new THREE.Color(ZONE_SKY[0]), []);
  const skyCurrent = useMemo(() => new THREE.Color(ZONE_SKY[0]), []);

  const data = useMemo(() => generateEnvData(), []);

  const windowTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return makeWindowTexture();
  }, []);

  const buildings = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: "#070b12",
      roughness: 0.85,
      metalness: 0.15,
      emissive: "#71f5d4",
      emissiveMap: windowTexture ?? undefined,
      emissiveIntensity: 0.7,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, data.buildings.length);
    data.buildings.forEach((building, index) => {
      scratchPos.set(building.x, building.height / 2, building.z);
      scratchScale.set(building.width, building.height, building.depth);
      scratchMatrix.compose(scratchPos, THREE.Quaternion.IDENTITY, scratchScale);
      mesh.setMatrixAt(index, scratchMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [data, windowTexture]);

  const lanternMesh = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.16, 12, 12);
    const material = new THREE.MeshStandardMaterial({
      color: "#fef3e2",
      emissive: "#fdefc9",
      emissiveIntensity: 2.4,
      roughness: 0.4,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, data.lanterns.length);
    data.lanterns.forEach((lantern, index) => {
      scratchPos.set(lantern.x, lantern.y, lantern.z);
      scratchScale.setScalar(1);
      scratchMatrix.compose(scratchPos, THREE.Quaternion.IDENTITY, scratchScale);
      mesh.setMatrixAt(index, scratchMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [data]);

  const starPoints = useMemo(() => {
    const coordinates = new Float32Array(data.stars.length * 3);
    data.stars.forEach((star, index) => {
      coordinates[index * 3] = star.x;
      coordinates[index * 3 + 1] = star.y;
      coordinates[index * 3 + 2] = star.z;
    });
    return coordinates;
  }, [data]);

  useFrame(() => {
    const zoneIndex = Math.max(0, Math.min(ZONES.length - 1, Math.round(store.current.zoneTransition * (ZONES.length - 1))));
    skyTarget.set(ZONE_SKY[zoneIndex]);
    skyCurrent.lerp(skyTarget, 0.03);
    if (skyMaterial.current) {
      skyMaterial.current.uniforms.uTop.value.copy(skyCurrent);
    }
  });

  return (
    <>
      <mesh scale={[220, 220, 220]} renderOrder={-100}>
        <sphereGeometry args={[1, 24, 16]} />
        <shaderMaterial
          ref={skyMaterial}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
          uniforms={{ uTop: { value: skyCurrent }, uBottom: { value: new THREE.Color("#03050a") } }}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <points renderOrder={-90}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPoints, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d8f4ff" size={0.8} sizeAttenuation transparent opacity={0.7} depthWrite={false} fog={false} />
      </points>

      {[0, 1].map((moonIndex) => {
        const moon = data.moons[moonIndex];
        return (
          <mesh key={moonIndex} position={[moon.x, moon.y, moon.z]} renderOrder={-80}>
            <sphereGeometry args={[moon.radius, 24, 24]} />
            <meshBasicMaterial color="#f5e9ff" fog={false} />
          </mesh>
        );
      })}

      {data.torii && (
        <group position={[data.torii.x, 0, data.torii.z]}>
          <mesh position={[-data.torii.width / 2, data.torii.height / 2 - 0.6, 0]}>
            <boxGeometry args={[0.7, data.torii.height - 1.2, 0.7]} />
            <meshStandardMaterial color="#0d1119" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[data.torii.width / 2, data.torii.height / 2 - 0.6, 0]}>
            <boxGeometry args={[0.7, data.torii.height - 1.2, 0.7]} />
            <meshStandardMaterial color="#0d1119" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[0, data.torii.height - 0.7, 0]}>
            <boxGeometry args={[data.torii.width + 2.6, 1.05, 1.05]} />
            <meshStandardMaterial color="#10161f" emissive="#1d5a4c" emissiveIntensity={0.35} roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, data.torii.height - 2.1, 0]}>
            <boxGeometry args={[data.torii.width - 2.6, 0.5, 0.5]} />
            <meshStandardMaterial color="#10161f" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      )}

      <primitive object={buildings} />
      <primitive object={lanternMesh} />

      <pointLight position={[-34, 8, -60]} color="#71f5d4" intensity={6} distance={70} decay={2} />
      <pointLight position={[34, 8, -130]} color="#ff6b9d" intensity={4} distance={70} decay={2} />
      <pointLight position={[-30, 7, -230]} color="#8ab4ff" intensity={5} distance={70} decay={2} />
      <pointLight position={[28, 7, -320]} color="#fef3e2" intensity={5} distance={70} decay={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -190]}>
        <planeGeometry args={[240, 520]} />
        <meshStandardMaterial color="#04060b" roughness={0.95} metalness={0.05} />
      </mesh>
      <fog attach="fog" args={["#05070c", 24, 78]} />

      <mesh position={[0, -0.5, -190]} renderOrder={-60}>
        <planeGeometry args={[240, 520]} />
        <shaderMaterial fragmentShader={windowShader} vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}
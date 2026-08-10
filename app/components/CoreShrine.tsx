"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useScene } from "../lib/scene";

const haloVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const haloFragment = `
  varying vec2 vUv;
  void main() {
    vec2 point = vUv - 0.5;
    float radius = length(point);
    float broad = pow(max(0.0, 1.0 - radius * 1.72), 3.0);
    float core = pow(max(0.0, 1.0 - radius * 5.2), 2.2);
    vec3 color = mix(vec3(0.12, 0.55, 0.46), vec3(0.72, 1.0, 0.94), core);
    gl_FragColor = vec4(color * (broad + core * 0.55), (broad * 0.4 + core * 0.08));
  }
`;

const rimVertex = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const rimFragment = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 4.2);
    gl_FragColor = vec4(vec3(0.44, 1.0, 0.84) * rim, rim * 0.18);
  }
`;

const branchVertex = `
  attribute float aHeight;
  uniform float uBloom;
  varying float vHeight;
  void main() {
    vHeight = aHeight;
    vec3 pos = position;
    float pulse = sin(vHeight * 3.0 + uBloom * 6.2831) * 0.5 + 0.5;
    pos.y += pulse * 0.03 * uBloom;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const branchFragment = `
  uniform float uBloom;
  varying float vHeight;
  void main() {
    vec3 rose = vec3(1.0, 0.42, 0.62);
    vec3 teal = vec3(0.44, 1.0, 0.83);
    vec3 color = mix(rose, teal, clamp(vHeight * 0.5 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(color * (0.25 + uBloom), (0.3 + uBloom * 0.7) * 0.5);
  }
`;

type BranchLine = { from: THREE.Vector3; to: THREE.Vector3 };

function generateBranch(iterations: number, angle: number, stepLength: number, growth: number): BranchLine[] {
  const lines: BranchLine[] = [];
  let position = new THREE.Vector3(0, 0, 0);
  let direction = new THREE.Vector3(0, 1, 0);

  const draw = (depth: number) => {
    if (depth === 0) {
      const from = position.clone();
      const to = position.clone().addScaledVector(direction, stepLength);
      lines.push({ from, to });
      position.copy(to);
      return;
    }
    const saved = { position: position.clone(), direction: direction.clone() };
    draw(depth - 1);
    const left = saved.direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle * 0.4);
    const right = saved.direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -angle * 0.4);
    const branchLen = stepLength / growth;
    position.copy(saved.position);
    direction.copy(left).multiplyScalar(branchLen / stepLength);
    draw(depth - 1);
    position.copy(saved.position);
    direction.copy(right).multiplyScalar(branchLen / stepLength);
    draw(depth - 1);
    position.copy(saved.position);
    direction.copy(saved.direction);
  };

  draw(iterations);
  return lines;
}

export default function CoreShrine() {
  const store = useScene();
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const hoverLight = useRef<THREE.PointLight>(null);
  const bodyMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const shellMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const branchMaterial = useRef<THREE.ShaderMaterial>(null);
  const targetScale = useMemo(() => new THREE.Vector3(), []);

  const branchGeometry = useMemo(() => {
    const lines = generateBranch(4, 0.52, 1.35, 1.75);
    const count = lines.length;
    const positions = new Float32Array(count * 2 * 3);
    const heights = new Float32Array(count * 2);
    lines.forEach((line, index) => {
      positions[index * 6] = line.from.x;
      positions[index * 6 + 1] = line.from.y;
      positions[index * 6 + 2] = line.from.z;
      positions[index * 6 + 3] = line.to.x;
      positions[index * 6 + 4] = line.to.y;
      positions[index * 6 + 5] = line.to.z;
      heights[index * 2] = line.from.y * 0.35;
      heights[index * 2 + 1] = line.to.y * 0.35;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aHeight", new THREE.BufferAttribute(heights, 1));
    return geometry;
  }, []);

  useFrame((state, delta) => {
    if (!group.current || !body.current || !shell.current || !rings.current || !hoverLight.current || !bodyMaterial.current || !shellMaterial.current) return;
    const time = state.clock.elapsedTime;
    const pointerX = store.current.pointerX;
    const pointerY = store.current.pointerY;
    const nearShrine = store.current.cameraZ < -105 && store.current.cameraZ > -225;
    const corePointerX = (pointerX - 0.55) * (nearShrine ? 1 : 0.18);
    const corePointerY = (pointerY - 0.02) * (nearShrine ? 1 : 0.18);
    const pointerDistance = Math.sqrt((corePointerX / 0.55) ** 2 + (corePointerY / 0.72) ** 2);
    const hover = THREE.MathUtils.clamp(1 - pointerDistance, 0, 1);
    store.current.bloom = THREE.MathUtils.lerp(store.current.bloom, hover, 0.1);

    group.current.position.y = Math.sin(time * 0.38) * 0.045;
    group.current.rotation.y = Math.sin(time * 0.1) * 0.08;
    targetScale.setScalar(0.84 + hover * 0.014);
    group.current.scale.lerp(targetScale, 1 - Math.exp(-delta * 5));
    body.current.rotation.y += delta * 0.045;
    body.current.rotation.z += delta * 0.018;
    shell.current.rotation.x -= delta * 0.025;
    shell.current.rotation.y += delta * 0.06;
    rings.current.rotation.z += delta * 0.012;
    hoverLight.current.intensity = THREE.MathUtils.lerp(hoverLight.current.intensity, 5 + hover * 19, 0.1);
    bodyMaterial.current.emissiveIntensity = THREE.MathUtils.lerp(bodyMaterial.current.emissiveIntensity, 0.2 + hover * 0.16, 0.1);
    shellMaterial.current.emissiveIntensity = THREE.MathUtils.lerp(shellMaterial.current.emissiveIntensity, 0.72 + hover * 0.48, 0.1);
    shellMaterial.current.opacity = THREE.MathUtils.lerp(shellMaterial.current.opacity, 0.22 + hover * 0.08, 0.1);
    if (branchMaterial.current) {
      branchMaterial.current.uniforms.uBloom.value += (hover - branchMaterial.current.uniforms.uBloom.value) * 0.08;
    }
  });

  return (
    <group position={[0, 4.6, -160]}>
      <mesh position={[0, 0, -1.5]} scale={[5.8, 5.8, 1]} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial vertexShader={haloVertex} fragmentShader={haloFragment} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <group position={[0, -1.9, 0]}>
        <lineSegments geometry={branchGeometry} renderOrder={-1}>
          <shaderMaterial
            ref={branchMaterial}
            vertexShader={branchVertex}
            fragmentShader={branchFragment}
            uniforms={{ uBloom: { value: 0.2 } }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
        <pointLight position={[0, 1.6, 0.6]} color="#ff6b9d" intensity={2.2} distance={9} decay={2} />
      </group>

      <group ref={rings} rotation={[1.05, 0.2, 0.1]}>
        {[1.96, 2.26].map((radius, index) => (
          <mesh key={radius} rotation={[index * 0.7, index * 0.3, index * 0.5]}>
            <torusGeometry args={[radius, 0.009, 6, 150]} />
            <meshStandardMaterial color="#b3ffed" emissive="#21705f" emissiveIntensity={1.15} transparent opacity={index ? 0.13 : 0.22} roughness={0.25} metalness={0.68} />
          </mesh>
        ))}
      </group>

      <mesh ref={shell} scale={1.68}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial ref={shellMaterial} color="#b7ffed" emissive="#24695a" emissiveIntensity={0.72} transparent opacity={0.22} wireframe />
      </mesh>

      <mesh ref={body} scale={1.36} rotation={[0.16, 0.4, 0.08]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial ref={bodyMaterial} color="#07110e" emissive="#08251e" emissiveIntensity={0.2} metalness={0.9} roughness={0.24} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={1.35} flatShading />
      </mesh>

      <mesh scale={1.39} rotation={[0.16, 0.4, 0.08]}>
        <icosahedronGeometry args={[1, 2]} />
        <shaderMaterial vertexShader={rimVertex} fragmentShader={rimFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <pointLight ref={hoverLight} position={[1.7, 1.2, 2.4]} color="#eafffa" intensity={5} distance={5.5} decay={2} />
    </group>
  );
}
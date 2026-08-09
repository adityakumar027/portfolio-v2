"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
    gl_FragColor = vec4(color * (broad + core * 0.55), (broad * 0.2 + core * 0.04));
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
    gl_FragColor = vec4(vec3(0.44, 1.0, 0.84) * rim, rim * 0.08);
  }
`;

type PointerState = { current: { x: number; y: number } };

function Core({ pointer, scrollProgress }: { pointer: PointerState; scrollProgress: number }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const hoverLight = useRef<THREE.PointLight>(null);
  const bodyMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const shellMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const targetScale = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!group.current || !body.current || !shell.current || !rings.current || !hoverLight.current || !bodyMaterial.current || !shellMaterial.current) return;
    const time = state.clock.elapsedTime;
    const pointerX = pointer.current.x;
    const pointerY = pointer.current.y;
    const corePointerX = pointerX - 0.58;
    const corePointerY = pointerY - 0.02;
    const pointerDistance = Math.sqrt((corePointerX / 0.55) ** 2 + (corePointerY / 0.72) ** 2);
    const hover = THREE.MathUtils.clamp(1 - pointerDistance, 0, 1);

    const sp = scrollProgress;
    const targetX = THREE.MathUtils.lerp(2.82, 4.5, sp);
    // Scaled down significantly for subtleness
    const targetScaleVal = THREE.MathUtils.lerp(0.5, 0.35, sp); 

    group.current.position.y = Math.sin(time * 0.38) * 0.045;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.08);
    group.current.rotation.x = corePointerY * 0.018;
    group.current.rotation.y = corePointerX * 0.026;
    targetScale.setScalar(targetScaleVal + hover * 0.008);
    group.current.scale.lerp(targetScale, 1 - Math.exp(-delta * 5));
    body.current.rotation.y += delta * (0.045 + sp * 0.06);
    body.current.rotation.z += delta * 0.018;
    shell.current.rotation.x -= delta * 0.025;
    shell.current.rotation.y += delta * (0.06 + sp * 0.06);
    rings.current.rotation.z += delta * 0.012;
    
    // Reduced hover intensity to keep it ambient
    hoverLight.current.intensity = THREE.MathUtils.lerp(hoverLight.current.intensity, 2 + hover * 8, 0.1);
    bodyMaterial.current.emissiveIntensity = THREE.MathUtils.lerp(bodyMaterial.current.emissiveIntensity, 0.1 + hover * 0.08, 0.1);
    shellMaterial.current.emissiveIntensity = THREE.MathUtils.lerp(shellMaterial.current.emissiveIntensity, 0.35 + hover * 0.2, 0.1);
    shellMaterial.current.opacity = THREE.MathUtils.lerp(shellMaterial.current.opacity, 0.12 + hover * 0.05, 0.1);
  });

  return (
    <group ref={group} position={[2.82, 0.06, -1.5]} scale={0.5}>
      <mesh position={[0, 0, -1.5]} scale={[5.8, 5.8, 1]} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial vertexShader={haloVertex} fragmentShader={haloFragment} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <group ref={rings} rotation={[1.05, 0.2, 0.1]}>
        {[1.96, 2.26].map((radius, index) => (
          <mesh key={radius} rotation={[index * 0.7, index * 0.3, index * 0.5]}>
            <torusGeometry args={[radius, 0.009, 6, 150]} />
            <meshStandardMaterial color="#b3ffed" emissive="#21705f" emissiveIntensity={0.6} transparent opacity={index ? 0.08 : 0.12} roughness={0.25} metalness={0.68} />
          </mesh>
        ))}
      </group>

      <mesh ref={shell} scale={1.68}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial ref={shellMaterial} color="#b7ffed" emissive="#24695a" emissiveIntensity={0.35} transparent opacity={0.12} wireframe />
      </mesh>

      <mesh ref={body} scale={1.36} rotation={[0.16, 0.4, 0.08]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial ref={bodyMaterial} color="#07110e" emissive="#08251e" emissiveIntensity={0.1} metalness={0.9} roughness={0.24} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={1.35} flatShading />
      </mesh>

      <mesh scale={1.39} rotation={[0.16, 0.4, 0.08]}>
        <icosahedronGeometry args={[1, 2]} />
        <shaderMaterial vertexShader={rimVertex} fragmentShader={rimFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight ref={hoverLight} position={[1.7, 1.2, 2.4]} color="#eafffa" intensity={2} distance={5.5} decay={2} />
    </group>
  );
}

function Particles({ scrollProgress }: { scrollProgress: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(96 * 3);
    let seed = 901;
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let index = 0; index < data.length; index += 3) {
      data[index] = (random() - 0.5) * 17;
      data[index + 1] = (random() - 0.5) * 9;
      data[index + 2] = (random() - 0.5) * 8 - 1;
    }
    return data;
  }, []);

  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.004;
      // Lowered opacity for subtlety
      points.current.material.opacity = THREE.MathUtils.lerp(0.12, 0.02, scrollProgress);
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#a6f9e4" size={0.015} transparent opacity={0.12} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Scene({ pointer, scrollProgress }: { pointer: PointerState; scrollProgress: number }) {
  const bloomRef = useRef<any>(null);

  useFrame(() => {
    if (bloomRef.current) {
      // Significantly reduced bloom to keep the scene pushed back
      bloomRef.current.intensity = THREE.MathUtils.lerp(0.15, 0.05, scrollProgress);
    }
  });

  return (
    <>
      <fog attach="fog" args={["#070908", 6, 15]} />
      <ambientLight intensity={0.03} color="#b9fff0" />
      {/* Lowered light intensities */}
      <spotLight position={[-4, 5, 5]} color="#f0fffb" intensity={12} angle={0.4} penumbra={0.95} distance={15} decay={2} />
      <pointLight position={[4, -2, 3]} color="#1e7868" intensity={2} distance={10} decay={2} />
      <spotLight position={[4, 3, -3]} color="#71f5d4" intensity={18} angle={0.55} penumbra={1} distance={14} decay={2} />
      <Core pointer={pointer} scrollProgress={scrollProgress} />
      <Particles scrollProgress={scrollProgress} />
      <EffectComposer multisampling={0} resolutionScale={0.8}>
        <Bloom ref={bloomRef} intensity={0.15} luminanceThreshold={0.76} luminanceSmoothing={0.2} mipmapBlur />
        <Noise opacity={0.012} blendFunction={BlendFunction.SOFT_LIGHT} />
        <Vignette eskil={false} offset={0.2} darkness={0.58} />
      </EffectComposer>
    </>
  );
}

export default function CoreScene({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const [enabled] = useState(() => typeof window !== "undefined" && innerWidth > 980 && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [ready, setReady] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const trackPointer = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / innerWidth) * 2 - 1;
      pointer.current.y = -(event.clientY / innerHeight) * 2 + 1;
    };
    addEventListener("pointermove", trackPointer, { passive: true });
    return () => removeEventListener("pointermove", trackPointer);
  }, []);

  if (!enabled) return <div className="core-fallback" aria-hidden="true" />;

  return (
    <>
      <div className={ready ? "scene-loader is-ready" : "scene-loader"} aria-hidden="true">
        <span>INITIALIZING CORE</span><div><i style={{ transform: `scaleX(${ready ? 1 : 0.35})` }} /></div>
      </div>
      <div className="webgl-layer" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0, 7.4], fov: 43 }}
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.85; // Slightly lower exposure
            gl.outputColorSpace = THREE.SRGBColorSpace;
            requestAnimationFrame(() => setReady(true));
          }}
        >
          <Suspense fallback={null}><Scene pointer={pointer} scrollProgress={scrollProgress} /></Suspense>
        </Canvas>
      </div>
    </>
  );
}
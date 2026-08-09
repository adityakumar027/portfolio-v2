"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";

function AmbientFluid({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;
    
    // Slow, fluid rotation
    meshRef.current.rotation.x += delta * 0.05;
    meshRef.current.rotation.y += delta * 0.08;
    meshRef.current.rotation.z += delta * 0.03;

    // React to scroll (moves up and fades slightly as you scroll down)
    meshRef.current.position.y = THREE.MathUtils.lerp(0, 3, scrollProgress);
    materialRef.current.opacity = THREE.MathUtils.lerp(0.4, 0.1, scrollProgress);
  });

  return (
    <mesh ref={meshRef} position={[2, 0, -2]} scale={4.5}>
      <icosahedronGeometry args={[1, 16]} />
      <meshPhysicalMaterial 
        ref={materialRef}
        color="#0a1f1a"
        emissive="#123a30"
        emissiveIntensity={0.8}
        roughness={0.1}
        metalness={0.8}
        transparent
        opacity={0.4}
        wireframe={false}
      />
    </mesh>
  );
}

export default function CoreScene({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const [enabled] = useState(() => typeof window !== "undefined" && innerWidth > 980 && !matchMedia("(prefers-reduced-motion: reduce)").matches);

  if (!enabled) return null;

  return (
    <div className="webgl-layer" aria-hidden="true" style={{ filter: 'blur(60px)' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: false, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} color="#ffffff" />
          <spotLight position={[-5, 5, 5]} color="#E8A838" intensity={15} distance={20} penumbra={1} />
          <spotLight position={[5, -5, 2]} color="#71f5d4" intensity={20} distance={20} penumbra={1} />
          
          <AmbientFluid scrollProgress={scrollProgress} />
          
          <EffectComposer>
            <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
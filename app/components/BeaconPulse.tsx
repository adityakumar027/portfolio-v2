"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "../lib/scene";

export default function BeaconPulse() {
  const store = useScene();
  const ring = useRef<THREE.Mesh>(null);
  const startRef = useRef(0);

  useFrame((state) => {
    if (store.current.burst) {
      startRef.current = state.clock.elapsedTime;
      store.current.burst = null;
    }
    if (startRef.current > 0 && ring.current) {
      const elapsed = state.clock.elapsedTime - startRef.current;
      if (elapsed < 0.8) {
        const progress = elapsed / 0.8;
        const eased = 1 - Math.pow(1 - progress, 3);
        ring.current.scale.setScalar(1 + eased * 4.5);
        const material = ring.current.material as THREE.MeshBasicMaterial;
        material.opacity = (1 - progress) * 0.9;
        ring.current.visible = true;
      } else {
        ring.current.visible = false;
        startRef.current = 0;
      }
    }
  });

  return (
    <mesh ref={ring} position={[0, 1.9, -340]} visible={false} renderOrder={10}>
      <torusGeometry args={[1.1, 0.015, 8, 90]} />
      <meshBasicMaterial color="#71f5d4" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}
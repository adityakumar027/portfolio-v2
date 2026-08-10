"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Journey } from "../lib/spline";
import { useScene } from "../lib/scene";

type SplineControllerProps = {
  journey: Journey;
};

const scratchPosition = new THREE.Vector3();

export default function SplineController({ journey }: SplineControllerProps) {
  const store = useScene();

  useFrame((state, delta) => {
    const t = store.current.t;
    const { position, lookAt } = journey.getAt(t);
    scratchPosition.lerpVectors(state.camera.position, position, 1 - Math.exp(-delta * 8));
    state.camera.position.copy(scratchPosition);
    state.camera.lookAt(lookAt);
    store.current.cameraZ = state.camera.position.z;
  });

  return null;
}
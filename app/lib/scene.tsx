"use client";

import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";

export type SceneStore = {
  cameraZ: number;
  t: number;
  pointerX: number;
  pointerY: number;
  velocity: number;
  bloom: number;
  zoneTransition: number;
  burst: ((x: number, y: number, z: number) => void) | null;
};

export const defaultSceneStore = (): SceneStore => ({
  cameraZ: 0,
  t: 0,
  pointerX: 0,
  pointerY: 0,
  velocity: 0,
  bloom: 0,
  zoneTransition: 0,
  burst: null,
});

export const SceneContext = createContext<MutableRefObject<SceneStore> | null>(null);

export function useScene() {
  const store = useContext(SceneContext);
  if (!store) throw new Error("useScene must be used inside SceneProvider");
  return store;
}
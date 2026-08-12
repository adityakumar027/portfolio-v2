"use client";

import SceneCanvas from "./components/SceneCanvas";
import HUD from "./components/HUD";
import { useAudio } from "./hooks/useAudio";

export default function Home() {
  const { enabled, toggle, rustle, ping } = useAudio();

  return (
    <div>
      <SceneCanvas />
      <HUD activeZone="approach" progress={1} audioEnabled={enabled} onToggleAudio={ () => toggle() } />
    </div>
  );
}
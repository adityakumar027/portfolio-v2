export type Building = {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
};

export type Lantern = {
  x: number;
  y: number;
  z: number;
};

export type Star = {
  x: number;
  y: number;
  z: number;
  size: number;
};

export type EnvData = {
  buildings: Building[];
  lanterns: Lantern[];
  stars: Star[];
  moons: { x: number; y: number; z: number; radius: number }[];
  torii: { x: number; z: number; width: number; height: number } | null;
};

const seedRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

export function generateEnvData(): EnvData {
  const random = seedRandom(9029);

  const buildings: Building[] = [];
  const buildingZ = (index: number) => -8 - index * 4.6;
  for (let index = 0; index < 84; index += 1) {
    const side = random() > 0.5 ? 1 : -1;
    const z = buildingZ(index) + (random() - 0.5) * 3;
    buildings.push({
      x: side * (19 + random() * 36),
      z,
      width: 1.6 + random() * 3,
      height: 5 + random() * 29,
      depth: 6 + random() * 9,
    });
  }

  const lanterns: Lantern[] = [];
  for (let index = 0; index < 14; index += 1) {
    const z = -34 - index * 6.8;
    lanterns.push({ x: -3.4, y: 3.5, z });
    lanterns.push({ x: 3.4, y: 3.5, z });
  }

  const stars: Star[] = [];
  for (let index = 0; index < 260; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = random() * Math.PI * 0.42;
    const radius = 175;
    stars.push({
      x: Math.sin(phi) * Math.cos(theta) * radius,
      y: Math.cos(phi) * radius * 0.85 + 8,
      z: Math.sin(phi) * Math.sin(theta) * radius * 0.9 - 190,
      size: 0.35 + random() * 0.9,
    });
  }

  const moons = [
    { x: -26, y: 24, z: -368, radius: 4.6 },
    { x: -16, y: 18, z: -334, radius: 2.4 },
  ];

  const torii = { x: 0, z: -10, width: 8.4, height: 9.5 };

  return { buildings, lanterns, stars, moons, torii };
}
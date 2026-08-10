export type AudioEngine = {
  toggle(on: boolean): void;
  rustle(intensity: number): void;
  ping(): void;
  dispose(): void;
};

export function createAudioEngine(): AudioEngine {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const humOscillator = context.createOscillator();
  humOscillator.type = "sine";
  humOscillator.frequency.value = 40;
  const humGain = context.createGain();
  humGain.gain.value = 0.6;
  humOscillator.connect(humGain).connect(master);

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let noiseSeed = 5521;
  const random = () => ((noiseSeed = (noiseSeed * 9301 + 49297) % 233280) / 233280);
  for (let index = 0; index < noiseData.length; index += 1) {
    noiseData[index] = random() * 2 - 1;
  }
  const noiseSource = context.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const windFilter = context.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.6;
  const windGain = context.createGain();
  windGain.gain.value = 0.12;
  noiseSource.connect(windFilter).connect(windGain).connect(master);

  humOscillator.start();
  noiseSource.start();

  let enabled = false;

  return {
    toggle(on: boolean) {
      enabled = on;
      if (context.state === "suspended") void context.resume();
      master.gain.linearRampToValueAtTime(on ? 0.12 : 0, context.currentTime + 0.6);
    },
    rustle(intensity: number) {
      if (!enabled || intensity < 0.3) return;
      const burst = context.createBufferSource();
      burst.buffer = noiseBuffer;
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1200;
      const gain = context.createGain();
      const now = context.currentTime;
      gain.gain.setValueAtTime(Math.min(0.22, intensity * 0.09), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      burst.connect(filter).connect(gain).connect(master);
      burst.start(now);
      burst.stop(now + 0.4);
    },
    ping() {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      const now = context.currentTime;
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      oscillator.connect(gain).connect(master);
      oscillator.start(now);
      oscillator.stop(now + 0.36);
    },
    dispose() {
      humOscillator.stop();
      noiseSource.stop();
      void context.close();
    },
  };
}
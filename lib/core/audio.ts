// ──────────────────────────────────────────────────────────────
// Web Audio API synthesizer — zero external assets
// All sounds are generated programmatically
// ──────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isEnabled = true;

/**
 * Lazy-initialize AudioContext on first user interaction
 * (Chrome autoplay policy compliance).
 */
function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.3;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getGain(): GainNode {
  getContext();
  return masterGain!;
}

/**
 * Set master volume (0–1).
 */
export function setVolume(vol: number): void {
  const gain = getGain();
  gain.gain.value = Math.max(0, Math.min(1, vol));
}

/**
 * Enable/disable all audio.
 */
export function setEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

/**
 * Helper: play a tone with ADSR envelope.
 */
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  detune: number = 0
): void {
  if (!isEnabled) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(env);
  env.connect(getGain());

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Soft acoustic click for valid keypresses.
 */
export function playKeypressClick(): void {
  playTone(800, 0.06, 'triangle', 0.08);
}

/**
 * Low-frequency buzz/thud for mistypes.
 */
export function playMistypeThud(): void {
  if (!isEnabled) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = 80;

  env.gain.setValueAtTime(0.12, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(env);
  env.connect(getGain());

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Ascending pitch chime for completed words.
 */
export function playWordComplete(): void {
  playTone(523, 0.12, 'sine', 0.1); // C5
  setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 50); // E5
}

/**
 * Multi-tone chord arpeggio for destroyed sentences.
 */
export function playSentenceDestroy(): void {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.12), i * 60);
  });
}

/**
 * Heavy bass rumble when a sentence hits the danger line.
 */
export function playSentenceDrop(): void {
  if (!isEnabled) return;
  const ctx = getContext();

  // Bass rumble
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

  env.gain.setValueAtTime(0.25, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  osc.connect(env);
  env.connect(getGain());
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);

  // Noise burst
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseEnv = ctx.createGain();
  noiseEnv.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseEnv.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  noise.connect(noiseEnv);
  noiseEnv.connect(getGain());
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.15);
}

/**
 * UI click for button presses.
 */
export function playUIClick(): void {
  playTone(600, 0.04, 'triangle', 0.06);
}

/**
 * Game start jingle.
 */
export function playGameStart(): void {
  const notes = [392, 523, 659, 784]; // G4, C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.1), i * 100);
  });
}

/**
 * Game over sound.
 */
export function playGameOver(): void {
  const notes = [523, 466, 392, 330]; // C5, Bb4, G4, E4 (descending)
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.1), i * 150);
  });
}

/**
 * Victory fanfare.
 */
export function playVictory(): void {
  const notes = [523, 659, 784, 1047, 1047]; // C5 E5 G5 C6 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'triangle', 0.12), i * 120);
  });
}

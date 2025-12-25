import { loadSettings } from '@/lib/storage';

type FeedbackEvent =
  | 'key'
  | 'delete'
  | 'submit'
  | 'error'
  | 'solved'
  | 'win'
  | 'lose';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

async function ensureAudioRunning(ctx: AudioContext) {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
    }
  }
}

function beep(ctx: AudioContext, opts: { freq: number; durationMs: number; type?: OscillatorType; gain?: number; when?: number }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  const type = opts.type ?? 'sine';
  const gain = opts.gain ?? 0.03;
  const t0 = (opts.when ?? ctx.currentTime);
  const t1 = t0 + opts.durationMs / 1000;

  osc.type = type;
  osc.frequency.setValueAtTime(opts.freq, t0);

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t1 + 0.01);
}

function vibrate(pattern: number | number[]) {
  if (typeof window === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
  }
}

export async function triggerFeedback(event: FeedbackEvent) {
  const settings = loadSettings();

  if (settings.feedbackEnabled) {
    switch (event) {
      case 'key':
        vibrate(10);
        break;
      case 'delete':
        vibrate(15);
        break;
      case 'submit':
        vibrate(25);
        break;
      case 'error':
        vibrate([50, 30, 50]);
        break;
      case 'solved':
        vibrate([20, 20, 35]);
        break;
      case 'win':
        vibrate([30, 20, 30, 20, 70]);
        break;
      case 'lose':
        vibrate([60, 30, 25]);
        break;
    }
  }

  if (!settings.feedbackEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  await ensureAudioRunning(ctx);

  const now = ctx.currentTime;
  switch (event) {
    case 'key':
      beep(ctx, { freq: 720, durationMs: 14, type: 'square', gain: 0.015, when: now });
      break;
    case 'delete':
      beep(ctx, { freq: 240, durationMs: 28, type: 'triangle', gain: 0.02, when: now });
      break;
    case 'submit':
      beep(ctx, { freq: 520, durationMs: 60, type: 'sine', gain: 0.03, when: now });
      break;
    case 'error':
      beep(ctx, { freq: 140, durationMs: 120, type: 'sawtooth', gain: 0.035, when: now });
      break;
    case 'solved':
      beep(ctx, { freq: 660, durationMs: 70, type: 'sine', gain: 0.03, when: now });
      beep(ctx, { freq: 880, durationMs: 90, type: 'sine', gain: 0.03, when: now + 0.08 });
      break;
    case 'win':
      beep(ctx, { freq: 523, durationMs: 90, type: 'sine', gain: 0.03, when: now });
      beep(ctx, { freq: 659, durationMs: 90, type: 'sine', gain: 0.03, when: now + 0.10 });
      beep(ctx, { freq: 784, durationMs: 120, type: 'sine', gain: 0.03, when: now + 0.20 });
      break;
    case 'lose':
      beep(ctx, { freq: 380, durationMs: 120, type: 'triangle', gain: 0.03, when: now });
      beep(ctx, { freq: 280, durationMs: 140, type: 'triangle', gain: 0.03, when: now + 0.12 });
      beep(ctx, { freq: 190, durationMs: 180, type: 'triangle', gain: 0.03, when: now + 0.26 });
      break;
  }
}

export async function primeFeedback() {
  const settings = loadSettings();
  if (!settings.feedbackEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  await ensureAudioRunning(ctx);
}



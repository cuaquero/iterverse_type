// A gentle "time's up" cue for Kiosk mode and Tap Mode — synthesized with
// the Web Audio API rather than a shipped sound file, since it's just a
// couple of soft sine tones. Deliberately understated (no siren, no sharp
// beep): a two-note rising chime, low volume, smooth attack/decay so there
// is no click at the start or end of each note.
let audioCtx = null;

const getAudioContext = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const playTone = (ctx, frequency, startTime, duration) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

export const playTimeUpChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 587.33, now, 0.18); // D5
    playTone(ctx, 783.99, now + 0.15, 0.24); // G5
  } catch {
    // Web Audio unsupported or blocked — the chime is a nice-to-have, so
    // fail silently rather than interrupt the session-end flow.
  }
};

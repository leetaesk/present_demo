import { getAudioContext } from "./context";

export type CueType = "filler" | "fast" | "slow" | "section" | "pause";

export const soundCue = {
  play(type: CueType) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case "filler":
        tone(ctx, 880, 880, now, 0.08);
        break;
      case "fast":
        tone(ctx, 440, 880, now, 0.15);
        break;
      case "slow":
        tone(ctx, 880, 440, now, 0.15);
        break;
      case "section":
        tone(ctx, 220, 220, now, 0.5);
        break;
      case "pause":
        tone(ctx, 220, 220, now, 0.15);
        tone(ctx, 220, 220, now + 0.22, 0.15);
        break;
    }
  },
};

function tone(
  ctx: AudioContext,
  startHz: number,
  endHz: number,
  at: number,
  dur: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.setValueAtTime(startHz, at);
  if (startHz !== endHz) {
    osc.frequency.linearRampToValueAtTime(endHz, at + dur);
  }

  gain.gain.setValueAtTime(0.3, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + dur);

  osc.start(at);
  osc.stop(at + dur);
}

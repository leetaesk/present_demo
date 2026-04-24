let instance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!instance) {
    instance = new AudioContext({ sampleRate: 16000 });
  }
  return instance;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

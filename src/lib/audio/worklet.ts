import { getAudioContext } from './context';

export interface AudioPipeline {
  stop: () => void;
}

export async function startAudioPipeline(
  onChunk: (chunk: ArrayBuffer) => void,
): Promise<AudioPipeline> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  await ctx.audioWorklet.addModule('/audio-worklet.js');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
    video: false,
  });

  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'pcm16-processor');
  node.port.onmessage = (e) => onChunk(e.data as ArrayBuffer);
  source.connect(node);

  return {
    stop: () => {
      source.disconnect();
      node.disconnect();
      node.port.onmessage = null;
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

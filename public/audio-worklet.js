class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);
    this.targetLength = 1600;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    const merged = new Float32Array(this.buffer.length + channel.length);
    merged.set(this.buffer, 0);
    merged.set(channel, this.buffer.length);
    this.buffer = merged;

    while (this.buffer.length >= this.targetLength) {
      const chunk = this.buffer.subarray(0, this.targetLength);
      const pcm16 = new Int16Array(this.targetLength);
      for (let i = 0; i < this.targetLength; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
      this.buffer = this.buffer.slice(this.targetLength);
    }

    return true;
  }
}

registerProcessor('pcm16-processor', PCM16Processor);

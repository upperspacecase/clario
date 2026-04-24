// AudioWorklet: takes browser-native sample-rate mono input, averages +
// decimates down to 16 kHz, converts to PCM16 LE, and posts raw frames
// (~40 ms = 640 samples, 1280 bytes) as transferable ArrayBuffers to
// the main thread. The main thread does base64 + WS send.
//
// Note: `btoa` is NOT available inside AudioWorkletGlobalScope.
// Encoding happens on the main thread.

class Pcm16Encoder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inRate = sampleRate; // global in worklet scope
    this.outRate = 16000;
    this.ratio = this.inRate / this.outRate;
    this.samplesPerChunk = 640; // 40 ms at 16 kHz
    this.accumulator = [];
    this.decimateSum = 0;
    this.decimateCount = 0;
    this.decimateProgress = 0;
  }

  floatToPcm16(float32) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  rms(float32) {
    let s = 0;
    for (let i = 0; i < float32.length; i++) s += float32[i] * float32[i];
    return Math.sqrt(s / float32.length);
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const mono = input[0];
    if (mono.length === 0) return true;

    this.port.postMessage({ type: "level", value: this.rms(mono) });

    for (let i = 0; i < mono.length; i++) {
      this.decimateSum += mono[i];
      this.decimateCount++;
      this.decimateProgress += 1;
      if (this.decimateProgress >= this.ratio) {
        this.accumulator.push(this.decimateSum / this.decimateCount);
        this.decimateSum = 0;
        this.decimateCount = 0;
        this.decimateProgress -= this.ratio;
      }
    }

    while (this.accumulator.length >= this.samplesPerChunk) {
      const chunk = this.accumulator.splice(0, this.samplesPerChunk);
      const pcm = this.floatToPcm16(chunk);
      // Send the raw backing ArrayBuffer as a transferable (zero-copy).
      this.port.postMessage(
        { type: "audio", buffer: pcm.buffer },
        [pcm.buffer]
      );
    }
    return true;
  }
}

registerProcessor("pcm16-encoder", Pcm16Encoder);

// AudioWorklet: resamples the mic to 16 kHz mono PCM16 LE and posts
// base64-encoded chunks ~every 40 ms to the main thread.
// Also emits a lightweight RMS level every frame for the UI meter.

class Pcm16Encoder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.samplesPerChunk = 16000 * 0.04; // 40 ms at 16 kHz = 640 samples
    this.ratio = sampleRate / 16000; // browser sampleRate is global
    this.readIndex = 0;
  }

  downsample(input) {
    // Linear decimation — fine for speech, bounded quality acceptable for demo.
    const out = [];
    let i = 0;
    while (i < input.length) {
      const idx = Math.floor(i);
      if (idx >= input.length) break;
      out.push(input[idx]);
      i += this.ratio;
    }
    return out;
  }

  floatTo16BE(float32) {
    // PCM16 little-endian
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  base64(int16) {
    const bytes = new Uint8Array(int16.buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, Math.min(i + chunk, bytes.length))
      );
    }
    return btoa(binary);
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

    // Emit level for UI
    this.port.postMessage({ type: "level", value: this.rms(mono) });

    // Downsample to 16 kHz and buffer
    const down = this.downsample(mono);
    for (let i = 0; i < down.length; i++) this.buffer.push(down[i]);

    while (this.buffer.length >= this.samplesPerChunk) {
      const chunk = this.buffer.splice(0, this.samplesPerChunk);
      const pcm = this.floatTo16BE(chunk);
      const b64 = this.base64(pcm);
      this.port.postMessage({ type: "audio", data: b64 });
    }
    return true;
  }
}

registerProcessor("pcm16-encoder", Pcm16Encoder);

// μ-law (G.711) <-> PCM16 conversion + naive resampling.
// Twilio Media Streams: μ-law 8kHz mono, 20ms frames (160 bytes).
// Gemini Live: PCM16 LE, 16kHz in / 24kHz out.

const BIAS = 0x84;
const CLIP = 32635;

export function mulawDecodeSample(u: number): number {
  u = ~u & 0xff;
  const sign = u & 0x80;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  let sample = ((mantissa << 3) + BIAS) << exponent;
  sample -= BIAS;
  return sign ? -sample : sample;
}

export function mulawEncodeSample(pcm: number): number {
  const sign = pcm < 0 ? 0x80 : 0;
  let abs = pcm < 0 ? -pcm : pcm;
  if (abs > CLIP) abs = CLIP;
  abs += BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (abs & mask) === 0 && exponent > 0; mask >>= 1) exponent--;
  const mantissa = (abs >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

// μ-law 8kHz bytes → PCM16 16kHz LE bytes (upsample 2x by sample duplication).
export function mulaw8kToPcm16k(mulaw: Buffer): Buffer {
  const out = Buffer.alloc(mulaw.length * 4); // 1 byte → 2 samples × 2 bytes
  for (let i = 0; i < mulaw.length; i++) {
    const s = mulawDecodeSample(mulaw[i]);
    out.writeInt16LE(s, i * 4);
    out.writeInt16LE(s, i * 4 + 2);
  }
  return out;
}

// PCM16 24kHz LE bytes → μ-law 8kHz bytes (downsample 3x by decimation).
// Naive: take every 3rd sample. For a test call this is fine; if it sounds
// aliased we can add a low-pass filter.
export function pcm24kToMulaw8k(pcm: Buffer): Buffer {
  const numSamples = pcm.length / 2;
  const outLen = Math.floor(numSamples / 3);
  const out = Buffer.alloc(outLen);
  for (let i = 0; i < outLen; i++) {
    const sample = pcm.readInt16LE(i * 3 * 2);
    out[i] = mulawEncodeSample(sample);
  }
  return out;
}

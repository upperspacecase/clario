// Playback queue for PCM16 24 kHz LE audio from the Gemini Live API.
// Schedules AudioBufferSourceNodes back-to-back so there are no gaps.
// On barge-in (server says interrupted), flushes anything unplayed.

export class PlaybackQueue {
  private ctx: AudioContext;
  private nextStart = 0;
  private sources: AudioBufferSourceNode[] = [];
  private gain: GainNode;
  private outputSampleRate = 24000;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gain = ctx.createGain();
    this.gain.gain.value = 1.0;
    this.gain.connect(ctx.destination);
  }

  private base64ToInt16(b64: string): Int16Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  }

  enqueue(b64: string) {
    const pcm = this.base64ToInt16(b64);
    if (pcm.length === 0) return;

    const buf = this.ctx.createBuffer(1, pcm.length, this.outputSampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gain);

    const now = this.ctx.currentTime;
    const start = Math.max(now, this.nextStart);
    src.start(start);

    this.nextStart = start + buf.duration;
    this.sources.push(src);

    src.onended = () => {
      this.sources = this.sources.filter((s) => s !== src);
    };
  }

  flush() {
    // Barge-in: stop all scheduled sources immediately.
    for (const s of this.sources) {
      try {
        s.stop();
        s.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.sources = [];
    this.nextStart = this.ctx.currentTime;
  }

  async close() {
    this.flush();
    try {
      await this.ctx.close();
    } catch {
      /* ignore */
    }
  }
}

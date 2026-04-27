export type WakeLockHandle = { release: () => Promise<void> };

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
}

interface WakeLockApi {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
}

export async function acquireWakeLock(): Promise<WakeLockHandle | null> {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { wakeLock?: WakeLockApi };
  if (!("wakeLock" in nav) || !nav.wakeLock) return null;
  try {
    const sentinel = await nav.wakeLock.request("screen");
    return {
      release: async () => {
        try {
          if (!sentinel.released) await sentinel.release();
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return null;
  }
}

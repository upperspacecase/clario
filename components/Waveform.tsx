"use client";

import { AbsoluteFill, useCurrentFrame } from "remotion";

const BAR_COUNT = 23;
const FPS = 30;

export const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = (BAR_COUNT - 1) / 2;
    const distFromCenter = Math.abs(i - center) / center;
    const envelope = Math.pow(1 - distFromCenter, 1.6);
    const wobble =
      0.55 + 0.45 * Math.sin(t * 3.1 + i * 0.7) * Math.cos(t * 1.3 + i * 0.2);
    const amp = Math.max(0.08, envelope * wobble);
    return amp;
  });

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 460 120"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <g>
          {bars.map((amp, i) => {
            const barWidth = 8;
            const gap = 12;
            const totalW = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
            const startX = (460 - totalW) / 2;
            const x = startX + i * (barWidth + gap);
            const h = amp * 100;
            const y = 60 - h / 2;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={4}
                fill="#A28A43"
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const WaveformStill: React.FC = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 460 120"
    preserveAspectRatio="xMidYMid meet"
    style={{ display: "block" }}
    aria-hidden="true"
  >
    <g fill="#A28A43">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const center = (BAR_COUNT - 1) / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const envelope = Math.pow(1 - distFromCenter, 1.6);
        const amp = Math.max(0.12, envelope * 0.82);
        const barWidth = 8;
        const gap = 12;
        const totalW = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
        const startX = (460 - totalW) / 2;
        const x = startX + i * (barWidth + gap);
        const h = amp * 100;
        const y = 60 - h / 2;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx={4} />;
      })}
    </g>
  </svg>
);

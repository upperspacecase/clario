"use client";

import dynamic from "next/dynamic";
import { Waveform, WaveformStill } from "./Waveform";

const Player = dynamic(
  () => import("@remotion/player").then((mod) => mod.Player),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <WaveformStill />
      </div>
    ),
  }
);

export const WaveformPlayer: React.FC = () => {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: "460 / 120" }}
      aria-hidden="true"
    >
      <Player
        component={Waveform}
        durationInFrames={360}
        compositionWidth={460}
        compositionHeight={120}
        fps={30}
        autoPlay
        loop
        controls={false}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      />
    </div>
  );
};

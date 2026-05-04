"use client";

import { Signal, Wifi, BatteryMedium } from "lucide-react";
import { PhoneStage } from "./PhoneStage";
import { PhoneSteps } from "./PhoneSteps";

type Step = 1 | 2 | 3;

interface Props {
  current: Step;
  done?: boolean;
  children: React.ReactNode;
}

export const PhoneScreenWrap: React.FC<Props> = ({
  current,
  done,
  children,
}) => {
  return (
    <PhoneStage>
      <div
        className="flex h-full w-full flex-col"
        style={{ background: "#0a0a0a", color: "#fff" }}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-1 text-[13px] font-bold text-white">
          <span>9:41</span>
          <div className="flex items-center gap-1" aria-hidden>
            <Signal size={13} strokeWidth={2.5} />
            <Wifi size={13} strokeWidth={2.5} />
            <BatteryMedium size={18} strokeWidth={2.2} />
          </div>
        </div>
        <PhoneSteps current={current} done={done} />
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </PhoneStage>
  );
};

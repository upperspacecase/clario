"use client";

import { useEffect, useRef } from "react";
import { IPhoneMockup } from "./ui/iphone-mockup";

const NATURAL_WIDTH = 417;

export const PhoneStage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const scale = Math.min(1, el.clientWidth / NATURAL_WIDTH);
      el.style.setProperty("--phone-scale", String(scale));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="phone-frame">
      <div className="phone-stage">
        <IPhoneMockup
          model="14-pro"
          color="space-black"
          screenBg="#0a0a0a"
          safeAreaOverrides={{ top: 34, bottom: 10 }}
        >
          {children}
        </IPhoneMockup>
      </div>
    </div>
  );
};

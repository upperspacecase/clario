"use client";

import { IPhoneMockup } from "./ui/iphone-mockup";
import { CallScreen } from "./CallScreen";

export const PhoneStage: React.FC = () => {
  return (
    <div className="relative mx-auto w-full max-w-[440px] overflow-visible">
      {/* Responsive scale: natural size is 417x876. We scale to fit the
         container width; transformOrigin sits top-center so the phone
         stays centered and the stage height matches the scaled height. */}
      <div
        className="phone-stage"
        style={{
          width: 417,
          height: 876,
          transformOrigin: "top center",
          margin: "0 auto",
        }}
      >
        <IPhoneMockup
          model="14-pro"
          color="space-black"
          screenBg="var(--bg-cream)"
          safeAreaOverrides={{ top: 34, bottom: 10 }}
        >
          <CallScreen />
        </IPhoneMockup>
      </div>
    </div>
  );
};

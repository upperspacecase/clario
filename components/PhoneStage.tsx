"use client";

import { IPhoneMockup } from "./ui/iphone-mockup";
import { CallScreen, type CallScreenProps } from "./CallScreen";

export const PhoneStage: React.FC<CallScreenProps> = (props) => {
  return (
    <div className="relative mx-auto w-full max-w-[440px] overflow-visible">
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
          <CallScreen {...props} />
        </IPhoneMockup>
      </div>
    </div>
  );
};

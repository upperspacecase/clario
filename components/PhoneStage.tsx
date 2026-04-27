"use client";

import { IPhoneMockup } from "./ui/iphone-mockup";
import { CallScreen, type CallScreenProps } from "./CallScreen";

export const PhoneStage: React.FC<CallScreenProps> = (props) => {
  return (
    <div className="phone-frame">
      <div className="phone-stage">
        <IPhoneMockup
          model="14-pro"
          color="space-black"
          screenBg="#0a0a0a"
          safeAreaOverrides={{ top: 34, bottom: 10 }}
        >
          <CallScreen {...props} />
        </IPhoneMockup>
      </div>
    </div>
  );
};

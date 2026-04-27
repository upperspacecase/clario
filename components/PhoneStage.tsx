"use client";

import { IPhoneMockup } from "./ui/iphone-mockup";

export const PhoneStage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="phone-frame">
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


import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { VoiceStatus } from "@/types";

interface VoiceWaveProps {
  status: VoiceStatus;
  className?: string;
}

const VoiceWave: React.FC<VoiceWaveProps> = ({ status, className }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(status === 'listening' || status === 'processing');
  }, [status]);

  return (
    <div className={cn("voice-wave-container", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "voice-wave-bar transition-all duration-300 ease-in-out",
            {
              [`animate-wave${index + 1}`]: isActive,
              "h-1": !isActive,
              "bg-opacity-50": !isActive
            }
          )}
        />
      ))}
    </div>
  );
};

export default VoiceWave;


import React from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceWave from "./VoiceWave";
import { VoiceStatus } from "@/types";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  status: VoiceStatus;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  status,
  isRecording,
  startRecording,
  stopRecording,
}) => {
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";
  const isActive = isListening || isProcessing || isSpeaking;

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <Button
        onClick={handleClick}
        variant={isActive ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-16 w-16 rounded-full shadow-md transition-all duration-300",
          {
            "bg-primary text-primary-foreground": isActive,
            "hover:bg-primary/90 hover:text-primary-foreground": !isActive,
            "animate-pulse-slow": isProcessing,
          }
        )}
      >
        {isRecording ? (
          <Square className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      
      <div className={cn("mt-2 text-sm font-medium", {
        "text-primary": isActive,
        "text-muted-foreground": !isActive
      })}>
        {isListening ? "Listening..." : 
         isProcessing ? "Processing..." : 
         isSpeaking ? "Speaking..." : 
         "Tap to speak"}
      </div>
      
      {isActive && (
        <VoiceWave 
          status={status} 
          className="absolute -top-12" 
        />
      )}
    </div>
  );
};

export default VoiceButton;

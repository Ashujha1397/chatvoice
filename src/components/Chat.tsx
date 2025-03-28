
import React, { useEffect } from "react";
import ChatContainer from "./ChatContainer";
import VoiceButton from "./VoiceButton";
import { useChat } from "@/contexts/ChatContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, VolumeX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Chat: React.FC = () => {
  const { state, startRecording, stopRecording } = useChat();

  useEffect(() => {
    // Request microphone permission on component mount
    const requestMicrophonePermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Permission granted, we don't need to do anything with the stream
      } catch (error) {
        console.error("Microphone permission denied:", error);
      }
    };

    requestMicrophonePermission();
  }, []);

  const cancelSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <Card className="flex flex-col h-full rounded-xl shadow-lg border overflow-hidden">
      <div className="bg-agent-gradient p-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-primary-foreground">Interview Assistant</h1>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground"
                  onClick={cancelSpeech}
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop speaking</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ask me interview questions and I'll respond as you would!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <CardContent className="flex-1 flex flex-col p-0 h-[calc(100%-64px)]">
        <ChatContainer messages={state.messages} />
        
        <div className="p-4 border-t bg-background">
          <div className="flex justify-center items-center py-2">
            <VoiceButton
              status={state.status}
              isRecording={state.isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chat;

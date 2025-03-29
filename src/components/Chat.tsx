
import React, { useEffect } from "react";
import ChatContainer from "./ChatContainer";
import VoiceButton from "./VoiceButton";
import TextInput from "./TextInput";
import { useChat } from "@/contexts/ChatContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, VolumeX, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Chat: React.FC = () => {
  const { state, startRecording, stopRecording, sendTextMessage } = useChat();

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

  const isInputDisabled = state.status === "processing" || state.status === "speaking";

  return (
    <Card className="flex flex-col h-full rounded-xl shadow-xl border overflow-hidden bg-black/30 backdrop-blur-sm border-indigo-900/50">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 flex justify-between items-center border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-300" />
          <h1 className="text-xl font-bold text-white">VoiceAI Assistant</h1>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/10"
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
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Try questions like: "What can you help me with?", "What's your #1 superpower?", "Tell me a fun fact", or "How's the weather?"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <CardContent className="flex-1 flex flex-col p-0 h-[calc(100%-64px)]">
        <ChatContainer messages={state.messages} />
        
        <div className="p-4 border-t border-indigo-900/50 bg-gray-900/50 backdrop-blur-sm">
          <div className="space-y-4">
            <TextInput 
              onSendMessage={sendTextMessage} 
              isDisabled={isInputDisabled}
            />
            
            <div className="flex justify-center items-center">
              <VoiceButton
                status={state.status}
                isRecording={state.isRecording}
                startRecording={startRecording}
                stopRecording={stopRecording}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chat;

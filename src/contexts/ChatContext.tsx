
import React, { createContext, useContext, useReducer, useRef, useState, useEffect } from "react";
import { Message, VoiceStatus, ChatState } from "@/types";
import { useToast } from "@/components/ui/use-toast";

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_STATUS"; payload: VoiceStatus }
  | { type: "SET_RECORDING"; payload: boolean }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "CLEAR_TRANSCRIPT" };

const initialState: ChatState = {
  messages: [],
  status: "idle",
  isRecording: false,
  transcript: "",
};

const ChatContext = createContext<{
  state: ChatState;
  startRecording: () => void;
  stopRecording: () => void;
  addMessage: (role: "user" | "assistant", content: string) => void;
  setStatus: (status: VoiceStatus) => void;
} | null>(null);

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "SET_STATUS":
      return {
        ...state,
        status: action.payload,
      };
    case "SET_RECORDING":
      return {
        ...state,
        isRecording: action.payload,
      };
    case "SET_TRANSCRIPT":
      return {
        ...state,
        transcript: action.payload,
      };
    case "CLEAR_TRANSCRIPT":
      return {
        ...state,
        transcript: "",
      };
    default:
      return state;
  }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { toast } = useToast();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Chat function
  const addMessage = (role: "user" | "assistant", content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: message });
  };

  const setStatus = (status: VoiceStatus) => {
    dispatch({ type: "SET_STATUS", payload: status });
  };

  // Speech synthesis setup
  useEffect(() => {
    utteranceRef.current = new SpeechSynthesisUtterance();
    utteranceRef.current.rate = 1.0;
    utteranceRef.current.pitch = 1.0;
    utteranceRef.current.volume = 1.0;
    
    // Get the voices
    const populateVoices = () => {
      const voices = synth.getVoices();
      // Look for a good English voice
      const preferredVoice = voices.find(
        (voice) => 
          voice.name.includes("Google") && 
          voice.name.includes("US") && 
          voice.name.includes("Female")
      ) || voices.find(
        (voice) => voice.lang === 'en-US'
      ) || voices[0];
      
      if (utteranceRef.current && preferredVoice) {
        utteranceRef.current.voice = preferredVoice;
      }
    };
    
    populateVoices();
    
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoices;
    }

    // Clean up
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []);

  // Handle speaking the assistant's messages
  const speakMessage = (text: string) => {
    if (!utteranceRef.current) return;

    // Cancel any ongoing speech
    if (synth.speaking) {
      synth.cancel();
    }

    setStatus("speaking");
    utteranceRef.current.text = text;
    
    utteranceRef.current.onend = () => {
      setStatus("idle");
    };
    
    utteranceRef.current.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setStatus("idle");
      toast({
        title: "Voice error",
        description: "Unable to speak the response.",
        variant: "destructive",
      });
    };
    
    synth.speak(utteranceRef.current);
  };

  // Send message to OpenAI API
  const sendMessageToOpenAI = async (userMessage: string) => {
    try {
      setStatus("processing");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a voice assistant that speaks as if you were the user in an interview. 
                        You should respond to interview questions as if you are the human using the bot.
                        Your answers should be conversational, personal, and authentic.
                        Keep responses concise (1-3 paragraphs maximum) as they will be read aloud.
                        Sound like a real person speaking, not an AI.`,
            },
            ...state.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content.trim();
      
      if (assistantMessage) {
        addMessage("assistant", assistantMessage);
        speakMessage(assistantMessage);
      }
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      setStatus("idle");
      toast({
        title: "Connection error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Speech recognition setup
  const startRecording = () => {
    if (state.isRecording) return;
    
    try {
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        throw new Error("Speech recognition not supported");
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      
      recognitionRef.current.onstart = () => {
        dispatch({ type: "SET_RECORDING", payload: true });
        setStatus("listening");
        dispatch({ type: "CLEAR_TRANSCRIPT" });
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join("");
          
        dispatch({ type: "SET_TRANSCRIPT", payload: transcript });
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopRecording();
        toast({
          title: "Voice recognition error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        if (state.isRecording) {
          stopRecording();
        }
      };
      
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Voice recognition not available",
        description: "Your browser doesn't support voice recognition or access was denied.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      dispatch({ type: "SET_RECORDING", payload: false });
      
      if (state.transcript.trim()) {
        addMessage("user", state.transcript.trim());
        sendMessageToOpenAI(state.transcript.trim());
      } else {
        setStatus("idle");
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        startRecording,
        stopRecording,
        addMessage,
        setStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

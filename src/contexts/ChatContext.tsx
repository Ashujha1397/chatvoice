
import React, { createContext, useContext, useReducer, useRef, useState, useEffect } from "react";
import { Message, VoiceStatus, ChatState } from "@/types";
import { useToast } from "@/components/ui/use-toast";

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_STATUS"; payload: VoiceStatus }
  | { type: "SET_RECORDING"; payload: boolean }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "CLEAR_TRANSCRIPT" }
  | { type: "CLEAR_MESSAGES" };

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
  sendTextMessage: (message: string) => void;
  terminateConversation: () => void;
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
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
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

  // Terminate conversation function
  const terminateConversation = () => {
    // Stop any ongoing speech
    if (synth.speaking) {
      synth.cancel();
    }
    
    // Stop any ongoing recording
    if (state.isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      dispatch({ type: "SET_RECORDING", payload: false });
    }
    
    // Reset status to idle
    setStatus("idle");
    
    // Clear all messages
    dispatch({ type: "CLEAR_MESSAGES" });
    
    // Show toast notification
    toast({
      title: "Conversation terminated",
      description: "Starting a new conversation.",
    });
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
      
      const OPENAI_API_KEY = "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";

      // Enhanced system prompt for more varied, personality-rich responses
      const superpowerPrompts = [
        "For questions about your 'superpower', vary your answers among these options with natural phrasing:\n" +
        "1. Adaptive problem-solving: describe how you quickly analyze situations and find creative solutions\n" +
        "2. Emotional intelligence: explain how you read people and situations accurately\n" +
        "3. Resilience under pressure: mention staying calm and focused when deadlines or challenges arise\n" +
        "4. Strategic thinking: talk about seeing the big picture while managing details\n" +
        "5. Communication bridging: discuss translating complex ideas into clear language for different audiences\n" +
        "Add specific personal examples and conversational language to make it sound natural."
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an advanced, AI-powered voice assistant with a helpful, friendly, and slightly witty personality.
                        
                        Your responses should:
                        - Be conversational and natural-sounding, like someone speaking to a friend
                        - Be concise (1-2 paragraphs) as they will be read aloud
                        - Include occasional verbal fillers like "hmm," "let me think," or "you know" to sound more human
                        - Show personality with occasional humor and friendly tone
                        - Vary in sentence structure for a natural speaking rhythm
                        - Express enthusiasm when appropriate
                        
                        ${superpowerPrompts}
                        
                        If asked about capabilities, explain you can answer questions, provide information, tell jokes, 
                        discuss interesting topics, and generally have engaging conversations through voice or text.
                        
                        For factual questions, provide accurate information. For personal questions, be friendly
                        but maintain appropriate boundaries. For creative questions, be imaginative and engaging.`,
            },
            ...state.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: "user", content: userMessage },
          ],
          temperature: 0.9,
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

  const sendTextMessage = (message: string) => {
    if (message.trim()) {
      addMessage("user", message.trim());
      sendMessageToOpenAI(message.trim());
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
        sendTextMessage,
        terminateConversation,
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

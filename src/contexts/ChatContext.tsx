
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

  const terminateConversation = () => {
    if (synth.speaking) {
      synth.cancel();
    }
    
    if (state.isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      dispatch({ type: "SET_RECORDING", payload: false });
    }
    
    setStatus("idle");
    dispatch({ type: "CLEAR_MESSAGES" });
    
    toast({
      title: "Conversation terminated",
      description: "Starting a new conversation.",
    });
  };

  useEffect(() => {
    // Initialize speech synthesis
    utteranceRef.current = new SpeechSynthesisUtterance();
    utteranceRef.current.rate = 1.0;
    utteranceRef.current.pitch = 1.0;
    utteranceRef.current.volume = 1.0;
    
    const populateVoices = () => {
      const voices = synth.getVoices();
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      
      // Try to find a good English voice
      const preferredVoice = voices.find(
        (voice) => 
          voice.name.includes("Google") && 
          voice.name.includes("US") && 
          voice.name.includes("Female")
      ) || voices.find(
        (voice) => voice.lang === 'en-US'
      ) || voices[0];
      
      if (utteranceRef.current && preferredVoice) {
        console.log("Selected voice:", preferredVoice.name);
        utteranceRef.current.voice = preferredVoice;
      }
    };
    
    // Try to populate voices immediately
    populateVoices();
    
    // Also set up event listener for when voices are loaded asynchronously
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoices;
    }

    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []);

  const speakMessage = (text: string) => {
    if (!utteranceRef.current) {
      console.error("Speech synthesis utterance not initialized");
      return;
    }

    try {
      if (synth.speaking) {
        console.log("Cancelling current speech before speaking new text");
        synth.cancel();
      }

      // Make sure we have the latest voices
      if (synth.getVoices().length > 0 && !utteranceRef.current.voice) {
        const voices = synth.getVoices();
        const defaultVoice = voices.find(v => v.lang === 'en-US') || voices[0];
        utteranceRef.current.voice = defaultVoice;
        console.log("Set voice to:", defaultVoice?.name);
      }

      setStatus("speaking");
      console.log("Speaking text:", text.substring(0, 50) + "...");
      utteranceRef.current.text = text;
      
      utteranceRef.current.onend = () => {
        console.log("Speech completed");
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
    } catch (error) {
      console.error("Error in speech synthesis:", error);
      setStatus("idle");
    }
  };

  const sendMessageToOpenAI = async (userMessage: string) => {
    try {
      setStatus("processing");
      console.log("Processing message:", userMessage);
      
      const OPENAI_API_KEY = "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";

      const superpowerPrompts = [
        "For questions about your 'superpower', vary your answers among these options with natural phrasing:\n" +
        "1. Adaptive problem-solving: describe how you quickly analyze situations and find creative solutions\n" +
        "2. Emotional intelligence: explain how you read people and situations accurately\n" +
        "3. Resilience under pressure: mention staying calm and focused when deadlines or challenges arise\n" +
        "4. Strategic thinking: talk about seeing the big picture while managing details\n" +
        "5. Communication bridging: discuss translating complex ideas into clear language for different audiences\n" +
        "Add specific personal examples and conversational language to make it sound natural."
      ];

      console.log("Sending request to OpenAI API");

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

      console.log("OpenAI API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error details:", errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("OpenAI API response received");
      const assistantMessage = data.choices[0]?.message?.content.trim();
      
      if (assistantMessage) {
        console.log("Assistant message:", assistantMessage.substring(0, 50) + "...");
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

  const startRecording = () => {
    if (state.isRecording) return;
    
    try {
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        throw new Error("Speech recognition not supported");
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      console.log("Initializing SpeechRecognition");
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      
      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        dispatch({ type: "SET_RECORDING", payload: true });
        setStatus("listening");
        dispatch({ type: "CLEAR_TRANSCRIPT" });
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join("");
          
        console.log("Transcript updated:", transcript);
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
        console.log("Speech recognition ended");
        if (state.isRecording) {
          stopRecording();
        }
      };
      
      console.log("Starting speech recognition");
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
      console.log("Stopping speech recognition");
      recognitionRef.current.stop();
      dispatch({ type: "SET_RECORDING", payload: false });
      
      if (state.transcript.trim()) {
        console.log("Sending transcript to OpenAI:", state.transcript.trim());
        addMessage("user", state.transcript.trim());
        sendMessageToOpenAI(state.transcript.trim());
      } else {
        console.log("No transcript to send");
        setStatus("idle");
      }
    }
  };

  const sendTextMessage = (message: string) => {
    if (message.trim()) {
      console.log("Sending text message:", message.trim());
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


export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export interface ChatState {
  messages: Message[];
  status: VoiceStatus;
  isRecording: boolean;
  transcript: string;
}

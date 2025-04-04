
import React from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  
  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] px-4 py-3 rounded-2xl shadow-lg",
        isUser 
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-500" 
          : "bg-gradient-to-br from-gray-800 to-indigo-950 text-gray-100 border border-indigo-900/50"
      )}>
        <p className="text-md leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;

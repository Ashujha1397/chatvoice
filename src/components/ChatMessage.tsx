
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
        "max-w-[85%] px-4 py-3 rounded-2xl",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-accent text-accent-foreground"
      )}>
        <p className="text-md">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;

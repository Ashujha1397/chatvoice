
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
        "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm",
        isUser 
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700"
      )}>
        <p className="text-md">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;

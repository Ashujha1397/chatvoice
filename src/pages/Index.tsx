
import React from "react";
import Chat from "@/components/Chat";
import { ChatProvider } from "@/contexts/ChatContext";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-4 text-indigo-900 dark:text-indigo-300">
          Voice Interview Assistant
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Ask interview questions, and I'll respond as if I were you
        </p>
        <div className="flex-1 flex flex-col">
          <ChatProvider>
            <Chat />
          </ChatProvider>
        </div>
      </div>
    </div>
  );
};

export default Index;

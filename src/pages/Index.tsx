
import React from "react";
import Chat from "@/components/Chat";
import { ChatProvider } from "@/contexts/ChatContext";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-950 dark:to-indigo-950">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-4 text-indigo-900 dark:text-indigo-300">
          Voice Interview Assistant
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          I'll respond to interview questions as if I were you
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


import React from "react";
import Chat from "@/components/Chat";
import { ChatProvider } from "@/contexts/ChatContext";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-background">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-6">
          Voice Interview Assistant
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Ask me interview questions, and I'll respond as if I were you.
        </p>
        <div className="flex-1 flex flex-col">
          <ChatProvider>
            <Chat />
          </ChatProvider>
        </div>
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Using this assistant for interview preparation or personal reflection.
            Tap the microphone and start asking questions!
          </p>
          <p className="mt-2">
            Suggested questions: What's your life story? What's your #1 superpower?
            What are your growth areas? What misconceptions do your coworkers have?
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

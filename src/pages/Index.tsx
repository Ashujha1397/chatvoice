
import React, { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import { ChatProvider } from "@/contexts/ChatContext";

const Index = () => {
  const [stars, setStars] = useState<Array<{id: number, top: string, left: string, size: string, duration: string}>>([]);
  
  // Generate stars for the background
  useEffect(() => {
    const generateStars = () => {
      const numberOfStars = 50;
      const newStars = [];
      
      for (let i = 0; i < numberOfStars; i++) {
        newStars.push({
          id: i,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          size: `${Math.random() * 0.4 + 0.1}rem`,
          duration: `${Math.random() * 5 + 5}s`
        });
      }
      
      setStars(newStars);
    };
    
    generateStars();
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-black relative overflow-hidden">
      {/* Sparkle stars in the background */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white opacity-0 animate-pulse-slow"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDuration: star.duration,
            boxShadow: `0 0 10px 2px rgba(255, 255, 255, 0.7)`
          }}
        />
      ))}
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 pointer-events-none" />
      
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col relative z-10">
        <h1 className="text-3xl font-bold text-center mb-4 text-white">
          Voice Interview Assistant
        </h1>
        <p className="text-indigo-200 text-center mb-8">
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

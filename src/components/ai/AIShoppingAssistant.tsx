"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Sparkles, Bot, User, CornerDownLeft, Loader2, Paperclip, X } from "lucide-react";
import Image from "next/image";

// Message type is updated to handle optional images
type Message = {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
};

export function AIShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
      { role: 'assistant', content: "Hi! I'm your AI assistant. You can ask me to find products or show me an image of something you're looking for." }
  ]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ preview: string; data: string } | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({
          preview: URL.createObjectURL(file),
          data: (reader.result as string).split(',')[1], // Get the base64 part of the data URL
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !image) || loading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      imageUrl: image?.preview,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    setLoading(true);
    try {
      // THE FIX: Call the backend API with the chat history and image data
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: newMessages, 
            imageData: image?.data 
        }),
      });

      if (!response.ok) {
        throw new Error("The AI assistant is currently unavailable.");
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setInput('');
      setImage(null);
      setLoading(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50">
            <Sparkles className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>AI Shopping Assistant</SheetTitle>
            <SheetDescription>
              Ask me anything or show me a picture of what you're looking for.
            </SheetDescription>
          </SheetHeader>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-4 py-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (<div className="bg-muted p-2 rounded-full"><Bot className="h-5 w-5" /></div>)}
                  <div className={`rounded-lg p-3 text-sm max-w-[80%] break-words ${ msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted' }`}>
                    {msg.imageUrl && <Image src={msg.imageUrl} alt="User upload" width={150} height={150} className="rounded-md mb-2" />}
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (<div className="bg-blue-100 p-2 rounded-full"><User className="h-5 w-5 text-blue-600" /></div>)}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3"><div className="bg-muted p-2 rounded-full"><Bot className="h-5 w-5" /></div><div className="rounded-lg p-3 text-sm bg-muted flex items-center"><Loader2 className="h-4 w-4 animate-spin"/></div></div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="relative mt-auto border-t pt-4">
            {image && (
              <div className="relative w-20 h-20 mb-2">
                <Image src={image.preview} alt="Image preview" layout="fill" className="rounded-md object-cover" />
                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setImage(null)}><X className="h-4 w-4" /></Button>
              </div>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the image or ask a question..."
              className="pr-20"
              disabled={loading}
            />
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
            <Button type="button" size="icon" variant="ghost" className="absolute right-10 top-5 h-8 w-8" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="submit" size="icon" className="absolute right-1 top-5 h-8 w-8" disabled={loading}>
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}


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
import { Sparkles, Bot, User, CornerDownLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function AIShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to Artisan Haven! Ask me to find products, get gift ideas, or describe what you're looking for." }
  ]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // THE FIX: Call the new, smarter backend API
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("The AI assistant is currently unavailable.");
      }

      const data = await response.json();
      
      // THE FIX: Create an assistant message that includes both the text reply and any products found
      const assistantMessage = { 
        role: 'assistant', 
        content: data.reply,
        products: data.products || [] // Attach the products array if it exists
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage = { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
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
              Your personal guide to handcrafted treasures.
            </SheetDescription>
          </SheetHeader>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-4 py-4">
              {messages.map((msg, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (<div className="bg-muted p-2 rounded-full mt-1"><Bot className="h-5 w-5" /></div>)}
                    <div className={`rounded-lg p-3 text-sm max-w-[80%] break-words ${ msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted' }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (<div className="bg-blue-100 p-2 rounded-full mt-1"><User className="h-5 w-5 text-blue-600" /></div>)}
                  </div>
                  
                  {/* Render product cards if they exist on an assistant message */}
                  {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                    <div className="ml-12 grid grid-cols-1 gap-2">
                      {msg.products.map(product => (
                        <Link href={`/product/${product.id}`} key={product.id} className="block group">
                          <div className="flex items-center gap-3 rounded-lg border p-2 hover:bg-muted/50 transition-colors">
                            <Image 
                              src={product.imageUrls[0] || "https://placehold.co/64x64"} 
                              alt={product.name}
                              width={64}
                              height={64}
                              className="rounded-md object-cover"
                            />
                            <div>
                              <p className="font-semibold text-sm group-hover:underline">{product.name}</p>
                              <p className="text-sm font-bold">₹{product.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3"><div className="bg-muted p-2 rounded-full"><Bot className="h-5 w-5" /></div><div className="rounded-lg p-3 text-sm bg-muted flex items-center"><Loader2 className="h-4 w-4 animate-spin"/></div></div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="relative mt-auto border-t pt-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Show me a blue silk scarf..."
              className="pr-12"
              disabled={loading}
            />
            <Button type="submit" size="icon" className="absolute right-1 top-5 h-8 w-8" disabled={loading}>
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

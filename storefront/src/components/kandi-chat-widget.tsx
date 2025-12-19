'use client';

// Ensure this import is exactly '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'; 
import { useState, useRef, useEffect } from 'react';
import { Button, Input, clx } from '@medusajs/ui';
import X from '@modules/common/icons/x';
import Spinner from '@modules/common/icons/spinner';

export default function KandiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // We explicitly type this to 'any' temporarily to silence the compiler 
  // if the version mismatch persists in your editor, but the runtime code below handles it.
  const chat = useChat({
    api: '/api/chat',
    onError: (e) => console.error("Chat Error:", e),
  }) as any;

  // Destructure with fallbacks
  const { messages = [], input = '', handleInputChange, handleSubmit, append, status } = chat;

  const isLoading = status === 'streaming' || status === 'submitted';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // ROBUST SEND LOGIC:
    // 1. Try 'append' (Modern SDK)
    if (typeof append === 'function') {
      await append({ role: 'user', content: input });
    } 
    // 2. Fallback to 'handleSubmit' (Legacy/Standard SDK)
    else if (typeof handleSubmit === 'function') {
      handleSubmit(e);
    } 
    // 3. Error if neither exists
    else {
      console.error("CRITICAL: neither 'append' nor 'handleSubmit' is available.", chat);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 font-sans">
      
      {isOpen && (
        <div className="w-[350px] h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-ui-border-base flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-200">
          
          <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="text-small-plus font-bold">KandiBot 🤖</h3>
              <p className="text-[10px] opacity-90">Ask me about Phygital Kandi!</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ui-bg-subtle" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-ui-fg-muted mt-10 text-small-regular">
                <p>✌️ Hey there!</p>
                <p className="mt-2">I can help you design Kandi, explain our NFTs, or find products.</p>
              </div>
            )}
            
            {messages.map((m: any) => (
              <div
                key={m.id}
                className={clx(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-small-regular shadow-sm whitespace-pre-wrap",
                  m.role === 'user' 
                    ? "bg-purple-600 text-white self-end ml-auto rounded-br-none" 
                    : "bg-white dark:bg-zinc-800 text-ui-fg-base border border-ui-border-base mr-auto rounded-bl-none"
                )}
              >
                {/* Robust content rendering */}
                {m.content || (m.parts && m.parts.map((p: any) => p.text).join(''))}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white dark:bg-zinc-800 p-2 rounded-2xl border border-ui-border-base shadow-sm">
                    <Spinner className="animate-spin w-4 h-4 text-purple-600" />
                 </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="p-3 border-t border-ui-border-base bg-white dark:bg-zinc-900 flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about Kandi..."
              className="flex-1 text-small-regular bg-ui-bg-field"
            />
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white !p-2 w-10 h-10 flex items-center justify-center rounded-md"
            >
              ➤
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-white active:scale-95 group"
      >
        {isOpen ? (
          <X />
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>
    </div>
  );
}
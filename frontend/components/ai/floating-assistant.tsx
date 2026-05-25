"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { sendChat } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const prompts = ["Find me a 2BHK near OMR", "Show parking-friendly homes", "Suggest quiet shared stays in Chennai"];

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi, I can search semantically across Zuntra properties and help plan visits." }]);
  const [loading, setLoading] = useState(false);
  const { userId, city } = useUserStore();

  const onSend = async (message = input) => {
    if (!message.trim()) return;
    if (!userId) {
      toast.error("Register a user first from the landing page onboarding form.");
      return;
    }
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const data = await sendChat({ userId, message, city });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen((prev) => !prev)} className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glass transition hover:scale-105">
        <Bot className="h-6 w-6" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-32px))]">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold">Zuntra AI</div>
                    <div className="text-xs text-muted-foreground">Semantic search, roommate hints, move-in ideas</div>
                  </div>
                </div>
              </div>
              <div className="max-h-[420px] space-y-3 overflow-auto p-4">
                {messages.map((message, index) => (
                  <div key={index} className={message.role === "assistant" ? "mr-10 rounded-[24px] bg-muted/60 p-3 text-sm" : "ml-10 rounded-[24px] bg-primary p-3 text-sm text-primary-foreground"}>
                    {message.content}
                  </div>
                ))}
                {loading && <div className="mr-10 rounded-[24px] bg-muted/60 p-3 text-sm">Zuntra AI is typing...</div>}
              </div>
              <div className="space-y-3 border-t border-border/60 p-4">
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt) => (
                    <button key={prompt} onClick={() => onSend(prompt)} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about locality, parking, or type..." onKeyDown={(event) => event.key === "Enter" && onSend()} />
                  <Button onClick={() => onSend()}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, SendHorizontal } from "lucide-react";
import { sendChat } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const suggestions = ["Show me PG options near Tidel Park", "Any villa options with parking?", "Recommend move-in ready options in Velachery"];

export default function AssistantPage() {
  const { userId, city } = useUserStore();
  const [input, setInput] = useState(suggestions[0]);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Ask me anything about locality, parking, property type, or matching options." }]);
  const [loading, setLoading] = useState(false);

  const submit = async (message = input) => {
    if (!userId) return toast.error("Register a user on the landing page first.");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const data = await sendChat({ userId, message, city });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assistant failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-4 border-b border-border/60 bg-gradient-to-r from-primary/10 to-cyan-400/10 p-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Bot className="h-6 w-6" /></div>
          <div>
            <h1 className="text-3xl font-semibold">AI chat assistant</h1>
            <p className="text-sm text-muted-foreground">Natural-language recommendations powered by your <code>/chat</code> and <code>/properties/semantic</code> backend.</p>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => <button key={item} onClick={() => submit(item)} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">{item}</button>)}
          </div>
          <div className="min-h-[420px] space-y-4 rounded-[28px] bg-muted/30 p-4">
            {messages.map((message, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={message.role === "assistant" ? "max-w-[85%] rounded-[24px] bg-white p-4 text-sm shadow-soft dark:bg-white/5" : "ml-auto max-w-[85%] rounded-[24px] bg-primary p-4 text-sm text-primary-foreground"}>
                {message.content}
              </motion.div>
            ))}
            {loading && <div className="max-w-[85%] rounded-[24px] bg-white p-4 text-sm shadow-soft dark:bg-white/5">Typing recommendation...</div>}
          </div>
          <div className="flex gap-3">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Describe the home, location, or vibe you need" />
            <Button onClick={() => submit()}><SendHorizontal className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </main>
  );
}

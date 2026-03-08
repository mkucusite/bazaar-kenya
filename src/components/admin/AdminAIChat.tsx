import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "How can I increase user engagement?",
  "Write a blog post about safe online trading in Kenya",
  "Suggest SEO improvements for the site",
  "What features should I add next?",
];

const AdminAIChat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-chat", {
        body: { messages: nextMessages, stream: false },
      });

      if (error) throw error;

      const content = typeof data?.content === "string" ? data.content.trim() : "";
      if (!content) throw new Error("AI returned an empty response");

      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (e: any) {
      const message = e?.message || "Please try again later.";
      toast({ title: "AI chat failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl flex flex-col" style={{ height: "min(70vh, 500px)" }}>
      <div className="p-3 border-b border-border/60 flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <h2 className="font-heading font-semibold text-sm">AI Admin Assistant</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium ml-auto">Gemini</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground mb-4">Ask me anything about managing your platform</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant..."
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          />
          <Button type="submit" size="sm" className="h-9 w-9 p-0" disabled={isLoading || !input.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminAIChat;

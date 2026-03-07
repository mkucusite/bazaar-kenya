import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2 } from "lucide-react";

const ChatsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchConvs = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });
      setConversations(data || []);
      setLoading(false);
    };
    fetchConvs();
  }, [user]);

  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConv)
        .order("created_at");
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConv}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) { navigate("/login"); return null; }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    await supabase.from("messages").insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content: newMessage.trim(),
    } as any);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-8">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-6">My Chats</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 h-[60vh]">
            {/* Conversations list */}
            <div className="bg-card rounded-xl border border-border overflow-auto">
              {conversations.map((conv) => (
                <button key={conv.id} onClick={() => setSelectedConv(conv.id)} className={`w-full text-left p-4 border-b border-border hover:bg-muted transition-colors ${selectedConv === conv.id ? "bg-primary/5" : ""}`}>
                  <p className="font-medium text-sm text-foreground truncate">Conversation</p>
                  <p className="text-xs text-muted-foreground">{new Date(conv.updated_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>

            {/* Chat window */}
            <div className="md:col-span-2 bg-card rounded-xl border border-border flex flex-col">
              {selectedConv ? (
                <>
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${msg.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t border-border p-3 flex gap-2">
                    <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                    <Button size="icon" onClick={sendMessage}><Send className="w-4 h-4" /></Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Select a conversation</div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ChatsPage;

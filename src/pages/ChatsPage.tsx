import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";

interface ConversationWithDetails {
  id: string;
  ad_id: string | null;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  ad_title?: string;
  other_name?: string;
  last_message?: string;
  unread_count?: number;
}

const ChatsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const fetchConvs = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!convs || convs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Enrich with ad title and other user name
      const enriched: ConversationWithDetails[] = await Promise.all(
        convs.map(async (conv) => {
          const otherId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
          
          const [adRes, profileRes, msgRes] = await Promise.all([
            conv.ad_id
              ? supabase.from("ads").select("title").eq("id", conv.ad_id).maybeSingle()
              : Promise.resolve({ data: null }),
            supabase.from("profiles").select("full_name").eq("id", otherId).maybeSingle(),
            supabase
              .from("messages")
              .select("content,is_read,sender_id")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1),
          ]);

          const unreadCount = msgRes.data?.filter(
            (m: any) => m.sender_id !== user.id && !m.is_read
          ).length || 0;

          return {
            ...conv,
            ad_title: adRes.data?.title || "Conversation",
            other_name: profileRes.data?.full_name || "User",
            last_message: msgRes.data?.[0]?.content || "",
            unread_count: unreadCount,
          };
        })
      );

      setConversations(enriched);
      setLoading(false);
    };
    fetchConvs();
  }, [user, authLoading]);

  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConv)
        .order("created_at");
      setMessages(data || []);

      // Mark messages as read
      if (user) {
        await supabase
          .from("messages")
          .update({ is_read: true } as any)
          .eq("conversation_id", selectedConv)
          .neq("sender_id", user.id)
          .eq("is_read", false);
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedConv}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selectedConv}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading || !user) return null;

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content: newMessage.trim(),
    } as any);

    if (!error) {
      setNewMessage("");
      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() } as any)
        .eq("id", selectedConv);
    }
    setSending(false);
  };

  const selectedConvData = conversations.find((c) => c.id === selectedConv);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-6">
        <h1 className="font-heading font-bold text-xl text-foreground mb-5">My Chats</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border/60">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-2">No conversations yet</p>
            <p className="text-xs text-muted-foreground">Start a chat by clicking "Chat" on any ad listing</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 h-[65vh]">
            {/* Conversation list — hidden on mobile when a chat is selected */}
            <div className={`bg-card rounded-xl border border-border/60 overflow-auto ${selectedConv ? "hidden md:block" : ""}`}>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-left p-4 border-b border-border/40 hover:bg-muted/50 transition-colors ${selectedConv === conv.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground truncate">{conv.other_name}</p>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-primary truncate">{conv.ad_title}</p>
                  {conv.last_message && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(conv.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </button>
              ))}
            </div>

            {/* Chat area */}
            <div className={`md:col-span-2 bg-card rounded-xl border border-border/60 flex flex-col ${!selectedConv ? "hidden md:flex" : ""}`}>
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <div className="p-3 border-b border-border/60 flex items-center gap-3">
                    <button onClick={() => setSelectedConv(null)} className="md:hidden p-1">
                      <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{selectedConvData?.other_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{selectedConvData?.ad_title}</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hi!</p>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.sender_id === user.id ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                          {msg.content}
                          <p className={`text-[9px] mt-1 ${msg.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(msg.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-border/60 p-3 flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="h-10"
                    />
                    <Button size="icon" onClick={sendMessage} disabled={sending} className="h-10 w-10">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a conversation
                </div>
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

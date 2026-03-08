import { useState, useEffect, useRef } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessagesSquare, Send, Loader2, ArrowLeft, User } from "lucide-react";

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

      if (user) {
        await supabase
          .from("messages")
          .update({ is_read: true })
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
    });

    if (!error) {
      setNewMessage("");
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConv);
    }
    setSending(false);
  };

  const selectedConvData = conversations.find((c) => c.id === selectedConv);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: any[] }[]>((acc, msg) => {
    const date = formatDate(msg.created_at);
    const last = acc[acc.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      acc.push({ date, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Messages — Chat with Buyers & Sellers" description="Chat securely with buyers and sellers on KenyaAdvert." canonical="https://www.kenyaadverts.co.ke/chats" />
      <Navbar />
      <div className="flex-1 px-4 md:px-8 lg:px-16 xl:px-24 py-4">
        <h1 className="font-heading font-bold text-xl text-foreground mb-4">My Chats</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border/60 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessagesSquare className="w-7 h-7 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground mb-4">Start chatting by clicking "Chat" on any ad listing</p>
            <Button onClick={() => navigate("/")} size="sm">Browse Ads</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-[320px_1fr] gap-0 md:gap-0 h-[calc(100vh-180px)] bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            {/* Conversation list */}
            <div className={`border-r border-border/60 flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
              <div className="p-3 border-b border-border/40">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversations</p>
              </div>
              <div className="flex-1 overflow-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-border/30 hover:bg-muted/40 transition-colors flex items-start gap-3 ${selectedConv === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{conv.other_name}</p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(conv.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-primary truncate font-medium">{conv.ad_title}</p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        {conv.last_message && (
                          <p className="text-[11px] text-muted-foreground truncate">{conv.last_message}</p>
                        )}
                        {(conv.unread_count || 0) > 0 && (
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex flex-col ${!selectedConv ? "hidden md:flex" : "flex"}`}>
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3 bg-muted/20">
                    <button onClick={() => setSelectedConv(null)} className="md:hidden p-1 -ml-1">
                      <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{selectedConvData?.other_name}</p>
                      <p className="text-[11px] text-primary truncate">{selectedConvData?.ad_title}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-auto px-4 py-4 bg-muted/10">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <MessagesSquare className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
                      </div>
                    )}
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">{group.date}</span>
                        </div>
                        {group.msgs.map((msg) => (
                          <div key={msg.id} className={`flex mb-2 ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${
                                msg.sender_id === user.id
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                                  : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border/40"
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p className={`text-[9px] mt-1 text-right ${msg.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-border/60 p-3 flex gap-2 bg-card">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="h-10 rounded-full px-4"
                    />
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="h-10 w-10 rounded-full flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessagesSquare className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Select a conversation</p>
                  <p className="text-xs text-muted-foreground">Choose a chat from the left to start messaging</p>
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

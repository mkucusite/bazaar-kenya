import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) { navigate("/login"); return null; }

  // Redirect to chats for now
  navigate("/chats");
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      <Footer />
    </div>
  );
};

export default MessagesPage;

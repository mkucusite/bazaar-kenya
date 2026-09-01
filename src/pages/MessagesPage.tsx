import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) { navigate("/login"); }
    else { navigate("/chats"); }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex justify-center py-20 text-sm text-muted-foreground">Redirecting...</div>
      <Footer />
    </div>
  );
};

export default MessagesPage;

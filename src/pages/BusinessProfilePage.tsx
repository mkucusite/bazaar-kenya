import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Building2 } from "lucide-react";

const BusinessProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-xl text-foreground mb-6">Business Profile</h1>
          <div className="text-center py-20 bg-card rounded-xl border border-border/60">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">You haven't created a business profile yet</p>
            <Button className="h-9 text-sm">Create Business Profile</Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfilePage;

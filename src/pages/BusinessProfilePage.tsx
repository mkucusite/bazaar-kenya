import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BusinessProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-6">My Business Profile</h1>
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">You haven't created a business profile yet</p>
            <Button>Create Business Profile</Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfilePage;

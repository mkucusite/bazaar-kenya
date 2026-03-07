import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import { PREMIUM_ADS, LATEST_ADS } from "@/data/mockData";
import { MapPin, Calendar, Eye, Phone, MessageCircle, MessageSquare, Heart, Share2, ChevronRight, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const ALL_ADS = [...PREMIUM_ADS, ...LATEST_ADS];

const AdDetailsPage = () => {
  const { id } = useParams();
  const ad = ALL_ADS.find((a) => a.id === id);
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-padding py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Ad Not Found</h1>
          <p className="text-muted-foreground mb-4">This listing may have been removed.</p>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const similarAds = ALL_ADS.filter((a) => a.category === ad.category && a.id !== ad.id).slice(0, 4);
  const images = [ad.image, ad.image, ad.image]; // Mock multiple images

  const handleCall = () => { window.open(`tel:${ad.phone}`); };
  const handleWhatsApp = () => { window.open(`https://wa.me/${(ad.whatsapp || ad.phone).replace(/[^0-9]/g, "")}?text=Hi, I'm interested in "${ad.title}" on KenyaAdvert`); };
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/search?category=${encodeURIComponent(ad.category)}`} className="hover:text-primary">{ad.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{ad.title}</span>
        </nav>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Images */}
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden border border-border mb-3 aspect-[4/3]">
              <img src={images[currentImage]} alt={ad.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`w-20 h-16 rounded-lg overflow-hidden border-2 ${i === currentImage ? "border-primary" : "border-border"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="font-heading font-bold text-lg text-foreground mb-3">Description</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                This is a listing for {ad.title}. Located in {ad.location}, {ad.county}. 
                Contact the seller for more details about this item. Condition: {ad.condition || "Not specified"}.
              </p>
            </div>

            {/* Safety Tips */}
            <div className="mt-6 p-4 bg-gold-light/30 border border-gold-border/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-sm text-foreground">Safety Tips</h3>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Meet in a public place for the transaction</li>
                <li>• Never pay before seeing the item</li>
                <li>• Beware of deals that seem too good to be true</li>
                <li>• Use M-Pesa for secure payments</li>
              </ul>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              {ad.badge && (
                <span className={`inline-block mb-2 ${ad.badge === "gold" ? "gold-badge" : "silver-badge"}`}>
                  {ad.badge.toUpperCase()}
                </span>
              )}
              <h1 className="font-heading font-bold text-xl text-foreground mb-2">{ad.title}</h1>
              <p className="text-2xl font-bold text-primary mb-3">
                {ad.price > 0 ? `KSh ${ad.price.toLocaleString()}` : "Contact for Price"}
              </p>
              {ad.condition && <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded mb-3">{ad.condition}</span>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ad.location}, {ad.county}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ad.date}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.views} views</span>
              </div>

              <div className="space-y-2">
                <Button onClick={handleCall} variant="outline" className="w-full justify-center gap-2">
                  <Phone className="w-4 h-4" /> Call Seller
                </Button>
                <Button onClick={handleWhatsApp} className="w-full justify-center gap-2 bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
                <Button variant="secondary" className="w-full justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSaved(!saved); toast({ title: saved ? "Removed from favourites" : "Saved to favourites" }); }}>
                  <Heart className={`w-4 h-4 mr-1 ${saved ? "fill-destructive text-destructive" : ""}`} /> {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Seller Info</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">S</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Seller</p>
                  <p className="text-xs text-muted-foreground">Member since 2024</p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
              <AlertTriangle className="w-4 h-4 mr-1" /> Report This Ad
            </Button>
          </div>
        </div>

        {/* Similar Ads */}
        {similarAds.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading font-bold text-xl text-foreground mb-6">Similar Ads</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {similarAds.map((a) => <AdCard key={a.id} ad={a} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdDetailsPage;

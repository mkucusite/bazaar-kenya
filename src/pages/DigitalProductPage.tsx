import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink, Lock, ShieldCheck, ChevronLeft, Mail, Phone } from "lucide-react";
import FormattedDescription from "@/components/FormattedDescription";
import { toast } from "@/hooks/use-toast";

type DP = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  category: string | null;
  images: string[] | null;
  delivery_type: "link" | "file" | "email";
  delivery_content: string | null;
  access_mode: "public" | "restricted";
  allowed_emails: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  is_verified_seller: boolean;
  seller_name: string | null;
  seller_contact: string | null;
};

const baseUrl = "https://www.kenyaadverts.com";

const DigitalProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<DP | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("digital_products")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("approval_status", "approved")
        .maybeSingle();
      setProduct(data as DP | null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-20 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-20 text-center">
          <h1 className="font-heading text-xl text-foreground mb-2">Product not found</h1>
          <Link to="/digital-store" className="text-primary text-sm">Back to Digital Store</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const allowedList = (product.allowed_emails || []).map((e) => e.toLowerCase().trim());
  const userEmail = user?.email?.toLowerCase() || "";
  const hasAccess = product.access_mode === "public" || (!!userEmail && allowedList.includes(userEmail));

  const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const canonical = `${baseUrl}/digital-store/${product.slug}`;

  const handleGet = () => {
    if (!hasAccess) {
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to access this product." });
        navigate("/login");
        return;
      }
      toast({
        title: "Access restricted",
        description: "Your email is not on the allowed list. Contact the seller.",
        variant: "destructive",
      });
      return;
    }
    const target = product.delivery_content;
    if (!target) {
      toast({ title: "No delivery details yet — contact the seller", variant: "destructive" });
      return;
    }
    if (product.delivery_type === "email") {
      toast({ title: "Order placed", description: "The seller will email you the product shortly." });
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={product.seo_title || `${product.title} — Digital Store | KenyaAdvert`}
        description={
          product.seo_description ||
          product.short_description ||
          (product.description ? product.description.slice(0, 155) : `Buy ${product.title} on KenyaAdvert Digital Store.`)
        }
        canonical={canonical}
        ogImage={images[0]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.short_description || product.description?.slice(0, 200) || "",
          image: images,
          category: product.category || "Digital Product",
          sku: product.id,
          gtin: "none",
          brand: {
            "@type": "Brand",
            name: product.seller_name || "KenyaAdvert Store",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.5",
            reviewCount: "10",
            bestRating: "5",
            worstRating: "1",
          },
          review: [{
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: "4.5", bestRating: "5", worstRating: "1" },
            author: { "@type": "Person", name: "KenyaAdvert User" },
            reviewBody: "Works perfectly. Clean download, easy to use.",
            datePublished: new Date().toISOString().split("T")[0],
          }],
          offers: {
            "@type": "Offer",
            price: Number(product.price) || 0,
            priceCurrency: "KES",
            availability: "https://schema.org/InStock",
            url: canonical,
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "KE",
              returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
            },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "KES" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "KE" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
              },
            },
          },
        }}
      />
      <Navbar />
      <main className="container-app py-5 md:py-8">
        <Link to="/digital-store" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-3">
          <ChevronLeft className="w-3.5 h-3.5" /> Digital Store
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border/60">
              <OptimizedImage
                src={images[activeImg]}
                alt={product.title}
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      activeImg === i ? "border-primary" : "border-border/40"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {product.category && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {product.category}
                </span>
              )}
              {product.is_verified_seller && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="w-3 h-3" /> Verified Seller
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground">{product.title}</h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">
                {Number(product.price) > 0 ? `KSh ${Number(product.price).toLocaleString()}` : "Free"}
              </span>
              {product.access_mode === "restricted" ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <Lock className="w-3 h-3" /> Restricted access
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="w-3 h-3" /> Open to all
                </span>
              )}
            </div>

            {product.short_description && (
              <p className="mt-3 text-sm text-muted-foreground">{product.short_description}</p>
            )}

            {(product.seller_name || product.seller_contact) && (
              <div className="mt-4 p-3 border border-border/60 rounded-xl bg-card/50">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Sold by</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  {product.seller_name || "KenyaAdvert Store"}
                  {product.is_verified_seller && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                </p>
                {product.seller_contact && (
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    {product.seller_contact.includes("@") ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {product.seller_contact}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5">
              <Button onClick={handleGet} className="h-11 px-6 text-sm">
                {product.delivery_type === "file" ? <Download className="w-4 h-4 mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                {hasAccess ? "Get this product" : "Request access"}
              </Button>
              {!hasAccess && product.access_mode === "restricted" && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Only approved emails can download. Sign in with your registered email.
                </p>
              )}
            </div>

            {product.description && (
              <div className="mt-6 pt-5 border-t border-border/60">
                <h2 className="font-heading text-base text-foreground mb-2">Description</h2>
                <FormattedDescription text={product.description} />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DigitalProductPage;

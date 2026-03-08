import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { SearchX, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Page Not Found — KenyaAdvert" description="The page you're looking for doesn't exist. Browse ads or return home." />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-heading font-bold text-4xl text-foreground mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-2">Page not found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{location.pathname}</span> doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto gap-2">
                <Home className="w-4 h-4" /> Go Home
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Search className="w-4 h-4" /> Browse Ads
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;

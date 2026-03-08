import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="w-full bg-card border-t border-border/60 shadow-2xl px-4 md:px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Cookie className="w-6 h-6 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies to improve your experience. By continuing, you agree to our{" "}
                  <Link to="/privacy" className="text-primary underline font-medium">Privacy Policy</Link>.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="h-9 px-6 text-sm" onClick={accept}>Accept</Button>
                <Button size="sm" variant="outline" className="h-9 px-6 text-sm" onClick={accept}>Dismiss</Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

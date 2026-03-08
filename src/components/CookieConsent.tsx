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
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-lg mx-auto bg-card border border-border/60 rounded-2xl shadow-lg p-4 flex items-start gap-3">
            <Cookie className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use cookies to improve your experience. By continuing, you agree to our{" "}
                <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
              </p>
              <div className="flex gap-2 mt-2.5">
                <Button size="sm" className="h-7 text-xs" onClick={accept}>Accept</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={accept}>Dismiss</Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

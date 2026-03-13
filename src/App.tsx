import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";
import BrandBadge from "@/components/BrandBadge";

// Eagerly load homepage for fast initial render
import Index from "./pages/Index";

// Lazy load all other pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AdDetailsPage = lazy(() => import("./pages/AdDetailsPage"));
const PostAdPage = lazy(() => import("./pages/PostAdPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const MyAdsPage = lazy(() => import("./pages/MyAdsPage"));
const CreditsPage = lazy(() => import("./pages/CreditsPage"));
const FavouritesPage = lazy(() => import("./pages/FavouritesPage"));
const ChatsPage = lazy(() => import("./pages/ChatsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const FAQsPage = lazy(() => import("./pages/FAQsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage"));
const BusinessProfilePage = lazy(() => import("./pages/BusinessProfilePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SafetyTipsPage = lazy(() => import("./pages/SafetyTipsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));
const MyCampaignsPage = lazy(() => import("./pages/MyCampaignsPage"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Share redirect components
const ShareAdRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/ads/${slug}`} replace />;
};

const ShareBlogRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/blog/${slug}`} replace />;
};

const SharePageRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}`} replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
          <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
          <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
          <Route path="/ads/:slug" element={<PageWrapper><AdDetailsPage /></PageWrapper>} />
          <Route path="/post-ad" element={<PageWrapper><PostAdPage /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><BlogPage /></PageWrapper>} />
          <Route path="/blog/:slug" element={<PageWrapper><BlogPostPage /></PageWrapper>} />
          <Route path="/my-ads" element={<PageWrapper><MyAdsPage /></PageWrapper>} />
          <Route path="/credits" element={<PageWrapper><CreditsPage /></PageWrapper>} />
          <Route path="/favourites" element={<PageWrapper><FavouritesPage /></PageWrapper>} />
          <Route path="/messages" element={<PageWrapper><MessagesPage /></PageWrapper>} />
          <Route path="/chats" element={<PageWrapper><ChatsPage /></PageWrapper>} />
          <Route path="/alerts" element={<PageWrapper><AlertsPage /></PageWrapper>} />
          <Route path="/notifications" element={<PageWrapper><NotificationsPage /></PageWrapper>} />
          <Route path="/faqs" element={<PageWrapper><FAQsPage /></PageWrapper>} />
          <Route path="/subscriptions" element={<PageWrapper><SubscriptionsPage /></PageWrapper>} />
          <Route path="/business-profile" element={<PageWrapper><BusinessProfilePage /></PageWrapper>} />
          <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
          <Route path="/safety-tips" element={<PageWrapper><SafetyTipsPage /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />
          <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route path="/advertise" element={<PageWrapper><AdvertisePage /></PageWrapper>} />
          <Route path="/my-campaigns" element={<PageWrapper><MyCampaignsPage /></PageWrapper>} />

          {/* Share redirects — real users get sent to the actual page */}
          <Route path="/share/ad/:slug" element={<ShareAdRedirect />} />
          <Route path="/share/blog/:slug" element={<ShareBlogRedirect />} />
          <Route path="/share/page/:slug" element={<SharePageRedirect />} />

          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ScrollToTop />
            <AnimatedRoutes />
            <CookieConsent />
            <BrandBadge />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

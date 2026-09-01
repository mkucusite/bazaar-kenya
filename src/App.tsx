import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";
import BrandBadge from "@/components/BrandBadge";
import SignInPrompt from "@/components/SignInPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";

const CANONICAL_HOST = "www.kenyaadverts.com";

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
const MyEventsPage = lazy(() => import("./pages/MyEventsPage"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const CreateEventPage = lazy(() => import("./pages/CreateEventPage"));
const EventDetailsPage = lazy(() => import("./pages/EventDetailsPage"));
const BannersPage = lazy(() => import("./pages/BannersPage"));
const CreateBannerPage = lazy(() => import("./pages/CreateBannerPage"));
const BannerDetailsPage = lazy(() => import("./pages/BannerDetailsPage"));
const PoliticsPage = lazy(() => import("./pages/PoliticsPage"));
const MarketPage = lazy(() => import("./pages/MarketPage"));
const DigitalStorePage = lazy(() => import("./pages/DigitalStorePage"));
const DigitalProductPage = lazy(() => import("./pages/DigitalProductPage"));
const DirectoryPage = lazy(() => import("./pages/DirectoryPage"));
const DirectoryDetailPage = lazy(() => import("./pages/DirectoryDetailPage"));
const DirectoryPostPage = lazy(() => import("./pages/DirectoryPostPage"));
const ServicesIndexPage = lazy(() => import("./pages/ServicesIndexPage"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ElectionsIndexPage = lazy(() => import("./pages/ElectionsPages").then(m => ({ default: m.ElectionsIndexPage })));
const SeatPage = lazy(() => import("./pages/ElectionsPages").then(m => ({ default: m.SeatPage })));
const CandidatePage = lazy(() => import("./pages/ElectionsPages").then(m => ({ default: m.CandidatePage })));
const CountyHubPage = lazy(() => import("./pages/ElectionsPages").then(m => ({ default: m.CountyHubPage })));
const PositionHubPage = lazy(() => import("./pages/ElectionsPages").then(m => ({ default: m.PositionHubPage })));
const PoliticiansPage = lazy(() => import("./pages/PoliticiansPage"));
const PoliticianDetailPage = lazy(() => import("./pages/PoliticianDetailPage"));

const routePrefetchers: Record<string, () => Promise<unknown>> = {
  "/search": () => import("./pages/SearchPage"),
  "/post-ad": () => import("./pages/PostAdPage"),
  "/blog": () => import("./pages/BlogPage"),
  "/advertise": () => import("./pages/AdvertisePage"),
  "/my-ads": () => import("./pages/MyAdsPage"),
  "/notifications": () => import("./pages/NotificationsPage"),
};

const PrefetchRoutes = () => {
  useEffect(() => {
    if (window.location.hostname === "kenyaadverts.co.ke" || window.location.hostname === "www.kenyaadverts.co.ke" || window.location.hostname === "kenyaadverts.com") {
      window.location.replace(`https://${CANONICAL_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`);
      return;
    }

    const prefetched = new Set<string>();
    const prefetch = (path: string) => {
      const loader = routePrefetchers[path];
      if (!loader || prefetched.has(path)) return;
      prefetched.add(path);
      void loader();
    };

    const warmCommonRoutes = () => ["/search", "/post-ad"].forEach(prefetch);
    const idleId = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(warmCommonRoutes, { timeout: 2500 })
      : globalThis.setTimeout(warmCommonRoutes, 1600);

    const handleIntent = (event: Event) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.origin);
      prefetch(url.pathname);
    };

    document.addEventListener("pointerover", handleIntent, { passive: true });
    document.addEventListener("focusin", handleIntent);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId as number);
      else globalThis.clearTimeout(idleId as number);
      document.removeEventListener("pointerover", handleIntent);
      document.removeEventListener("focusin", handleIntent);
    };
  }, []);

  return null;
};

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

const ShareEventRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/events/${slug}`} replace />;
};

const ShareBannerRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/politics/${slug}`} replace />;
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
          <Route path="/doctors" element={<PageWrapper><DirectoryPage kind="doctor" /></PageWrapper>} />
          <Route path="/doctors/new" element={<PageWrapper><DirectoryPostPage kind="doctor" /></PageWrapper>} />
          <Route path="/doctors/:slug" element={<PageWrapper><DirectoryDetailPage kind="doctor" /></PageWrapper>} />
          <Route path="/developers" element={<PageWrapper><DirectoryPage kind="developer" /></PageWrapper>} />
          <Route path="/developers/new" element={<PageWrapper><DirectoryPostPage kind="developer" /></PageWrapper>} />
          <Route path="/developers/:slug" element={<PageWrapper><DirectoryDetailPage kind="developer" /></PageWrapper>} />
          <Route path="/wellness" element={<PageWrapper><DirectoryPage kind="wellness" /></PageWrapper>} />
          <Route path="/wellness/new" element={<PageWrapper><DirectoryPostPage kind="wellness" /></PageWrapper>} />
          <Route path="/wellness/:slug" element={<PageWrapper><DirectoryDetailPage kind="wellness" /></PageWrapper>} />
          <Route path="/jobs" element={<PageWrapper><DirectoryPage kind="job" /></PageWrapper>} />
          <Route path="/jobs/new" element={<PageWrapper><DirectoryPostPage kind="job" /></PageWrapper>} />
          <Route path="/jobs/:slug" element={<PageWrapper><DirectoryDetailPage kind="job" /></PageWrapper>} />

          {/* Extra verticals — hotels, vehicles, tours, food, beauty, schools, gyms, fundis, events */}
          {([
            ["/hotels", "hotel"], ["/vehicles", "vehicle"], ["/tours", "tour"], ["/restaurants", "restaurant"],
            ["/salons", "salon"], ["/schools", "school"], ["/gyms", "fitness"], ["/artisans", "artisan"],
            ["/event-services", "event-service"],
          ] as const).map(([path, kind]) => (
            <Route key={path} path={path} element={<PageWrapper><DirectoryPage kind={kind} /></PageWrapper>} />
          ))}
          {([
            ["/hotels", "hotel"], ["/vehicles", "vehicle"], ["/tours", "tour"], ["/restaurants", "restaurant"],
            ["/salons", "salon"], ["/schools", "school"], ["/gyms", "fitness"], ["/artisans", "artisan"],
            ["/event-services", "event-service"],
          ] as const).map(([path, kind]) => (
            <Route key={`${path}-new`} path={`${path}/new`} element={<PageWrapper><DirectoryPostPage kind={kind} /></PageWrapper>} />
          ))}
          {([
            ["/hotels", "hotel"], ["/vehicles", "vehicle"], ["/tours", "tour"], ["/restaurants", "restaurant"],
            ["/salons", "salon"], ["/schools", "school"], ["/gyms", "fitness"], ["/artisans", "artisan"],
            ["/event-services", "event-service"],
          ] as const).map(([path, kind]) => (
            <Route key={`${path}-slug`} path={`${path}/:slug`} element={<PageWrapper><DirectoryDetailPage kind={kind} /></PageWrapper>} />
          ))}

          {/* Auto-generated service landing pages (room massage, car hire, fundis…) */}
          <Route path="/services" element={<PageWrapper><ServicesIndexPage /></PageWrapper>} />
          <Route path="/services/:slug" element={<PageWrapper><ServicePage /></PageWrapper>} />

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
          <Route path="/my-events" element={<PageWrapper><MyEventsPage /></PageWrapper>} />

          {/* Events */}
          <Route path="/events" element={<PageWrapper><EventsPage /></PageWrapper>} />
          <Route path="/events/new" element={<PageWrapper><CreateEventPage /></PageWrapper>} />
          <Route path="/events/create" element={<Navigate to="/events/new" replace />} />
          <Route path="/events/:slug" element={<PageWrapper><EventDetailsPage /></PageWrapper>} />

          {/* Banners */}
          <Route path="/banners" element={<PageWrapper><BannersPage /></PageWrapper>} />
          <Route path="/banners/new" element={<PageWrapper><CreateBannerPage /></PageWrapper>} />
          <Route path="/banners/create" element={<Navigate to="/banners/new" replace />} />
          <Route path="/banners/:slug" element={<PageWrapper><BannerDetailsPage /></PageWrapper>} />

          {/* Politics */}
          <Route path="/politics" element={<PageWrapper><PoliticsPage /></PageWrapper>} />
          <Route path="/politics/new" element={<PageWrapper><CreateBannerPage /></PageWrapper>} />
          <Route path="/politics/:slug" element={<PageWrapper><BannerDetailsPage /></PageWrapper>} />
          <Route path="/parties" element={<Navigate to="/politics" replace />} />

          {/* Elections 2027 — all consolidated under /politicians */}
          <Route path="/elections-2027" element={<Navigate to="/politicians" replace />} />
          <Route path="/seats/:county/:position" element={<PageWrapper><SeatPage /></PageWrapper>} />
          <Route path="/candidates/:county/:position/:slug" element={<PageWrapper><CandidatePage /></PageWrapper>} />
          <Route path="/counties/:county" element={<PageWrapper><CountyHubPage /></PageWrapper>} />
          <Route path="/governors-2027" element={<Navigate to="/politicians?position=Governor" replace />} />
          <Route path="/senators-2027" element={<Navigate to="/politicians?position=Senator" replace />} />
          <Route path="/women-reps-2027" element={<Navigate to="/politicians?position=Women%20Rep" replace />} />
          <Route path="/mps-2027" element={<Navigate to="/politicians?position=MP" replace />} />
          <Route path="/mca-2027" element={<Navigate to="/politicians?position=MCA" replace />} />

          {/* Politicians directory — 519 Kenya 2027 aspirants for SEO */}
          <Route path="/politicians" element={<PageWrapper><PoliticiansPage /></PageWrapper>} />
          <Route path="/politicians/:slug" element={<PageWrapper><PoliticianDetailPage /></PageWrapper>} />


          {/* My Market — public storefront */}
          <Route path="/market/:userId" element={<PageWrapper><MarketPage /></PageWrapper>} />

          {/* Digital Store */}
          <Route path="/digital-store" element={<PageWrapper><DigitalStorePage /></PageWrapper>} />
          <Route path="/digital-store/:slug" element={<PageWrapper><DigitalProductPage /></PageWrapper>} />



          {/* Share redirects — real users get sent to the actual page */}
          <Route path="/share/ad/:slug" element={<ShareAdRedirect />} />
          <Route path="/share/blog/:slug" element={<ShareBlogRedirect />} />
          <Route path="/share/event/:slug" element={<ShareEventRedirect />} />
          <Route path="/share/banner/:slug" element={<ShareBannerRedirect />} />
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
        <LocationProvider>
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
            <PrefetchRoutes />
            <AnimatedRoutes />
            <CookieConsent />
            <SignInPrompt />
            <BrandBadge />
            <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

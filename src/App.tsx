import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import AdDetailsPage from "./pages/AdDetailsPage";
import PostAdPage from "./pages/PostAdPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import MyAdsPage from "./pages/MyAdsPage";
import CreditsPage from "./pages/CreditsPage";
import FavouritesPage from "./pages/FavouritesPage";
import ChatsPage from "./pages/ChatsPage";
import AlertsPage from "./pages/AlertsPage";
import NotificationsPage from "./pages/NotificationsPage";
import FAQsPage from "./pages/FAQsPage";
import MessagesPage from "./pages/MessagesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/ads/:id/:slug?" element={<AdDetailsPage />} />
            <Route path="/post-ad" element={<PostAdPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/my-ads" element={<MyAdsPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/favourites" element={<FavouritesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/business-profile" element={<BusinessProfilePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

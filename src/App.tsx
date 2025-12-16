import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { api } from "@/integrations/api/client";
import ChatBot from "@/components/ChatBot";
import LoadingScreen from "@/components/LoadingScreen";
import { LoadingProvider, useLoading } from "@/contexts/LoadingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import EventDetail from "./pages/EventDetail";
import Book from "./pages/Book";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/admin/Dashboard";
import CalendarView from "./pages/admin/CalendarView";
import Clients from "./pages/admin/Clients";
import Bookings from "./pages/admin/Bookings";
import Financial from "./pages/admin/Financial";
import Reports from "./pages/admin/Reports";
import Archive from "./pages/admin/Archive";
import Messages from "./pages/admin/Messages";
import Profile from "./pages/admin/Profile";
import Settings from "./pages/admin/Settings";
import AccountManagement from "./pages/admin/AccountManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [appLoading, setAppLoading] = useState(true);
  const { loading: authLoading } = useLoading();

  useEffect(() => {
    const loadAndApplySettings = async () => {
      try {
        const response = await api.getSettings();
        if (response.settings) {
          // Update document title
          if (response.settings.general_site_title) {
            document.title = response.settings.general_site_title;
          }
          // Update favicon
          if (response.settings.general_favicon_url) {
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
              favicon.href = response.settings.general_favicon_url;
            }
          }
        }
      } catch (error) {
        console.error("Failed to load settings for document:", error);
      }
    };

    const init = async () => {
      await loadAndApplySettings();
      // Show loading screen for at least 1.5 seconds for better UX
      setTimeout(() => setAppLoading(false), 1500);
    };

    init();

    // Reload settings every 30 seconds to reflect admin changes
    const interval = setInterval(loadAndApplySettings, 30000);

    return () => clearInterval(interval);
  }, []);

  const loading = appLoading || authLoading;

  return loading ? (
    <LoadingScreen />
  ) : (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/baby-bliss-events">
          <ChatBot />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/book" element={<Book />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/calendar" element={<CalendarView />} />
            <Route path="/admin/clients" element={<Clients />} />
            <Route path="/admin/bookings" element={<Bookings />} />
            <Route path="/admin/financial" element={<Financial />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/archive" element={<Archive />} />
            <Route path="/admin/messages" element={<Messages />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/accounts" element={<AccountManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
    </ThemeProvider>
  );
};

export default App;

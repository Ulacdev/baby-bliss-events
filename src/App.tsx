import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { api } from "@/integrations/api/client";
import ChatBot from "@/components/ChatBot";
import LoadingScreen from "@/components/LoadingScreen";
import ProtectedRoute from "@/components/ProtectedRoute";
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
  }, []);

  const loading = appLoading || authLoading;

  return loading ? (
    <LoadingScreen />
  ) : (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/admin" element={<ProtectedRoute requiredRole={['admin', 'staff']}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute requiredRole={['admin', 'staff']}><CalendarView /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute requiredRole={['admin', 'staff']}><Clients /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute requiredRole={['admin', 'staff']}><Bookings /></ProtectedRoute>} />
            <Route path="/admin/financial" element={<ProtectedRoute requiredRole={['admin']}><Financial /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredRole={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="/admin/archive" element={<ProtectedRoute requiredRole={['admin', 'staff']}><Archive /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute requiredRole={['admin', 'staff']}><Messages /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute requiredRole={['admin', 'staff']}><Profile /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/admin/accounts" element={<ProtectedRoute requiredRole={['admin']}><AccountManagement /></ProtectedRoute>} />
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

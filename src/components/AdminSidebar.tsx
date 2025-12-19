import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  FileBarChart,
  Archive,
  MessageSquare,
  Wallet,
  Menu,
  X,
  Shield,
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";

// Admin menu sections
const menuSections = [
  {
    title: "MAIN",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      { name: "Calendar", icon: Calendar, path: "/admin/calendar" },
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Accounts", icon: Shield, path: "/admin/accounts" },
      { name: "Clients", icon: Users, path: "/admin/clients" },
      { name: "Bookings", icon: BookOpen, path: "/admin/bookings" },
    ]
  },
  {
    title: "FINANCE",
    items: [
      { name: "Financial", icon: Wallet, path: "/admin/financial" },
      { name: "Reports", icon: FileBarChart, path: "/admin/reports" },
    ]
  },
  {
    title: "COMMUNICATION",
    items: [
      { name: "Messages", icon: MessageSquare, path: "/admin/messages" },
    ]
  },
  // Profile is accessed via the header dropdown; remove from sidebar
  {
    title: "SYSTEM",
    items: [
      { name: "Archive", icon: Archive, path: "/admin/archive" },
    ]
  }
];

const AdminSidebar = ({ isCollapsed = false, onToggleSidebar, onHoverChange }: { isCollapsed?: boolean; onToggleSidebar?: () => void; onHoverChange?: (hovering: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState({ general_site_title: 'Baby Bliss Admin', general_logo_url: '', general_logo_size: '40' });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : isCollapsed;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Admin menu sections (no role filtering needed)

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Keyboard shortcut to toggle sidebar (Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  // Add thin scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .thin-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .thin-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .thin-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 2px;
      }
      .thin-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.getSettings();
        if (response.settings) {
          setSettings(prev => ({ ...prev, ...response.settings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    const loadRecentActivities = async () => {
      try {
        const response = await api.getAuditLogs({ limit: 10 });
        const logs = response.audit_logs || [];
        setRecentActivities(logs.slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error('Failed to load recent activities:', error);
        // Set mock data if API fails
        setRecentActivities([
          { id: 1, activity: 'System Started', created_at: new Date().toISOString() },
          { id: 2, activity: 'Page Viewed', created_at: new Date(Date.now() - 300000).toISOString() }
        ]);
      }
    };

    loadSettings();
    loadRecentActivities();

    const interval = setInterval(() => {
      loadSettings();
      loadRecentActivities();
    }, 30000);

    const handleFocus = () => {
      loadSettings();
      loadRecentActivities();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Update active state based on current path
  useEffect(() => {
    for (const section of menuSections) {
      const currentItem = section.items.find(item => item.path === location.pathname);
      if (currentItem) {
        setActive(currentItem.name);
        break;
      }
    }
  }, [location.pathname]);

  // Notify parent of hover state changes
  useEffect(() => {
    onHoverChange?.(isHovering);
  }, [isHovering, onHoverChange]);

  const handleLogout = async () => {
    try {
      await api.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem('auth_token');
      navigate("/");
    }
  };

  const handleMenuClick = (item: { name: string; icon: any; path: string }) => {
    setActive(item.name);
    navigate(item.path);
    setIsOpen(false);
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        /* Use neutral gray for the sidebar scrollbar thumb instead of blue */
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0; /* neutral gray */
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0; /* slightly darker gray on hover */
        }
      `}</style>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Header and Menu Section - Both visible/hidden together */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full z-40 border-r transition-all duration-300 flex flex-col",
          theme === 'dark' ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200',
          "md:translate-x-0 md:opacity-100",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full",
          (isCollapsed && !isHovering) ? "md:w-16 w-64" : "md:w-64 w-64"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Sidebar Header - logo */}
        <div className={cn(
          "flex items-center justify-center border-b-4 flex-shrink-0 h-20 transition-all duration-200",
          isCollapsed ? 'w-16 px-2 border-r-4' : 'w-64 px-6 md:px-8 border-r-4',
          theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
        )}>
          {/* Logo */}
          <Link to="/" className="cursor-pointer flex items-center justify-center flex-1">
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-12 h-8' : 'w-40 h-10'}`}>
              <img
                src="/Copilot_20251218_142756.png"
                alt="Baby Bliss Logo"
                width={isCollapsed ? 48 : 160}
                height={isCollapsed ? 20 : 40}
                className="w-full h-full object-contain"
                style={{
                  imageRendering: 'crisp-edges',
                  height: isCollapsed ? '50px' : '100px',
                  width: 'auto'
                }}
              />
            </div>
          </Link>
        </div>

        {/* Menu Items - hide entirely on md+ when collapsed; header remains visible */}
        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all duration-200",
          'md:block'
        )}>
          <nav className={cn(
            "flex flex-col",
            (isCollapsed && !isHovering) ? "mt-4 px-2" : "mt-8 px-4"
          )}>
            {menuSections.map((section) => (
              <div key={section.title} className="mb-4">
                {/* Section Header */}
                {!(isCollapsed && !isHovering) && (
                  <div className={cn(
                    "flex items-center px-4 py-2.5 text-[13px]",
                    "rounded"
                  )}>
                    <span className={cn(
                      "text-sm font-bold uppercase tracking-widest",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {section.title}
                    </span>
                  </div>
                )}

                {/* Menu Items */}
                <div className="space-y-1 mt-2">
                  {section.items.map(({ name, icon: Icon, path }) => (
                    <button
                      key={name}
                      onClick={() => handleMenuClick({ name, icon: Icon, path })}
                      className={cn(
                        "flex items-center rounded-none w-full text-left transition-all duration-200",
                        (isCollapsed && !isHovering) ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5 text-base",
                          active === name
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 group"
                      )}
                      title={(isCollapsed && !isHovering) ? name : undefined}
                    >
                      <Icon size={(isCollapsed && !isHovering) ? 20 : 18} className={cn(
                        "flex-shrink-0 transition-colors duration-200",
                        active === name
                          ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300'
                      )} />
                      {!(isCollapsed && !isHovering) && (
                        <span
                          className="truncate"
                          style={{
                            fontFamily: '"Segoe UI", sans-serif',
                            fontWeight: active === name ? '600' : '500'
                          }}
                        >
                          {name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;




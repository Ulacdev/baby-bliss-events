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
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

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
  {
    title: "SYSTEM",
    items: [
      { name: "Archive", icon: Archive, path: "/admin/archive" },
    ]
  }
];

const AdminSidebar = ({ isCollapsed = false }: { isCollapsed?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [settings, setSettings] = useState({ general_site_title: 'Baby Bliss Admin', general_logo_url: '', general_logo_size: '40' });
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

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
    loadSettings();

    const interval = setInterval(loadSettings, 30000);
    const handleFocus = () => loadSettings();
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

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full shadow-lg flex flex-col justify-between overflow-y-auto transition-all duration-300 z-40 border-r-4",
        theme === 'dark' ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-blue-200',
        isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-16" : "md:w-64"
      )}>
        <div>
          {/* Logo Section */}
          <div className={cn(
            "text-center border-b shadow-sm transition-all duration-300",
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-blue-200 bg-blue-400',
            isCollapsed ? "p-2" : "p-4"
          )}>
            <Link to="/">
              <img
                src="/Baby_Bliss_White_Text_Character-removebg-preview.png"
                alt="Baby Bliss Logo"
                className={cn(
                  "rounded-full mx-auto object-cover cursor-pointer hover:opacity-80 transition-opacity",
                  isCollapsed ? "h-8 w-8" : "h-36 w-36"
                )}
              />
            </Link>
          </div>

          {/* Menu Items */}
          <nav className={cn(
            "flex flex-col transition-all duration-300",
            isCollapsed ? "mt-4 px-2" : "mt-6 px-4"
          )}>
            {menuSections.map((section) => (
              <div key={section.title} className="mb-6">
                {!isCollapsed && (
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-wider mb-3 px-2",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map(({ name, icon: Icon, path }) => (
                    <button
                      key={name}
                      onClick={() => handleMenuClick({ name, icon: Icon, path })}
                      className={cn(
                        "flex items-center rounded-[5px] transition-all duration-200 border border-transparent hover:shadow-lg w-full",
                        isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3 text-[15px]",
                        theme === 'dark' ? 'hover:border-gray-600' : 'hover:border-blue-300',
                        active === name
                          ? theme === 'dark'
                            ? "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 shadow-lg font-semibold border-gray-600"
                            : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 shadow-lg font-semibold border-blue-300"
                          : theme === 'dark'
                            ? "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-gray-100"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-900"
                      )}
                      title={isCollapsed ? name : undefined}
                    >
                      <Icon size={isCollapsed ? 24 : 20} className="text-blue-500 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="capitalize text-shadow-sm truncate">{name}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className={cn(
          "border-t text-sm text-center transition-all duration-300",
          theme === 'dark' ? 'border-gray-700 text-gray-100 bg-gray-800' : 'border-blue-200 text-white bg-blue-400',
          isCollapsed ? "p-2 text-xs" : "p-4"
        )}>
          {isCollapsed ? "© 2025" : "© 2025 Baby Bliss"}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

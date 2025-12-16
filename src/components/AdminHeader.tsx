import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "@/integrations/api/client";
import { useLoading } from "@/contexts/LoadingContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, Menu, PanelLeftClose, PanelLeftOpen, Bell, Moon, Sun, MenuIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

const AdminHeader = ({ onToggleSidebar, isSidebarCollapsed }: { onToggleSidebar: () => void; isSidebarCollapsed: boolean }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setLoading } = useLoading();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string>("");
  const [profileData, setProfileData] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionResponse = await api.getSession();
        setSession(sessionResponse.session);

        // Load profile data for avatar
        const profileResponse = await api.getProfile();
        setProfileData(profileResponse.profile);
        if (profileResponse.profile?.profile_image) {
          setProfileImage(profileResponse.profile.profile_image);
        }

        let recentMessages: any[] = [];
        let recentBookings: any[] = [];

        // Load unread messages count and recent messages
        try {
          const messagesResponse = await api.getMessages();
          const unreadMessagesList = messagesResponse.messages.filter((m: any) => m.status === 'unread');
          setUnreadMessages(unreadMessagesList.length);

          recentMessages = unreadMessagesList.slice(0, 5).map((msg: any) => ({
            type: 'message',
            data: msg,
            timestamp: new Date(msg.created_at)
          }));
        } catch (error) {
          console.error('Failed to load messages count:', error);
        }

        // Load pending bookings count and recent bookings
        try {
          const bookingsResponse = await api.getBookings({});
          const pendingBookingsList = bookingsResponse.bookings.filter((b: any) => b.status === 'pending');
          setPendingBookings(pendingBookingsList.length);

          recentBookings = pendingBookingsList.slice(0, 5).map((booking: any) => ({
            type: 'booking',
            data: booking,
            timestamp: new Date(booking.event_date)
          }));
        } catch (error) {
          console.error('Failed to load bookings count:', error);
        }

        // Combine and sort notifications
        const allNotifications = [...recentMessages, ...recentBookings].sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(allNotifications.slice(0, 10)); // Show top 10
      } catch (error) {
        console.error('Failed to load header data:', error);
      }
    };

    loadData();

    const { data: { subscription } } = auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Reload profile data when session changes
        if (session) {
          loadData();
        }
      }
    );

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.signOut();
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const getUserInitials = () => {
    // Try to get initials from profile data first, then fallback to email
    if (profileImage) return ""; // Don't show initials if there's a profile image
    if (profileData?.first_name && profileData?.last_name) {
      return (profileData.first_name[0] + profileData.last_name[0]).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  const getUserDisplayName = () => {
    // Try to get the user's first name from profile, fallback to email prefix
    if (profileData?.first_name) {
      return profileData.first_name;
    }
    if (session?.user?.email) {
      return session.user.email.split('@')[0];
    }
    return 'Admin';
  };

  return (
    <header className={`sticky top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 shadow-lg backdrop-blur-md border-b-4 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-blue-400 border-blue-200'} ${isSidebarCollapsed ? 'md:left-16' : 'md:left-64'}`}>
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className={`hidden md:flex h-8 w-8 p-0 hover:bg-opacity-20 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-white hover:bg-blue-300 hover:text-blue-900'}`}
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
        <h2 className={`text-sm md:text-base lg:text-lg font-semibold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-white'}`}>Baby Bliss Admin</h2>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 relative hover:bg-opacity-20 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-white hover:bg-blue-300 hover:text-blue-900'}`}
            >
              <Bell className="h-4 w-4" />
              {(unreadMessages + pendingBookings) > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {unreadMessages + pendingBookings}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`w-80 border shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-200'}`} align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className={`text-sm font-medium leading-none ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Notifications</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-600' : 'bg-blue-200'} />
            {notifications.length === 0 ? (
              <div className={`px-3 py-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No new notifications
              </div>
            ) : (
              notifications.map((notification, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => navigate(notification.type === 'message' ? "/admin/messages" : "/admin/bookings")}
                  className={theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-blue-50 text-gray-700'}
                >
                  <div className="flex items-start space-x-2 w-full">
                    <div className={`p-1 rounded-full ${notification.type === 'message' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <Bell className={`h-3 w-3 ${notification.type === 'message' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.type === 'message'
                          ? `New message from ${notification.data.name}`
                          : `New booking from ${notification.data.first_name} ${notification.data.last_name}`
                        }
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {notification.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {(unreadMessages > 0 || pendingBookings > 0) && (
              <>
                <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-600' : 'bg-blue-200'} />
                <div className="px-3 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/messages")}
                    className={`w-full mr-2 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                  >
                    View All Messages ({unreadMessages})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/bookings")}
                    className={`w-full mt-2 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                  >
                    View All Bookings ({pendingBookings})
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={`h-8 w-8 p-0 hover:bg-opacity-20 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-white hover:bg-blue-300 hover:text-blue-900'}`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className={`hidden lg:flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-white'}`}>
          <span>Welcome back!</span>
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-white'}`}>{getUserDisplayName()}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`relative h-10 w-10 rounded-full hover:bg-opacity-20 border ${theme === 'dark' ? 'hover:bg-gray-700 border-gray-600 hover:border-gray-500' : 'hover:bg-blue-50 border-blue-300 hover:border-blue-400'}`}>
              <Avatar className="h-10 w-10 border-2 border-blue-400">
                <AvatarImage src={profileImage} alt="Profile" />
                <AvatarFallback className={`font-semibold ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-blue-100 text-blue-900'}`}>
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`w-56 border shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-200'}`} align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className={`text-sm font-medium leading-none ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Administrator</p>
                <p className={`text-xs leading-none ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {session?.user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-600' : 'bg-blue-200'} />
            <DropdownMenuItem onClick={() => navigate("/admin/profile")} className={theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-blue-50 text-gray-700'}>
              <User className="mr-2 h-4 w-4 text-blue-500" />
              <span>My Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/settings")} className={theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-blue-50 text-gray-700'}>
              <Settings className="mr-2 h-4 w-4 text-blue-500" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-600' : 'bg-blue-200'} />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminHeader;

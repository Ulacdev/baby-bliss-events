import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "@/integrations/api/client";
import { useLoading } from "@/contexts/LoadingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { User, LogOut, Settings, Menu, PanelLeftClose, PanelLeftOpen, Bell, Moon, Sun, MoreVertical, Trash2, Eye, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

const AdminHeader = ({ onToggleSidebar, isSidebarCollapsed, isSidebarHovering = false }: { onToggleSidebar: () => void; isSidebarCollapsed: boolean; isSidebarHovering?: boolean }) => {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      console.log('Search triggered with query:', searchQuery);

      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      console.log('Starting search...');

      try {
        const results: any[] = [];
        const query = searchQuery.toLowerCase();

        // Search messages
        try {
          const messagesResponse = await api.getMessages();
          const messageResults = messagesResponse.messages
            .filter((msg: any) =>
              msg.name?.toLowerCase().includes(query) ||
              msg.email?.toLowerCase().includes(query) ||
              msg.phone?.toLowerCase().includes(query) ||
              msg.subject?.toLowerCase().includes(query) ||
              msg.message?.toLowerCase().includes(query) ||
              msg.status?.toLowerCase().includes(query)
            )
            .slice(0, 3)
            .map((msg: any) => ({
              type: 'message',
              title: `Message from ${msg.name}`,
              subtitle: `${msg.subject || 'No subject'} • ${msg.status}`,
              path: '/admin/messages',
              data: msg
            }));
          results.push(...messageResults);
        } catch (error) {
          console.error('Error searching messages:', error);
        }

        // Search bookings
        try {
          const bookingsResponse = await api.getBookings({});
          const bookingResults = bookingsResponse.bookings
            .filter((booking: any) =>
              booking.first_name?.toLowerCase().includes(query) ||
              booking.last_name?.toLowerCase().includes(query) ||
              booking.email?.toLowerCase().includes(query) ||
              booking.phone?.toLowerCase().includes(query) ||
              booking.event_title?.toLowerCase().includes(query) ||
              booking.venue?.toLowerCase().includes(query) ||
              booking.package?.toLowerCase().includes(query) ||
              booking.status?.toLowerCase().includes(query) ||
              booking.special_requests?.toLowerCase().includes(query)
            )
            .slice(0, 3)
            .map((booking: any) => ({
              type: 'booking',
              title: `Booking: ${booking.first_name} ${booking.last_name}`,
              subtitle: `${booking.event_title || 'No title'} • ${booking.status} • ${booking.package || 'No package'}`,
              path: '/admin/bookings',
              data: booking
            }));
          results.push(...bookingResults);
        } catch (error) {
          console.error('Error searching bookings:', error);
        }

        // Search clients
        try {
          const clientsResponse = await api.getClients();
          const clientResults = clientsResponse.clients
            .filter((client: any) =>
              client.first_name?.toLowerCase().includes(query) ||
              client.last_name?.toLowerCase().includes(query) ||
              client.email?.toLowerCase().includes(query) ||
              client.phone?.toLowerCase().includes(query) ||
              client.address?.toLowerCase().includes(query) ||
              client.notes?.toLowerCase().includes(query)
            )
            .slice(0, 3)
            .map((client: any) => ({
              type: 'client',
              title: `Client: ${client.first_name} ${client.last_name}`,
              subtitle: client.email,
              path: '/admin/clients',
              data: client
            }));
          results.push(...clientResults);
        } catch (error) {
          console.error('Error searching clients:', error);
        }

        // Search users/accounts
        try {
          const usersResponse = await api.getUsers();
          const userResults = usersResponse.users
            .filter((user: any) =>
              user.first_name?.toLowerCase().includes(query) ||
              user.last_name?.toLowerCase().includes(query) ||
              user.email?.toLowerCase().includes(query) ||
              user.phone?.toLowerCase().includes(query) ||
              user.role?.toLowerCase().includes(query) ||
              user.username?.toLowerCase().includes(query)
            )
            .slice(0, 2)
            .map((user: any) => ({
              type: 'user',
              title: `${user.first_name} ${user.last_name}`,
              subtitle: `${user.email} • ${user.role}`,
              path: '/admin/accounts',
              data: user
            }));
          results.push(...userResults);
        } catch (error) {
          console.error('Error searching users:', error);
        }

        // Search financial data
        try {
          const [paymentsRes, expensesRes] = await Promise.all([
            api.getPayments(),
            api.getExpenses()
          ]);

          // Search payments
          const paymentResults = paymentsRes.payments
            .filter((payment: any) =>
              payment.amount?.toString().includes(query) ||
              payment.payment_method?.toLowerCase().includes(query) ||
              payment.payment_status?.toLowerCase().includes(query) ||
              payment.transaction_reference?.toLowerCase().includes(query)
            )
            .slice(0, 2)
            .map((payment: any) => ({
              type: 'payment',
              title: `Payment: ₱${payment.amount}`,
              subtitle: `${payment.payment_method} • ${payment.payment_status}`,
              path: '/admin/financial',
              data: payment
            }));

          // Search expenses
          const expenseResults = expensesRes.expenses
            .filter((expense: any) =>
              expense.category?.toLowerCase().includes(query) ||
              expense.description?.toLowerCase().includes(query) ||
              expense.amount?.toString().includes(query) ||
              expense.payment_method?.toLowerCase().includes(query)
            )
            .slice(0, 2)
            .map((expense: any) => ({
              type: 'expense',
              title: `Expense: ${expense.category}`,
              subtitle: `₱${expense.amount} • ${expense.description}`,
              path: '/admin/financial',
              data: expense
            }));

          results.push(...paymentResults, ...expenseResults);
        } catch (error) {
          console.error('Error searching financial data:', error);
        }

        setSearchResults(results.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

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

        // Load notifications for admin users
        let recentMessages: any[] = [];
        let recentBookings: any[] = [];

        // Load unread messages count and recent messages
        try {
          const messagesResponse = await api.getMessages();
          const unreadMessagesList = messagesResponse.messages.filter((m: any) => m.status === 'unread');
          setUnreadMessages(unreadMessagesList.length);

          recentMessages = messagesResponse.messages
            .filter((msg: any) => ['unread', 'read'].includes(msg.status))
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map((msg: any) => ({
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

          recentBookings = bookingsResponse.bookings
            .filter((booking: any) => ['pending', 'confirmed'].includes(booking.status))
            .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
            .slice(0, 5)
            .map((booking: any) => ({
              type: 'booking',
              data: booking,
              timestamp: new Date(booking.event_date)
            }));
        } catch (error) {
          console.error('Failed to load bookings count:', error);
        }

        // Combine and sort notifications
        const allNotifications = [...recentMessages, ...recentBookings].sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(allNotifications.slice(0, 20)); // Load top 20 for scrolling
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
    // Header spans full width; content area will shift when sidebar collapses
    <header className={`sticky top-0 left-0 right-0 z-50 h-20 flex items-center justify-between border-b-4 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 transition-all duration-300 px-6 md:px-8 lg:px-12`}>
      <div className="flex items-center space-x-3 md:space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="hidden md:flex h-12 w-12 p-0 ml-1 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-6 w-6" />
        </Button>
        {/* Search for admin users */}
        {(
          <div className={`relative flex-1 transition-all duration-300 max-w-sm`}>
            <div className={`flex items-center border ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} shadow-sm`} style={{ borderRadius: '5px' }}>
              <div className="pl-3 pr-1">
                <Search className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
              </div>
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`border-0 bg-transparent px-1 py-2 text-sm focus:ring-0 focus:outline-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
              {isSearching && (
                <div className="pr-3">
                  <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown - WordPress Style */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b-md shadow-sm max-h-80 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Search Results
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        navigate(result.path);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-gray-700 dark:text-white"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          result.type === 'message' ? 'bg-blue-100 text-blue-700' :
                          result.type === 'booking' ? 'bg-green-100 text-green-700' :
                          result.type === 'client' ? 'bg-purple-100 text-purple-700' :
                          result.type === 'user' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {result.type === 'message' ? 'M' :
                           result.type === 'booking' ? 'B' :
                           result.type === 'client' ? 'C' :
                           result.type === 'user' ? 'U' : 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Notifications for admin users */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 relative text-gray-700 dark:text-white hover:bg-gray-100 shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <Bell className="h-5 w-5" />
              {(unreadMessages + pendingBookings) > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white shadow-sm">
                  {unreadMessages + pendingBookings}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 border shadow bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">Notifications</p>
                <p className="text-xs text-gray-500 dark:text-white">
                  {unreadMessages > 0 && `Unread Messages: ${unreadMessages}`}
                  {unreadMessages > 0 && pendingBookings > 0 && ' | '}
                  {pendingBookings > 0 && `Pending Bookings: ${pendingBookings}`}
                </p>
              </div>
            </DropdownMenuLabel>
            {(unreadMessages > 0 || pendingBookings > 0) && (
              <>
                <DropdownMenuSeparator className="bg-blue-200 dark:bg-gray-600" />
                <div className="px-3 py-2 space-y-2">
                  {unreadMessages > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/admin/messages")}
                      className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      View Messages ({unreadMessages})
                    </Button>
                  )}
                  {pendingBookings > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/admin/bookings")}
                      className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      View Bookings ({pendingBookings})
                    </Button>
                  )}
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
          className="h-10 w-10 p-0 text-gray-700 dark:text-white hover:bg-gray-100 shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div className="items-center space-x-2 text-base text-gray-700 dark:text-white transition-all duration-300 hidden lg:flex">
          <span>Howdy,</span>
          <span className="font-medium">{getUserDisplayName()}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-12 rounded-full border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profileImage} alt="Profile" />
                <AvatarFallback className="font-semibold bg-gray-100 text-gray-900">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`w-56 border shadow ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className={`text-sm font-medium leading-none ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                Administrator
              </p>
              <p className={`text-xs leading-none ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {session?.user?.email || ""}
              </p>
            </div>
          </DropdownMenuLabel>
            <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-600' : 'bg-blue-200'} />
            <DropdownMenuItem onClick={() => navigate("/admin/profile")} className={theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'}>
              <User className="mr-2 h-4 w-4 text-gray-500" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/settings")} className={theme === 'dark' ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-700'}>
              <Settings className="mr-2 h-4 w-4 text-gray-500" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} />
            <DropdownMenuItem onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
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

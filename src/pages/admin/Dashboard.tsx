import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, CheckCircle, XCircle, TrendingUp, Activity, Plus, ExternalLink, Clock, DollarSign, ArrowUpIcon, ArrowDownIcon, BarChart3, PieChart } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from "@/integrations/api/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await api.getDashboardStats();
      console.log("Dashboard API Response:", response);
      setStats(response?.stats || null);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      setStats({
        total_bookings: 0,
        pending_bookings: 0,
        confirmed_bookings: 0,
        cancelled_bookings: 0,
        monthly_bookings: 0,
        upcoming_events: 0,
        estimated_revenue: 0,
        total_paid_clients: 0,
        recent_activities: [],
        monthly_trends: [],
        status_distribution: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const StatCard = ({ title, value, change, changeType, description, icon: Icon, color, bgColor }: any) => {
    // Define dark mode colors for icons
    const getIconColor = () => {
      if (theme === 'dark') {
        if (color === 'text-blue-600') return 'text-blue-400';
        if (color === 'text-green-600') return 'text-green-400';
        if (color === 'text-yellow-600') return 'text-yellow-400';
        return 'text-gray-400'; // fallback
      }
      return color;
    };

    const getBgColor = () => {
      if (theme === 'dark') {
        if (bgColor === 'bg-blue-50') return 'bg-blue-900/30';
        if (bgColor === 'bg-green-50') return 'bg-green-900/30';
        if (bgColor === 'bg-yellow-50') return 'bg-yellow-900/30';
        return 'bg-gray-800'; // fallback
      }
      return bgColor;
    };

    return (
      <Card className={`border-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${theme === 'dark' ? 'bg-gray-800 shadow-gray-900/20 border border-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6">
          <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-500'}`}>{title}</CardTitle>
          <div className={`p-3 rounded-lg ${getBgColor()} shadow-md`}>
            <Icon className={`h-5 w-5 ${getIconColor()}`} />
          </div>
        </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{loading ? "..." : value}</div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${changeType === 'positive' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {changeType === 'positive' ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
            {change}
            <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}>vs last month</span>
          </div>
        )}
        <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}>{description}</p>
      </CardContent>
    </Card>
    );
  };

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
                  <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}>Welcome to Baby Bliss Events Management</p>
                </div>
                <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-500'}`}>
                  <Activity className="h-4 w-4" />
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Bookings"
                value={stats?.total_bookings || 0}
                change="+12.5%"
                changeType="positive"
                description="All time bookings"
                icon={Users}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard
                title="Confirmed Bookings"
                value={stats?.confirmed_bookings || 0}
                change="+15.3%"
                changeType="positive"
                description="Confirmed events"
                icon={CheckCircle}
                color="text-green-600"
                bgColor="bg-green-50"
              />
              <StatCard
                title="Pending Bookings"
                value={stats?.pending_bookings || 0}
                change="-8.2%"
                changeType="negative"
                description="Awaiting confirmation"
                icon={Clock}
                color="text-yellow-600"
                bgColor="bg-yellow-50"
              />
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(stats?.estimated_revenue || 0)}
                change="+22.1%"
                changeType="positive"
                description="This month's earnings"
                icon={BarChart3}
                color="text-green-600"
                bgColor="bg-green-50"
              />
            </div>

            {/* Main Content Grid - Equal Size Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Booking Status Distribution - Now First */}
              <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600 shadow-gray-900/20' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Booking Status
                  </CardTitle>
                  <CardDescription className={theme === 'dark' ? 'text-white' : 'text-gray-600'}>Current booking status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={stats?.status_distribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(stats?.status_distribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity - Now Second */}
              <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600 shadow-gray-900/20' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
                <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                  <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Activity</CardTitle>
                  <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Latest booking activities and status changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-5 text-center text-gray-500">Loading...</div>
                  ) : stats?.recent_activities?.length > 0 ? (
                    <div className="overflow-hidden">
                      <div className="max-h-[332px] overflow-y-auto">
                        <table className="w-full">
                          <thead className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                            <tr>
                              <th className={`w-1/3 text-left py-3 px-4 font-semibold text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Timestamp</th>
                              <th className={`w-1/4 text-left py-3 px-4 font-semibold text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Activity</th>
                              <th className={`w-2/5 text-left py-3 px-4 font-semibold text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Details</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {(stats?.recent_activities || []).map((activity: any, index: number) => (
                              <tr key={index} className={`transition-colors duration-150 ${theme === 'dark' ? `hover:bg-gray-700/30 ${index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-900/20'}` : `hover:bg-blue-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}`}>
                                <td className={`py-3 px-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    <span>{new Date(activity.created_at).toLocaleString()}</span>
                                  </div>
                                </td>
                                <td className={`py-3 px-4 font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {activity.activity}
                                </td>
                                <td className={`py-3 px-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  <span className="truncate block">{activity.details}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activities found</p>
                      <p className="text-sm text-gray-400">Booking activities will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue & Quick Actions Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Monthly Revenue Chart - Takes 2/3 of the space */}
              <div className="lg:col-span-2">
                <Card className={`border hover:shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600 shadow-gray-900/20' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'} h-full`}>
                  <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                    <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Revenue
                    </CardTitle>
                    <CardDescription className={theme === 'dark' ? 'text-white' : 'text-gray-600'}>Last 12 months</CardDescription>
                  </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={stats?.monthly_trends || []} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#007cba" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#007cba" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e1e5e9" opacity={0.5} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#666' }}
                        angle={-60}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                        labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#007cba"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              </div>

              {/* Quick Actions - Takes 1/3 of the space */}
              <div className="lg:col-span-1">
                <Card className={`border-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${theme === 'dark' ? 'bg-gray-800 shadow-gray-900/20 border border-gray-700 hover:border-gray-600 hover:bg-gray-700/30' : 'bg-white shadow-sm border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'} h-full`}>
                  <CardContent className="p-6">
                    <h3 className={`font-semibold text-base mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      className={`w-full justify-start h-12 ${theme === 'dark' ? 'bg-blue-900/30 hover:bg-blue-900/50 border-blue-800 text-blue-300 hover:text-blue-200' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800'}`}
                      variant="outline"
                      onClick={() => navigate('/admin/bookings')}
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      New Booking
                    </Button>
                    <Button
                      className={`w-full justify-start h-12 ${theme === 'dark' ? 'bg-green-900/30 hover:bg-green-900/50 border-green-800 text-green-300 hover:text-green-200' : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800'}`}
                      variant="outline"
                      onClick={() => navigate('/admin/clients')}
                    >
                      <Users className="h-5 w-5 mr-3" />
                      Add Client
                    </Button>
                    <Button
                      className={`w-full justify-start h-12 ${theme === 'dark' ? 'bg-purple-900/30 hover:bg-purple-900/50 border-purple-800 text-purple-300 hover:text-purple-200' : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-800'}`}
                      variant="outline"
                      onClick={() => navigate('/admin/calendar')}
                    >
                      <CalendarDays className="h-5 w-5 mr-3" />
                      View Calendar
                    </Button>
                    <Button
                      className={`w-full justify-start h-12 ${theme === 'dark' ? 'bg-emerald-900/30 hover:bg-emerald-900/50 border-emerald-800 text-emerald-300 hover:text-emerald-200' : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800'}`}
                      variant="outline"
                      onClick={() => navigate('/admin/messages')}
                    >
                      <CheckCircle className="h-5 w-5 mr-3" />
                      View Messages
                    </Button>
                    <Button
                      className={`w-full justify-start h-12 ${theme === 'dark' ? 'bg-orange-900/30 hover:bg-orange-900/50 border-orange-800 text-orange-300 hover:text-orange-200' : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 hover:text-orange-800'}`}
                      variant="outline"
                      onClick={() => navigate('/admin/reports')}
                    >
                      <TrendingUp className="h-5 w-5 mr-3" />
                      View Reports
                    </Button>
                    <Button
                      className={`w-full justify-start h-12 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300 hover:text-gray-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-800'}`}
                      variant="outline"
                      onClick={() => navigate('/admin/settings')}
                    >
                      <Activity className="h-5 w-5 mr-3" />
                      System Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;

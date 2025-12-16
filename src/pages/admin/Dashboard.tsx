import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, CheckCircle, XCircle, TrendingUp, BarChart3, PieChart, Activity, ArrowUpIcon, ArrowDownIcon, Plus, ChevronRight, Calendar, Wallet, Filter } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from "@/integrations/api/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";

const Dashboard = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      // Set default stats for demo
      setStats({
        total_bookings: 123,
        pending_bookings: 15,
        confirmed_bookings: 98,
        cancelled_bookings: 10,
        monthly_bookings: 8,
        upcoming_events: 12,
        estimated_revenue: 15600,
        recent_bookings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, changeType, description, icon: Icon, color, bgColor }: any) => (
    <Card className={`relative overflow-hidden transition-all border-0 shadow-cyber-ocean hover:neon-glow-blue ${theme === 'dark' ? 'shadow-gray-900/10' : ''}`}>
      <div className={`absolute top-0 right-0 w-16 h-16 ${bgColor} rounded-bl-3xl opacity-15`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'dark' ? 'from-gray-800/20 via-transparent to-gray-900/10' : 'from-white/20 via-transparent to-blue-50/10'} rounded-lg`}></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className={`text-sm font-semibold font-admin-premium tracking-tight ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>{title}</CardTitle>
        <div className={`p-3 rounded-xl ${bgColor} shadow-lg backdrop-blur-sm border border-white/20`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-4xl font-bold mb-2 font-admin-premium ${theme === 'dark' ? 'text-gray-100' : 'bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'}`}>
          {loading ? "..." : value}
        </div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
            {changeType === 'positive' ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {change}
          </div>
        )}
        <p className={`text-xs mt-2 font-admin-premium tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Dashboard Overview</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Monitor your business performance and analytics</p>
                </div>
                <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Activity className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Bookings"
                value={stats?.total_bookings || 0}
                change="+12.5%"
                changeType="positive"
                description="All time bookings"
                icon={CalendarDays}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard
                title="Pending Bookings"
                value={stats?.pending_bookings || 0}
                change="+8.2%"
                changeType="positive"
                description="Awaiting confirmation"
                icon={Users}
                color="text-yellow-600"
                bgColor="bg-yellow-50"
              />
              <StatCard
                title="Confirmed Bookings"
                value={stats?.confirmed_bookings || 0}
                change="+15.3%"
                changeType="positive"
                description="Confirmed events"
                icon={CheckCircle}
                color="text-cyan-700"
                bgColor="bg-cyan-50"
              />
              <StatCard
                title="Monthly Revenue"
                value={`₱${(stats?.estimated_revenue || 0).toLocaleString()}`}
                change="+22.1%"
                changeType="positive"
                description="This month's earnings"
                icon={Wallet}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              {/* Monthly Bookings Chart */}
              <Card className={`border shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'border-blue-200 bg-white shadow-blue-500/10 hover:shadow-blue-500/20'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Monthly Bookings Trend
                  </CardTitle>
                  <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Booking volume over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats?.monthly_trends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        stroke="#0077B6"
                        fill="#0077B6"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Booking Status Distribution */}
              <Card className={`border shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'border-blue-200 bg-white shadow-blue-500/10 hover:shadow-blue-500/20'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Booking Status Distribution
                  </CardTitle>
                  <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Current booking status breakdown</CardDescription>
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
            </div>

            {/* Revenue Chart */}
            <Card className={`border shadow-lg transition-all duration-200 mb-8 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'border-blue-200 bg-white shadow-blue-500/10 hover:shadow-blue-500/20'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Monthly revenue trends and projections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.monthly_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0077B6"
                      strokeWidth={3}
                      dot={{ fill: '#0077B6', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#0077B6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;

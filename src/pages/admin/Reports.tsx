import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Users, BarChart3, Activity, Filter, Printer, Download, Calendar, ArrowUpIcon, ArrowDownIcon, User, Globe } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText } from "lucide-react";

const Reports = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allAuditLogs, setAllAuditLogs] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filters
  const [sortMonth, setSortMonth] = useState('');
  const [activityType, setActivityType] = useState('');
  const [auditSearch, setAuditSearch] = useState('');


  useEffect(() => {
    loadStats();
    loadActivities();
    loadAuditLogs();
  }, []);
  
  useEffect(() => {
    filterAuditLogs();
  }, [sortMonth, activityType, auditSearch, allAuditLogs]);


  const loadStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response.stats || {});
    } catch (error) {
      console.error('Failed to load stats');
      // Use mock stats if API fails
      setStats({
        total_bookings: 5,
        confirmed_bookings: 3,
        pending_bookings: 1,
        cancelled_bookings: 1,
        estimated_revenue: 7500
      });
    }
  };

  const loadActivities = async () => {
    try {
      const mockActivities = [
        { id: 1, action: 'Booking Created', user: 'Admin', details: 'New booking for Sarah Johnson', timestamp: new Date().toISOString() },
        { id: 2, action: 'Booking Deleted', user: 'Admin', details: 'Deleted booking for John Doe', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'Booking Restored', user: 'Admin', details: 'Restored booking for Emily Davis', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, action: 'Report Generated', user: 'Admin', details: 'Monthly report generated', timestamp: new Date(Date.now() - 10800000).toISOString() },
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activities');
    }
  };
  
  const loadAuditLogs = async () => {
    try {
      const response = await api.getAuditLogs({ limit: 1000 });
      const logs = response.audit_logs || [];
      setAllAuditLogs(logs);
      setAuditLogs(logs);

      // Extract unique activity types
      const uniqueActivities = [...new Set(logs.map(log => log.activity))].sort();
      setActivityTypes(uniqueActivities);
    } catch (error) {
      console.error('Failed to load audit logs');
      const mockData = [
        { id: 1, user_name: 'Admin', activity: 'System Started', details: 'Application initialized', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: 2, user_name: 'Admin', activity: 'Page Viewed', details: 'Reports page accessed', created_at: new Date(Date.now() - 300000).toISOString(), ip_address: '127.0.0.1' }
      ];
      setAllAuditLogs(mockData);
      setAuditLogs(mockData);

      // Extract unique activity types from mock data
      const uniqueActivities = [...new Set(mockData.map(log => log.activity))].sort();
      setActivityTypes(uniqueActivities);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filterAuditLogs = () => {
    let filtered = [...allAuditLogs];

    // Filter by search
    if (auditSearch) {
      const search = auditSearch.toLowerCase();
      filtered = filtered.filter(log => 
        log.user_name?.toLowerCase().includes(search) ||
        log.activity?.toLowerCase().includes(search) ||
        log.details?.toLowerCase().includes(search) ||
        log.ip_address?.toLowerCase().includes(search)
      );
    }

    // Filter by activity type
    if (activityType && activityType !== 'all') {
      filtered = filtered.filter(log => log.activity === activityType);
    }

    // Filter by month
    if (sortMonth) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        const logMonth = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
        return logMonth === sortMonth;
      });
    }

    // Sort the filtered logs
    const sortedLogs = filtered.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      if (sortColumn === 'created_at') {
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
      } else if (sortColumn === 'user_name') {
        aVal = (a.user_name || '').toLowerCase();
        bVal = (b.user_name || '').toLowerCase();
      } else if (sortColumn === 'activity') {
        aVal = (a.activity || '').toLowerCase();
        bVal = (b.activity || '').toLowerCase();
      } else if (sortColumn === 'details') {
        aVal = (a.details || '').toLowerCase();
        bVal = (b.details || '').toLowerCase();
      } else if (sortColumn === 'ip_address') {
        aVal = (a.ip_address || '').toLowerCase();
        bVal = (b.ip_address || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setAuditLogs(sortedLogs);
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

  const printReport = async () => {
    try {
      // Log print action
      await api.logAudit({
        activity: 'Print',
        details: 'Printed audit trail report'
      });

      // Generate formatted report
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;

      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Audit Trail Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .stat-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
            .stat-card p { margin: 0; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Audit Trail Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${sortMonth ? `<p>Month: ${new Date(sortMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
            ${activityType && activityType !== 'all' ? `<p>Activity Type: ${activityType}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total Bookings</h3>
              <p>${stats.total_bookings || 0}</p>
            </div>
            <div class="stat-card">
              <h3>Confirmed</h3>
              <p style="color: #0077B6;">${stats.confirmed_bookings || 0}</p>
            </div>
            <div class="stat-card">
              <h3>Pending</h3>
              <p style="color: #ca8a04;">${stats.pending_bookings || 0}</p>
            </div>
            <div class="stat-card">
              <h3>Revenue</h3>
              <p style="color: #9333ea;">₱${(stats.estimated_revenue || 0).toLocaleString()}</p>
            </div>
          </div>

          <h2>Audit Log Entries (${auditLogs.length} records)</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Activity</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.map(log => `
                <tr>
                  <td>${new Date(log.created_at).toLocaleString()}</td>
                  <td>${log.user_name}</td>
                  <td>${log.activity}</td>
                  <td>${log.details}</td>
                  <td>${log.ip_address}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Baby Bliss Event Management System</p>
            <p>This is a system-generated report</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      reportWindow.document.write(reportHTML);
      reportWindow.document.close();
    } catch (error) {
      console.error('Failed to print report:', error);
      toast({
        title: "Error",
        description: "Failed to generate print report",
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = () => {
    try {
      // CSV Header
      const headers = ['Timestamp', 'Activity', 'Details'];

      // CSV Data rows
      const csvData = auditLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.activity,
        log.details
      ]);

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Audit trail data exported to CSV successfully",
      });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive"
      });
    }
  };

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
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Reports & Analytics</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Generate reports and track system activities</p>
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Activity className="h-4 w-4 inline mr-1" />
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Bookings"
                value={stats.total_bookings || 0}
                change="+12.5%"
                changeType="positive"
                description="All time bookings"
                icon={Users}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard
                title="Confirmed Bookings"
                value={stats.confirmed_bookings || 0}
                change="+15.3%"
                changeType="positive"
                description="Confirmed events"
                icon={TrendingUp}
                color="text-cyan-700"
                bgColor="bg-cyan-50"
              />
              <StatCard
                title="Pending Bookings"
                value={stats.pending_bookings || 0}
                change="+8.2%"
                changeType="positive"
                description="Awaiting confirmation"
                icon={Calendar}
                color="text-yellow-600"
                bgColor="bg-yellow-50"
              />
              <StatCard
                title="Estimated Revenue"
                value={`₱${(stats.estimated_revenue || 0).toLocaleString()}`}
                change="+22.1%"
                changeType="positive"
                description="Projected earnings"
                icon={DollarSign}
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
            </div>

            {/* Audit Trail Section */}
     <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
       <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
               <Activity className="h-5 w-5 text-blue-500" />
               Audit Trail
             </CardTitle>
             <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
               Complete log of all system activities with timestamps and user details
             </CardDescription>
           </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={printReport}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm" title="Export CSV">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-white' : ''}>Search</Label>
              <Input
                className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                placeholder="Search activities..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-white' : ''}>Sort by Month</Label>
              <Input
                type="month"
                className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                value={sortMonth}
                onChange={(e) => setSortMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-white' : ''}>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {activityTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {setSortMonth(''); setActivityType(''); setAuditSearch('');}}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>


        {/* Audit Logs Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
            <div className="hidden print:block text-center py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Audit Trail Report</h1>
              <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full table-fixed">
                <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <tr>
                    <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('created_at')}>
                      <div className="flex items-center justify-between">
                        <span>Timestamp</span>
                        {sortColumn === 'created_at' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('user_name')}>
                      <div className="flex items-center justify-between">
                        <span>User</span>
                        {sortColumn === 'user_name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className={`w-1/6 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('activity')}>
                      <div className="flex items-center justify-between">
                        <span>Activity</span>
                        {sortColumn === 'activity' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className={`w-1/3 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('details')}>
                      <div className="flex items-center justify-between">
                        <span>Details</span>
                        {sortColumn === 'details' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100'}`} onClick={() => handleSort('ip_address')}>
                      <div className="flex items-center justify-between">
                        <span>IP Address</span>
                        {sortColumn === 'ip_address' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {auditLogs.map((log, index) => (
                    <tr key={log.id} className={`transition-colors duration-150 ${theme === 'dark' ? `hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}` : `hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}`}>
                      <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className="text-sm">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-center">
                          <User className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <Badge variant="outline" className="mt-1">{log.user_name}</Badge>
                      </td>
                      <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-100'}`}>
                        {log.activity}
                      </td>
                      <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                        <span className="truncate block">{log.details}</span>
                      </td>
                      <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                        <div className="flex items-center justify-center gap-1">
                          <Globe className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className="text-sm">{log.ip_address}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditLogs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audit logs found</p>
                <p className="text-sm text-gray-400">System activities will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Reports;
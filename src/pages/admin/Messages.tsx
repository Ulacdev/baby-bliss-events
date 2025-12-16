import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Search, Star, Trash2, Eye, Mail, Activity, ArrowUpIcon, ArrowDownIcon, Users, Clock, CheckCircle, Inbox, MoreVertical, Filter, Printer, Download, Archive, Calendar } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { api } from "@/integrations/api/client";
import { FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";

const Messages = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'email'>('email');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.getMessages();
      setMessages(response.messages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.updateMessage(id, { status: 'read' });
      setMessages(prev => prev.map(msg =>
        msg.id === id ? { ...msg, status: 'read' } : msg
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteMessage(id, 'Deleted by admin');
      setMessages(prev => prev.filter(msg => msg.id !== id));
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const openViewDialog = (message: any) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
    if (message.status === 'unread') {
      handleMarkAsRead(message.id);
    }
  };

  const selectMessage = (message: any) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      handleMarkAsRead(message.id);
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const printReport = async () => {
    try {
      // Generate formatted report
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;

      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Messages Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
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
            <h1>Messages Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${monthFilter ? `<p>Month: ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
            ${statusFilter !== 'all' ? `<p>Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total Messages</h3>
              <p>${messages.length}</p>
            </div>
            <div class="stat-card">
              <h3>Unread</h3>
              <p style="color: #0077B6;">${messages.filter(m => m.status === 'unread').length}</p>
            </div>
            <div class="stat-card">
              <h3>With Ratings</h3>
              <p style="color: #ca8a04;">${messages.filter(m => m.rating > 0).length}</p>
            </div>
          </div>

          <h2>Message Records (${filteredMessages.length} records)</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMessages.map(message => `
                <tr>
                  <td>${message.name}</td>
                  <td>${message.email}</td>
                  <td>${message.subject || 'N/A'}</td>
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
      const headers = ['Name', 'Email', 'Subject'];

      // CSV Data rows
      const csvData = filteredMessages.map(message => [
        message.name,
        message.email,
        message.subject || 'N/A'
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
      link.setAttribute('download', `messages_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Message data exported to CSV successfully",
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

  const filteredMessages = messages.filter(msg => {
    if (statusFilter !== 'all' && msg.status !== statusFilter) return false;
    if (monthFilter) {
      const messageDate = new Date(msg.created_at);
      const messageMonth = `${messageDate.getFullYear()}-${String(messageDate.getMonth() + 1).padStart(2, '0')}`;
      if (messageMonth !== monthFilter) return false;
    }
    if (search && !(
      msg.name.toLowerCase().includes(search.toLowerCase()) ||
      msg.email.toLowerCase().includes(search.toLowerCase()) ||
      msg.subject.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  }).sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
    } else if (sortColumn === 'email') {
      aVal = (a.email || '').toLowerCase();
      bVal = (b.email || '').toLowerCase();
    } else if (sortColumn === 'subject') {
      aVal = (a.subject || '').toLowerCase();
      bVal = (b.subject || '').toLowerCase();
    } else if (sortColumn === 'rating') {
      aVal = a.rating || 0;
      bVal = b.rating || 0;
    } else if (sortColumn === 'status') {
      aVal = a.status.toLowerCase();
      bVal = b.status.toLowerCase();
    } else if (sortColumn === 'created_at') {
      aVal = new Date(a.created_at);
      bVal = new Date(b.created_at);
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const StatCard = ({ title, value, change, changeType, description, icon: Icon, color, bgColor }: any) => (
    <Card className={`relative overflow-hidden transition-all border-0 shadow-cyber-ocean hover:neon-glow-blue ${theme === 'dark' ? 'shadow-gray-900/10' : ''}`}>
      <div className={`absolute top-0 right-0 w-16 h-16 ${bgColor} rounded-bl-3xl opacity-10`}></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'}`}>{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-gray-100' : ''}`}>{loading ? "..." : value}</div>
        {change && (
          <div className={`flex items-center text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'positive' ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {change}
          </div>
        )}
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>{description}</p>
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
            <div className="mb-8 print:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Messages & Feedback</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Manage customer messages and feedback</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'email' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('email')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email View
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Table View
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Activity className="h-4 w-4 inline mr-1" />
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Messages"
                value={messages.length}
                change="+8.2%"
                changeType="positive"
                description="All customer messages"
                icon={Inbox}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard
                title="Unread Messages"
                value={messages.filter(m => m.status === 'unread').length}
                change="-12.5%"
                changeType="negative"
                description="Require attention"
                icon={Mail}
                color="text-orange-600"
                bgColor="bg-orange-50"
              />
              <StatCard
                title="With Ratings"
                value={messages.filter(m => m.rating > 0).length}
                change="+15.3%"
                changeType="positive"
                description="Customer feedback"
                icon={Star}
                color="text-yellow-600"
                bgColor="bg-yellow-50"
              />
              <StatCard
                title="Response Time"
                value="2.4h"
                change="-5.2%"
                changeType="positive"
                description="Average response time"
                icon={Clock}
                color="text-green-600"
                bgColor="bg-green-50"
              />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 print:hidden">
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <Input
                  placeholder="Search messages..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 rounded-lg print:hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Sort by Month</Label>
                <Input
                  type="month"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={printReport} variant="outline" size="sm" title="Print" className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}>
                  <Printer className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm" title="Export CSV" className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}>
                  <FileText className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
                </Button>
                <Button variant="outline" onClick={() => {setStatusFilter('all'); setMonthFilter(''); setSearch('');}} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                  <Filter className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : ''}`} />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Messages Content */}
            {viewMode === 'table' ? (
              <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20 hover:border-gray-600' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
                <CardHeader className={`border-b print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                  <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    All Messages
                  </CardTitle>
                  <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Customer messages and feedback from contact form
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading messages...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No messages found</p>
                      <p className="text-sm text-gray-400">Customer messages will appear here</p>
                    </div>
                  ) : (
                    <div className={`border rounded-lg overflow-hidden table-to-print ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="hidden print:block text-center py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Messages Report</h1>
                        <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="overflow-auto max-h-[500px]">
                        <table className="w-full table-fixed">
                          <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <tr>
                              <th className={`w-1/6 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('name')}>
                                <div className="flex items-center justify-between">
                                  <span>Name</span>
                                  {sortColumn === 'name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                              </th>
                              <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('email')}>
                                <div className="flex items-center justify-between">
                                  <span>Email</span>
                                  {sortColumn === 'email' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                              </th>
                              <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('subject')}>
                                <div className="flex items-center justify-between">
                                  <span>Subject</span>
                                  {sortColumn === 'subject' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                              </th>
                              <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('rating')}>
                                <div className="flex items-center justify-between">
                                  <span>Rating</span>
                                  {sortColumn === 'rating' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                              </th>
                              <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('status')}>
                                <div className="flex items-center justify-between">
                                  <span>Status</span>
                                  {sortColumn === 'status' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                              </th>
                              <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('created_at')}>
                                <div className="flex items-center justify-between">
                                  <span>Date</span>
                                  {sortColumn === 'created_at' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                              </th>
                              <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800' : 'text-gray-800 bg-gray-50'}`}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {filteredMessages.map((message, index) => (
                              <tr key={message.id} className={`transition-colors duration-150 ${theme === 'dark' ? `hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}` : `hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}`}>
                                <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-100'}`}>{message.name}</td>
                                <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                                  <div className="flex items-center gap-2">
                                    <Mail className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <span className="truncate">{message.email}</span>
                                  </div>
                                </td>
                                <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                                  <span className="truncate block">{message.subject || 'N/A'}</span>
                                </td>
                                <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                  {message.rating > 0 ? (
                                    <div className="flex items-center justify-center gap-1">
                                      {renderStars(message.rating)}
                                      <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>({message.rating})</span>
                                    </div>
                                  ) : (
                                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No rating</span>
                                  )}
                                </td>
                                <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                  {message.status === 'unread' ? (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Unread</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">Read</Badge>
                                  )}
                                </td>
                                <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                                  <div className="flex items-center justify-center gap-1">
                                    <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <span className="text-sm">{new Date(message.created_at).toLocaleDateString()}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center print:hidden">
                                  <ActionMenu
                                    items={[
                                      {
                                        id: 'view',
                                        label: 'View',
                                        icon: Eye,
                                        onClick: () => openViewDialog(message)
                                      },
                                      {
                                        id: 'delete',
                                        label: 'Delete',
                                        icon: Trash2,
                                        onClick: () => handleDelete(message.id),
                                        isDelete: true,
                                        confirmMessage: `Are you sure you want to delete this message from ${message.name}? This action cannot be undone.`
                                      }
                                    ]}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
                {/* Message List */}
                <div className="lg:col-span-1">
                  <Card className={`h-full border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-blue-200 bg-white'}`}>
                    <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                      <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <Inbox className="h-5 w-5 text-blue-500" />
                        Inbox ({filteredMessages.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-y-auto max-h-[500px]">
                        {loading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-gray-500 text-sm">Loading...</p>
                          </div>
                        ) : filteredMessages.length === 0 ? (
                          <div className="text-center py-8">
                            <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No messages</p>
                          </div>
                        ) : (
                          filteredMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`p-4 cursor-pointer transition-colors ${
                                theme === 'dark'
                                  ? `border-b border-gray-700 hover:bg-gray-700/50 ${
                                      selectedMessage?.id === message.id ? 'bg-gray-700 border-l-4 border-l-blue-500' : ''
                                    }`
                                  : `border-b border-gray-100 hover:bg-gray-50 ${
                                      selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`
                              }`}
                              onClick={() => selectMessage(message)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                                  message.status === 'unread' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}>
                                  {message.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className={`text-sm font-medium truncate ${
                                      message.status === 'unread'
                                        ? (theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
                                        : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
                                    }`}>
                                      {message.name}
                                    </p>
                                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                      {new Date(message.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className={`text-sm truncate mb-1 ${
                                    message.status === 'unread'
                                      ? `font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`
                                      : (theme === 'dark' ? 'text-gray-400' : 'text-gray-600')
                                  }`}>
                                    {message.subject || 'No subject'}
                                  </p>
                                  <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {message.message.substring(0, 50)}...
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {message.rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        {renderStars(message.rating)}
                                      </div>
                                    )}
                                    {message.status === 'unread' && (
                                      <Badge className="bg-blue-100 text-blue-700 text-xs">Unread</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Message Detail */}
                <div className="lg:col-span-2">
                  <Card className={`h-full border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-blue-200 bg-white'}`}>
                    {selectedMessage ? (
                      <>
                        <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                {selectedMessage.subject || 'No Subject'}
                              </h3>
                              <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  From: {selectedMessage.name} ({selectedMessage.email})
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(selectedMessage.created_at).toLocaleString()}
                                </span>
                                {selectedMessage.status === 'unread' && (
                                  <Badge className="bg-blue-100 text-blue-700">Unread</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ActionMenu
                                items={[
                                  {
                                    id: 'delete',
                                    label: 'Delete',
                                    icon: Trash2,
                                    onClick: () => handleDelete(selectedMessage.id),
                                    isDelete: true,
                                    confirmMessage: `Are you sure you want to delete this message from ${selectedMessage.name}? This action cannot be undone.`
                                  }
                                ]}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                          {selectedMessage.rating > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-600" />
                                Customer Rating
                              </h4>
                              <div className="flex items-center gap-2">
                                {renderStars(selectedMessage.rating)}
                                <span className="text-sm text-gray-600 ml-2">
                                  {selectedMessage.rating} out of 5 stars
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="prose prose-gray max-w-none">
                            <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                              <MessageSquare className="h-4 w-4" />
                              Message
                            </h4>
                            <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                              <p className={`leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                {selectedMessage.message}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Mail className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
                          <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Select a message</h3>
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Choose a message from the list to view its contents</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* View Message Dialog */}
            {selectedMessage && (
              <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <DialogHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${selectedMessage.status === 'unread' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        {selectedMessage.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <DialogTitle className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          {selectedMessage.subject}
                        </DialogTitle>
                        <DialogDescription className={`text-base mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          From <span className="font-medium">{selectedMessage.name}</span> • {selectedMessage.email}
                        </DialogDescription>
                        <div className={`flex items-center gap-4 mt-2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(selectedMessage.created_at).toLocaleString()}
                          </span>
                          {selectedMessage.status === 'unread' && (
                            <Badge className="bg-blue-100 text-blue-700">Unread</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {selectedMessage.rating > 0 && (
                      <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                        <h4 className={`font-semibold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          <Star className="h-4 w-4 text-yellow-600" />
                          Customer Rating
                        </h4>
                        <div className="flex items-center gap-2">
                          {renderStars(selectedMessage.rating)}
                          <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedMessage.rating} out of 5 stars
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </h4>
                      <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{selectedMessage.message}</p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className={`border-t pt-4 ${theme === 'dark' ? 'border-gray-700' : ''}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex gap-2">
                        <ActionMenu
                          items={[
                            {
                              id: 'delete',
                              label: 'Delete Message',
                              icon: Trash2,
                              onClick: () => handleDelete(selectedMessage.id),
                              isDelete: true,
                              confirmMessage: `Are you sure you want to delete this message from ${selectedMessage.name}? This action cannot be undone.`
                            }
                          ]}
                        />
                      </div>
                      <Button onClick={() => setViewDialogOpen(false)} className="px-6">
                        Close
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Messages;
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive as ArchiveIcon, Search, Trash2, RotateCcw, MoreVertical, Filter, Printer, Download, User, Mail, Calendar, MessageSquare } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/integrations/api/client";
import { FileText } from "lucide-react";

const Archive = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar, marginClass } = useSidebar();
  const { theme } = useTheme();
  const [archivedBookings, setArchivedBookings] = useState<any[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'messages'>('bookings');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('event_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');

  // Bulk delete states
  const [selectedArchivedBookings, setSelectedArchivedBookings] = useState<number[]>([]);
  const [selectedArchivedMessages, setSelectedArchivedMessages] = useState<number[]>([]);

  const loadArchivedBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getArchivedBookings({ search: searchTerm || undefined, limit: 50 });
      setArchivedBookings(response.archived_bookings);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load archived bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const loadArchivedMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getArchivedItems('messages', { search: searchTerm || undefined, limit: 50 });
      setArchivedMessages(response.items || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load archived messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectArchivedBooking = (id: number, checked: boolean | string) => {
    setSelectedArchivedBookings(prev => {
      if (checked === true) {
        return [...prev, id];
      } else {
        return prev.filter(bookingId => bookingId !== id);
      }
    });
  };

  const handleSelectAllArchivedBookings = (checked: boolean | string) => {
    if (checked === true) {
      setSelectedArchivedBookings(sortedArchivedBookings.map(booking => booking.id));
    } else {
      setSelectedArchivedBookings([]);
    }
  };

  const handleSelectArchivedMessage = (id: number, checked: boolean | string) => {
    setSelectedArchivedMessages(prev => {
      if (checked === true) {
        return [...prev, id];
      } else {
        return prev.filter(messageId => messageId !== id);
      }
    });
  };

  const handleSelectAllArchivedMessages = (checked: boolean | string) => {
    if (checked === true) {
      setSelectedArchivedMessages(sortedArchivedMessages.map(msg => msg.id));
    } else {
      setSelectedArchivedMessages([]);
    }
  };

  const clearArchivedBookingSelection = () => {
    setSelectedArchivedBookings([]);
  };

  const clearArchivedMessageSelection = () => {
    setSelectedArchivedMessages([]);
  };

  const sortedArchivedBookings = [...(archivedBookings || [])].filter(booking => {
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
    if (monthFilter) {
      const eventDate = new Date(booking.event_date);
      const eventMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      if (eventMonth !== monthFilter) return false;
    }
    return true;
  }).sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'client') {
      aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
      bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
    } else if (sortColumn === 'event_date') {
      aVal = new Date(a.event_date);
      bVal = new Date(b.event_date);
    } else if (sortColumn === 'status') {
      aVal = a.status.toLowerCase();
      bVal = b.status.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    return status === "confirmed"
      ? "bg-green-500 text-white"
      : status === "pending"
      ? "bg-yellow-500 text-white"
      : "bg-red-500 text-white";
  };

  const sortedArchivedMessages = [...(archivedMessages || [])].filter(msg => {
    if (statusFilter !== 'all' && msg.status !== statusFilter) return false;
    if (monthFilter) {
      const messageDate = new Date(msg.created_at);
      const messageMonth = `${messageDate.getFullYear()}-${String(messageDate.getMonth() + 1).padStart(2, '0')}`;
      if (messageMonth !== monthFilter) return false;
    }
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
    } else if (sortColumn === 'created_at') {
      aVal = new Date(a.created_at);
      bVal = new Date(b.created_at);
    } else if (sortColumn === 'deleted_at') {
      aVal = new Date(a.deleted_at || 0);
      bVal = new Date(b.deleted_at || 0);
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const printReport = async () => {
    try {
      // Generate formatted report
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;

      const isBookings = activeTab === 'bookings';
      const data = isBookings ? sortedArchivedBookings : sortedArchivedMessages;
      const title = isBookings ? 'Archived Bookings Report' : 'Archived Messages Report';

      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
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
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${monthFilter ? `<p>Month: ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
            ${statusFilter !== 'all' ? `<p>Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total ${isBookings ? 'Bookings' : 'Messages'}</h3>
              <p>${data.length}</p>
            </div>
            <div class="stat-card">
              <h3>Archived Items</h3>
              <p style="color: #ca8a04;">${data.length}</p>
            </div>
          </div>

          <h2>Archived Records (${data.length} records)</h2>
          <table>
            <thead>
              <tr>
                ${isBookings ? `
                  <th>Client</th>
                  <th>Event Date</th>
                ` : `
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                `}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => isBookings ? `
                <tr>
                  <td>${item.first_name} ${item.last_name}</td>
                  <td>${new Date(item.event_date).toLocaleDateString()}</td>
                </tr>
              ` : `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.email}</td>
                  <td>${item.subject || 'N/A'}</td>
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
      const isBookings = activeTab === 'bookings';
      const data = isBookings ? sortedArchivedBookings : sortedArchivedMessages;
      const filename = isBookings ? 'archived_bookings' : 'archived_messages';

      // CSV Header
      const headers = isBookings
        ? ['Client Name', 'Event Date']
        : ['Name', 'Email', 'Subject'];

      // CSV Data rows
      const csvData = data.map(item => isBookings
        ? [
            `${item.first_name} ${item.last_name}`,
            new Date(item.event_date).toLocaleDateString()
          ]
        : [
            item.name,
            item.email,
            item.subject || 'N/A'
          ]
      );

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `${isBookings ? 'Archived booking' : 'Archived message'} data exported to CSV successfully`,
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

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadArchivedBookings();
    } else {
      loadArchivedMessages();
    }
  }, [activeTab, loadArchivedBookings, loadArchivedMessages]);

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${marginClass}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />
          <main className="flex-1 p-6 lg:p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Archive</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Manage deleted items</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={activeTab === 'bookings' ? 'default' : 'outline'} onClick={() => setActiveTab('bookings')}>Bookings</Button>
                <Button variant={activeTab === 'messages' ? 'default' : 'outline'} onClick={() => setActiveTab('messages')}>Messages</Button>
              </div>

              {activeTab === 'bookings' && (
                <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Deleted Bookings</CardTitle>
                        <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>All deleted bookings</CardDescription>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                      </div>
                    </div>
                    <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>Status Filter</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Sort by Month</Label>
                          <Input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button onClick={printReport} variant="outline" size="sm" title="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button onClick={handleExportCSV} variant="outline" size="sm" title="Export CSV">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => {setStatusFilter('all'); setMonthFilter(''); setSearchTerm('');}}>
                            <Filter className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                          {selectedArchivedBookings.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Selected ({selectedArchivedBookings.length})
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Archived Bookings</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {selectedArchivedBookings.length} archived booking{selectedArchivedBookings.length > 1 ? 's' : ''}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={clearArchivedBookingSelection}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async () => {
                                      try {
                                        for (const id of selectedArchivedBookings) {
                                          await api.permanentlyDeleteArchivedItem('bookings', id);
                                        }
                                        toast({ title: "Success", description: `${selectedArchivedBookings.length} archived booking${selectedArchivedBookings.length > 1 ? 's' : ''} permanently deleted` });
                                        clearArchivedBookingSelection();
                                        loadArchivedBookings();
                                      } catch (error) {
                                        toast({ title: "Error", description: "Failed to delete archived bookings", variant: "destructive" });
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading...</p>
                      </div>
                    ) : archivedBookings.length === 0 ? (
                      <div className="text-center py-8">
                        <ArchiveIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No deleted bookings</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
                        <div className="hidden print:block text-center py-4 border-b border-gray-200">
                          <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Archive Report - Bookings</h1>
                          <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="overflow-auto max-h-[500px]">
                          <table className="w-full table-fixed">
                            <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                              <tr>
                                <th className={`w-12 text-center py-4 px-6 font-bold sticky top-0 border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 border-gray-700' : 'text-gray-800 bg-gray-50 border-gray-200'}`}>
                                  <Checkbox
                                    checked={selectedArchivedBookings.length === sortedArchivedBookings.length && sortedArchivedBookings.length > 0}
                                    onCheckedChange={(checked) => handleSelectAllArchivedBookings(checked === true)}
                                  />
                                </th>
                                <th className={`w-1/3 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('client')}>
                                  <div className="flex items-center justify-between">
                                    <span>Client</span>
                                    {sortColumn === 'client' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className={`w-1/3 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('event_date')}>
                                  <div className="flex items-center justify-between">
                                    <span>Event Date</span>
                                    {sortColumn === 'event_date' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('status')}>
                                  <div className="flex items-center justify-between">
                                    <span>Status</span>
                                    {sortColumn === 'status' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800' : 'text-gray-800 bg-gray-50'}`}>Actions</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                              {sortedArchivedBookings.map((booking, index) => (
                                <tr key={booking.id} className={`transition-colors duration-150 ${theme === 'dark' ? `hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}` : `hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}`}>
                                  <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                    <Checkbox
                                      checked={selectedArchivedBookings.includes(booking.id)}
                                      onCheckedChange={(checked) => handleSelectArchivedBooking(booking.id, checked === true)}
                                    />
                                  </td>
                                  <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-600' : 'text-gray-900 border-gray-100'}`}>
                                    <div className="flex items-center gap-2">
                                      <User className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                      <span className="truncate">{booking.first_name} {booking.last_name}</span>
                                    </div>
                                  </td>
                                  <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'text-gray-400 border-gray-600' : 'text-gray-600 border-gray-100'}`}>
                                    <div className="flex items-center justify-center gap-1">
                                      <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                      <span className="text-sm">{new Date(booking.event_date).toLocaleDateString()}</span>
                                    </div>
                                  </td>
                                  <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                    <Badge className={`${getStatusColor(booking.status)} rounded-[5px]`}>{booking.status}</Badge>
                                  </td>
                                  <td className="py-4 px-6 text-center print:hidden">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await api.restoreBooking(booking.id);
                                            toast({ title: "Success", description: "Booking restored" });
                                            loadArchivedBookings();
                                          } catch (error) {
                                            toast({ title: "Error", description: "Failed to restore", variant: "destructive" });
                                          }
                                        }}
                                        className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                        title="Restore Booking"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await api.permanentDeleteBooking(booking.id);
                                            toast({ title: "Success", description: "Deleted" });
                                            loadArchivedBookings();
                                          } catch (error) {
                                            toast({ title: "Error", description: "Failed", variant: "destructive" });
                                          }
                                        }}
                                        className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                        title="Delete Booking"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
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
              )}

              {activeTab === 'messages' && (
                <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Deleted Messages</CardTitle>
                        <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>All deleted messages</CardDescription>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                      </div>
                    </div>
                    <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>Status Filter</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
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
                          <Label>Sort by Month</Label>
                          <Input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button onClick={printReport} variant="outline" size="sm" title="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button onClick={handleExportCSV} variant="outline" size="sm" title="Export CSV">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => {setStatusFilter('all'); setMonthFilter(''); setSearchTerm('');}}>
                            <Filter className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                          {selectedArchivedMessages.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Selected ({selectedArchivedMessages.length})
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Archived Messages</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {selectedArchivedMessages.length} archived message{selectedArchivedMessages.length > 1 ? 's' : ''}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={clearArchivedMessageSelection}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async () => {
                                      try {
                                        for (const id of selectedArchivedMessages) {
                                          await api.permanentlyDeleteArchivedItem('messages', id);
                                        }
                                        toast({ title: "Success", description: `${selectedArchivedMessages.length} archived message${selectedArchivedMessages.length > 1 ? 's' : ''} permanently deleted` });
                                        clearArchivedMessageSelection();
                                        loadArchivedMessages();
                                      } catch (error) {
                                        toast({ title: "Error", description: "Failed to delete archived messages", variant: "destructive" });
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading...</p>
                      </div>
                    ) : archivedMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <ArchiveIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No deleted messages</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
                        <div className="hidden print:block text-center py-4 border-b border-gray-200">
                          <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Archive Report - Messages</h1>
                          <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="overflow-auto max-h-[500px]">
                          <table className="w-full table-fixed">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                              <tr>
                                <th className="w-12 text-center py-4 px-6 font-bold text-gray-800 sticky top-0 bg-gray-50 border-r border-gray-200">
                                  <Checkbox
                                    checked={selectedArchivedMessages.length === sortedArchivedMessages.length && sortedArchivedMessages.length > 0}
                                    onCheckedChange={(checked) => handleSelectAllArchivedMessages(checked)}
                                  />
                                </th>
                                <th className="w-1/5 text-left py-4 px-6 font-bold text-gray-800 sticky top-0 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none border-r border-gray-200" onClick={() => handleSort('name')}>
                                  <div className="flex items-center justify-between">
                                    <span>Name</span>
                                    {sortColumn === 'name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className="w-1/4 text-left py-4 px-6 font-bold text-gray-800 sticky top-0 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none border-r border-gray-200" onClick={() => handleSort('email')}>
                                  <div className="flex items-center justify-between">
                                    <span>Email</span>
                                    {sortColumn === 'email' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className="w-1/4 text-left py-4 px-6 font-bold text-gray-800 sticky top-0 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none border-r border-gray-200" onClick={() => handleSort('subject')}>
                                  <div className="flex items-center justify-between">
                                    <span>Subject</span>
                                    {sortColumn === 'subject' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className="w-1/5 text-center py-4 px-6 font-bold text-gray-800 sticky top-0 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none border-r border-gray-200 print:hidden" onClick={() => handleSort('created_at')}>
                                  <div className="flex items-center justify-between">
                                    <span>Date</span>
                                    {sortColumn === 'created_at' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                  </div>
                                </th>
                                <th className="w-1/6 text-center py-4 px-6 font-bold text-gray-800 sticky top-0 bg-gray-50 print:hidden">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {sortedArchivedMessages.map((msg, index) => (
                                <tr key={msg.id} className={`hover:bg-blue-50/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                  <td className="py-4 px-6 text-center border-r border-gray-100">
                                    <Checkbox
                                      checked={selectedArchivedMessages.includes(msg.id)}
                                      onCheckedChange={(checked) => handleSelectArchivedMessage(msg.id, checked)}
                                    />
                                  </td>
                                  <td className="py-4 px-6 text-gray-900 font-semibold border-r border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{msg.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-gray-700 border-r border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{msg.email}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-gray-700 border-r border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{msg.subject || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-gray-600 border-r border-gray-100 print:hidden">
                                    <div className="flex items-center justify-center gap-1">
                                      <Calendar className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm">{new Date(msg.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center print:hidden">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await api.restoreArchivedItem('messages', msg.id);
                                            toast({ title: "Success", description: "Message restored" });
                                            loadArchivedMessages();
                                          } catch (error) {
                                            toast({ title: "Error", description: "Failed to restore", variant: "destructive" });
                                          }
                                        }}
                                        className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                        title="Restore Message"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await api.permanentlyDeleteArchivedItem('messages', msg.id);
                                            toast({ title: "Success", description: "Deleted" });
                                            loadArchivedMessages();
                                          } catch (error) {
                                            toast({ title: "Error", description: "Failed", variant: "destructive" });
                                          }
                                        }}
                                        className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                        title="Delete Message"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
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
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Archive;

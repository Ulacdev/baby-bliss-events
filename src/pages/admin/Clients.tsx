 import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Edit, Trash2, Eye, Mail, Phone, Calendar, DollarSign, Users, Filter, Printer, Download, User } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText } from "lucide-react";

const Clients = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar, marginClass } = useSidebar();
  const { theme } = useTheme();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string>('last_booking');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('admin');
  const [userId, setUserId] = useState<number | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: ""
  });

  useEffect(() => {
    // Get user role and ID
    const role = localStorage.getItem('user_role') || 'admin';
    setUserRole(role);

    // Get user ID from localStorage (set during login)
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }

    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.getClients({ search });

      // Admin can view all clients
      setClients(response.clients);
    } catch (error) {
      console.error("Failed to load clients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clients",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce search
    setTimeout(() => loadClients(), 300);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      phone: ""
    });
  };

  const handleEdit = async () => {
    if (!selectedClient) return;

    try {
      await api.updateClient(selectedClient.email, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });

      toast({
        title: "Success",
        description: "Client updated successfully",
      });

      setEditDialogOpen(false);
      resetForm();
      loadClients();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update client",
      });
    }
  };

  const handleDelete = async (email: string) => {
    try {
      await api.deleteClient(email);

      toast({
        title: "Success",
        description: "Client and all bookings deleted successfully",
      });

      loadClients();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete client",
      });
    }
  };

  const handleAdd = async () => {
    // Validation
    if (!formData.email || !formData.first_name || !formData.last_name) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Email, First Name, and Last Name are required",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address",
      });
      return;
    }

    try {
      await api.createClient({
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || undefined,
      });

      toast({
        title: "Success",
        description: "Client added successfully",
      });

      setAddDialogOpen(false);
      resetForm();
      loadClients();
    } catch (error: any) {
      console.error("Add client error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to add client",
      });
    }
  };

  const openEditDialog = (client: any) => {
    setSelectedClient(client);
    setFormData({
      email: client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone || ""
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (client: any) => {
    setSelectedClient(client);
    setViewDialogOpen(true);
  };

  const filteredClients = clients.filter(client => {
    if (confirmedFilter === 'has_confirmed' && client.confirmed_bookings === 0) return false;
    if (confirmedFilter === 'no_confirmed' && client.confirmed_bookings > 0) return false;
    if (monthFilter) {
      const lastBookingDate = new Date(client.last_booking);
      const lastBookingMonth = `${lastBookingDate.getFullYear()}-${String(lastBookingDate.getMonth() + 1).padStart(2, '0')}`;
      if (lastBookingMonth !== monthFilter) return false;
    }
    return true;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'full_name') {
      aVal = a.full_name.toLowerCase();
      bVal = b.full_name.toLowerCase();
    } else if (sortColumn === 'email') {
      aVal = a.email.toLowerCase();
      bVal = b.email.toLowerCase();
    } else if (sortColumn === 'phone') {
      aVal = (a.phone || '').toLowerCase();
      bVal = (b.phone || '').toLowerCase();
    } else if (sortColumn === 'last_booking') {
      aVal = new Date(a.last_booking);
      bVal = new Date(b.last_booking);
    } else if (sortColumn === 'total_bookings' || sortColumn === 'confirmed_bookings') {
      aVal = parseInt(a[sortColumn]) || 0;
      bVal = parseInt(b[sortColumn]) || 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const ClientCard = ({ client }: { client: any }) => (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{client.full_name}</CardTitle>
          <Badge variant="outline">{client.total_bookings} bookings</Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          {client.email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{client.total_bookings} total</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confirmed:</span>
            <Badge className={`bg-blue-600 text-white hover:bg-blue-700 rounded-[5px]`}>
              {client.confirmed_bookings}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last booking:</span>
            <span>{new Date(client.last_booking).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openViewDialog(client)}
              className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
              title="View Client"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(client)}
              className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
              title="Edit Client"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(client.email)}
              className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
              title="Delete Client"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const printReport = async () => {
    try {
      // Generate formatted report
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;

      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Client Management Report - ${new Date().toLocaleDateString()}</title>
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
            <h1>Client Management Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${monthFilter ? `<p>Month: ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
            ${confirmedFilter !== 'all' ? `<p>Status: ${confirmedFilter === 'has_confirmed' ? 'Has Confirmed Bookings' : 'No Confirmed Bookings'}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total Clients</h3>
              <p>${clients.length}</p>
            </div>
            <div class="stat-card">
              <h3>With Confirmed Bookings</h3>
              <p style="color: #0077B6;">${clients.filter(c => c.confirmed_bookings > 0).length}</p>
            </div>
            <div class="stat-card">
              <h3>No Confirmed Bookings</h3>
              <p style="color: #ca8a04;">${clients.filter(c => c.confirmed_bookings === 0).length}</p>
            </div>
          </div>

          <h2>Client Records (${sortedClients.length} records)</h2>
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${sortedClients.map(client => `
                <tr>
                  <td>${client.full_name}</td>
                  <td>${client.email}</td>
                  <td>${client.phone || 'N/A'}</td>
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
      const headers = ['Client Name', 'Email', 'Phone'];

      // CSV Data rows
      const csvData = sortedClients.map(client => [
        client.full_name,
        client.email,
        client.phone || 'N/A'
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
      link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Client data exported to CSV successfully",
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
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${marginClass}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 p-6 lg:p-8 pb-0">
            {/* Header */}
            <div className="mb-8 print:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Client Management</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Manage your client database and relationships</p>
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Users className="h-4 w-4 inline mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
              <div className="relative w-full sm:w-80">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <Input
                  placeholder="Search clients by name or email..."
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              {userRole === 'admin' && (
                <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-[5px] shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 rounded-lg print:hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Booking Status</Label>
                <Select value={confirmedFilter} onValueChange={setConfirmedFilter}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="has_confirmed">Has Confirmed Bookings</SelectItem>
                    <SelectItem value="no_confirmed">No Confirmed Bookings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Sort by Month</Label>
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={printReport} variant="outline" size="sm" title="Print" className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                  <Printer className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm" title="Export CSV" className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                  <FileText className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
                </Button>
                <Button variant="outline" onClick={() => {setConfirmedFilter('all'); setMonthFilter(''); setSearch('');}} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                  <Filter className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : ''}`} />
                  Clear Filters
                </Button>
              </div>
            </div>

            <Card className={`shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20 hover:border-gray-600' : 'shadow-blue-500/10 border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300'}`}>
              <CardHeader className={`border-b print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>All Clients</CardTitle>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Complete client database with booking history</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={theme === 'dark' ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-blue-50 text-blue-700 border-blue-300'}>
                      {clients.length} Total Clients
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading clients...</span>
                  </div>
                ) : clients.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
                    <div className="hidden print:block text-center py-4 border-b border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Client List</h1>
                      <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="overflow-auto max-h-[500px]">
                      <table className="w-full table-fixed">
                        <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                          <tr>
                            <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('full_name')}>
                              <div className="flex items-center justify-between">
                                <span>Client Name</span>
                                {sortColumn === 'full_name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                            <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('email')}>
                              <div className="flex items-center justify-between">
                                <span>Email</span>
                                {sortColumn === 'email' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                            <th className={`w-1/6 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('phone')}>
                              <div className="flex items-center justify-between">
                                <span>Phone</span>
                                {sortColumn === 'phone' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                            <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('total_bookings')}>
                              <div className="flex items-center justify-between">
                                <span>Total</span>
                                {sortColumn === 'total_bookings' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                            <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('confirmed_bookings')}>
                              <div className="flex items-center justify-between">
                                <span>Confirmed</span>
                                {sortColumn === 'confirmed_bookings' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                            <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('last_booking')}>
                              <div className="flex items-center justify-between">
                                <span>Last Booking</span>
                                {sortColumn === 'last_booking' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                            <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800' : 'text-gray-800 bg-gray-50'}`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {sortedClients.map((client, index) => (
                            <tr key={client.email} className={`transition-colors duration-150 ${theme === 'dark' ? 'hover:bg-gray-700/50 bg-gray-800' : 'hover:bg-blue-50/50 bg-white'}`}>
                              <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-100'}`}>
                                <div className="flex items-center gap-2">
                                  <User className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                  <span className="truncate">{client.full_name}</span>
                                </div>
                              </td>
                              <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                                <div className="flex items-center gap-2">
                                  <Mail className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              </td>
                              <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                                <div className="flex items-center gap-2">
                                  <Phone className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                  <span className="truncate">{client.phone || 'N/A'}</span>
                                </div>
                              </td>
                              <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-[5px]">
                                  {client.total_bookings}
                                </Badge>
                              </td>
                              <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-[5px]">
                                  {client.confirmed_bookings}
                                </Badge>
                              </td>
                              <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                                <div className="flex items-center justify-center gap-1">
                                  <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                  <span className="text-sm">{new Date(client.last_booking).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center print:hidden">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openViewDialog(client)}
                                    className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                    title="View Client"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {userRole === 'admin' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(client)}
                                        className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                        title="Edit Client"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(client.email)}
                                        className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                        title="Delete Client"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No clients found</p>
                    <p className="text-sm">Clients will appear here once they make bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Client Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Client Details</DialogTitle>
                  <DialogDescription>
                    Detailed information about this client
                  </DialogDescription>
                </DialogHeader>
                {selectedClient && (
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Name</Label>
                            <p className="text-sm text-muted-foreground">{selectedClient.full_name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Phone</Label>
                            <p className="text-sm text-muted-foreground">{selectedClient.phone || 'Not provided'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Booking Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Bookings:</span>
                            <Badge>{selectedClient.total_bookings}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Confirmed:</span>
                            <Badge variant="default">{selectedClient.confirmed_bookings}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">First Event:</span>
                            <span className="text-sm">{new Date(selectedClient.first_event).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Last Event:</span>
                            <span className="text-sm">{new Date(selectedClient.last_event).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Client</DialogTitle>
                  <DialogDescription>
                    Update client information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_first_name" className={theme === 'dark' ? 'text-white' : ''}>First Name *</Label>
                      <Input
                        id="edit_first_name"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_last_name" className={theme === 'dark' ? 'text-white' : ''}>Last Name *</Label>
                      <Input
                        id="edit_last_name"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_phone" className={theme === 'dark' ? 'text-white' : ''}>Phone</Label>
                    <Input
                      id="edit_phone"
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {setEditDialogOpen(false); resetForm();}}>
                    Cancel
                  </Button>
                  <Button onClick={handleEdit}>Update Client</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Client Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Add a new client to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_email" className={theme === 'dark' ? 'text-white' : ''}>Email *</Label>
                    <Input
                      id="add_email"
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add_first_name" className={theme === 'dark' ? 'text-white' : ''}>First Name *</Label>
                      <Input
                        id="add_first_name"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_last_name" className={theme === 'dark' ? 'text-white' : ''}>Last Name *</Label>
                      <Input
                        id="add_last_name"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_phone" className={theme === 'dark' ? 'text-white' : ''}>Phone</Label>
                    <Input
                      id="add_phone"
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {setAddDialogOpen(false); resetForm();}}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd}>Add Client</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Clients;

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
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Loader2, Edit, Trash2, Eye, Mail, Phone, Shield, User, Filter, Printer, Download, Calendar } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText } from "lucide-react";

const AccountManagement = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar, marginClass } = useSidebar();
  const { theme } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "client",
    first_name: "",
    last_name: "",
    phone: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce search
    setTimeout(() => loadUsers(), 300);
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
      username: "",
      email: "",
      password: "",
      role: "user",
      first_name: "",
      last_name: "",
      phone: ""
    });
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    try {
      await api.updateUser(selectedUser.id, {
        email: formData.email,
        role: formData.role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        password: formData.password || undefined
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update user",
      });
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await api.deleteUser(userId);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete user",
      });
    }
  };

  const handleAdd = async () => {
    // Validation
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Email, first name, last name, and password are required",
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
      await api.createUser({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });

      toast({
        title: "Success",
        description: "User added successfully",
      });

      setAddDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error("Add user error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to add user",
      });
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "", // Don't populate password for security
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (user: any) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(sortedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkDeleteSuccess = () => {
    setSelectedUsers([]);
    loadUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
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
          <title>Account Management Report - ${new Date().toLocaleDateString()}</title>
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
            <h1>Account Management Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${monthFilter ? `<p>Month: ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total Users</h3>
              <p>${users.length}</p>
            </div>
            <div class="stat-card">
              <h3>Active Users</h3>
              <p style="color: #0077B6;">${users.filter(u => u.status === 'active').length}</p>
            </div>
          </div>

          <h2>User Accounts (${sortedUsers.length} records)</h2>
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              ${sortedUsers.map(user => `
                <tr>
                  <td>${user.full_name}</td>
                  <td>${user.email}${user.phone ? '<br>' + user.phone : ''}</td>
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
      const headers = ['User Name', 'Email', 'Phone'];

      // CSV Data rows
      const csvData = sortedUsers.map(user => [
        user.full_name,
        user.email,
        user.phone || 'N/A'
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
      link.setAttribute('download', `account_management_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "User data exported to CSV successfully",
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

  const filteredUsers = (users || []).filter(user => {
    if (monthFilter) {
      const createdDate = new Date(user.created_at);
      const createdMonth = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      if (createdMonth !== monthFilter) return false;
    }
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'full_name') {
      aVal = a.full_name.toLowerCase();
      bVal = b.full_name.toLowerCase();
    } else if (sortColumn === 'email') {
      aVal = a.email.toLowerCase();
      bVal = b.email.toLowerCase();
    } else if (sortColumn === 'role') {
      aVal = a.role.toLowerCase();
      bVal = b.role.toLowerCase();
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

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${marginClass}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex-shrink-0 p-6 lg:p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Account Management</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Manage user accounts and permissions</p>
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Shield className="h-4 w-4 inline mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-6">
              {/* Search and Actions */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-[5px] shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
 
              {/* Filters */}
              <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
                  <Button variant="outline" onClick={() => setMonthFilter('')} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                    <Filter className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : ''}`} />
                    Clear Filters
                  </Button>
                  {selectedUsers.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" title="Delete Selected">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedUsers.length} selected user(s)? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            try {
                              for (const id of selectedUsers) {
                                await api.deleteUser(id);
                              }
                              toast({ title: "Success", description: "Selected users deleted successfully" });
                              handleBulkDeleteSuccess();
                            } catch (error) {
                              toast({ variant: "destructive", title: "Error", description: "Failed to delete users" });
                            }
                          }}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
 
              <Card className={`shadow-lg shadow-blue-500/10 border transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300'}`}>
                <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>All Users</CardTitle>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Complete user account database with roles and permissions</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`border ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
                        {users.length} Total Users
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  ) : users.length > 0 ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block">
                        <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
                          <div className="hidden print:block text-center py-4 border-b border-gray-200">
                            <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Account Management Report</h1>
                            <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="overflow-auto max-h-[500px]">
                            <table className="w-full table-fixed">
                              <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <tr>
                                  <th className={`w-12 text-center py-4 px-6 font-bold sticky top-0 border ${theme === 'dark' ? 'text-gray-200 bg-gray-800 border-gray-600' : 'text-gray-800 bg-gray-100 border-gray-300'}`}>
                                    <Checkbox
                                      checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                                      onCheckedChange={(checked) => handleSelectAllUsers(checked as boolean)}
                                    />
                                  </th>
                                  <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 border ${theme === 'dark' ? 'text-gray-200 bg-gray-800 border-gray-600' : 'text-gray-800 bg-gray-100 border-gray-300'}`}>Image</th>
                                  <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r border-l ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-300'}`} onClick={() => handleSort('full_name')}>
                                    <div className="flex items-center justify-between">
                                      <span>User</span>
                                      {sortColumn === 'full_name' && <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                  </th>
                                  <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-300'}`} onClick={() => handleSort('role')}>
                                    <div className="flex items-center justify-between">
                                      <span>Role</span>
                                      {sortColumn === 'role' && <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                  </th>
                                  <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-300'}`} onClick={() => handleSort('email')}>
                                    <div className="flex items-center justify-between">
                                      <span>Contact</span>
                                      {sortColumn === 'email' && <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                  </th>
                                  <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-300'}`} onClick={() => handleSort('status')}>
                                    <div className="flex items-center justify-between">
                                      <span>Status</span>
                                      {sortColumn === 'status' && <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                  </th>
                                  <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-300'}`} onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center justify-between">
                                      <span>Created</span>
                                      {sortColumn === 'created_at' && <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                  </th>
                                  <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 print:hidden border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 border-gray-600' : 'text-gray-800 bg-gray-100 border-gray-300'}`}>Actions</th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                  {sortedUsers.map((user, index) => (
                                    <tr key={user.id} className={`transition-colors duration-150 ${theme === 'dark' ? 'hover:bg-gray-700/50 bg-gray-800' : 'hover:bg-blue-50/50 bg-white'}`}>
                                      <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                        <Checkbox
                                          checked={selectedUsers.includes(user.id)}
                                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                                        />
                                      </td>
                                      <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                        {user.profile_image ? (
                                          <img
                                            src={user.profile_image}
                                            alt={user.full_name}
                                            className={`w-12 h-12 rounded-full object-cover border-2 mx-auto ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                                          />
                                        ) : (
                                          <div className={`w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold mx-auto border-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-600' : 'text-gray-900 border-gray-100'}`}>
                                        <div>
                                          <div className="font-medium">{user.full_name}</div>
                                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>@{user.username}</div>
                                        </div>
                                      </td>
                                      <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                        <Badge className={`${getRoleBadgeColor(user.role)} rounded-[5px]`}>
                                          <div className="flex items-center gap-1">
                                            {getRoleIcon(user.role)}
                                            {user.role}
                                          </div>
                                        </Badge>
                                      </td>
                                      <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-100'}`}>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-sm">
                                            <Mail className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                            <span className="truncate">{user.email}</span>
                                          </div>
                                          {user.phone && (
                                            <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                              <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                              <span className="truncate">{user.phone}</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                        <Badge className={`${user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} rounded-[5px]`}>
                                          {user.status}
                                        </Badge>
                                      </td>
                                      <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'text-gray-400 border-gray-600' : 'text-gray-600 border-gray-100'}`}>
                                        <div className="flex items-center justify-center gap-1">
                                          <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                          <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-center print:hidden">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openViewDialog(user)}
                                            className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                            title="View User"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(user)}
                                            className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                            title="Edit User"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(user.id)}
                                            className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                            title="Delete User"
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
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {users.map((user) => (
                          <Card key={user.id} className={`p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {user.profile_image ? (
                                  <img
                                    src={user.profile_image}
                                    alt={user.full_name}
                                    className={`w-10 h-10 rounded-full object-cover border-[5px] ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                                  />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold border-[5px] ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{user.full_name}</div>
                                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>@{user.username}</div>
                                  <div className={`flex items-center gap-1 text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                  </div>
                                  {user.phone && (
                                    <div className={`flex items-center gap-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <Phone className="w-3 h-3" />
                                      {user.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openViewDialog(user)}
                                  className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                  title="View User"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                  title="Edit User"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(user.id)}
                                  className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getRoleBadgeColor(user.role)} rounded-[5px]`}>
                                  <div className="flex items-center gap-1">
                                    {getRoleIcon(user.role)}
                                    {user.role}
                                  </div>
                                </Badge>
                                <Badge className={`${user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} rounded-[5px]`}>
                                  {user.status}
                                </Badge>
                              </div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">Users will appear here once they are added to the system</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* View User Dialog */}
              <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className={`sm:max-w-[600px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-gray-100' : ''}>User Details</DialogTitle>
                    <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                      Detailed information about this user account
                    </DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="grid gap-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}>
                          <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-gray-100' : ''}`}>Basic Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>Name</Label>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-muted-foreground'}`}>{selectedUser.full_name}</p>
                            </div>
                            <div>
                              <Label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>Username</Label>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-muted-foreground'}`}>@{selectedUser.username}</p>
                            </div>
                            <div>
                              <Label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>Email</Label>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-muted-foreground'}`}>{selectedUser.email}</p>
                            </div>
                            <div>
                              <Label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>Phone</Label>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-muted-foreground'}`}>{selectedUser.phone || 'Not provided'}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}>
                          <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-gray-100' : ''}`}>Account Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : ''}`}>Role:</span>
                              <Badge className={`${getRoleBadgeColor(selectedUser.role)} rounded-[5px]`}>
                                <div className="flex items-center gap-1">
                                  {getRoleIcon(selectedUser.role)}
                                  {selectedUser.role}
                                </div>
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : ''}`}>Status:</span>
                              <Badge className={`${selectedUser.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} rounded-[5px]`}>
                                {selectedUser.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : ''}`}>Created:</span>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : ''}`}>{selectedUser.created_at}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  <DialogFooter className={theme === 'dark' ? 'border-gray-700' : ''}>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit User Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className={`sm:max-w-[500px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Edit User</DialogTitle>
                    <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                      Update user account information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_first_name" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                          <User className="w-4 h-4" />
                          First Name *
                        </Label>
                        <Input
                          id="edit_first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_last_name" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                          <User className="w-4 h-4" />
                          Last Name *
                        </Label>
                        <Input
                          id="edit_last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_username" className={theme === 'dark' ? 'text-gray-300' : ''}>Username *</Label>
                      <Input
                        id="edit_username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_email" className={theme === 'dark' ? 'text-gray-300' : ''}>Email *</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_phone" className={theme === 'dark' ? 'text-gray-300' : ''}>Phone</Label>
                      <Input
                        id="edit_phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_role" className={theme === 'dark' ? 'text-gray-300' : ''}>Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_password" className={theme === 'dark' ? 'text-gray-300' : ''}>New Password (leave empty to keep current)</Label>
                      <Input
                        id="edit_password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter new password"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                  </div>
                  <DialogFooter className={theme === 'dark' ? 'border-gray-700' : ''}>
                    <Button variant="outline" onClick={() => {setEditDialogOpen(false); resetForm();}} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}>
                      Cancel
                    </Button>
                    <Button onClick={handleEdit}>Update User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add User Dialog */}
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className={`sm:max-w-[500px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <DialogHeader>
                    <DialogTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Add New User</DialogTitle>
                    <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                      Add a new user account to the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add_first_name" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                          <User className="w-4 h-4" />
                          First Name *
                        </Label>
                        <Input
                          id="add_first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                          required
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add_last_name" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                          <User className="w-4 h-4" />
                          Last Name *
                        </Label>
                        <Input
                          id="add_last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                          required
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_username" className={theme === 'dark' ? 'text-gray-300' : ''}>Username *</Label>
                      <Input
                        id="add_username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="johndoe"
                        required
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_email" className={theme === 'dark' ? 'text-gray-300' : ''}>Email *</Label>
                      <Input
                        id="add_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                        required
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_phone" className={theme === 'dark' ? 'text-gray-300' : ''}>Phone</Label>
                      <Input
                        id="add_phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_role" className={theme === 'dark' ? 'text-gray-300' : ''}>Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_password" className={theme === 'dark' ? 'text-gray-300' : ''}>Password *</Label>
                      <Input
                        id="add_password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter password"
                        required
                        className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                      />
                    </div>
                  </div>
                  <DialogFooter className={theme === 'dark' ? 'border-gray-700' : ''}>
                    <Button variant="outline" onClick={() => {setAddDialogOpen(false); resetForm();}} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdd}>Add User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AccountManagement;
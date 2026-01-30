import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { TrendingUp, TrendingDown, Wallet, Plus, Calendar, CheckCircle, XCircle, Printer, Download, Activity, ArrowUpIcon, ArrowDownIcon, BarChart3, PieChart, MoreVertical, Trash2, Filter, User, MapPin, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/integrations/api/client";
import { FileText } from "lucide-react";

const Financial = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar, marginClass } = useSidebar();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any>({});
  const [sortColumn, setSortColumn] = useState<string>('event_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);

  const packagePrices: { [key: string]: number } = {
    basic: 15000,
    premium: 25000,
    deluxe: 40000
  };

  useEffect(() => {
    loadBookings();
    loadPayments();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await api.getBookings({});
      setBookings((response?.bookings || []).filter((b: any) => b.package));
    } catch (error) {
      // Set empty array on error to prevent crashes
      setBookings([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bookings",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await api.getPayments();
      const paymentMap: any = {};
      (response.payments || []).forEach((p: any) => {
        if (p.payment_status === 'paid') {
          paymentMap[p.booking_id] = true;
        }
      });
      setPayments(paymentMap);
    } catch (error) {
      console.error('Failed to load payments:', error);
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

  const markAsPaid = async (bookingId: number, amount: number) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Booking not found",
        });
        return;
      }

      if (booking.status === 'pending') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Cannot mark payment as paid for a pending booking. Please confirm the booking first.",
        });
        return;
      }

      await api.markPaymentAsPaid(bookingId, amount, 'cash');

      const updated = { ...payments, [bookingId]: true };
      setPayments(updated);

      toast({
        title: "Success",
        description: "Payment marked as received",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark payment as paid",
      });
    }
  };

  const markAsUnpaid = async (bookingId: number) => {
    try {
      await api.markPaymentAsUnpaid(bookingId);

      const updated = { ...payments };
      delete updated[bookingId];
      setPayments(updated);

      toast({
        title: "Success",
        description: "Payment marked as pending",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark payment as unpaid",
      });
    }
  };

  const handleSelectBooking = (bookingId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleSelectAllBookings = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(sortedBookings.map(booking => booking.id));
    } else {
      setSelectedBookings([]);
    }
  };


  const printReceipt = async (bookingId: number) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Booking not found",
        });
        return;
      }

      const amount = packagePrices[booking.package] || 0;
      const receiptNumber = `RCP-${bookingId}-${Date.now()}`;
      const today = new Date().toLocaleDateString();

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .logo { margin-bottom: 10px; }
              .logo img { max-width: 150px; height: auto; }
              .receipt-info { margin-bottom: 20px; }
              .receipt-info div { margin-bottom: 8px; }
              .amount { font-size: 20px; font-weight: bold; color: #28a745; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">
                <img src="/logo.jpg" alt="Baby Bliss Logo">
              </div>
              <h1>Baby Bliss Photography</h1>
              <h2>Payment Receipt</h2>
              <p>Receipt #: ${receiptNumber}</p>
            </div>

            <div class="receipt-info">
              <div><strong>Date:</strong> ${today}</div>
              <div><strong>Client:</strong> ${booking.first_name} ${booking.last_name}</div>
              <div><strong>Email:</strong> ${booking.email}</div>
              <div><strong>Phone:</strong> ${booking.phone || 'N/A'}</div>
              <div><strong>Event Date:</strong> ${new Date(booking.event_date).toLocaleDateString()}</div>
              <div><strong>Package:</strong> ${booking.package.charAt(0).toUpperCase() + booking.package.slice(1)}</div>
              <div><strong>Amount Paid:</strong> <span class="amount">₱${amount.toLocaleString()}</span></div>
              <div><strong>Payment Method:</strong> Cash</div>
              <div><strong>Status:</strong> PAID</div>
            </div>

            <div class="footer">
              <p>Thank you for choosing Baby Bliss Photography!</p>
              <p>This is a computer-generated receipt.</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "Success",
        description: "Receipt opened for printing",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to print receipt",
      });
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
          <title>Financial Management Report - ${new Date().toLocaleDateString()}</title>
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
            <h1>Financial Management Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${monthFilter ? `<p>Month: ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
            ${paymentFilter !== 'all' ? `<p>Payment Status: ${paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total Revenue</h3>
              <p>₱${totals.totalRevenue.toLocaleString()}</p>
            </div>
            <div class="stat-card">
              <h3>Paid Revenue</h3>
              <p style="color: #0077B6;">₱${totals.paidRevenue.toLocaleString()}</p>
            </div>
            <div class="stat-card">
              <h3>Pending Revenue</h3>
              <p style="color: #ca8a04;">₱${totals.pendingRevenue.toLocaleString()}</p>
            </div>
          </div>

          <h2>Booking Payments (${sortedBookings.length} records)</h2>
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Event Title</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${sortedBookings.map(booking => `
                <tr>
                  <td>${booking.first_name} ${booking.last_name}</td>
                  <td>${booking.first_name} ${booking.last_name} Baby Shower</td>
                  <td>${new Date(booking.event_date).toLocaleDateString()}</td>
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
      const headers = ['Client Name', 'Event Title', 'Date'];

      // CSV Data rows
      const csvData = sortedBookings.map(booking => [
        `${booking.first_name} ${booking.last_name}`,
        `${booking.first_name} ${booking.last_name} Baby Shower`,
        new Date(booking.event_date).toLocaleDateString()
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
      link.setAttribute('download', `financial_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Financial data exported to CSV successfully",
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

  const calculateTotals = () => {
    const totalRevenue = bookings.reduce((sum, booking) => {
      const price = packagePrices[booking.package] || 0;
      return sum + price;
    }, 0);

    const paidRevenue = bookings.reduce((sum, booking) => {
      if (payments[booking.id]) {
        const price = packagePrices[booking.package] || 0;
        return sum + price;
      }
      return sum;
    }, 0);

    const pendingRevenue = totalRevenue - paidRevenue;

    return { totalRevenue, paidRevenue, pendingRevenue };
  };

  const totals = calculateTotals();

  const filteredBookings = (bookings || []).filter(booking => {
    if (paymentFilter === 'paid' && !payments[booking.id]) return false;
    if (paymentFilter === 'pending' && payments[booking.id]) return false;
    if (monthFilter) {
      const eventDate = new Date(booking.event_date);
      const eventMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      if (eventMonth !== monthFilter) return false;
    }
    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'client') {
      aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
      bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
    } else if (sortColumn === 'event_title') {
      aVal = `${a.first_name} ${a.last_name} Baby Shower`.toLowerCase();
      bVal = `${b.first_name} ${b.last_name} Baby Shower`.toLowerCase();
    } else if (sortColumn === 'package') {
      aVal = (a.package || '').toLowerCase();
      bVal = (b.package || '').toLowerCase();
    } else if (sortColumn === 'event_date') {
      aVal = new Date(a.event_date);
      bVal = new Date(b.event_date);
    } else if (sortColumn === 'amount') {
      aVal = packagePrices[a.package] || 0;
      bVal = packagePrices[b.package] || 0;
    } else if (sortColumn === 'status') {
      aVal = (payments[a.id] ? 'Paid' : 'Pending').toLowerCase();
      bVal = (payments[b.id] ? 'Paid' : 'Pending').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const StatCard = ({ title, value, change, changeType, description, icon: Icon, color, bgColor }: any) => (
    <Card className={`border-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${theme === 'dark' ? 'bg-gray-800/60 backdrop-blur-sm shadow-lg' : 'bg-white shadow-sm border border-gray-100'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6">
        <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</CardTitle>
        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : bgColor} shadow-md`}>
          <Icon className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{loading ? "..." : value}</div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${changeType === 'positive' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {changeType === 'positive' ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
            {change}
            <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>vs last month</span>
          </div>
        )}
        <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, bgColor, onClick }: any) => (
    <Card className={`border-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${theme === 'dark' ? 'bg-gray-800/60 backdrop-blur-sm shadow-lg hover:bg-gray-700/60' : 'bg-white shadow-sm border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className={`inline-flex p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : bgColor} mb-4 shadow-md`}>
          <Icon className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-400' : color}`} />
        </div>
        <h3 className={`font-semibold text-base mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${marginClass}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Financial Management</h1>
                  <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Track payments and revenue analytics</p>
                </div>
                <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  <Activity className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Financial Dashboard - KPI Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Revenue"
                value={`₱${totals.totalRevenue.toLocaleString()}`}
                change="+15.3%"
                changeType="positive"
                description={`From ${bookings.length} bookings`}
                icon={Wallet}
                color="text-blue-600"
                bgColor={theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'}
              />
              <StatCard
                title="Paid Revenue"
                value={`₱${totals.paidRevenue.toLocaleString()}`}
                change="+22.1%"
                changeType="positive"
                description={`${Object.keys(payments).length} payments received`}
                icon={TrendingUp}
                color="text-emerald-600"
                bgColor={theme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-50'}
              />
              <StatCard
                title="Pending Revenue"
                value={`₱${totals.pendingRevenue.toLocaleString()}`}
                change="-8.2%"
                changeType="negative"
                description={`${bookings.length - Object.keys(payments).length} pending payments`}
                icon={TrendingDown}
                color="text-orange-600"
                bgColor={theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-50'}
              />
              <StatCard
                title="Payment Rate"
                value={`${bookings.length > 0 ? Math.round((Object.keys(payments).length / bookings.length) * 100) : 0}%`}
                change="+12.5%"
                changeType="positive"
                description="Payment completion rate"
                icon={CheckCircle}
                color="text-cyan-700"
                bgColor={theme === 'dark' ? 'bg-cyan-900/30' : 'bg-cyan-50'}
              />
            </div>

            {/* Filters and Actions */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5 mb-6 p-4 rounded-lg print:hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}">
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Payment Status</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                    <SelectValue placeholder="All bookings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bookings</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
                  <Printer className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm" title="Export CSV" className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}>
                  <FileText className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                </Button>
                <Button variant="outline" onClick={() => {setPaymentFilter('all'); setMonthFilter('');}} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                  <Filter className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                  Clear Filters
                </Button>
                {selectedBookings.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" title="Delete Selected">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Bookings</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedBookings.length} selected booking(s)? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                          try {
                            for (const id of selectedBookings) {
                              await api.deleteBooking(id);
                            }
                            toast({ title: "Success", description: "Selected bookings deleted successfully" });
                            loadBookings();
                            loadPayments();
                            setSelectedBookings([]);
                          } catch (error) {
                            toast({ variant: "destructive", title: "Error", description: "Failed to delete bookings" });
                          }
                        }}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Bookings Revenue Table */}
            <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
              <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                <CardTitle className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Booking Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
                  <div className="hidden print:block text-center py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Financial Report</h1>
                    <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="overflow-auto max-h-[500px]">
                    <table className="w-full table-fixed">
                      <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <tr>
                          <th className={`w-12 text-center py-4 px-6 font-bold sticky top-0 border ${theme === 'dark' ? 'text-gray-200 bg-gray-800 border-gray-600' : 'text-gray-800 bg-gray-100 border-gray-300'}`}>
                            <Checkbox
                              checked={selectedBookings.length === sortedBookings.length && sortedBookings.length > 0}
                              onCheckedChange={(checked) => handleSelectAllBookings(checked as boolean)}
                            />
                          </th>
                          <th className={`w-1/6 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('client')}>
                            <div className="flex items-center justify-between">
                              <span>Client</span>
                              {sortColumn === 'client' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                          </th>
                          <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('event_title')}>
                            <div className="flex items-center justify-between">
                              <span>Event Title</span>
                              {sortColumn === 'event_title' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                          </th>
                          <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('package')}>
                            <div className="flex items-center justify-between">
                              <span>Package</span>
                              {sortColumn === 'package' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                          </th>
                          <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('event_date')}>
                            <div className="flex items-center justify-between">
                              <span>Date</span>
                              {sortColumn === 'event_date' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                          </th>
                          <th className={`w-1/6 text-right py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('amount')}>
                            <div className="flex items-center justify-between">
                              <span>Amount</span>
                              {sortColumn === 'amount' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                          </th>
                          <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('status')}>
                            <div className="flex items-center justify-between">
                              <span>Status</span>
                              {sortColumn === 'status' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                          </th>
                          <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 print:hidden ${theme === 'dark' ? 'text-gray-200 bg-gray-800' : 'text-gray-800 bg-gray-50'}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {loading ? (
                          <tr>
                            <td colSpan={8} className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Loading bookings...
                            </td>
                          </tr>
                        ) : bookings.length === 0 ? (
                          <tr>
                            <td colSpan={8} className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              No bookings with packages yet.
                            </td>
                          </tr>
                        ) : (
                          sortedBookings.map((booking, index) => {
                            const isPaid = payments[booking.id];
                            const amount = packagePrices[booking.package] || 0;
                            return (
                              <tr key={booking.id} className={`transition-colors duration-150 ${theme === 'dark' ? 'hover:bg-gray-700/50 bg-gray-800' : 'hover:bg-blue-50/50 bg-white'}`}>
                                <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`}>
                                  <Checkbox
                                    checked={selectedBookings.includes(booking.id)}
                                    onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                                  />
                                </td>
                                <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-100'}`}>
                                  <div className="flex items-center gap-2">
                                    <User className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`} />
                                    <span className="truncate">{booking.first_name} {booking.last_name}</span>
                                  </div>
                                </td>
                                <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                                  <span className="truncate block">{booking.first_name} {booking.last_name} Baby Shower</span>
                                </td>
                                <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                  <Badge className="capitalize bg-gray-500 text-white rounded-[5px]">{booking.package}</Badge>
                                </td>
                                <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                                  <div className="flex items-center justify-center gap-1">
                                    <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`} />
                                    <span className="text-sm">{new Date(booking.event_date).toLocaleDateString()}</span>
                                  </div>
                                </td>
                                <td className={`py-4 px-6 text-right font-semibold border-r print:hidden ${theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-100'}`}>
                                  ₱{amount.toLocaleString()}
                                </td>
                                <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                  {isPaid ? (
                                    <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-[5px]">
                                      Paid
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-500 text-white hover:bg-orange-600 rounded-[5px]">
                                      Pending
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center print:hidden">
                                  <div className="flex items-center justify-center gap-1">
                                    {isPaid ? (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => markAsUnpaid(booking.id)}
                                          className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                          title="Mark as Unpaid"
                                        >
                                          <XCircle className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => printReceipt(booking.id)}
                                          className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                          title="Print Receipt"
                                        >
                                          <Printer className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAsPaid(booking.id, amount)}
                                        disabled={booking.status === 'pending'}
                                        className={`h-8 w-8 p-0 text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'border-green-600 hover:bg-green-900/20' : ''}`}
                                        title="Mark as Paid"
                                      >
                                        <CheckCircle className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Financial;

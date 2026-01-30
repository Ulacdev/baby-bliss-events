import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Loader2, Edit, Trash2, Eye, CalendarDays, Upload, X, Filter, Printer, Download, Calendar, MapPin, Users } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText } from "lucide-react";

const Bookings = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar, marginClass } = useSidebar();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string>('event_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    event_date: "",
    guests: "",
    venue: "",
    package: "",
    special_requests: "",
    status: "pending"
  });

  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Update loading state
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Bulk delete state
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await api.getBookings({ search });
      setBookings(response?.bookings || []);
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

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce search
    setTimeout(() => loadBookings(), 300);
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
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      event_date: "",
      guests: "",
      venue: "",
      package: "",
      special_requests: "",
      status: "pending"
    });
    setSelectedImages([]);
    setImageUrls([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);

    // Create preview URLs
    const newUrls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string> => {
    if (selectedImages.length === 0) return "";

    setUploadingImages(true);
    try {
      const formDataUpload = new FormData();
      selectedImages.forEach((file, index) => {
        formDataUpload.append(`images[${index}]`, file);
      });

      const response = await api.uploadImages(formDataUpload);
      return JSON.stringify(response.files); // Store as JSON string
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload images",
      });
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.event_date) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setCreatingBooking(true);

    try {
      let imageUrlsJson = "";
      if (selectedImages.length > 0) {
        imageUrlsJson = await uploadImages();
      }

      await api.createBooking({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        event_date: formData.event_date,
        guests: formData.guests ? parseInt(formData.guests) : undefined,
        venue: formData.venue || undefined,
        package: formData.package || undefined,
        special_requests: formData.special_requests || undefined,
        images: imageUrlsJson || undefined,
        status: formData.status as "pending" | "confirmed" | "cancelled"
      });

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      setCreateDialogOpen(false);
      resetForm();
      loadBookings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create booking",
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedBooking) return;

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.event_date) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setUpdatingBooking(true);

    try {
      let imageUrlsJson = selectedBooking.images || "";
      if (selectedImages.length > 0) {
        const newImageUrls = await uploadImages();
        let existingImages = [];
        try {
          existingImages = selectedBooking.images ? JSON.parse(selectedBooking.images) : [];
          if (!Array.isArray(existingImages)) existingImages = [];
        } catch {
          existingImages = [];
        }
        const newImages = JSON.parse(newImageUrls);
        imageUrlsJson = JSON.stringify([...existingImages, ...newImages]);
      }

      await api.updateBooking(selectedBooking.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        event_date: formData.event_date,
        guests: formData.guests ? parseInt(formData.guests) : undefined,
        venue: formData.venue || undefined,
        package: formData.package || undefined,
        special_requests: formData.special_requests || undefined,
        images: imageUrlsJson || undefined,
        status: formData.status as "pending" | "confirmed" | "cancelled"
      });

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      setEditDialogOpen(false);
      resetForm();
      loadBookings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update booking",
      });
    } finally {
      setUpdatingBooking(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteBooking(id);

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });

      loadBookings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete booking",
      });
    }
  };

  const handleSelectBooking = (id: number, checked: boolean) => {
    setSelectedBookings(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(bookingId => bookingId !== id);
      }
    });
  };


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(sortedBookings.map(booking => booking.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const clearSelection = () => {
    setSelectedBookings([]);
  };


  const openEditDialog = (booking: any) => {
    setSelectedBooking(booking);
    setFormData({
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email,
      phone: booking.phone || "",
      event_date: booking.event_date,
      guests: booking.guests ? booking.guests.toString() : "",
      venue: booking.venue || "",
      package: booking.package || "",
      special_requests: booking.special_requests || "",
      status: booking.status
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (booking: any) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    return status === "confirmed"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : status === "pending"
      ? "bg-orange-500 text-white hover:bg-orange-600"
      : "bg-red-500 text-white hover:bg-red-600";
  };

  const filteredBookings = (bookings || []).filter(booking => {
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
    if (monthFilter) {
      const bookingDate = new Date(booking.event_date);
      const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
      if (bookingMonth !== monthFilter) return false;
    }
    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'client') {
      aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
      bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
    } else if (sortColumn === 'event_name') {
      aVal = (a.special_requests || 'Baby Shower').toLowerCase();
      bVal = (b.special_requests || 'Baby Shower').toLowerCase();
    } else if (sortColumn === 'event_date') {
      aVal = new Date(a.event_date);
      bVal = new Date(b.event_date);
    } else if (sortColumn === 'venue') {
      aVal = (a.venue || 'TBD').toLowerCase();
      bVal = (b.venue || 'TBD').toLowerCase();
    } else if (sortColumn === 'status') {
      aVal = a.status.toLowerCase();
      bVal = b.status.toLowerCase();
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

      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bookings Management Report - ${new Date().toLocaleDateString()}</title>
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
            <h1>Bookings Management Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${monthFilter ? `<p>Month: ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>` : ''}
            ${statusFilter !== 'all' ? `<p>Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <h3>Total Bookings</h3>
              <p>${bookings.length}</p>
            </div>
            <div class="stat-card">
              <h3>Confirmed</h3>
              <p style="color: #0077B6;">${bookings.filter(b => b.status === 'confirmed').length}</p>
            </div>
            <div class="stat-card">
              <h3>Pending</h3>
              <p style="color: #ca8a04;">${bookings.filter(b => b.status === 'pending').length}</p>
            </div>
          </div>

          <h2>Booking Records (${sortedBookings.length} records)</h2>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Event Name</th>
                <th>Date</th>
                <th>Venue</th>
              </tr>
            </thead>
            <tbody>
              ${sortedBookings.map(booking => `
                <tr>
                  <td>${booking.first_name} ${booking.last_name}</td>
                  <td>${booking.special_requests || 'Baby Shower'}</td>
                  <td>${new Date(booking.event_date).toLocaleDateString()}</td>
                  <td>${booking.venue || 'TBD'}</td>
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
      const headers = ['Client Name', 'Event Name', 'Date', 'Venue'];

      // CSV Data rows
      const csvData = sortedBookings.map(booking => [
        `${booking.first_name} ${booking.last_name}`,
        booking.special_requests || 'Baby Shower',
        new Date(booking.event_date).toLocaleDateString(),
        booking.venue || 'TBD'
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
      link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Booking data exported to CSV successfully",
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
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Booking Management</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Manage and track all event bookings</p>
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <CalendarDays className="h-4 w-4 inline mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <Input
                  placeholder="Search bookings by name, email, or venue..."
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-[5px] shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
                    <DialogHeader>
                      <DialogTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Create New Booking</DialogTitle>
                      <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                        Add a new booking to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className={theme === 'dark' ? 'text-gray-300' : ''}>First Name *</Label>
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            placeholder="John"
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className={theme === 'dark' ? 'text-gray-300' : ''}>Last Name *</Label>
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            placeholder="Doe"
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className={theme === 'dark' ? 'text-gray-300' : ''}>Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="john@example.com"
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className={theme === 'dark' ? 'text-gray-300' : ''}>Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="(555) 123-4567"
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="event_date" className={theme === 'dark' ? 'text-gray-300' : ''}>Event Date *</Label>
                          <Input
                            id="event_date"
                            type="date"
                            value={formData.event_date}
                            onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guests" className={theme === 'dark' ? 'text-gray-300' : ''}>Guests</Label>
                          <Input
                            id="guests"
                            type="number"
                            value={formData.guests}
                            onChange={(e) => setFormData({...formData, guests: e.target.value})}
                            placeholder="50"
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venue" className={theme === 'dark' ? 'text-gray-300' : ''}>Venue</Label>
                        <Input
                          id="venue"
                          value={formData.venue}
                          onChange={(e) => setFormData({...formData, venue: e.target.value})}
                          placeholder="Garden Terrace"
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="package" className={theme === 'dark' ? 'text-gray-300' : ''}>Package</Label>
                        <Select value={formData.package} onValueChange={(value) => setFormData({...formData, package: value})}>
                          <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                            <SelectValue placeholder="Select a package" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic (₱15,000)</SelectItem>
                            <SelectItem value="premium">Premium (₱25,000)</SelectItem>
                            <SelectItem value="deluxe">Deluxe (₱40,000)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className={theme === 'dark' ? 'text-gray-300' : ''}>Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                          <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="special_requests" className={theme === 'dark' ? 'text-gray-300' : ''}>Special Requests</Label>
                        <Textarea
                          id="special_requests"
                          value={formData.special_requests}
                          onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                          placeholder="Any special requirements..."
                          rows={3}
                          className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="images">Images</Label>
                        <div className="space-y-2">
                          <Input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                          />
                          {imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {imageUrls.map((url, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {setCreateDialogOpen(false); resetForm();}}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreate} disabled={creatingBooking}>
                        {creatingBooking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Create Booking
                      </Button>
                    </DialogFooter>
                  </DialogContent>
              </Dialog>
            </div>
            </div>

            {/* Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
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
                <Button variant="outline" onClick={() => {setStatusFilter('all'); setMonthFilter(''); setSearch('');}} className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-white' : ''}>
                  <Filter className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : ''}`} />
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
                            clearSelection();
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

            <Card className={`shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'shadow-blue-500/10 border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300'}`}>
                <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>All Bookings</CardTitle>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Complete list of all event bookings</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={theme === 'dark' ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-blue-50 text-blue-700 border-blue-300'}>
                        {bookings.filter(b => b.status === 'confirmed').length} Confirmed
                      </Badge>
                      <Badge variant="outline" className={theme === 'dark' ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-indigo-50 text-indigo-700 border-indigo-300'}>
                        {bookings.filter(b => b.status === 'pending').length} Pending
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
          <CardContent>
            <div className="border border-gray-200 rounded-lg overflow-hidden table-to-print">
              <div className="hidden print:block text-center py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Baby Bliss Bookings Report</h1>
                <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full table-fixed">
                  <thead className={`border-b-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <tr>
                      <th className={`w-12 text-center py-4 px-6 font-bold sticky top-0 border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 border-gray-700' : 'text-gray-800 bg-gray-50 border-gray-200'}`}>
                        <Checkbox
                          checked={selectedBookings.length === sortedBookings.length && sortedBookings.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </th>
                      <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('client')}>
                        <div className="flex items-center justify-between">
                          <span>Client</span>
                          {sortColumn === 'client' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className={`w-1/4 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('event_name')}>
                        <div className="flex items-center justify-between">
                          <span>Event Name</span>
                          {sortColumn === 'event_name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className={`w-1/6 text-center py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('event_date')}>
                        <div className="flex items-center justify-between">
                          <span>Date</span>
                          {sortColumn === 'event_date' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className={`w-1/6 text-left py-4 px-6 font-bold sticky top-0 cursor-pointer hover:bg-gray-100 select-none border-r ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-700' : 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200'}`} onClick={() => handleSort('venue')}>
                        <div className="flex items-center justify-between">
                          <span>Venue</span>
                          {sortColumn === 'venue' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
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
                        <td colSpan={7} className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-2">Loading bookings...</span>
                          </div>
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      sortedBookings.map((booking, index) => (
                        <tr key={booking.id} className={`transition-colors duration-150 ${theme === 'dark' ? `hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}` : `hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}`}>
                          <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                            <Checkbox
                              checked={selectedBookings.includes(booking.id)}
                              onCheckedChange={(checked) => handleSelectBooking(booking.id, !!checked)}
                            />
                          </td>
                          <td className={`py-4 px-6 font-semibold border-r ${theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-100'}`}>
                            <div className="flex items-center gap-2">
                              <Users className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className="truncate">{`${booking.first_name} ${booking.last_name}`}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                            <span className="truncate block">{booking.special_requests || 'Baby Shower'}</span>
                          </td>
                          <td className={`py-4 px-6 text-center border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                            <div className="flex items-center justify-center gap-1">
                              <Calendar className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className="text-sm">{new Date(booking.event_date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-6 border-r ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-100'}`}>
                            <div className="flex items-center gap-2">
                              <MapPin className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className="truncate">{booking.venue || 'TBD'}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-6 text-center border-r print:hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                            <span className={`px-3 py-1 rounded-[5px] text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(booking)}
                                className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                title="View Booking"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(booking)}
                                className={`h-8 w-8 p-0 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                                title="Edit Booking"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(booking.id)}
                                className={`h-8 w-8 p-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                                title="Delete Booking"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          
          <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-gray-100' : ''}>Edit Booking</DialogTitle>
              <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                Update booking information.
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
                <Label htmlFor="edit_email" className={theme === 'dark' ? 'text-white' : ''}>Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone" className={theme === 'dark' ? 'text-white' : ''}>Phone</Label>
                <Input
                  id="edit_phone"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_event_date" className={theme === 'dark' ? 'text-white' : ''}>Event Date *</Label>
                  <Input
                    id="edit_event_date"
                    type="date"
                    className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_guests" className={theme === 'dark' ? 'text-white' : ''}>Guests</Label>
                  <Input
                    id="edit_guests"
                    type="number"
                    className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_venue" className={theme === 'dark' ? 'text-white' : ''}>Venue</Label>
                <Input
                  id="edit_venue"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package" className={theme === 'dark' ? 'text-white' : ''}>Package</Label>
                <Select value={formData.package} onValueChange={(value) => setFormData({...formData, package: value})}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (₱15,000)</SelectItem>
                    <SelectItem value="premium">Premium (₱25,000)</SelectItem>
                    <SelectItem value="deluxe">Deluxe (₱40,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className={theme === 'dark' ? 'text-white' : ''}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_special_requests" className={theme === 'dark' ? 'text-white' : ''}>Special Requests</Label>
                <Textarea
                  id="edit_special_requests"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}
                  value={formData.special_requests}
                  onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_images" className={theme === 'dark' ? 'text-white' : ''}>Add Images</Label>
                <div className="space-y-2">
                  <Input
                    id="edit_images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                  />
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedBooking?.images && (() => {
                    try {
                      const images = JSON.parse(selectedBooking.images);
                      return Array.isArray(images) && images.length > 0;
                    } catch {
                      return false;
                    }
                  })() && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Existing Images:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(() => {
                          try {
                            const images = JSON.parse(selectedBooking.images);
                            return Array.isArray(images) ? images : [];
                          } catch {
                            return [];
                          }
                        })().map((url: string, index: number) => (
                          <div key={`existing-${index}`} className="relative">
                            <img
                              src={url}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {setEditDialogOpen(false); resetForm();}}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updatingBooking}>
                {updatingBooking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                View booking information.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.first_name} {selectedBooking.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Event Date</Label>
                    <p className="text-sm text-muted-foreground">{new Date(selectedBooking.event_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Guests</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.guests || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Venue</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.venue || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Package</Label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedBooking.package || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedBooking.status}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Special Requests</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.special_requests || 'None'}</p>
                </div>
                {selectedBooking.images && (() => {
                  try {
                    const images = JSON.parse(selectedBooking.images);
                    return Array.isArray(images) && images.length > 0;
                  } catch {
                    return false;
                  }
                })() && (
                  <div>
                    <Label className="text-sm font-medium">Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {(() => {
                        try {
                          const images = JSON.parse(selectedBooking.images);
                          return Array.isArray(images) ? images : [];
                        } catch {
                          return [];
                        }
                      })().map((url: string, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Booking image ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span>Created: {new Date(selectedBooking.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span>Updated: {new Date(selectedBooking.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default Bookings;

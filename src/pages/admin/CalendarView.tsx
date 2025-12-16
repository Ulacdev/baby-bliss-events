import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Edit, X } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";

const CalendarView = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
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

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      const response = await api.getCalendarBookings(
        currentDate.getMonth() + 1,
        currentDate.getFullYear()
      );
      setCalendarData(response);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load calendar data",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const renderCalendarDays = () => {
    const days = [];
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-border bg-muted/20"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = calendarData?.events?.[dateKey] || [];

      days.push(
        <div key={day} className="h-24 border border-border p-1 bg-card hover:bg-muted/50 transition-colors">
          <div className="text-sm font-medium mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event: any, index: number) => (
              <div
                key={index}
                className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                title={`${event.client} - ${event.title}`}
              >
                {event.client.split(' ')[0]}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-cyan-100 text-cyan-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
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
    try {
      const formDataUpload = new FormData();
      selectedImages.forEach((file, index) => {
        formDataUpload.append(`images[${index}]`, file);
      });
      const response = await api.uploadImages(formDataUpload);
      return JSON.stringify(response.files);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload images",
      });
      throw error;
    }
  };

  const openEditDialog = (booking: any) => {
    setSelectedBooking(booking);
    setFormData({
      first_name: booking.client.split(' ')[0],
      last_name: booking.client.split(' ').slice(1).join(' '),
      email: booking.email || "",
      phone: booking.phone || "",
      event_date: booking.date,
      guests: booking.guests ? booking.guests.toString() : "",
      venue: booking.venue || "",
      package: booking.package || "",
      special_requests: booking.special_requests || "",
      status: booking.status
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedBooking) return;
    try {
      let imageUrlsJson = selectedBooking.images || "";
      if (selectedImages.length > 0) {
        const newImageUrls = await uploadImages();
        const existingImages = selectedBooking.images ? JSON.parse(selectedBooking.images) : [];
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
      setSelectedImages([]);
      setImageUrls([]);
      loadCalendarData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update booking",
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
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Calendar View</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>View all bookings in calendar format</p>
                </div>
                <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
                  <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`flex items-center gap-2 text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <Calendar className="h-5 w-5 text-blue-500" />
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('prev')}
                          className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('next')}
                          className={theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading calendar...</span>
                      </div>
                    ) : (
                      <>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-0 mb-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
                          {renderCalendarDays()}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events Sidebar */}
              <div>
                <Card className={`border hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-blue-200 bg-white hover:border-blue-300'}`}>
                  <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                    <div>
                      <CardTitle className={`text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Upcoming Events</CardTitle>
                      <CardDescription className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Next 7 days</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : calendarData?.bookings?.filter((booking: any) => {
                      const eventDate = new Date(booking.date);
                      const today = new Date();
                      const nextWeek = new Date(today);
                      nextWeek.setDate(today.getDate() + 7);
                      return eventDate >= today && eventDate <= nextWeek && booking.status === 'confirmed';
                    }).length > 0 ? (
                      <div className="space-y-3">
                        {calendarData.bookings
                          .filter((booking: any) => {
                            const eventDate = new Date(booking.date);
                            const today = new Date();
                            const nextWeek = new Date(today);
                            nextWeek.setDate(today.getDate() + 7);
                            return eventDate >= today && eventDate <= nextWeek && booking.status === 'confirmed';
                          })
                          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((booking: any) => (
                            <div key={booking.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{booking.client}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openEditDialog(booking)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(booking.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.venue}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {booking.guests} guests
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming events</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Booking</DialogTitle>
                  <DialogDescription>Update booking information and images.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Date *</Label>
                      <Input type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Guests</Label>
                      <Input type="number" value={formData.guests} onChange={(e) => setFormData({...formData, guests: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Add Images</Label>
                    <Input type="file" multiple accept="image/*" onChange={handleImageSelect} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                            <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => removeImage(index)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {setEditDialogOpen(false); setSelectedImages([]); setImageUrls([]);}}>Cancel</Button>
                  <Button onClick={handleEdit}>Update Booking</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CalendarView;

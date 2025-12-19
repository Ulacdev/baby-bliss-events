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
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Edit, X, ChevronDown, Eye } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";

const CalendarView = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar, marginClass } = useSidebar();
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
    const today = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className={`min-h-[100px] border-r border-b border-gray-200 last:border-r-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50'}`}></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = calendarData?.events?.[dateKey] || [];
      const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

      days.push(
        <div key={day} className={`min-h-[100px] border-r border-b border-gray-200 last:border-r-0 p-2 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600 font-bold' : theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event: any, index: number) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${event.status === 'confirmed' ? 'bg-green-500' : event.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}
                title={`${event.client} - ${event.title}`}
              ></div>
            ))}
            {dayEvents.length > 3 && (
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                +{dayEvents.length - 3}
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
      case 'confirmed': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
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
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${marginClass}`}>
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
                <Card className={`border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg font-normal ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateMonth('prev')}
                          className={`h-8 w-8 p-0 shadow-md ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : 'text-blue-500 hover:text-blue-700 hover:bg-gray-100'}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateMonth('next')}
                          className={`h-8 w-8 p-0 shadow-md ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : 'text-blue-500 hover:text-blue-700 hover:bg-gray-100'}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                      </div>
                    ) : (
                      <>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className={`p-3 text-center text-sm font-medium border-r border-gray-200 last:border-r-0 ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-600'}`}>
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-0">
                          {renderCalendarDays()}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events Sidebar */}
              <div>
                <Card className={`border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <CardTitle className={`text-lg font-normal ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
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
                            <div key={booking.id} className={`p-3 border rounded ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-medium text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.client}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${getStatusColor(booking.status)} rounded-[5px]`}>
                                    {booking.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openEditDialog(booking)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                                <div>{new Date(booking.date).toLocaleDateString()}</div>
                                <div>{booking.venue}</div>
                                <div>{booking.guests} guests</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming events</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* View Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>View Booking Details</DialogTitle>
                  <DialogDescription>Booking information and details.</DialogDescription>
                </DialogHeader>
                {selectedBooking && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">First Name</Label>
                        <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                          {selectedBooking.client.split(' ')[0]}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                        <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                          {selectedBooking.client.split(' ').slice(1).join(' ')}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {selectedBooking.email || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {selectedBooking.phone || 'N/A'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Event Date</Label>
                        <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                          {new Date(selectedBooking.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Guests</Label>
                        <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                          {selectedBooking.guests || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Venue</Label>
                      <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {selectedBooking.venue || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Package</Label>
                      <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {selectedBooking.package || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="flex">
                        <Badge className={`${getStatusColor(selectedBooking.status)} rounded-[5px]`}>
                          {selectedBooking.status}
                        </Badge>
                      </div>
                    </div>
                    {selectedBooking.special_requests && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Special Requests</Label>
                        <div className={`p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                          {selectedBooking.special_requests}
                        </div>
                      </div>
                    )}
                    {selectedBooking.images && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Images</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {JSON.parse(selectedBooking.images).map((image: string, index: number) => (
                            <div key={index} className="relative">
                              <img src={image} alt={`Booking image ${index + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
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

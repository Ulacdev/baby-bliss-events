import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Users, MapPin, Upload, X, Image, Loader2, CheckCircle, Home, Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import { Link } from "react-router-dom";
import ShootingStars from "@/components/ShootingStars";

const Book = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    event_date: "",
    guests: "",
    venue: "",
    package: "",
    special_requests: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.getClients();
      setClients(response.clients);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  };

  const handleClientSelect = (clientId: string) => {
    if (clientId === "new") {
      setShowNewClientDialog(true);
      setFormData(prev => ({
        ...prev,
        client_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: ""
      }));
    } else {
      const selectedClient = clients.find(c => c.email === clientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          client_id: clientId,
          first_name: selectedClient.first_name,
          last_name: selectedClient.last_name,
          email: selectedClient.email,
          phone: selectedClient.phone || ""
        }));
      }
    }
  };

  const handleCreateNewClient = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "First name, last name, and email are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.createClient({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
      });

      await loadClients();
      setShowNewClientDialog(false);

      toast({
        title: "Success",
        description: "New client created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new client",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id === "firstName" ? "first_name" : id === "lastName" ? "last_name" : id === "message" ? "special_requests" : id]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images.",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB.`,
          variant: "destructive",
        });
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.package) {
      toast({
        title: "Package Required",
        description: "Please select a package before submitting your booking.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrls: string[] = [];

      // Upload images first if any
      if (images.length > 0) {
        try {
          const formDataUpload = new FormData();
          images.forEach((file, index) => {
            formDataUpload.append('files[]', file);
          });

          const uploadResponse = await api.uploadImages(formDataUpload);
          if (uploadResponse.files && uploadResponse.files.length > 0) {
            imageUrls = uploadResponse.files.map(filename => '/uploads/' + filename);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: "Image Upload Failed",
            description: "Your booking will be submitted without images. You can add them later.",
            variant: "destructive",
          });
          // Continue with booking submission even if image upload fails
        }
      }

      const bookingData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        event_date: formData.event_date,
        guests: formData.guests ? parseInt(formData.guests) : undefined,
        venue: formData.venue,
        package: formData.package,
        special_requests: formData.special_requests,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        status: "pending" as const,
      };

      await api.createBooking(bookingData);
      setSubmitted(true);
    } catch (error) {
      console.error("Booking submission failed:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error submitting your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ShootingStars />
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8 flex justify-center">
                <CheckCircle className="h-24 w-24 text-green-500" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Booking Successful!</h1>
              <p className="text-xl text-gray-600 mb-8">
                Thank you for your booking request, {formData.first_name}!
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 mb-8">
                <p className="text-gray-700 mb-4">
                  We've received your booking and will get back to you within 24 hours to confirm your event details.
                </p>
                <p className="text-gray-600 text-sm">
                  A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>
                </p>
              </div>
              <div className="space-y-4">
                <Link to="/">
                  <Button className="w-full bg-blue-500 text-white hover:bg-blue-600 px-8 py-3 rounded-lg font-bold text-lg">
                    <Home className="mr-2 h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col animate-page-fade-in">
      <ShootingStars />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center bg-fixed bg-cover bg-center" style={{backgroundImage: 'url(/gallery.jpg)'}}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-300 leading-tight mb-4 sm:mb-6" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                Book Your
                <span className="block text-white mt-2">Perfect Event</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-6 sm:mb-8 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                Turn your baby shower dreams into reality. We create Instagram-worthy celebrations that make hearts melt and memories last forever.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6 animate-slide-in-left">
                    <h2 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Comic Sans MS, cursive'}}>Book Your Perfect Event</h2>
                    <p className="text-gray-600 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                      Turn your baby shower dreams into reality with our expert event planning. We create memorable celebrations with creativity, attention to detail, and genuine care for every special occasion.
                    </p>
                    <p className="text-gray-600 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                      Choose from our Basic (up to 30 guests), Premium (up to 50 guests), or Deluxe packages (up to 80 guests). Each includes professional planning, beautiful decor, catering, and personalized service to make your event perfect.
                    </p>
                    <p className="text-gray-600 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                      Fill out the form and we'll contact you within 24 hours to bring your vision to life. Upload inspiration images and let our experienced team create your unforgettable celebration!
                    </p>
 
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Comic Sans MS, cursive'}}>Frequently Asked Questions</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800">How far in advance should I book?</h4>
                          <p className="text-gray-600 text-sm">We recommend booking at least 4-6 weeks in advance for the best availability and preparation time.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Can I customize my package?</h4>
                          <p className="text-gray-600 text-sm">Absolutely! All packages can be customized to fit your specific needs and preferences.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">What if I need to cancel or reschedule?</h4>
                          <p className="text-gray-600 text-sm">We understand plans change. Contact us as soon as possible for flexible rescheduling options.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 max-h-[600px] overflow-y-auto shadow-lg animate-slide-in-right">
                  <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="Jane"
                        required
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Smith"
                        required
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="jane@example.com"
                        required
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                        required
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="event_date" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                        Preferred Date *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="event_date"
                          type="date"
                          value={formData.event_date}
                          onChange={handleInputChange}
                          required
                          className="h-12 pl-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="guests" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                        Number of Guests *
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="guests"
                          type="number"
                          value={formData.guests}
                          onChange={handleInputChange}
                          placeholder="50"
                          required
                          min="1"
                          className="h-12 pl-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      Choose Your Package *
                    </Label>
                    <select
                      id="package"
                      value={formData.package}
                      onChange={(e) => setFormData({...formData, package: e.target.value})}
                      required
                      className="w-full h-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white px-4"
                    >
                      <option value="">Select a package...</option>
                      <option value="basic">Basic Package - ₱15,000 (Up to 30 guests, 2 hours)</option>
                      <option value="premium">Premium Package - ₱25,000 (Up to 50 guests, 3 hours)</option>
                      <option value="deluxe">Deluxe Package - ₱40,000 (Up to 80 guests, 4 hours)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="venue" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      Preferred Venue
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="venue"
                        value={formData.venue}
                        onChange={handleInputChange}
                        placeholder="Garden Terrace, Rose Hall, etc."
                        className="h-12 pl-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="special_requests" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      Special Requests or Theme Ideas
                    </Label>
                    <Textarea
                      id="special_requests"
                      value={formData.special_requests}
                      onChange={handleInputChange}
                      placeholder="Tell us about your dream baby shower..."
                      className="min-h-32 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white p-4 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Event Images (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload images for your event inspiration</p>
                      <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF up to 5MB each (max 10 images)</p>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <Image className="h-4 w-4 mr-2" />
                        Choose Images
                      </Label>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 text-white hover:opacity-90 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
                      style={{backgroundColor: '#006994'}}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Submitting Your Request...
                        </>
                      ) : (
                        <>
                          Submit Booking Request
                          <Upload className="ml-3 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-gray-600 mt-6 text-sm leading-relaxed">
                      We'll get back to you within 24 hours to confirm your booking and discuss the details.
                    </p>
                  </div>
                    </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system before creating their booking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_first_name">First Name *</Label>
                <Input
                  id="new_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_last_name">Last Name *</Label>
                <Input
                  id="new_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_email">Email *</Label>
              <Input
                id="new_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_phone">Phone</Label>
              <Input
                id="new_phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewClient}>
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Book;

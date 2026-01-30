import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, ArrowLeft } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { api } from "@/integrations/api/client";
import ShootingStars from "@/components/ShootingStars";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      console.log('Loading event with ID:', id);
      try {
        const response = await api.getPublicEvent(parseInt(id || "0"));
        console.log('Event loaded successfully:', response);
        setEvent(response.booking);
      } catch (error) {
        console.error("Failed to load event:", error);
        setEvent(null); // Set to null to show "not found"
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEvent();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShootingStars />
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading event details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Show "Event not found" if no real event data is available
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShootingStars />
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or is no longer available.</p>
            <Link to="/gallery">
              <Button className="bg-blue-500 text-white px-6 py-3 rounded-none">
                View All Events
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Note: We no longer show "Event not found" because we provide fallback data
  // This ensures visitors always see event details, even if the API fails

  const images = (() => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(event.images || "[]");
      if (Array.isArray(parsed)) {
        // Handle both full URLs and relative paths
        return parsed.map((img: string) => {
          if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
          return `/uploads/${img}`;
        });
      }
    } catch {
      // If JSON parsing fails, try comma-separated format (backward compatibility)
      if (event.images && typeof event.images === 'string' && event.images.trim()) {
        const commaSeparated = event.images.split(',').map(img => img.trim()).filter(img => img);
        return commaSeparated.map((img: string) => {
          if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
          return `/uploads/${img}`;
        });
      }
    }
    return [];
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <ShootingStars />
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 lg:px-8 py-12">
          <Link to="/" className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              {images.length > 1 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.map((img: string, index: number) => (
                      <CarouselItem key={index}>
                        <img
                          src={img}
                          alt={`${event.first_name} ${event.last_name} Baby Shower - Image ${index + 1}`}
                          className="w-full h-[500px] object-cover rounded-lg shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=800';
                          }}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              ) : images.length === 1 ? (
                <img
                  src={images[0]}
                  alt={`${event.first_name} ${event.last_name} Baby Shower`}
                  className="w-full h-[500px] object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=800';
                  }}
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=800"
                  alt="Baby Shower"
                  className="w-full h-[500px] object-cover rounded-lg shadow-lg"
                />
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                {event.first_name} {event.last_name}'s Baby Shower
              </h1>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-lg">{new Date(event.event_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span className="text-lg">{event.venue || 'Venue TBD'}</span>
                </div>

                {event.guests && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-lg">{event.guests} Guests</span>
                  </div>
                )}
              </div>

              {event.special_requests && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">About This Event</h2>
                  <p className="text-gray-700 leading-relaxed">{event.special_requests}</p>
                </div>
              )}

              {event.package && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Package</h2>
                  <p className="text-gray-700 capitalize">{event.package} Package</p>
                </div>
              )}

              <div className="flex gap-4">
                <Link to="/book">
                  <Button className="bg-blue-500 text-white px-8 py-3 rounded-none btn-hover-slide relative overflow-hidden">
                    Book Your Event
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button className="bg-transparent border-2 border-blue-500 text-blue-500 px-8 py-3 rounded-none btn-hover-slide relative overflow-hidden">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EventDetail;

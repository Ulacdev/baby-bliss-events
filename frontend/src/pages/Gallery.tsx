import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/integrations/api/client";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ShootingStars from "@/components/ShootingStars";

const Gallery = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(false);
  const eventsPerPage = 9;

  useEffect(() => {
    loadEvents();
  }, [currentPage, activeTab]);

  // Auto-refresh events every minute to ensure past events move to past category
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Load all confirmed events (both upcoming and past) to ensure proper categorization
      // Use getBookings API to get all events, then filter for confirmed status
      const response = await api.getBookings({ limit: 1000, status: 'confirmed' });
      const allEvents = response.bookings || [];
      const now = new Date();

      // Always categorize events based on current date to ensure automatic movement
      // Ensure proper date parsing and comparison with robust error handling
      const upcoming = [];
      const past = [];

      allEvents.forEach(e => {
        try {
          // Handle different date formats (YYYY-MM-DD, ISO string, etc.)
          // Use event_date for bookings API, date for upcoming events API
          const dateField = (e as any).event_date || (e as any).date;
          let eventDate;

          if (typeof dateField === 'string') {
            // Try parsing as YYYY-MM-DD format first
            if (dateField.match(/^\d{4}-\d{2}-\d{2}$/)) {
              eventDate = new Date(dateField + 'T00:00:00'); // Add time to ensure local timezone
            } else {
              eventDate = new Date(dateField);
            }
          } else {
            eventDate = new Date(dateField);
          }

          // Check if date is valid
          if (isNaN(eventDate.getTime())) {
            console.warn(`Invalid date for event ${e.id}: ${dateField}`);
            return; // Skip invalid dates
          }

          // Compare dates (set both to start of day for accurate comparison)
          const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

          const isUpcoming = eventDateOnly >= nowDate;
          console.log(`Event ${e.id} (${dateField}) -> ${eventDateOnly.toDateString()}: ${isUpcoming ? 'UPCOMING' : 'PAST'}`);

          // Transform booking data to event format for consistent display
          const eventData = {
            id: e.id,
            title: `${(e as any).first_name || 'Unknown'} ${(e as any).last_name || 'Guest'} Baby Shower`,
            date: dateField,
            venue: (e as any).venue || 'TBD',
            image: (e as any).images ? (() => {
              const images = JSON.parse((e as any).images);
              if (images && images.length > 0) {
                const firstImage = images[0];
                if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
                  return firstImage;
                } else {
                  return '/uploads/' + firstImage;
                }
              }
              return '/placeholder.svg';
            })() : '/placeholder.svg'
          };

          if (isUpcoming) {
            upcoming.push(eventData);
          } else {
            past.push(eventData);
          }
        } catch (error) {
          console.error(`Error parsing date for event ${e.id}: ${(e as any).event_date || (e as any).date}`, error);
        }
      });

      console.log(`Total events: ${allEvents.length}, Upcoming: ${upcoming.length}, Past: ${past.length}, Current date: ${now.toISOString()}`);

      setUpcomingEvents(upcoming);
      setPastEvents(past);

      // Set total based on active tab for pagination calculation
      if (activeTab === "upcoming") {
        setTotalEvents(upcoming.length);
      } else if (activeTab === "past") {
        setTotalEvents(past.length);
      } else {
        // For "all" tab, show total of both upcoming and past
        setTotalEvents(upcoming.length + past.length);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      setUpcomingEvents([]);
      setPastEvents([]);
      setTotalEvents(0);
    } finally {
      setLoading(false);
    }
  };

  const allEvents = activeTab === "upcoming"
    ? upcomingEvents
    : activeTab === "past"
    ? pastEvents
    : [...upcomingEvents, ...pastEvents]; // All events for "all" tab

  const filteredEvents = allEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply pagination to filtered events
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const displayEvents = filteredEvents.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  return (
    <div className="min-h-screen flex flex-col animate-page-fade-in">
      <ShootingStars />
      <Navbar />
      
      <main className="flex-1">
        <section className="relative h-[60vh] flex items-center justify-center bg-fixed bg-cover bg-center" style={{backgroundImage: 'url(/33.jpg)'}}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-300 leading-tight mb-4 sm:mb-6" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              View Our
              <span className="block text-white mt-2">Gallery</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              Browse through our collection of beautiful baby showers we've had the pleasure to create
            </p>
          </div>
        </section>
        
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search events by title or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => handleTabChange(e.target.value)}
                  className="px-6 py-3 border-2 border-gray-900 rounded-none font-bold bg-white text-gray-900 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 pr-10"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none text-gray-900" />
              </div>
            </div>

            {loading ? (
              <div className="text-center text-gray-600 py-12">
                <p className="text-lg">Loading events...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayEvents.map((event, index) => (
                      <div key={event.id} className={`bg-white shadow-card hover:shadow-hover shadow-lg shadow-xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden cursor-pointer group rounded-lg animate-fade-in-delay-${Math.min(index + 1, 3)} transition-smooth`} onClick={() => navigate(`/event/${event.id}`)}>
                      <div className="relative h-80 overflow-hidden rounded-t-lg">
                        <img
                          src={event.image || '/placeholder.svg'}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-6 text-white">
                            <p className="font-semibold text-lg">{event.title}</p>
                            <p className="text-sm">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                          className="w-10 h-10"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {displayEvents.length === 0 && !loading && (
                  <div className="text-center text-gray-600 py-12">
                    <p className="text-lg">
                      No {activeTab === "all" ? "events" : activeTab} events at the moment.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;

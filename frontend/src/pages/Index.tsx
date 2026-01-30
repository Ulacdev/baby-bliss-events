import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero3D from "@/components/Hero3D";
import Background3D from "@/components/Background3D";
import Card3D from "@/components/Card3D";
import Interactive3DSection from "@/components/Interactive3DSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star, Calendar, Users, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/integrations/api/client";
import ShootingStars from "@/components/ShootingStars";
import ShootingStars3D from "@/components/ShootingStars3D";
import { useTheme } from "@/contexts/ThemeContext";

const Index = () => {
  const { theme } = useTheme();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ general_site_title: 'Baby Bliss', general_company_name: 'Baby Bliss' });
  const [aboutImageInView, setAboutImageInView] = useState(false);
  const [aboutTextInView, setAboutTextInView] = useState(false);
  const [packagesInView, setPackagesInView] = useState(false);
  const [eventsInView, setEventsInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const aboutImageRef = useRef<HTMLImageElement>(null);
  const aboutTextRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  const duplicatedEvents = upcomingEvents.length >= 4 ? [...upcomingEvents, ...upcomingEvents] : upcomingEvents;
  const shouldAutoScroll = upcomingEvents.length >= 4;
  const aboutContent = {
    image: "/abt-removebg-preview.png",
    title: "Create Unforgettable Memories with Baby Bliss",
    description: "Book your perfect baby shower celebration with ease! Our simple booking system lets you reserve your date, choose your theme, and customize every detail in minutes. Join hundreds of happy families who trusted us to make their special day extraordinary."
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsResponse, settingsResponse] = await Promise.all([
          api.getUpcomingEvents(),
          api.getSettings()
        ]);
        setUpcomingEvents(eventsResponse.events);
        if (settingsResponse.settings) {
          setSettings(prev => ({ ...prev, ...settingsResponse.settings }));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setUpcomingEvents([
          {
            id: 1,
            title: "Sample Baby Shower",
            date: "December 15, 2024",
            venue: "Garden Terrace",
            image: "/placeholder.svg"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === aboutImageRef.current) {
            setAboutImageInView(entry.isIntersecting);
          } else if (entry.target === aboutTextRef.current) {
            setAboutTextInView(entry.isIntersecting);
          } else if (entry.target === packagesRef.current) {
            setPackagesInView(entry.isIntersecting);
          } else if (entry.target === eventsRef.current) {
            setEventsInView(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.1 }
    );

    [aboutImageRef, aboutTextRef, packagesRef, eventsRef].forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      [aboutImageRef, aboutTextRef, packagesRef, eventsRef].forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  const packages = [
    {
      name: "Basic",
      price: "₱15,000",
      features: ["Venue decoration", "Basic catering", "Photography", "2 hours event"]
    },
    {
      name: "Premium",
      price: "₱25,000",
      features: ["Full venue setup", "Premium catering", "Professional photography", "4 hours event", "Entertainment"]
    },
    {
      name: "Deluxe",
      price: "₱40,000",
      features: ["Complete venue transformation", "Gourmet catering", "Professional videography", "Full day event", "Entertainment & DJ"]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative animate-page-fade-in">
      <ShootingStars />
      <Background3D />
      <Navbar />

      <main className="flex-1 relative z-10">
        <Hero3D />

        {/* About Section */}
        <section className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-gray-100 to-purple-50 py-20 animate-fade-in-delay-1 relative">
          <div className="absolute inset-0 overflow-hidden">
            <ShootingStars3D count={25} />
          </div>
          <div className="container mx-auto px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div ref={aboutTextRef} className={`order-2 lg:order-2 flex flex-col justify-center h-full transition-all duration-700 ${aboutTextInView ? 'opacity-100 translate-y-0' : `opacity-0 ${scrollDirection === 'down' ? 'translate-y-16' : '-translate-y-16'}`} animate-slide-in-right`}>
                <h2
                  className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6"
                  style={{
                    fontFamily: 'Comic Sans MS, cursive'
                  }}
                >
                  {aboutContent.title.replace('Baby Bliss', settings.general_company_name)}
                </h2>
                   <p
                     className="text-lg text-gray-700 mb-8 leading-relaxed"
                     style={{
                       fontFamily: 'Comic Sans MS, cursive',
                       fontWeight: '300'
                     }}
                   >
                   {aboutContent.description}
                </p>
               <Link to="/about">
                 <Button className="bg-gradient-to-r from-[#006994] to-[#004d6b] text-white px-8 py-3 rounded-none font-bold">
                   About Us
                 </Button>
               </Link>
              </div>
              <div className="order-1 lg:order-1 bg-transparent animate-slide-in-left">
                <img
                  ref={aboutImageRef}
                  src={aboutContent.image}
                  alt="Professional baby shower setup"
                  className={`w-full h-[500px] object-cover rounded-lg transition-all duration-700 ${aboutImageInView ? 'scale-100 translate-y-0' : `scale-90 ${scrollDirection === 'down' ? 'translate-y-16' : '-translate-y-16'}`}`}
                />
              </div>
           </div>
         </div>
       </section>

       {/* Packages Section */}
       <section className="relative min-h-screen py-16 bg-cover bg-center flex items-center animate-fade-in-delay-2" style={{backgroundImage: 'url(/gallery.jpg)'}}>
         <div className="absolute inset-0 bg-black/60" />
         <div className="container mx-auto px-6 lg:px-8 relative z-10">
           <div className="text-center mb-12">
             <h2 className="text-5xl lg:text-6xl font-bold text-white mb-4" style={{fontFamily: 'Comic Sans MS, cursive'}}>
               Our Packages
             </h2>
             <p className="text-lg text-gray-100" style={{fontFamily: 'Comic Sans MS, cursive'}}>
               Choose the perfect package for your celebration
             </p>
           </div>

           <div ref={packagesRef} className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8 transition-all duration-700 ${packagesInView ? 'opacity-100 translate-y-0' : `opacity-0 ${scrollDirection === 'down' ? 'translate-y-16' : '-translate-y-16'}`}`}>
             {packages.map((pkg, index) => (
               <div key={index} className="bg-white/30 rounded-lg shadow-lg overflow-hidden border border-white/40 flex flex-col">
                 <div className="p-6 text-white">
                   <h3 className="text-2xl font-bold">{pkg.name}</h3>
                   <div className="text-3xl font-bold mt-2">{pkg.price}</div>
                 </div>
                 <div className="p-6 flex-1 flex flex-col">
                   <ul className="space-y-2 mb-4 flex-1">
                     {pkg.features.map((feature, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm">
                         <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                         <span className="text-white">{feature}</span>
                       </li>
                     ))}
                   </ul>
                   <Link to="/book" className="w-full block mt-auto">
                     <Button className="w-full text-white border border-white px-4 py-2 rounded-none font-bold text-sm shadow-lg relative overflow-hidden bg-transparent transition-all duration-500 before:absolute before:inset-0 before:bg-[#006994] before:transform before:scale-y-0 before:origin-bottom hover:before:scale-y-100 before:transition-transform before:duration-500">
                       <span className="relative z-10">Book Now</span>
                     </Button>
                   </Link>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </section>

       {/* Upcoming Events Section */}
       <section className="min-h-screen flex items-center bg-gradient-to-br from-purple-50 via-gray-100 to-blue-50 py-20 animate-fade-in-delay-3 relative">
         <div className="absolute inset-0 overflow-hidden">
           <ShootingStars3D count={20} />
         </div>
         <div className="container mx-auto px-6 lg:px-8 relative z-10">
           <div ref={eventsRef} className={`text-center mb-12 transition-all duration-700 ${eventsInView ? 'opacity-100 translate-y-0' : `opacity-0 ${scrollDirection === 'down' ? 'translate-y-16' : '-translate-y-16'}`}`}>
             <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Comic Sans MS, cursive'}}>
               Our Upcoming Events
             </h2>
             <p className="text-lg text-gray-700 max-w-2xl mx-auto" style={{fontFamily: 'Comic Sans MS, cursive'}}>
               Join us in celebrating these special moments!
             </p>
           </div>

           {loading ? (
             <div className="text-center text-gray-700" style={{fontFamily: 'Comic Sans MS, cursive'}}>Loading events...</div>
           ) : upcomingEvents.length > 0 ? (
             shouldAutoScroll ? (
               <div className="overflow-hidden">
                 <div className={`flex gap-8 animate-auto-scroll ${paused ? 'paused' : ''}`} style={{ width: `${upcomingEvents.length * 2 * 400}px` }}>
                   {duplicatedEvents.map((event, index) => (
                     <div key={`${event.id}-${index}`} className="bg-white shadow-lg overflow-hidden rounded-lg w-96 flex-shrink-0 hover:scale-105 transition-transform duration-300" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                       <div className="relative group">
                         <img
                           src={event.image || '/img/abt.jpg'}
                           alt={event.title}
                           className="w-full h-80 object-cover rounded-t-lg"
                         />
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                           <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                           <div className="flex items-center gap-2 mb-2">
                             <Calendar className="h-4 w-4" />
                             <span className="text-sm">{event.date}</span>
                           </div>
                           <div className="flex items-center gap-2 mb-4">
                             <Users className="h-4 w-4" />
                             <span className="text-sm">{event.venue}</span>
                           </div>
                           <Link to={`/event/${event.id}`}>
                             <Button className="bg-transparent text-white border-2 border-white hover:bg-blue-400 hover:border-blue-400 px-4 py-2 rounded-none text-sm btn-hover-slide relative overflow-hidden">
                               Learn More
                             </Button>
                           </Link>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <div className={`${
                 upcomingEvents.length === 1
                   ? 'grid grid-cols-1 max-w-2xl mx-auto gap-8'
                   : upcomingEvents.length === 2
                   ? 'grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8'
                   : 'grid grid-cols-1 md:grid-cols-3 gap-8'
               }`}>
                 {upcomingEvents.map((event) => (
                   <div key={event.id} className={`bg-white shadow-lg overflow-hidden rounded-lg hover:scale-105 transition-transform duration-300 ${
                     upcomingEvents.length === 1 ? 'w-full' : 'w-full'
                   }`}>
                     <div className="relative group">
                       <img
                         src={event.image || '/placeholder.svg'}
                         alt={event.title}
                         className={`w-full object-cover rounded-t-lg ${
                           upcomingEvents.length === 1 ? 'h-96' : 'h-80'
                         }`}
                       />
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                         <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                         <div className="flex items-center gap-2 mb-2">
                           <Calendar className="h-4 w-4" />
                           <span className="text-sm">{event.date}</span>
                         </div>
                         <div className="flex items-center gap-2 mb-4">
                           <Users className="h-4 w-4" />
                           <span className="text-sm">{event.venue}</span>
                         </div>
                         <Link to={`/event/${event.id}`}>
                           <Button className="bg-transparent text-white border-2 border-white hover:bg-blue-400 hover:border-blue-400 px-4 py-2 rounded-none text-sm btn-hover-slide relative overflow-hidden">
                             Learn More
                           </Button>
                         </Link>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )
           ) : (
             <div className="text-center text-gray-700" style={{fontFamily: 'Comic Sans MS, cursive'}}>No upcoming events at the moment.</div>
           )}

           {upcomingEvents.length > 0 && (
             <div className="text-center mt-12">
               <Link to="/gallery">
                 <Button className="bg-transparent text-gray-900 border-2 border-gray-900 hover:bg-blue-400 hover:text-white hover:border-blue-400 px-8 py-3 rounded-none text-lg font-semibold btn-hover-slide relative overflow-hidden">
                   All Events
                 </Button>
               </Link>
             </div>
           )}
         </div>
       </section>
     </main>

     <Footer />
   </div>
 );
};

export default Index;

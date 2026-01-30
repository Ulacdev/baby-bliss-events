import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Baby } from "lucide-react";
import { api } from "@/integrations/api/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState({
    general_site_title: 'Baby Bliss',
    general_logo_url: '/Baby_Cloud_To_Bliss_Text_Changeb.png',
    general_logo_size: '32',
    general_company_name: 'Baby Bliss Events',
    navbar_nav_home_text: 'Home',
    navbar_nav_about_text: 'About',
    navbar_nav_gallery_text: 'Events',
    navbar_nav_book_text: 'Book Now',
    navbar_nav_contact_text: 'Contact',
    navbar_nav_login_text: 'Login'
  });
  const location = useLocation();
  const pagesWithHero = ['/', '/book', '/gallery', '/contact', '/about'];
  const hasHeroSection = pagesWithHero.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionResponse = await api.getSession();
        setSession(sessionResponse.session);

        const response = await api.getSettings();
        if (response.settings) {
          setSettings(prev => ({ ...prev, ...response.settings }));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const shouldBeOceanBlue = (hasHeroSection && isScrolled) || (!hasHeroSection);
  const shouldBeWhite = (hasHeroSection && isScrolled);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${shouldBeOceanBlue ? 'bg-[#006994]/70 backdrop-blur-sm shadow-md' : shouldBeWhite ? 'bg-white/90 backdrop-blur-sm shadow-md' : ''}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left Corner */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 overflow-hidden animate-fade-in-delay-1">
            {settings.general_logo_url ? (
              <img src={settings.general_logo_url} alt="Logo" className={`object-contain`} style={{ height: `${settings.general_logo_size}px`, width: `${settings.general_logo_size}px` }} />
            ) : (
              <Baby className="h-12 w-12 text-white" />
            )}
            <span className="text-lg font-bold text-white drop-shadow-lg" style={{fontFamily: 'Dancing Script, cursive'}}>{settings.general_company_name}</span>
          </Link>

          {/* Navigation Links & Login - Right Corner */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <Link to="/" className="navbar-link-hover text-white drop-shadow-lg hover:text-white text-base font-medium animate-fade-in-delay-1 relative pb-1">
              {settings.navbar_nav_home_text}
            </Link>
            <Link to="/about" className="navbar-link-hover text-white drop-shadow-lg hover:text-white text-base font-medium animate-fade-in-delay-2 relative pb-1">
              {settings.navbar_nav_about_text}
            </Link>
            <Link to="/gallery" className="navbar-link-hover text-white drop-shadow-lg hover:text-white text-base font-medium animate-fade-in-delay-3 relative pb-1">
              {settings.navbar_nav_gallery_text}
            </Link>
            <Link to="/book" className="navbar-link-hover text-white drop-shadow-lg hover:text-white text-base font-medium animate-fade-in-delay-1 relative pb-1">
              {settings.navbar_nav_book_text}
            </Link>
            <Link to="/contact" className="navbar-link-hover text-white drop-shadow-lg hover:text-white text-base font-medium animate-fade-in-delay-2 relative pb-1">
              {settings.navbar_nav_contact_text}
            </Link>
            <Link to={session ? "/admin" : "/auth"} className="animate-fade-in-delay-3">
              <Button className="bg-transparent border-2 border-white text-white hover:border-blue-400 rounded-none px-4 py-2 text-base font-semibold btn-hover-slide">
                {session ? "Dashboard" : settings.navbar_nav_login_text}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 rounded-lg ${shouldBeWhite ? 'hover:bg-gray-100' : 'hover:bg-white/20'} transition-colors`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/20 bg-black/50 backdrop-blur-md">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-white hover:text-blue-400 font-medium transition-colors px-4 py-2" onClick={() => setIsOpen(false)}>
                {settings.navbar_nav_home_text}
              </Link>
              <Link to="/about" className="text-white hover:text-blue-400 font-medium transition-colors px-4 py-2" onClick={() => setIsOpen(false)}>
                {settings.navbar_nav_about_text}
              </Link>
              <Link to="/gallery" className="text-white hover:text-blue-400 font-medium transition-colors px-4 py-2" onClick={() => setIsOpen(false)}>
                {settings.navbar_nav_gallery_text}
              </Link>
              <Link to="/book" className="text-white hover:text-blue-400 font-medium transition-colors px-4 py-2" onClick={() => setIsOpen(false)}>
                {settings.navbar_nav_book_text}
              </Link>
              <Link to="/contact" className="text-white hover:text-blue-400 font-medium transition-colors px-4 py-2" onClick={() => setIsOpen(false)}>
                {settings.navbar_nav_contact_text}
              </Link>
              <Link to={session ? "/admin" : "/auth"} className="px-4 py-2" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-transparent border-2 border-white text-white hover:border-blue-400 rounded-none font-semibold btn-hover-slide">
                  {session ? "Dashboard" : settings.navbar_nav_login_text}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

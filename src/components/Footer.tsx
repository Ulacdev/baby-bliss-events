import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";
import { api } from "@/integrations/api/client";

const Footer = () => {
  const [settings, setSettings] = useState({
    footer_footer_text: '© 2024 Baby Bliss Events. All rights reserved.',
    footer_footer_address: '123 Main Street, City, State 12345',
    general_company_email: 'info@babybliss.com',
    general_company_phone: '(555) 123-4567',
    general_logo_url: '/Baby_Cloud_To_Bliss_Text_Changeb.png',
    general_company_name: 'Baby Bliss Events'
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.getSettings();
        if (response.settings) {
          setSettings(prev => ({ ...prev, ...response.settings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();

    // Reload settings every 30 seconds to reflect changes
    const interval = setInterval(loadSettings, 30000);

    // Also reload when window gains focus
    const handleFocus = () => loadSettings();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  return (
    <footer className="text-white" style={{background: 'linear-gradient(135deg, #0077BE 0%, #0096C7 50%, #00A8E8 100%)'}}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="animate-fade-in-delay-1">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {settings.general_logo_url ? (
                  <img src={settings.general_logo_url} alt="Logo" className="h-[200px] w-[200px] object-contain" />
                ) : (
                  <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">BB</span>
                  </div>
                )}
                <p className="text-primary-foreground/80 text-lg text-center mt-2">
                  Creating unforgettable moments for growing families with love and care.
                </p>
              </div>
              <h3 className="text-2xl font-bold mt-16">{settings.general_company_name}</h3>
            </div>
          </div>

          <div className="animate-fade-in-delay-2">
            <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-primary-foreground/80 hover:text-white transition-smooth text-base font-medium">
                Home
              </Link>
               <Link to="/about" className="text-primary-foreground/80 hover:text-white transition-smooth text-base font-medium">
                About
              </Link>
              
              <Link to="/gallery" className="text-primary-foreground/80 hover:text-white transition-smooth text-base font-medium">
                Events
              </Link>
              <Link to="/book" className="text-primary-foreground/80 hover:text-white transition-smooth text-base font-medium">
                Book Now
              </Link>
              <Link to="/contact" className="text-primary-foreground/80 hover:text-white transition-smooth text-base font-medium">
                Contact
              </Link>
             
            </div>
          </div>

          <div className="animate-fade-in-delay-3">
            <h3 className="text-xl font-semibold mb-6">Connect With Us</h3>
            <div className="flex gap-6 mb-6">
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-smooth">
                <Facebook className="h-8 w-8" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-smooth">
                <Instagram className="h-8 w-8" />
              </a>
            </div>
            <div className="flex flex-col gap-3 text-primary-foreground/80 text-base">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>{settings.general_company_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>{settings.general_company_phone}</span>
              </div>
              <div className="text-primary-foreground/80 text-base">
                {settings.footer_footer_address}
              </div>
            </div>
          </div>
        </div>
        
        
      </div>
    </footer>
  );
};

export default Footer;

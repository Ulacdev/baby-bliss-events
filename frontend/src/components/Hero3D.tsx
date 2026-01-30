import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, Star } from "lucide-react";

const Hero3D = () => {
  return (
    <section className="relative h-screen flex items-center overflow-hidden pt-20 bg-fixed bg-cover bg-center" style={{backgroundImage: 'url(/book.jpg)'}}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-transparent" />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4 sm:mb-6" style={{fontFamily: 'cursive'}}>
            Baby Bliss
            <span className="block text-blue-300 mt-2">Booking System</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-6 sm:mb-8 leading-relaxed">
            Turn your baby shower dreams into reality. We create Instagram-worthy celebrations that make hearts melt and memories last forever.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/book" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:border-white px-4 sm:px-6 py-2 sm:py-3 rounded-none font-semibold text-sm sm:text-base btn-hover-slide">
                Book Your Event
              </Button>
            </Link>
            <Link to="/gallery" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:border-blue-500 px-4 sm:px-6 py-2 sm:py-3 rounded-none font-semibold text-sm sm:text-base btn-hover-slide">
                View Gallery
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-white/20">
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">500+</div>
              <div className="text-xs sm:text-sm text-gray-300">Happy Families</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">5.0</div>
              <div className="text-xs sm:text-sm text-gray-300">Star Rating</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-xs sm:text-sm text-gray-300">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-blue-500/20 to-transparent blur-3xl" />
    </section>
  );
};

export default Hero3D;

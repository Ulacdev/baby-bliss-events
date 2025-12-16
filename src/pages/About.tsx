import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, Award, Users, Sparkles } from "lucide-react";
import ShootingStars from "@/components/ShootingStars";
import ShootingStars3D from "@/components/ShootingStars3D";

const About = () => {
  const storyRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const commitmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
        }
      });
    }, observerOptions);

    if (storyRef.current) observer.observe(storyRef.current);
    if (experienceRef.current) observer.observe(experienceRef.current);
    if (commitmentRef.current) observer.observe(commitmentRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col animate-page-fade-in">
      <ShootingStars />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center bg-fixed bg-cover bg-center" style={{backgroundImage: 'url(/dddddd.webp)'}}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-300 leading-tight mb-4 sm:mb-6" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              About
              <span className="block text-white mt-2">Baby Bliss</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              Creating magical moments for your precious celebrations
            </p>
          </div>
        </section>

        {/* Static Section Content */}
        <section className="pt-16 bg-white relative">
          <ShootingStars3D />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="overflow-hidden rounded-2xl animate-slide-in-left">
                <img
                  src="/2-removebg-preview.png"
                  alt="Our Story"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="flex items-center animate-slide-in-right">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900 animate-fade-in-delay-1" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                    Our Story
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                    Baby Bliss Booking was founded with a simple mission: to make baby shower planning stress-free and magical for every family. Our team of experienced event planners brings creativity, attention to detail, and genuine care to every celebration.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
              <div className="flex items-center animate-slide-in-left-delay-1">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900 animate-fade-in-delay-1" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                    Our Experience
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                    Over the years, we've had the privilege of helping hundreds of families celebrate their new arrivals. From intimate gatherings to grand celebrations, we approach each event with the same dedication and love.
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl animate-slide-in-right-delay-1">
                <img
                  src="/6-removebg-preview.png"
                  alt="Our Experience"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
              <div className="overflow-hidden rounded-2xl animate-slide-in-left">
                <img
                  src="/5-removebg-preview.png"
                  alt="Our Commitment"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="flex items-center animate-slide-in-right">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900 animate-fade-in-delay-1" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                    Our Commitment
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                    We believe every baby shower should be special and memorable. Our commitment is to provide exceptional service, creative solutions, and personalized attention to make your celebration truly unforgettable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;


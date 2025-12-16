import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-baby.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-card">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Premium Baby Shower Planning</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Celebrate New Beginnings with{" "}
              <span className="text-primary">Love & Joy</span> 💙
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Plan your perfect baby shower with ease and elegance. We handle every detail so you can focus on creating beautiful memories.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 transition-smooth shadow-soft hover:shadow-hover group">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-2 border-secondary text-secondary-foreground hover:bg-secondary/10 transition-smooth">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-hover">
              <img 
                src={heroImage} 
                alt="Beautiful newborn baby" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary rounded-full blur-2xl opacity-60 animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary rounded-full blur-2xl opacity-40 animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

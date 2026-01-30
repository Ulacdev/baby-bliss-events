import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import ShootingStars from "@/components/ShootingStars";
import ShootingStars3D from "@/components/ShootingStars3D";

const Contact = () => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createMessage({ ...formData, rating: rating || undefined });
      toast({ title: "Success", description: "Message sent successfully!" });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setRating(0);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col animate-page-fade-in">
      <ShootingStars />
      <Navbar />
      
      <main className="flex-1">
        <section className="relative h-[60vh] flex items-center justify-center bg-fixed bg-cover bg-center" style={{backgroundImage: 'url(/abput.jpg)'}}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-300 leading-tight mb-4 sm:mb-6" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              Get In
              <span className="block text-white mt-2">Touch</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>
        
        <section className="py-20 bg-white relative">
          <ShootingStars3D />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* Left Side - Info */}
              <div className="space-y-8 animate-slide-in-left">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>
                </div>

                <Card className="transition-smooth animate-slide-in-left">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Email Us</h3>
                        <p className="text-muted-foreground">hello@babybliss.com</p>
                        <p className="text-muted-foreground">support@babybliss.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="transition-smooth animate-slide-in-left">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Call Us</h3>
                        <p className="text-muted-foreground">(555) 123-4567</p>
                        <p className="text-muted-foreground">(555) 987-6543</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="transition-smooth animate-slide-in-left">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Business Hours</h3>
                        <p className="text-muted-foreground">Mon - Fri: 9am - 6pm</p>
                        <p className="text-muted-foreground">Sat - Sun: 10am - 4pm</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Form */}
              <div className="animate-slide-in-right">
                <div className="bg-card rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>
                  
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Your Name *</Label>
                      <Input 
                        id="contactName" 
                        placeholder="Jane Smith" 
                        className="rounded-2xl border-2 focus:border-primary transition-smooth"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Your Email *</Label>
                      <Input 
                        id="contactEmail" 
                        type="email" 
                        placeholder="jane@example.com" 
                        className="rounded-2xl border-2 focus:border-primary transition-smooth"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input 
                        id="subject" 
                        placeholder="How can we help?" 
                        className="rounded-2xl border-2 focus:border-primary transition-smooth"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactMessage">Message *</Label>
                      <Textarea 
                        id="contactMessage" 
                        placeholder="Tell us what's on your mind..." 
                        className="rounded-2xl border-2 focus:border-primary transition-smooth min-h-32"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rate Your Experience (Optional)</Label>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => {
                          const starRating = i + 1;
                          const isActive = starRating <= (hoveredRating || rating);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleStarClick(starRating)}
                              onMouseEnter={() => handleStarHover(starRating)}
                              onMouseLeave={handleStarLeave}
                              className="p-1 transition-colors"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  isActive
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                        {rating > 0 && (
                          <span className="ml-2 text-sm text-gray-600">
                            {rating} out of 5 stars
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full text-white hover:opacity-90 rounded-full transition-smooth shadow-soft hover:shadow-hover"
                      style={{backgroundColor: '#006994'}}
                      disabled={submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Map Section - Full Width */}
            <div className="w-full h-96 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.541098220819!2d121.02837!3d14.5994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7b7b7b7b7b7%3A0x0!2sManila%2C%20Philippines!5e0!3m2!1sen!2sus!4v1234567890"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;

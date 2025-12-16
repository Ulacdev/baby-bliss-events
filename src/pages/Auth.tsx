import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/contexts/LoadingContext";
import { Loader2, ArrowRight, Mail, Lock, Home } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setLoading } = useLoading();
  const [searchParams] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);

    try {
      await api.signInWithPassword(loginEmail, loginPassword);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/admin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Login failed",
      });
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <a 
        href="/" 
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-white font-semibold drop-shadow-lg hover:text-blue-200 transition-colors"
      >
        <Home className="h-5 w-5" />
        <span>Back to Website</span>
      </a>
      
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&h=1080&fit=crop" 
          alt="Baby shower background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 via-blue-900/30 to-gray-900/40" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/10 rounded-2xl shadow-2xl border border-white/30 p-4">
          <div className="text-center mb-3">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-1">
              Baby Bliss
            </h1>
            <p className="text-white drop-shadow-md text-sm font-medium">
              Welcome back
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-white font-semibold text-sm drop-shadow-md">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@babybliss.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-white/15 border-white/30 text-white placeholder:text-white/80 rounded-lg focus:border-white focus:ring-0 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-white font-semibold text-sm drop-shadow-md">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="pl-10 h-11 bg-white/15 border-white/30 text-white placeholder:text-white/80 rounded-lg focus:border-white focus:ring-0 font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold shadow-lg"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-center">
              <Link to="/forgot-password" className="text-xs text-white font-semibold drop-shadow-md hover:text-blue-200 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
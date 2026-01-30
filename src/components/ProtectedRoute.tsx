import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "@/integrations/api/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage first (fast, no API call needed)
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Token exists, user is logged in
      setSession({ user: { id: '1' }, access_token: token });
      
      // Get user role from localStorage
      const storedRole = localStorage.getItem('user_role');
      setUserRole(storedRole || 'staff');
      setLoading(false);
    } else {
      // No token, check session via API
      api.getSession().then((response) => {
        setSession(response.session);
        
        // Get user role from localStorage or API response
        const storedRole = localStorage.getItem('user_role');
        setUserRole(storedRole || response.user?.role || 'client');
        setLoading(false);

        if (!response.session) {
          navigate("/auth");
        }
      }).catch(() => {
        // If API fails, check localStorage for token
        const localToken = localStorage.getItem('auth_token');
        if (localToken) {
          setSession({ access_token: localToken });
          setUserRole(localStorage.getItem('user_role') || 'staff');
        } else {
          navigate("/auth");
        }
        setLoading(false);
      });
    }
  }, [navigate]);

  // Check if user has required role
  if (loading === false && requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
      return null;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

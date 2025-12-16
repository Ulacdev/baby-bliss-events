import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "@/integrations/api/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (!session && event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    api.getSession().then((response) => {
      setSession(response.session);
      setLoading(false);

      if (!response.session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

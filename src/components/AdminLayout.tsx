import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [isSidebarHovering, setIsSidebarHovering] = useState(false);

  return (
    <ProtectedRoute>
      <div
        className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
        style={{ transform: 'scale(1.2)', transformOrigin: 'top left', width: '83.33%', height: '83.33%' }}
      >
        <AdminSidebar
          isCollapsed={sidebarCollapsed}
          onHoverChange={setIsSidebarHovering}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${(sidebarCollapsed && !isSidebarHovering) ? 'md:ml-20' : 'md:ml-64'}`}>
          <AdminHeader
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={sidebarCollapsed}
          />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
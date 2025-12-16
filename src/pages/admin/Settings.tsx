import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import ShootingStars from "@/components/ShootingStars";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Save, Building, Camera } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/contexts/ThemeContext";

const Settings = () => {
  const { toast } = useToast();
  const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general_site_title: "Baby Bliss",
    general_logo_url: "",
    general_favicon_url: "",
    general_logo_size: "32",
    general_company_name: "Baby Bliss Events",
    general_company_email: "info@babybliss.com",
    general_company_phone: "(555) 123-4567",
    navbar_nav_home_text: "Home",
    navbar_nav_about_text: "About",
    navbar_nav_gallery_text: "Events",
    navbar_nav_book_text: "Book Now",
    navbar_nav_contact_text: "Contact",
    navbar_nav_login_text: "Login",
    footer_footer_text: "© 2024 Baby Bliss Events. All rights reserved.",
    footer_footer_address: "123 Main Street, City, State 12345"
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      if (response.settings) {
        setSettings(prev => ({ ...prev, ...response.settings }));
        if (response.settings.general_logo_url) {
          setLogoPreview(response.settings.general_logo_url);
        }
        if (response.settings.general_favicon_url) {
          setFaviconPreview(response.settings.general_favicon_url);
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Settings will use defaults if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload logo first if selected
      let logoUrl = settings.general_logo_url;
      if (logoFile) {
        const formData = new FormData();
        formData.append('files[]', logoFile);
        const uploadResponse = await api.uploadImages(formData);
        if (uploadResponse.files && uploadResponse.files[0]) {
          logoUrl = '/uploads/' + uploadResponse.files[0];
        }
      }

      // Upload favicon if selected
      let faviconUrl = settings.general_favicon_url;
      if (faviconFile) {
        const formData = new FormData();
        formData.append('files[]', faviconFile);
        const uploadResponse = await api.uploadImages(formData);
        if (uploadResponse.files && uploadResponse.files[0]) {
          faviconUrl = '/uploads/' + uploadResponse.files[0];
        }
      }

      // Update settings with uploaded image URLs
      await api.updateSettings({
        ...settings,
        general_logo_url: logoUrl,
        general_favicon_url: faviconUrl
      });

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });

      // Clear file states after successful save
      setLogoFile(null);
      setFaviconFile(null);

      // Reload settings to get latest data
      loadSettings();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <AdminSidebar isCollapsed={sidebarCollapsed} />
          <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
            <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />
            <main className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading settings...</span>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen font-admin-premium ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex-shrink-0 p-6 lg:p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Settings</h1>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Configure your application settings</p>
                </div>
                <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <SettingsIcon className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-6">
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className={`grid w-full grid-cols-3 p-1 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-blue-200'}`}>
                  <TabsTrigger value="general" className={`data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 ${theme === 'dark' ? 'data-[state=active]:bg-gray-700 text-gray-300 hover:text-blue-400' : 'data-[state=active]:bg-white text-gray-600 hover:text-blue-500'}`}>General</TabsTrigger>
                  <TabsTrigger value="navbar" className={`data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 ${theme === 'dark' ? 'data-[state=active]:bg-gray-700 text-gray-300 hover:text-blue-400' : 'data-[state=active]:bg-white text-gray-600 hover:text-blue-500'}`}>Navbar</TabsTrigger>
                  <TabsTrigger value="footer" className={`data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 ${theme === 'dark' ? 'data-[state=active]:bg-gray-700 text-gray-300 hover:text-blue-400' : 'data-[state=active]:bg-white text-gray-600 hover:text-blue-500'}`}>Footer</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                  <Card className={`shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'shadow-blue-500/10 border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300'}`}>
                    <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                      <CardTitle className={`flex items-center gap-2 text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <Building className="h-5 w-5 text-blue-500" />
                        Company Information
                      </CardTitle>
                      <CardDescription className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Basic information about your business
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo Size (pixels)</Label>
                        <Input
                          type="number"
                          value={settings.general_logo_size}
                          onChange={(e) => updateSetting('general_logo_size', e.target.value)}
                          placeholder="32"
                          min="16"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logo (Navbar & Admin)</Label>
                        <div className="flex items-center gap-6">
                          <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <Camera className="h-8 w-8 mx-auto mb-1" />
                                <span className="text-xs">No logo</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="logo-upload" className="cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Camera className="h-4 w-4" />
                                {logoPreview ? 'Change Logo' : 'Upload Logo'}
                              </div>
                            </Label>
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoSelect}
                              className="hidden"
                            />
                            <p className="text-sm text-gray-500">
                              JPG, PNG or GIF. Max size 5MB.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Favicon (Browser Tab)</Label>
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                            {faviconPreview ? (
                              <img src={faviconPreview} alt="Favicon preview" className="h-full w-full object-contain" />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <Camera className="h-6 w-6 mx-auto mb-1" />
                                <span className="text-xs">No icon</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="favicon-upload" className="cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Camera className="h-4 w-4" />
                                {faviconPreview ? 'Change Favicon' : 'Upload Favicon'}
                              </div>
                            </Label>
                            <input
                              id="favicon-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleFaviconSelect}
                              className="hidden"
                            />
                            <p className="text-sm text-gray-500">
                              ICO, PNG or JPG. Recommended 32x32px.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="general_site_title">Update Web Title (Browser Tab)</Label>
                        <Input
                          id="general_site_title"
                          value={settings.general_site_title}
                          onChange={(e) => updateSetting('general_site_title', e.target.value)}
                          placeholder="Baby Bliss"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="general_company_name">Company Name</Label>
                        <Input
                          id="general_company_name"
                          value={settings.general_company_name}
                          onChange={(e) => updateSetting('general_company_name', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="general_company_email">Company Email</Label>
                          <Input
                            id="general_company_email"
                            type="email"
                            value={settings.general_company_email}
                            onChange={(e) => updateSetting('general_company_email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="general_company_phone">Company Phone</Label>
                          <Input
                            id="general_company_phone"
                            value={settings.general_company_phone}
                            onChange={(e) => updateSetting('general_company_phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="navbar" className="space-y-6">
                  <Card className={`shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'shadow-blue-500/10 border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300'}`}>
                    <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                      <CardTitle className={`flex items-center gap-2 text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <SettingsIcon className="h-5 w-5 text-blue-500" />
                        Navbar Settings
                      </CardTitle>
                      <CardDescription className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Customize the navigation menu text
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="navbar_nav_home_text">Home Button Text</Label>
                          <Input
                            id="navbar_nav_home_text"
                            value={settings.navbar_nav_home_text}
                            onChange={(e) => updateSetting('navbar_nav_home_text', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="navbar_nav_about_text">About Button Text</Label>
                          <Input
                            id="navbar_nav_about_text"
                            value={settings.navbar_nav_about_text}
                            onChange={(e) => updateSetting('navbar_nav_about_text', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="navbar_nav_gallery_text">Gallery Button Text</Label>
                          <Input
                            id="navbar_nav_gallery_text"
                            value={settings.navbar_nav_gallery_text}
                            onChange={(e) => updateSetting('navbar_nav_gallery_text', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="navbar_nav_book_text">Book Now Button Text</Label>
                          <Input
                            id="navbar_nav_book_text"
                            value={settings.navbar_nav_book_text}
                            onChange={(e) => updateSetting('navbar_nav_book_text', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="navbar_nav_contact_text">Contact Button Text</Label>
                          <Input
                            id="navbar_nav_contact_text"
                            value={settings.navbar_nav_contact_text}
                            onChange={(e) => updateSetting('navbar_nav_contact_text', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="navbar_nav_login_text">Login Button Text</Label>
                          <Input
                            id="navbar_nav_login_text"
                            value={settings.navbar_nav_login_text}
                            onChange={(e) => updateSetting('navbar_nav_login_text', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="footer" className="space-y-6">
                  <Card className={`shadow-lg transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800 shadow-gray-900/10 hover:shadow-gray-900/20' : 'shadow-blue-500/10 border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300'}`}>
                    <CardHeader className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                      <CardTitle className={`flex items-center gap-2 text-xl ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <SettingsIcon className="h-5 w-5 text-blue-500" />
                        Footer Settings
                      </CardTitle>
                      <CardDescription className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Customize the footer content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="footer_footer_text">Footer Copyright Text</Label>
                        <Input
                          id="footer_footer_text"
                          value={settings.footer_footer_text}
                          onChange={(e) => updateSetting('footer_footer_text', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footer_footer_address">Footer Address</Label>
                        <Input
                          id="footer_footer_address"
                          value={settings.footer_footer_address}
                          onChange={(e) => updateSetting('footer_footer_address', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>

              <div className="flex justify-end pt-6">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;

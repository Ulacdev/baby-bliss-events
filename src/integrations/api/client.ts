
// Custom API client to replace Supabase
const API_BASE_URL = 'https://baby-bliss-events.onrender.com/api';

interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    token_type: string;
  } | null;
}

interface Booking {
  id: number;
  client_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  event_date: string;
  guests?: number;
  venue?: string;
  package?: string;
  special_requests?: string;
  images?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url, options.method || 'GET');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('API Response status:', response.status);

      // Check if response has content
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      if (contentLength === '0' || !contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return {};
      }

      try {
        const data = await response.json();
        console.log('API Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'API request failed');
        }

        return data;
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.session) {
      this.token = response.session.access_token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }


  async signOut(): Promise<void> {
    await this.request('/auth.php?action=logout', {
      method: 'POST',
    });

    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getSession(): Promise<AuthResponse> {
    try {
      const response = await this.request('/auth.php?action=session');
      return response;
    } catch (error) {
      return { user: null, session: null };
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/auth.php?action=forgot_password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.request('/auth.php?action=reset_password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getBookings(params: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ bookings: Booking[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const endpoint = `/bookings.php${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async getBooking(id: number): Promise<{ booking: Booking }> {
    return this.request(`/bookings.php?id=${id}`);
  }

  async getPublicEvent(id: number): Promise<{ booking: Booking }> {
    // Public method to get event details without authentication
    const url = `${API_BASE_URL}/public_events.php?id=${id}`;
    console.log('Public Event Request:', url);
    console.log('Request headers:', {
      'Content-Type': 'application/json',
    });
    console.log('Current auth token:', this.token ? 'Present' : 'None');

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Explicitly remove Authorization header for public requests
        },
      });

      console.log('Public Event Response status:', response.status);
      console.log('Public Event Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Public Event Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch event details (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('Public Event Request failed:', error);
      throw error;
    }
  }

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<{ booking: { id: number } }> {
    return this.request('/bookings.php', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<void> {
    return this.request(`/bookings.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBooking(id: number): Promise<void> {
    return this.request(`/bookings.php?id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  }

  async getDashboardStats(): Promise<{
    stats: {
      total_bookings: number;
      pending_bookings: number;
      confirmed_bookings: number;
      cancelled_bookings: number;
      monthly_bookings: number;
      upcoming_events: number;
      estimated_revenue: number;
      recent_bookings: any[];
    }
  }> {
    return this.request('/dashboard.php');
  }

  async getCalendarBookings(month?: number, year?: number): Promise<{
    month: number;
    year: number;
    events: { [date: string]: any[] };
    bookings: any[];
  }> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const query = params.toString();
    return this.request(`/calendar.php${query ? `?${query}` : ''}`);
  }

  async getClients(params: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    clients: any[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/clients.php${query ? `?${query}` : ''}`);
  }

  async getClient(email: string): Promise<{ client: any }> {
    return this.request(`/clients.php?id=${encodeURIComponent(email)}`);
  }

  async updateClient(email: string, updates: Partial<any>): Promise<void> {
    return this.request(`/clients.php?id=${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteClient(email: string): Promise<void> {
    return this.request(`/clients.php?id=${encodeURIComponent(email)}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  }

  async createClient(client: { email: string; first_name: string; last_name: string; phone?: string }): Promise<{ client: any }> {
    return this.request('/clients.php', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async uploadImages(formData: FormData): Promise<{ files: string[] }> {
    const url = `${API_BASE_URL}/upload.php`;
    console.log('Upload Request:', url);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Upload Response status:', response.status);

      const data = await response.json();
      console.log('Upload Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async getUpcomingEvents(params: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ events: any[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams({ upcoming: '1' });
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    return this.request(`/bookings.php?${queryParams}`);
  }

  async getSettings(): Promise<{
    settings: {
      general_site_title?: string;
      general_logo_url?: string;
      general_favicon_url?: string;
      general_logo_size?: string;
      general_company_name?: string;
      general_company_email?: string;
      general_company_phone?: string;
      navbar_nav_home_text?: string;
      navbar_nav_about_text?: string;
      navbar_nav_gallery_text?: string;
      navbar_nav_book_text?: string;
      navbar_nav_contact_text?: string;
      navbar_nav_login_text?: string;
      footer_footer_text?: string;
      footer_footer_address?: string;
    }
  }> {
    const url = `${API_BASE_URL}/settings.php`;
    console.log('Settings Request:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Don't send Authorization for public settings
        },
      });

      console.log('Settings Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Settings Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Settings request failed'}`);
      }

      const data = await response.json();
      console.log('Settings Response data:', data);

      return data;
    } catch (error) {
      console.error('Settings request failed:', error);

      // Return default settings if API is not available
      console.warn('API not available, using default settings');
      return {
        settings: {
          general_site_title: 'Baby Bliss',
          general_logo_url: '',
          general_favicon_url: '',
          general_logo_size: '32',
          general_company_name: 'Baby Bliss Events',
          general_company_email: 'info@babybliss.com',
          general_company_phone: '(555) 123-4567',
          navbar_nav_home_text: 'Home',
          navbar_nav_about_text: 'About',
          navbar_nav_gallery_text: 'Events',
          navbar_nav_book_text: 'Book Now',
          navbar_nav_contact_text: 'Contact',
          navbar_nav_login_text: 'Login',
          footer_footer_text: '© 2024 Baby Bliss Events. All rights reserved.',
          footer_footer_address: '123 Main Street, City, State 12345'
        }
      };
    }
  }

  async updateSettings(settings: any): Promise<void> {
    return this.request('/settings.php', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  async getReports(): Promise<{ reports: any[] }> {
    return this.request('/reports.php');
  }

  async generateReport(params: {
    type: 'monthly' | 'yearly' | 'custom';
    period: string;
  }): Promise<{ report: any }> {
    const queryParams = new URLSearchParams({
      generate: '1',
      type: params.type,
      period: params.period
    });
    return this.request(`/reports.php?${queryParams}`);
  }

  async deleteReport(id: number): Promise<void> {
    return this.request(`/reports.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  async getArchivedBookings(params: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ archived_bookings: any[]; total: number }> {
    const queryParams = new URLSearchParams({ action: 'list', type: 'bookings' });
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await this.request(`/archive.php?${queryParams}`);
    return {
      archived_bookings: response.archived_bookings || [],
      total: response.total || 0
    };
  }

  async restoreBooking(archiveId: number): Promise<void> {
    return this.request(`/archive.php?id=${archiveId}&action=restore&type=bookings`, {
      method: 'POST',
    });
  }

  async permanentDeleteBooking(archiveId: number): Promise<void> {
    return this.request(`/archive.php?id=${archiveId}&action=delete&type=bookings`, {
      method: 'POST',
    });
  }

  async getAuditLogs(params: {
    search?: string;
    date_from?: string;
    date_to?: string;
    activity_type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ audit_logs: any[] }> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.activity_type) queryParams.append('activity_type', params.activity_type);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/audit.php${query ? `?${query}` : ''}`);
  }

  async logActivity(activity: string, details: string): Promise<void> {
    return this.request('/audit.php', {
      method: 'POST',
      body: JSON.stringify({ activity, details }),
    });
  }

  async logAudit(params: { activity: string; details: string }): Promise<void> {
    return this.request('/audit.php', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPayments(): Promise<{ payments: any[] }> {
    return this.request('/payments.php');
  }

  async createPayment(payment: {
    booking_id: number;
    amount: number;
    payment_status: 'pending' | 'paid' | 'refunded';
    payment_method?: string;
    payment_date?: string;
    notes?: string;
  }): Promise<{ payment: { id: number } }> {
    return this.request('/payments.php', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async updatePayment(id: number, updates: Partial<any>): Promise<void> {
    return this.request(`/payments.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async markPaymentAsPaid(booking_id: number, amount: number, payment_method?: string): Promise<void> {
    return this.request('/payments.php?action=mark-paid', {
      method: 'POST',
      body: JSON.stringify({ booking_id, amount, payment_method: payment_method || 'cash' }),
    });
  }

  async markPaymentAsUnpaid(booking_id: number): Promise<void> {
    return this.request('/payments.php?action=mark-unpaid', {
      method: 'POST',
      body: JSON.stringify({ booking_id }),
    });
  }

  async getFinancialSummary(): Promise<{ summary: any }> {
    return this.request('/financial.php?action=summary');
  }

  async getExpenses(): Promise<{ expenses: any[] }> {
    return this.request('/financial.php?action=expenses');
  }

  async createExpense(expense: {
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    payment_method?: string;
    notes?: string;
  }): Promise<void> {
    return this.request('/financial.php?action=expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: number): Promise<void> {
    return this.request(`/financial.php?action=expenses&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  }

  async deletePayment(id: number, deleted_reason?: string): Promise<void> {
    return this.request(`/payments.php?id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleted_reason: deleted_reason || 'Deleted by admin' }),
    });
  }

  async printReceipt(payment_id: number): Promise<{ receipt: any }> {
    return this.request(`/financial.php?action=receipt&id=${payment_id}`);
  }

  async getAnalytics(): Promise<{ analytics: any; monthly: any[] }> {
    return this.request('/reports.php?action=analytics');
  }

  async getAuditTrail(limit?: number): Promise<{ audit_logs: any[] }> {
    const query = limit ? `?action=audit-trail&limit=${limit}` : '?action=audit-trail';
    return this.request(`/reports.php${query}`);
  }

  async getRecentActivity(): Promise<{ activities: any[] }> {
    return this.request('/reports.php?action=recent-activity');
  }

  async generateReportData(report_type: string, report_period: string): Promise<{ message: string; report: any }> {
    return this.request('/reports.php?action=generate', {
      method: 'POST',
      body: JSON.stringify({ report_type, report_period }),
    });
  }

  async archiveItem(type: string, id: number, deleted_reason?: string): Promise<void> {
    return this.request(`/archive.php?action=archive&type=${type}`, {
      method: 'POST',
      body: JSON.stringify({ id, deleted_reason: deleted_reason || 'No reason provided' }),
    });
  }

  async archiveAllItems(type: string): Promise<{ message: string }> {
    return this.request(`/archive.php?action=archive_all&type=${type}`, {
      method: 'POST',
    });
  }

  async getArchivedItems(type: string): Promise<any> {
    const response = await this.request(`/archive.php?action=list&type=${type}`);
    const key = `archived_${type}`;
    return { [key]: response[key] || [] };
  }

  async restoreArchivedItem(type: string, archive_id: number): Promise<void> {
    return this.request(`/archive.php?action=restore&id=${archive_id}&type=${type}`, {
      method: 'POST',
    });
  }

  async permanentlyDeleteArchivedItem(type: string, archive_id: number): Promise<void> {
    return this.request(`/archive.php?action=delete&id=${archive_id}&type=${type}`, {
      method: 'POST',
    });
  }

  async getMessages(): Promise<{ messages: any[] }> {
    return this.request('/messages.php?action=list');
  }

  async getMessage(id: number): Promise<{ message: any }> {
    return this.request(`/messages.php?action=get&id=${id}`);
  }

  async createMessage(message: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    rating?: number;
  }): Promise<{ message: { id: number } }> {
    return this.request('/messages.php?action=create', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateMessage(id: number, updates: Partial<any>): Promise<void> {
    return this.request(`/messages.php?action=update&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMessage(id: number, deleted_reason?: string): Promise<void> {
    return this.request(`/messages.php?action=delete&id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ deleted_reason: deleted_reason || 'No reason provided' }),
    });
  }

  async getMessageAuditTrail(): Promise<{ audit_logs: any[] }> {
    return this.request('/messages.php?action=audit-trail');
  }

  // User management methods
  async getUsers(): Promise<{ users: any[] }> {
    try {
      const response = await this.request('/users.php?action=list');
      // Ensure profile_image is included in the response
      if (response.users) {
        response.users = response.users.map((user: any) => ({
          ...user,
          profile_image: user.profile_image || '' // No default image
        }));
      }
      return response;
    } catch (error) {
      console.warn('Main users API failed, trying fallback endpoint:', error);

      // Fallback to simple test endpoint
      try {
        const fallbackResponse = await this.request('/simple_users_test.php?action=list');

        if (fallbackResponse.status === 'success') {
          // Transform the data to match expected format
          const users = fallbackResponse.users.map((user: any) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            profile_image: user.profile_image || '', // No default image
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            status: 'active',
            created_at: user.created_at
          }));

          return { users };
        } else {
          throw new Error(fallbackResponse.message || 'Failed to load users');
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        throw new Error('Load users failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  }

  async createUser(user: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<{ message: string; user: any }> {
    return this.request('/users.php?action=create', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(user: {
    id: number;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    phone?: string;
    password?: string;
  }): Promise<{ message: string; user: any }> {
    try {
      return await this.request('/users.php?action=update', {
        method: 'POST',
        body: JSON.stringify(user),
      });
    } catch (error) {
      console.warn('Main users API failed, trying fallback endpoint:', error);
      
      // Fallback to simple test endpoint
      try {
        const fallbackResponse = await this.request('/simple_users_test.php?action=update', {
          method: 'POST',
          body: JSON.stringify({
            id: user.id,
            username: `${user.first_name}.${user.last_name}`.toLowerCase(),
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            password: user.password
          }),
        });
        
        if (fallbackResponse.status === 'success') {
          return {
            message: fallbackResponse.message || 'User updated successfully',
            user: { id: user.id, ...user }
          };
        } else {
          throw new Error(fallbackResponse.message || 'Update failed');
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        throw new Error('Update user failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.request(`/users.php?id=${userId}`, {
      method: 'DELETE',
    });
  }

  // Profile management methods
  async getProfile(): Promise<{ profile: any }> {
    return this.request('/profile.php');
  }

  async updateProfile(profile: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    profile_image?: string;
  }): Promise<void> {
    return this.request('/profile.php', {
      method: 'PUT',
      body: JSON.stringify({ profile }),
    });
  }

  async changePassword(passwords: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    return this.request('/profile.php?action=change_password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  }

  async uploadProfileImage(formData: FormData): Promise<{ image_url: string }> {
    const url = `${API_BASE_URL}/profile.php?action=upload_image`;
    console.log('Profile Image Upload Request:', url);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Profile Image Upload Response status:', response.status);

      const data = await response.json();
      console.log('Profile Image Upload Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Profile image upload failed');
      }

      return data;
    } catch (error) {
      console.error('Profile image upload failed:', error);
      throw error;
    }
  }
}

export const api = new ApiClient();

export const auth = {
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const checkSession = async () => {
      try {
        const response = await api.getSession();
        callback(response.session ? 'SIGNED_IN' : 'SIGNED_OUT', response.session);
      } catch (error) {
        callback('SIGNED_OUT', null);
      }
    };

    checkSession();

    const interval = setInterval(checkSession, 30000);

    return {
      data: { subscription: { unsubscribe: () => clearInterval(interval) } }
    };
  }
};

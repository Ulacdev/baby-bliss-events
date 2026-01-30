// API client for Node.js/Express backend
// Uses RESTful endpoints with improved error handling and token refresh

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Environment check
const isDevelopment = import.meta.env.DEV;

interface ApiError {
  message: string;
  code: string;
  details?: any;
}

interface AuthResponse {
  user: {
    id: string;
    username?: string;
    email: string;
    role?: string;
  };
  session: {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in?: number;
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

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}

class ApiClient {
  private token: string | null = null;
  private _refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  
  // Request deduplication cache
  private requestCache: Map<string, { promise: Promise<any>; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 second cache for duplicate requests

  constructor() {
    this.token = localStorage.getItem('auth_token');
    this._refreshToken = localStorage.getItem('refresh_token');
  }

  get refreshToken(): string | null {
    return this._refreshToken;
  }

  set refreshToken(value: string | null) {
    this._refreshToken = value;
    if (value) {
      localStorage.setItem('refresh_token', value);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this._refreshToken) {
      return false;
    }

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.subscribeTokenRefresh((token) => {
          resolve(!!token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this._refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.data?.session?.access_token) {
        this.token = data.data.session.access_token;
        localStorage.setItem('auth_token', this.token);
        this.onTokenRefreshed(this.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private clearAuth() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    retryOn401 = true,
    useCache = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Create cache key for deduplication
    const method = options.method || 'GET';
    const cacheKey = `${method}:${url}`;
    
    // Check cache for duplicate requests (only for GET requests)
    if (useCache && options.method === undefined || options.method === 'GET') {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.promise as Promise<T>;
      }
    }
    
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

      if (response.status === 401 && retryOn401 && this._refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, false);
        }
        this.clearAuth();
        window.location.href = '/auth';
        throw new Error('Session expired');
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      if (contentLength === '0' || !contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return {} as T;
      }

      const json = await response.json();

      if (!response.ok) {
        const errorMessage = json.error?.message || `API request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).code = json.error?.code;
        (error as any).details = json.error?.details;
        throw error;
      }

      // Cache successful GET responses
      if (useCache && (options.method === undefined || options.method === 'GET')) {
        this.requestCache.set(cacheKey, { promise: Promise.resolve(json), timestamp: Date.now() });
        // Clean up old cache entries periodically
        if (this.requestCache.size > 100) {
          const now = Date.now();
          for (const [key, entry] of this.requestCache.entries()) {
            if (now - entry.timestamp > this.CACHE_TTL) {
              this.requestCache.delete(key);
            }
          }
        }
      }

      // Return the data property if success, otherwise return the whole response
      if (json.success && json.data !== undefined) {
        return json.data as T;
      }
      return json as T;
    } catch (error) {
      if (isDevelopment) {
        console.error('API Request failed:', error);
      }
      throw error;
    }
  }

  // ==================== AUTH ====================
  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.session?.access_token) {
      this.token = response.session.access_token;
      this.refreshToken = response.session.refresh_token || null;
      localStorage.setItem('auth_token', this.token);
      if (this.refreshToken) {
        localStorage.setItem('refresh_token', this.refreshToken);
      }
    }

    return response;
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignore logout errors
    }
    this.clearAuth();
  }

  async getSession(): Promise<AuthResponse> {
    try {
      return await this.request('/api/auth/session');
    } catch (error) {
      return { user: null, session: null };
    }
  }

  async doRefreshToken(): Promise<boolean> {
    return await this.refreshAccessToken();
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // ==================== BOOKINGS ====================
  async getUpcomingEvents(params: { limit?: number; offset?: number } = {}): Promise<{ events: any[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    const response = await this.request<{ events: any[] }>(`/api/public-events${queryParams ? `?${queryParams}` : ''}`);
    return {
      events: response.events || [],
      total: response.events?.length || 0,
      limit: params.limit || 10,
      offset: params.offset || 0
    };
  }

  async getBookings(params: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
    upcoming?: boolean;
  } = {}): Promise<{ bookings: Booking[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.upcoming) queryParams.append('upcoming', '1');

    const query = queryParams.toString();
    return this.request(`/api/bookings${query ? `?${query}` : ''}`);
  }

  async getBooking(id: number): Promise<{ booking: Booking }> {
    return this.request(`/api/bookings/${id}`);
  }

  async getPublicEvent(id: number): Promise<{ booking: Booking }> {
    const url = `${API_BASE_URL}/api/public-events/${id}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event details (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('Public Event Request failed:', error);
      throw error;
    }
  }

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<{ booking: { id: number } }> {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<void> {
    return this.request(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBooking(id: number): Promise<void> {
    return this.request(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== DASHBOARD ====================
  async getDashboardStats(): Promise<{
    stats: {
      total_bookings: number;
      pending_bookings: number;
      confirmed_bookings: number;
      cancelled_bookings: number;
      monthly_bookings: number;
      upcoming_events: number;
      estimated_revenue: number;
      recent_activities: any[];
      monthly_trends: any[];
      status_distribution: any[];
    }
  }> {
    return this.request('/api/dashboard');
  }

  // ==================== CALENDAR ====================
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
    return this.request(`/api/calendar${query ? `?${query}` : ''}`);
  }

  // ==================== CLIENTS ====================
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
    return this.request(`/api/clients${query ? `?${query}` : ''}`);
  }

  async getClient(id: string): Promise<{ client: any }> {
    return this.request(`/api/clients/${id}`);
  }

  async updateClient(id: string, updates: Partial<any>): Promise<void> {
    return this.request(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteClient(id: string): Promise<void> {
    return this.request(`/api/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async createClient(client: { email: string; first_name: string; last_name: string; phone?: string }): Promise<{ client: any }> {
    return this.request('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  // ==================== UPLOAD ====================
  async uploadImages(formData: FormData): Promise<{ files: string[] }> {
    const url = `${API_BASE_URL}/api/upload`;

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // ==================== SETTINGS ====================
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
    try {
      return await this.request('/api/settings');
    } catch (error) {
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
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  // ==================== REPORTS ====================
  async getReports(): Promise<{ reports: any[] }> {
    return this.request('/api/reports');
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
    return this.request(`/api/reports?${queryParams}`);
  }

  async deleteReport(id: number): Promise<void> {
    return this.request(`/api/reports/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== ARCHIVE ====================
  async getArchivedBookings(params: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ archived_bookings: any[]; total: number }> {
    const queryParams = new URLSearchParams({ action: 'list', type: 'bookings' });
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const archiveResponse = await this.request<{ archived_bookings: any[]; total: number }>(`/api/archive?${queryParams}`);
    return {
      archived_bookings: archiveResponse.archived_bookings || [],
      total: archiveResponse.total || 0
    };
  }

  async restoreBooking(archiveId: number): Promise<void> {
    return this.request(`/api/archive/${archiveId}/restore`, {
      method: 'POST',
    });
  }

  async permanentDeleteBooking(archiveId: number): Promise<void> {
    return this.request(`/api/archive/${archiveId}`, {
      method: 'DELETE',
    });
  }

  // Generic archive methods for both bookings and messages
  async getArchivedItems(type: 'bookings' | 'messages', params: { search?: string; limit?: number; offset?: number } = {}): Promise<{ items: any[]; total: number }> {
    const queryParams = new URLSearchParams({ action: 'list', type });
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await this.request<{ archived_bookings?: any[]; archived_messages?: any[]; total: number }>(`/api/archive?${queryParams}`);
    
    if (type === 'bookings') {
      return { items: response.archived_bookings || [], total: response.total || 0 };
    } else {
      return { items: response.archived_messages || [], total: response.total || 0 };
    }
  }

  async restoreArchivedItem(type: 'bookings' | 'messages', id: number): Promise<void> {
    return this.request(`/api/archive/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async permanentlyDeleteArchivedItem(type: 'bookings' | 'messages', id: number): Promise<void> {
    return this.request(`/api/archive/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ type }),
    });
  }

  // ==================== MESSAGES ====================
  async getMessages(): Promise<{ messages: any[]; total: number }> {
    return this.request('/api/messages');
  }

  async getMessage(id: string | number): Promise<{ message: any }> {
    return this.request(`/api/messages/${id}`);
  }

  async updateMessage(id: string | number, updates: Partial<any>): Promise<void> {
    return this.request(`/api/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMessage(id: string | number, reason?: string): Promise<void> {
    const body = reason ? JSON.stringify({ reason }) : undefined;
    return this.request(`/api/messages/${id}`, {
      method: 'DELETE',
      body,
    });
  }

  // ==================== AUDIT ====================
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
    return this.request(`/api/audit${query ? `?${query}` : ''}`);
  }

  async logAudit(params: { activity: string; details: string }): Promise<void> {
    return this.request('/api/audit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ==================== USERS ====================
  async getUsers(params: { search?: string; limit?: number; offset?: number } = {}): Promise<{ users: any[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/api/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string): Promise<{ user: any }> {
    return this.request(`/api/users/${id}`);
  }

  async createUser(user: { username?: string; email: string; password?: string; role: string; first_name?: string; last_name?: string; phone?: string }): Promise<{ message: string }> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string | number, updates: Partial<any>): Promise<void> {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string | number): Promise<void> {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FINANCIAL ====================
  async getPayments(): Promise<{ payments: any[]; total: number }> {
    return this.request('/api/payments');
  }

  async getPayment(id: string): Promise<{ payment: any }> {
    return this.request(`/api/payments/${id}`);
  }

  async createPayment(payment: any): Promise<{ payment: any }> {
    return this.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async updatePayment(id: string, updates: Partial<any>): Promise<void> {
    return this.request(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getExpenses(): Promise<{ expenses: any[]; total: number }> {
    return this.request('/api/expenses');
  }

  async getExpense(id: string): Promise<{ expense: any }> {
    return this.request(`/api/expenses/${id}`);
  }

  async createExpense(expense: any): Promise<{ expense: any }> {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string | number, updates: Partial<any>): Promise<void> {
    return this.request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(id: string | number): Promise<void> {
    return this.request(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment methods
  async markPaymentAsPaid(bookingId: number | string, amount: number, paymentMethod: string): Promise<void> {
    return this.request('/api/payments/mark-paid', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, amount, payment_method: paymentMethod }),
    });
  }

  async markPaymentAsUnpaid(bookingId: number | string): Promise<void> {
    return this.request('/api/payments/mark-unpaid', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId }),
    });
  }

  // ==================== PROFILE ====================
  async getProfile(): Promise<{ profile: any }> {
    return this.request('/api/profile');
  }

  async updateProfile(updates: Partial<any>): Promise<void> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ==================== HEALTH CHECK ====================
  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return {
        status: data.status,
        database: data.database
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected'
      };
    }
  }

  // ==================== AUTH STATE (Stub for Supabase compatibility) ====================
  onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: { unsubscribe: () => void } } } {
    // Return a mock subscription that calls callback on token changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        const newSession = e.newValue 
          ? { user: { id: '1' }, access_token: e.newValue }
          : null;
        callback('TOKEN_CHANGED', newSession);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          }
        }
      }
    };
  }
}

// Create instance after class definition
const apiClient = new ApiClient();

// Named exports for backward compatibility with existing imports
export const api = apiClient;
export const auth = apiClient;
export default apiClient;

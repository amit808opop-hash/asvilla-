import {
  Hotel,
  Booking,
  Payment,
  Review,
  Offer,
  ContactMessage,
  User,
  EmailNotification,
} from '../types';

const rawApiBase = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_URL || '/api';
const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('asvilla_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleApiResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      return data;
    } catch {
      // fall through
    }
  }

  const rawText = await res.text();
  const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160);

  if (!res.ok) {
    return {
      success: false,
      message: cleanText || `Server responded with HTTP ${res.status}: ${res.statusText}`,
      status: res.status,
    };
  }

  return {
    success: true,
    message: cleanText || 'Success',
  };
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; phone?: string; password: string; confirmPassword?: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleApiResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message ? `Connection failed: ${err.message}` : 'Unable to connect to registration server. Please check your network.',
      };
    }
  },

  async login(data: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleApiResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message ? `Connection failed: ${err.message}` : 'Unable to connect to authentication server.',
      };
    }
  },

  async getMe(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return await handleApiResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Unable to retrieve user session.',
      };
    }
  },

  async updateProfile(data: { name: string; phone?: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await handleApiResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Unable to update profile.',
      };
    }
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await handleApiResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Unable to update password.',
      };
    }
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async resetPassword(data: { token: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Hotels
  async getHotels(params: {
    city?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    starRating?: number;
    minRating?: number;
    amenity?: string;
    sort?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data: Hotel[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.city && params.city !== 'all') query.set('city', params.city);
    if (params.search) query.set('search', params.search);
    if (params.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params.starRating) query.set('starRating', params.starRating.toString());
    if (params.minRating) query.set('minRating', params.minRating.toString());
    if (params.amenity) query.set('amenity', params.amenity);
    if (params.sort) query.set('sort', params.sort);
    if (params.featured) query.set('featured', 'true');
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/hotels?${query.toString()}`);
    return res.json();
  },

  async getHotel(id: string): Promise<{ success: boolean; data: Hotel; message?: string }> {
    const res = await fetch(`${API_BASE}/hotels/${id}`);
    return res.json();
  },

  async createHotel(hotelData: Partial<Hotel>) {
    const res = await fetch(`${API_BASE}/hotels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(hotelData),
    });
    return res.json();
  },

  async updateHotel(id: string, hotelData: Partial<Hotel>) {
    const res = await fetch(`${API_BASE}/hotels/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(hotelData),
    });
    return res.json();
  },

  async deleteHotel(id: string) {
    const res = await fetch(`${API_BASE}/hotels/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Rooms
  async createRoom(roomData: any) {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    });
    return res.json();
  },

  async updateRoom(id: string, roomData: any) {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    });
    return res.json();
  },

  async deleteRoom(id: string) {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Availability
  async checkAvailability(params: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    rooms?: number;
  }): Promise<{
    success: boolean;
    available: boolean;
    remainingRooms: number;
    totalRooms: number;
    bookedRooms: number;
    message?: string;
  }> {
    const query = new URLSearchParams({
      roomId: params.roomId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      rooms: (params.rooms || 1).toString(),
    });
    const res = await fetch(`${API_BASE}/availability?${query.toString()}`);
    return res.json();
  },

  // Bookings
  async createBooking(bookingData: {
    hotelId: string;
    roomId?: string;
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
    numberOfRooms: number;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    specialRequests?: string;
    promoCode?: string;
    paymentMethod?: 'COD' | 'ONLINE';
  }): Promise<{
    success: boolean;
    message: string;
    booking: Booking;
    hotel: any;
    room: any;
    errors?: string[];
  }> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });
    return res.json();
  },

  async getMyBookings(): Promise<{ success: boolean; data: Booking[] }> {
    const res = await fetch(`${API_BASE}/my-bookings`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getBooking(id: string): Promise<{ success: boolean; data: any; message?: string }> {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async cancelBooking(id: string, reason?: string) {
    const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async resendBookingEmail(bookingId: string): Promise<{ success: boolean; message: string; notification?: EmailNotification }> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/resend-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getBookingEmailPreview(bookingId: string): Promise<{ success: boolean; html?: string; text?: string; subject?: string; recipient?: string }> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/email-preview`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getNotifications(): Promise<{ success: boolean; data: EmailNotification[] }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Payments (Razorpay)
  async createPaymentOrder(bookingId: string) {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookingId }),
    });
    return res.json();
  },

  async verifyPayment(verificationData: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paymentMethod?: string;
  }) {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(verificationData),
    });
    return res.json();
  },

  // Reviews
  async getReviews(hotelId: string): Promise<{ success: boolean; data: Review[] }> {
    const res = await fetch(`${API_BASE}/hotels/${hotelId}/reviews`);
    return res.json();
  },

  async submitReview(hotelId: string, reviewData: { rating: number; title: string; comment: string }) {
    const res = await fetch(`${API_BASE}/hotels/${hotelId}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return res.json();
  },

  // Offers
  async getOffers(): Promise<{ success: boolean; data: Offer[] }> {
    const res = await fetch(`${API_BASE}/offers`);
    return res.json();
  },

  // Contact
  async submitContact(data: { name: string; email: string; phone?: string; subject: string; message: string }) {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getContactInquiries(): Promise<{ success: boolean; data: ContactMessage[] }> {
    const res = await fetch(`${API_BASE}/contact`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Admin
  async getAdminDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getAdminBookings(params: { status?: string; search?: string; startDate?: string; endDate?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/admin/bookings?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async updateBookingStatus(id: string, statusData: { bookingStatus?: string; paymentStatus?: string }) {
    const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData),
    });
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getAdminReports() {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  hotelId: string;
  roomType: string;
  slug: string;
  description: string;
  pricePerNight: number;
  capacity: {
    adults: number;
    children: number;
    total: number;
  };
  totalRooms: number;
  bedType: string;
  sizeSqFt: number;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HotelOwner {
  name: string;
  role: string;
  phone: string;
  email: string;
  verified: boolean;
  checkInInstructions?: string;
  deskPhone?: string;
  avatarUrl?: string;
  languages?: string[];
  experienceYears?: number;
}

export interface Hotel {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  images: string[];
  coverImage: string;
  amenities: string[];
  starRating: number;
  guestRating: number;
  reviewCount: number;
  featured: boolean;
  published: boolean;
  priceStartingFrom: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  petFriendly: boolean;
  owner?: HotelOwner;
  createdAt: string;
  updatedAt: string;
  rooms?: Room[];
  reviews?: Review[];
}

export interface PriceBreakdown {
  basePrice: number;
  nights: number;
  rooms: number;
  roomTotal: number;
  gstAmount: number;
  serviceFee: number;
  discountAmount: number;
  promoCode?: string;
  totalAmount: number;
}

export interface Booking {
  _id: string;
  bookingReference: string;
  userId: string;
  hotelId: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfRooms: number;
  priceBreakdown: PriceBreakdown;
  paymentMethod?: 'COD' | 'ONLINE';
  paymentStatus: 'unpaid' | 'pending' | 'success' | 'paid' | 'failed' | 'refunded';
  bookingStatus: 'pending_confirmation' | 'confirmed' | 'pending' | 'cancelled' | 'completed';
  paymentInstructions?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  hotelName?: string;
  hotelCity?: string;
  hotelImage?: string;
  hotelAddress?: string;
  cancellationPolicy?: string;
  hotelOwner?: HotelOwner;
  roomType?: string;
  roomBed?: string;
}

export interface EmailNotification {
  _id: string;
  bookingId?: string;
  bookingReference?: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: 'guest' | 'hotel_owner' | 'concierge_admin';
  subject: string;
  htmlBody: string;
  textBody: string;
  status: 'sent' | 'delivered';
  type: 'booking_confirmation' | 'cancellation_notice' | 'checkin_reminder';
  sentAt: string;
}

export interface Payment {
  _id: string;
  bookingId: string;
  bookingReference: string;
  userId: string;
  provider: 'razorpay' | 'stripe';
  providerOrderId: string;
  providerPaymentId?: string;
  providerSignature?: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  method?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  hotelId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface Offer {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  maxDiscount: number;
  minBookingAmount: number;
  validUntil: string;
  isActive: boolean;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_review' | 'resolved';
  createdAt: string;
}

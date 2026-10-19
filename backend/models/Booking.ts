import mongoose, { Schema } from 'mongoose';

export interface IPriceBreakdown {
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

export interface IBooking {
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
  priceBreakdown: IPriceBreakdown;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  bookingStatus: 'pending_confirmation' | 'confirmed' | 'cancelled' | 'completed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  hotelOwner?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PriceBreakdownSchema: Schema = new Schema(
  {
    basePrice: { type: Number, required: true },
    nights: { type: Number, required: true },
    rooms: { type: Number, required: true },
    roomTotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    promoCode: { type: String },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const BookingSchema: Schema = new Schema(
  {
    _id: { type: String },
    bookingReference: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, default: '' },
    specialRequests: { type: String },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    numberOfGuests: { type: Number, default: 2 },
    numberOfRooms: { type: Number, default: 1 },
    priceBreakdown: { type: PriceBreakdownSchema, required: true },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    bookingStatus: {
      type: String,
      enum: ['pending_confirmation', 'confirmed', 'cancelled', 'completed'],
      default: 'pending_confirmation',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: String },
    refundAmount: { type: Number },
    hotelOwner: { type: Object },
  },
  { timestamps: true }
);

export const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

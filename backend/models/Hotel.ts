import mongoose, { Schema } from 'mongoose';

export interface IRoom {
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
}

export interface IHotel {
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
  owner?: {
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
  };
}

const RoomSchema: Schema = new Schema(
  {
    _id: { type: String },
    hotelId: { type: String, required: true, index: true },
    roomType: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    pricePerNight: { type: Number, required: true },
    capacity: {
      adults: { type: Number, default: 2 },
      children: { type: Number, default: 1 },
      total: { type: Number, default: 3 },
    },
    totalRooms: { type: Number, default: 5 },
    bedType: { type: String, default: 'King Bed' },
    sizeSqFt: { type: Number, default: 450 },
    images: [{ type: String }],
    amenities: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const HotelSchema: Schema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, default: '' },
    description: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' },
    pincode: { type: String, default: '' },
    latitude: { type: Number, default: 20.5937 },
    longitude: { type: Number, default: 78.9629 },
    images: [{ type: String }],
    coverImage: { type: String, required: true },
    amenities: [{ type: String }],
    starRating: { type: Number, default: 5 },
    guestRating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    priceStartingFrom: { type: Number, required: true },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    cancellationPolicy: { type: String, default: 'Free cancellation up to 48 hours before check-in.' },
    petFriendly: { type: Boolean, default: false },
    owner: {
      name: { type: String },
      role: { type: String },
      phone: { type: String },
      email: { type: String },
      deskPhone: { type: String },
      verified: { type: Boolean, default: true },
      checkInInstructions: { type: String },
      avatarUrl: { type: String },
      languages: [{ type: String }],
      experienceYears: { type: Number, default: 15 },
    },
  },
  { timestamps: true }
);

export const HotelModel = mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);
export const RoomModel = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

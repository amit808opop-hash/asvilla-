import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Hotel, Room, Booking } from '../types';
import { EmailPreviewModal } from '../components/EmailPreviewModal';
import {
  ShieldCheck,
  Building,
  Bed,
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Loader2,
  X,
  Mail,
  ChevronRight,
  Send,
  Sparkles,
  Phone,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hotels' | 'rooms' | 'bookings' | 'users' | 'inquiries' | 'emails'
  >('overview');

  // Stats & data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<{
    bookingId: string;
    bookingReference: string;
    guestEmail: string;
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Search/filter states for bookings
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  // Add/Edit Hotel Modal
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [hotelForm, setHotelForm] = useState({
    name: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    description: '',
    tagline: '',
    address: '',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    priceStartingFrom: 18000,
    starRating: 5,
    amenities: 'Private Pool, Spa, Butler Service, Fine Dining, High-Speed WiFi',
    featured: true,
  });

  // Add Room Modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedHotelForRoom, setSelectedHotelForRoom] = useState<string>('');
  const [roomForm, setRoomForm] = useState({
    roomType: 'Maharaja Royal Suite',
    description: 'Expansive private suite with balcony and hand-carved heritage decor.',
    pricePerNight: 24000,
    bedType: 'Royal King Bed',
    sizeSqFt: 650,
    totalRooms: 5,
    adults: 2,
    children: 1,
    amenities: 'Balcony, Jacuzzi, Butler Service, Breakfast Included',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, hotelsRes, bookingsRes, usersRes, reportsRes, inqRes, notifRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getHotels({ limit: 100 }),
        api.getAdminBookings(),
        api.getAdminUsers(),
        api.getAdminReports(),
        api.getContactInquiries(),
        api.getNotifications(),
      ]);

      if (dashRes.success) setDashboardData(dashRes);
      if (hotelsRes.success) setHotels(hotelsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (usersRes.success) setUsersList(usersRes.data);
      if (reportsRes.success) setReports(reportsRes);
      if (inqRes.success) setInquiries(inqRes.data);
      if (notifRes.success) setNotifications(notifRes.data || []);
    } catch (err) {
      console.error('Failed loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Ban className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">Restricted Administrator Area</h2>
        <p className="text-xs text-slate-600">
          This portal requires verified administrative privileges. Please log in using the administrator account (admin@asvilla.com).
        </p>
      </div>
    );
  }

  // Handle Save Hotel
  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...hotelForm,
        amenities: hotelForm.amenities.split(',').map(s => s.trim()),
      };

      if (editingHotel) {
        await api.updateHotel(editingHotel._id, payload);
        setActionFeedback(`Updated hotel "${hotelForm.name}" successfully.`);
      } else {
        await api.createHotel(payload);
        setActionFeedback(`Added new luxury sanctuary "${hotelForm.name}".`);
      }

      setHotelModalOpen(false);
      setEditingHotel(null);
      loadData();
    } catch (err) {
      setActionFeedback('Error saving hotel property. Please try again.');
    }
  };

  // Handle Delete Hotel
  const handleDeleteHotel = async (id: string, hotelName: string) => {
    try {
      await api.deleteHotel(id);
      setActionFeedback(`Removed "${hotelName}" from active listings.`);
      loadData();
    } catch {
      setActionFeedback('Error deleting hotel.');
    }
  };

  // Handle Add Room
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRoom({
        hotelId: selectedHotelForRoom || hotels[0]?._id,
        roomType: roomForm.roomType,
        description: roomForm.description,
        pricePerNight: Number(roomForm.pricePerNight),
        bedType: roomForm.bedType,
        sizeSqFt: Number(roomForm.sizeSqFt),
        totalRooms: Number(roomForm.totalRooms),
        capacity: { adults: roomForm.adults, children: roomForm.children, total: roomForm.adults + roomForm.children },
        amenities: roomForm.amenities.split(',').map(s => s.trim()),
      });

      setActionFeedback(`Added new suite category "${roomForm.roomType}".`);
      setRoomModalOpen(false);
      loadData();
    } catch {
      setActionFeedback('Error creating suite category.');
    }
  };

  // Handle Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: string, bookingStatus: string) => {
    try {
      await api.updateBookingStatus(bookingId, { bookingStatus });
      setActionFeedback(`Updated reservation status to ${bookingStatus}.`);
      loadData();
    } catch {
      setActionFeedback('Error updating reservation status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Alert Feedback */}
      {actionFeedback && (
        <div className="p-4 bg-[#0B132B] text-white rounded-xl shadow-lg border-l-4 border-[#D4AF37] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6D23]">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Administrator Control System
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#0B132B]">
            ASVILLA Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reservations, hotel management, property hosts, and email notification audits.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'overview', label: 'KPIs & Reports' },
            { id: 'hotels', label: 'Hotels & Hosts' },
            { id: 'rooms', label: 'Add Rooms' },
            { id: 'bookings', label: 'All Bookings' },
            { id: 'emails', label: `Email Logs (${notifications.length})` },
            { id: 'users', label: 'Users' },
            { id: 'inquiries', label: 'Inquiries' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#0B132B] text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#8C6D23]" />
          <p className="text-xs text-slate-500">Loading administrative records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW & REPORTS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verified Revenue</span>
                  <div className="text-2xl font-bold font-mono text-emerald-700">
                    ₹{(dashboardData?.stats?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Via Razorpay Verified Gateway</span>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
                  <div className="text-2xl font-bold font-mono text-[#0B132B]">
                    {dashboardData?.stats?.totalBookings || 0}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {dashboardData?.stats?.confirmedBookings || 0} Confirmed
                  </span>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sanctuaries & Suites</span>
                  <div className="text-2xl font-bold font-mono text-[#0B132B]">
                    {dashboardData?.stats?.totalHotels || 0} Hotels
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {dashboardData?.stats?.totalRooms || 0} Active Room Categories
                  </span>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Guests</span>
                  <div className="text-2xl font-bold font-mono text-[#0B132B]">
                    {dashboardData?.stats?.registeredUsers || 0} Users
                  </div>
                  <span className="text-[11px] text-[#8C6D23] font-medium">Club Members</span>
                </div>
              </div>

              {/* Geographic Performance & Recent Bookings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Geographic Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#8C6D23]" /> City Occupancy & Revenue Breakdown
                  </h3>
                  <div className="space-y-3">
                    {reports?.byCity?.map((c: any) => (
                      <div key={c.city} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{c.city}</span>
                          <span className="font-mono">
                            {c.bookings} booking(s) · ₹{c.revenue.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#0B132B] rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(15, (c.revenue / (dashboardData?.stats?.totalRevenue || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Bookings Feed */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#8C6D23]" /> Latest Verified Reservations
                  </h3>
                  <div className="space-y-3">
                    {dashboardData?.recentBookings?.map((b: any) => (
                      <div
                        key={b._id}
                        className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900">{b.bookingReference}</span>
                          <span className="block text-slate-600">{b.guestName} · {b.hotelName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-700 block">
                            ₹{b.priceBreakdown.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-semibold ${b.bookingStatus === 'confirmed' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {b.bookingStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE HOTELS */}
          {activeTab === 'hotels' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900">Hotel Catalog Management</h2>
                  <p className="text-xs text-slate-500">Publish, modify, or retire properties from the public directory.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingHotel(null);
                    setHotelForm({
                      name: '',
                      city: 'Jaipur',
                      state: 'Rajasthan',
                      description: '',
                      tagline: '',
                      address: '',
                      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                      priceStartingFrom: 18000,
                      starRating: 5,
                      amenities: 'Private Pool, Spa, Butler Service, Fine Dining',
                      featured: true,
                    });
                    setHotelModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-[#D4AF37] rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Hotel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map(h => (
                  <div key={h._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <img src={h.coverImage} alt={h.name} className="h-44 w-full object-cover" />
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{h.city}, {h.state}</span>
                          <span className="font-bold text-[#8C6D23]">{h.starRating} Stars</span>
                        </div>
                        <h3 className="font-heading font-bold text-base text-slate-900 line-clamp-1">{h.name}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{h.description}</p>
                        <div className="pt-1 text-xs text-slate-800 font-mono font-bold">
                          From ₹{h.priceStartingFrom.toLocaleString('en-IN')}/night
                        </div>

                        {/* Property Host Badge */}
                        {h.owner && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-slate-800">{h.owner.name}</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">Host</span>
                            </div>
                            <span className="font-mono text-slate-500 truncate">{h.owner.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setEditingHotel(h);
                          setHotelForm({
                            name: h.name,
                            city: h.city,
                            state: h.state,
                            description: h.description,
                            tagline: h.tagline,
                            address: h.address,
                            coverImage: h.coverImage,
                            priceStartingFrom: h.priceStartingFrom,
                            starRating: h.starRating,
                            amenities: h.amenities.join(', '),
                            featured: h.featured,
                          });
                          setHotelModalOpen(true);
                        }}
                        className="text-slate-700 hover:text-[#0B132B] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHotel(h._id, h.name)}
                        className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900">Room Categories & Inventory</h2>
                  <p className="text-xs text-slate-500">Add new suite categories or adjust capacities.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedHotelForRoom(hotels[0]?._id || '');
                    setRoomModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-[#D4AF37] rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Room Category
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Hotel</th>
                      <th className="p-3.5">Suite / Room Type</th>
                      <th className="p-3.5">Bed & Size</th>
                      <th className="p-3.5">Nightly Rate</th>
                      <th className="p-3.5">Total Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hotels.flatMap(h => (h.rooms || []).map(r => ({ ...r, hotelName: h.name }))).map((rm: any) => (
                      <tr key={rm._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-semibold text-slate-900">{rm.hotelName}</td>
                        <td className="p-3.5 font-medium">{rm.roomType}</td>
                        <td className="p-3.5 text-slate-500">{rm.bedType} · {rm.sizeSqFt} sq.ft</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">₹{rm.pricePerNight.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 font-semibold text-emerald-700">{rm.totalRooms} Rooms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ALL BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900">All Guest Bookings</h2>
                  <p className="text-xs text-slate-500">Track confirmation, cancellation, and payment status across all properties.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bookingStatusFilter}
                    onChange={e => setBookingStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Ref</th>
                      <th className="p-3.5">Guest</th>
                      <th className="p-3.5">Hotel & Suite</th>
                      <th className="p-3.5">Stay Dates</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings
                      .filter(b => bookingStatusFilter === 'all' || b.bookingStatus === bookingStatusFilter)
                      .map(b => (
                        <tr key={b._id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{b.bookingReference}</td>
                          <td className="p-3.5">
                            <span className="font-semibold block">{b.guestName}</span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">{b.guestEmail}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-slate-900 block">{b.hotelName}</span>
                            <span className="text-[11px] text-slate-500 block">{b.roomType}</span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {b.checkIn} to {b.checkOut}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-800">
                            ₹{b.priceBreakdown.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 font-medium">
                            <span className={b.paymentStatus === 'success' ? 'text-emerald-700' : 'text-amber-700'}>
                              {b.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={b.bookingStatus}
                              onChange={e => handleUpdateBookingStatus(b._id, e.target.value)}
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-xl text-slate-900">Registered Accounts</h2>
                <p className="text-xs text-slate-500">Security audit and user list.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map(u => (
                      <tr key={u._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-semibold text-slate-900">{u.name}</td>
                        <td className="p-3.5 font-mono text-slate-600">{u.email}</td>
                        <td className="p-3.5 text-slate-500">{u.phone || '—'}</td>
                        <td className="p-3.5 font-bold">
                          <span className={u.role === 'admin' ? 'text-amber-700' : 'text-slate-600'}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-xl text-slate-900">Guest Concierge Messages</h2>
                <p className="text-xs text-slate-500">Inquiries submitted via the Contact Us portal.</p>
              </div>

              <div className="space-y-3">
                {inquiries.length > 0 ? (
                  inquiries.map(inq => (
                    <div key={inq._id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{inq.subject}</span>
                        <span className="text-slate-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-slate-600">
                        <strong>From:</strong> {inq.name} ({inq.email}) {inq.phone && `· ${inq.phone}`}
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{inq.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No incoming inquiries.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: EMAIL NOTIFICATIONS AUDIT LOG */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#8C6D23]" />
                    Dispatched Email Notifications Log
                  </h2>
                  <p className="text-xs text-slate-500">
                    Audit trail of all automated guest booking vouchers and property host arrival alerts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                    Automated SMTP Active
                  </span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatches</span>
                  <div className="text-2xl font-bold font-mono text-slate-900">{notifications.length}</div>
                  <span className="text-[11px] text-emerald-600">All messages archived</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Guest Vouchers</span>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {notifications.filter(n => n.recipientRole === 'guest').length}
                  </div>
                  <span className="text-[11px] text-slate-500">Includes QR & instructions</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Property Host Alerts</span>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {notifications.filter(n => n.recipientRole === 'hotel_owner').length}
                  </div>
                  <span className="text-[11px] text-[#8C6D23]">Host desk notified instantly</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Recipient</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Booking Ref</th>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <tr key={n._id} className="hover:bg-slate-50">
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-900 block">{n.recipientName || n.recipientEmail}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{n.recipientEmail}</span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                n.recipientRole === 'hotel_owner'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {n.recipientRole === 'hotel_owner' ? 'Host Desk' : 'Guest'}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate" title={n.subject}>
                            {n.subject}
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 font-bold">
                            {n.bookingReference || '—'}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {new Date(n.sentAt || n.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" />
                              Delivered
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {n.bookingId ? (
                              <button
                                onClick={() =>
                                  setSelectedEmailPreview({
                                    bookingId: n.bookingId,
                                    bookingReference: n.bookingReference || 'ASV-REF',
                                    guestEmail: n.recipientEmail,
                                  })
                                }
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition cursor-pointer"
                              >
                                View Preview
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No email notifications dispatched yet. Book a stay to trigger automated notifications.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hotel Create/Edit Modal */}
      {hotelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-900">
                {editingHotel ? 'Edit Sanctuary' : 'Add New Luxury Hotel'}
              </h3>
              <button onClick={() => setHotelModalOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveHotel} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hotel Name</label>
                <input
                  type="text"
                  required
                  value={hotelForm.name}
                  onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })}
                  placeholder="e.g. Royal Palace & Sanctuary"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={hotelForm.city}
                    onChange={e => setHotelForm({ ...hotelForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={hotelForm.state}
                    onChange={e => setHotelForm({ ...hotelForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={hotelForm.tagline}
                  onChange={e => setHotelForm({ ...hotelForm, tagline: e.target.value })}
                  placeholder="Brief poetic description"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={hotelForm.description}
                  onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={hotelForm.priceStartingFrom}
                    onChange={e => setHotelForm({ ...hotelForm, priceStartingFrom: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Star Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    value={hotelForm.starRating}
                    onChange={e => setHotelForm({ ...hotelForm, starRating: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  required
                  value={hotelForm.coverImage}
                  onChange={e => setHotelForm({ ...hotelForm, coverImage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={hotelForm.amenities}
                  onChange={e => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHotelModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-lg font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0B132B] text-[#D4AF37] rounded-lg font-bold cursor-pointer"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Create Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-900">Add Room Category</h3>
              <button onClick={() => setRoomModalOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Hotel</label>
                <select
                  value={selectedHotelForRoom}
                  onChange={e => setSelectedHotelForRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {hotels.map(h => (
                    <option key={h._id} value={h._id}>{h.name} ({h.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room Category Name</label>
                <input
                  type="text"
                  required
                  value={roomForm.roomType}
                  onChange={e => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price / Night (INR)</label>
                  <input
                    type="number"
                    required
                    value={roomForm.pricePerNight}
                    onChange={e => setRoomForm({ ...roomForm, pricePerNight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Rooms Count</label>
                  <input
                    type="number"
                    required
                    value={roomForm.totalRooms}
                    onChange={e => setRoomForm({ ...roomForm, totalRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bed Configuration</label>
                  <input
                    type="text"
                    value={roomForm.bedType}
                    onChange={e => setRoomForm({ ...roomForm, bedType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size (Sq.Ft)</label>
                  <input
                    type="number"
                    value={roomForm.sizeSqFt}
                    onChange={e => setRoomForm({ ...roomForm, sizeSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-lg font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0B132B] text-[#D4AF37] rounded-lg font-bold cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {selectedEmailPreview && (
        <EmailPreviewModal
          bookingId={selectedEmailPreview.bookingId}
          bookingReference={selectedEmailPreview.bookingReference}
          guestEmail={selectedEmailPreview.guestEmail}
          onClose={() => setSelectedEmailPreview(null)}
        />
      )}
    </div>
  );
};

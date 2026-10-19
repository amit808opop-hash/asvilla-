import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { BookingModal } from './components/BookingModal';
import { VoucherModal } from './components/VoucherModal';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { HotelDetailsPage } from './pages/HotelDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PolicyPage } from './pages/PolicyPage';
import { Hotel, Room, Booking } from './types';

type ViewType =
  | 'home'
  | 'explore'
  | 'destinations'
  | 'hotel-details'
  | 'my-bookings'
  | 'profile'
  | 'admin'
  | 'about'
  | 'contact'
  | 'policy';

/**
 * Robust URL Hash Parser for Browser Back/Forward and Refresh Synchronization
 */
function parseHashLocation(): {
  view: ViewType;
  hotelId: string;
  params: Record<string, string>;
} {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [routePath, queryString] = hash.split('?');
  const params: Record<string, string> = {};
  if (queryString) {
    const sp = new URLSearchParams(queryString);
    sp.forEach((v, k) => {
      params[k] = v;
    });
  }

  const parts = routePath ? routePath.split('/').filter(Boolean) : [];
  const root = parts[0] || 'home';

  if (root === 'hotel' && parts[1]) {
    return {
      view: 'hotel-details',
      hotelId: parts[1],
      params,
    };
  }

  if (root === 'destinations') {
    return {
      view: 'explore',
      hotelId: '',
      params: { ...params, city: 'all' },
    };
  }

  if (root === 'hotels' || root === 'explore') {
    return {
      view: 'explore',
      hotelId: '',
      params,
    };
  }

  if (root === 'policy') {
    return {
      view: 'policy',
      hotelId: '',
      params: { ...params, type: parts[1] || params.type || 'cancellation' },
    };
  }

  if (['home', 'my-bookings', 'profile', 'admin', 'about', 'contact'].includes(root)) {
    return {
      view: root as ViewType,
      hotelId: '',
      params,
    };
  }

  return {
    view: 'home',
    hotelId: '',
    params,
  };
}

function buildHash(view: string, params: any = {}, hotelId?: string): string {
  if (view === 'home') return '#/';
  if (view === 'explore') {
    if (params?.city && params.city !== 'all') {
      return `#/explore?city=${encodeURIComponent(params.city)}`;
    }
    return '#/explore';
  }
  if (view === 'destinations') {
    return '#/explore?city=all';
  }
  if (view === 'hotel-details') {
    const id = hotelId || params?.id || 'htl_varanasi_01';
    return `#/hotel/${id}`;
  }
  if (view === 'policy') {
    const type = typeof params === 'string' ? params : params?.type || 'cancellation';
    return `#/policy/${type}`;
  }
  return `#/${view}`;
}

function MainApp() {
  const { user } = useAuth();

  // Initialize router state directly from the active URL hash so refresh keeps user in place!
  const initialRoute = parseHashLocation();
  const [currentView, setCurrentView] = useState<ViewType>(initialRoute.view);
  const [viewParams, setViewParams] = useState<any>(initialRoute.params);
  const [selectedHotelId, setSelectedHotelId] = useState<string>(
    initialRoute.hotelId || 'htl_varanasi_01'
  );

  // Booking Modal State
  const [bookingModalHotel, setBookingModalHotel] = useState<Hotel | null>(null);
  const [bookingModalRoom, setBookingModalRoom] = useState<Room | undefined>(undefined);

  // Voucher Modal State (Shown immediately after confirmed booking)
  const [confirmedBookingForVoucher, setConfirmedBookingForVoucher] = useState<Booking | null>(null);

  // Synchronize state with browser Back and Forward history buttons
  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseHashLocation();
      setCurrentView(route.view);
      setViewParams(route.params);
      if (route.hotelId) {
        setSelectedHotelId(route.hotelId);
      }
      // If user navigates back in history, dismiss modal windows cleanly
      setBookingModalHotel(null);
      setBookingModalRoom(undefined);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // If starting on empty hash, initialize to #/
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState(null, '', '#/');
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Primary navigation handler with browser history push
  const handleNavigate = useCallback(
    (view: string, params?: any) => {
      const targetParams = params || {};
      let targetView = view as ViewType;
      if (view === 'destinations') {
        targetView = 'explore';
        targetParams.city = 'all';
      }

      const targetHotelId =
        targetView === 'hotel-details' ? targetParams.id || selectedHotelId : undefined;
      const newHash = buildHash(targetView, targetParams, targetHotelId);

      if (window.location.hash !== newHash) {
        window.history.pushState({ view: targetView, params: targetParams }, '', newHash);
      }

      setCurrentView(targetView);
      setViewParams(targetParams);
      if (targetParams.id) {
        setSelectedHotelId(targetParams.id);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [selectedHotelId]
  );

  const handleSelectHotel = useCallback(
    (hotel: Hotel) => {
      setSelectedHotelId(hotel._id);
      const newHash = `#/hotel/${hotel._id}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(
          { view: 'hotel-details', hotelId: hotel._id },
          '',
          newHash
        );
      }
      setCurrentView('hotel-details');
      setViewParams({ id: hotel._id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleBookHotel = (hotel: Hotel, room?: Room) => {
    setBookingModalHotel(hotel);
    setBookingModalRoom(room);
  };

  const handleBookingConfirmed = (booking: Booking) => {
    setBookingModalHotel(null);
    setBookingModalRoom(undefined);
    setConfirmedBookingForVoucher(booking);

    // Transition URL cleanly to #/my-bookings so refresh loads guest bookings without re-submitting!
    const newHash = '#/my-bookings';
    if (window.location.hash !== newHash) {
      window.history.pushState({ view: 'my-bookings' }, '', newHash);
    }
    setCurrentView('my-bookings');
    setViewParams({});
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E293B]">
      {/* Navigation Bar */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Page View */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectHotel={handleSelectHotel}
            onBookHotel={handleBookHotel}
          />
        )}

        {currentView === 'explore' && (
          <ExplorePage
            initialCity={viewParams?.city}
            onSelectHotel={handleSelectHotel}
            onBookHotel={handleBookHotel}
          />
        )}

        {currentView === 'hotel-details' && (
          <HotelDetailsPage
            hotelId={selectedHotelId || 'htl_varanasi_01'}
            onBookRoom={handleBookHotel}
            onBack={() => handleNavigate('explore')}
          />
        )}

        {currentView === 'my-bookings' && (
          <MyBookingsPage onExploreHotels={() => handleNavigate('explore')} />
        )}

        {currentView === 'profile' && <ProfilePage onNavigate={handleNavigate} />}

        {currentView === 'admin' && <AdminDashboardPage />}

        {currentView === 'about' && <AboutPage />}

        {currentView === 'contact' && <ContactPage />}

        {currentView === 'policy' && (
          <PolicyPage
            policyType={
              typeof viewParams === 'string'
                ? viewParams
                : viewParams?.type || 'cancellation'
            }
            onBack={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Global Interactive Booking Modal */}
      {bookingModalHotel && (
        <BookingModal
          hotel={bookingModalHotel}
          selectedRoom={bookingModalRoom}
          initialCheckIn={viewParams?.checkIn}
          initialCheckOut={viewParams?.checkOut}
          initialGuests={viewParams?.guests}
          initialRooms={viewParams?.rooms}
          onClose={() => {
            setBookingModalHotel(null);
            setBookingModalRoom(undefined);
          }}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {/* Booking Voucher Modal on instant confirmation */}
      {confirmedBookingForVoucher && (
        <VoucherModal
          booking={confirmedBookingForVoucher}
          onClose={() => {
            setConfirmedBookingForVoucher(null);
            handleNavigate('my-bookings');
          }}
        />
      )}

      {/* Auth Modal (Sign In / Register / Forgot Password) */}
      <AuthModal />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

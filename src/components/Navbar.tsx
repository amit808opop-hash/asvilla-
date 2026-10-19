import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Calendar,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Compass,
  PhoneCall,
  Info,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, isAdmin, logout, openAuthModal, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickLogin = async (type: 'guest' | 'admin') => {
    if (type === 'admin') {
      await login('admin@asvilla.com', 'admin123');
    } else {
      await login('guest@asvilla.com', 'guest123');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B132B]/95 backdrop-blur-md border-b border-[#D4AF37]/20 text-white transition-all shadow-lg">
      {/* Top Privilege Bar */}
      <div className="bg-[#070B19] text-[#D4AF37] text-xs py-1 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="tracking-widest uppercase font-medium">ASVILLA Exclusive Privileges</span>
            <span className="hidden sm:inline text-white/50">·</span>
            <span className="hidden sm:inline text-slate-300">Complimentary 12% GST credit & private transfers on palatial villas</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden md:inline font-mono">24/7 Concierge: +91 1800 278 4552</span>
            {!user && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleQuickLogin('guest')}
                  className="text-[#D4AF37] hover:underline cursor-pointer"
                  title="Quick fill guest credentials"
                >
                  [Demo Guest]
                </button>
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="text-amber-400 hover:underline cursor-pointer"
                  title="Quick fill administrator credentials"
                >
                  [Demo Admin]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 text-left cursor-pointer group text-white"
        >
          <div className="w-11 h-11 rounded-sm bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#8C6D23] flex items-center justify-center shadow-md shadow-[#D4AF37]/20 border border-[#FAF8F5]/20 group-hover:scale-105 transition-transform">
            <span className="font-heading font-extrabold text-2xl text-[#0B132B] tracking-tighter">AV</span>
          </div>
          <div>
            <span className="font-heading tracking-[0.25em] text-2xl font-bold bg-gradient-to-r from-white via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent block">
              ASVILLA
            </span>
            <span className="text-[10px] text-white/70 tracking-widest uppercase block -mt-1 font-light">
              Your Stay · Your Comfort · Your Way
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors py-1 border-b-2 ${
              currentView === 'home'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-200 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('explore')}
            className={`transition-colors py-1 border-b-2 ${
              currentView === 'explore'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-200 hover:text-white'
            }`}
          >
            Explore Hotels
          </button>
          <button
            onClick={() => onNavigate('destinations')}
            className={`transition-colors py-1 border-b-2 ${
              currentView === 'destinations'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-200 hover:text-white'
            }`}
          >
            Destinations
          </button>
          <button
            onClick={() => {
              if (user) {
                onNavigate('my-bookings');
              } else {
                openAuthModal('login');
              }
            }}
            className={`transition-colors py-1 border-b-2 ${
              currentView === 'my-bookings'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-200 hover:text-white'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`transition-colors py-1 border-b-2 ${
              currentView === 'about'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-200 hover:text-white'
            }`}
          >
            About Us
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className={`transition-colors py-1 border-b-2 ${
              currentView === 'contact'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-200 hover:text-white'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* User Account / CTA Menu */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 bg-[#1C2541] hover:bg-[#253258] border border-[#D4AF37]/30 rounded-full py-1.5 pl-3 pr-4 transition text-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-[#0B132B] font-bold flex items-center justify-center text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="block font-medium text-white max-w-[120px] truncate">{user.name}</span>
                  <span className="block text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold">
                    {user.role === 'admin' ? 'Administrator' : 'Guest Member'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-[#D4AF37]/30 rounded-xl shadow-2xl py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-white/10 text-xs text-slate-400">
                    Signed in as <strong className="text-white block truncate">{user.email}</strong>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full text-left px-4 py-2.5 text-amber-300 hover:bg-white/5 flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('my-bookings');
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    My Bookings
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Profile Settings
                  </button>

                  <div className="border-t border-white/10 my-1"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      onNavigate('home');
                    }}
                    className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="text-sm font-medium text-slate-200 hover:text-white px-3 py-2 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="text-sm font-semibold bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5BF48] hover:to-[#D4AF37] text-[#0B132B] px-5 py-2.5 rounded-md shadow-md shadow-[#D4AF37]/20 transition-all cursor-pointer"
              >
                Join ASVILLA
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B132B] border-b border-[#D4AF37]/20 px-6 pt-4 pb-8 space-y-4">
          <nav className="flex flex-col space-y-3 text-base">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 border-b border-white/10 text-white font-medium"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('explore');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 border-b border-white/10 text-white font-medium flex items-center justify-between"
            >
              <span>Explore Hotels</span>
              <Compass className="w-4 h-4 text-[#D4AF37]" />
            </button>
            <button
              onClick={() => {
                onNavigate('destinations');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 border-b border-white/10 text-white font-medium"
            >
              Destinations
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) {
                  onNavigate('my-bookings');
                } else {
                  openAuthModal('login');
                }
              }}
              className="text-left py-2 border-b border-white/10 text-white font-medium"
            >
              My Bookings
            </button>
            <button
              onClick={() => {
                onNavigate('about');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 border-b border-white/10 text-white font-medium flex items-center justify-between"
            >
              <span>About Us</span>
              <Info className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                onNavigate('contact');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 border-b border-white/10 text-white font-medium flex items-center justify-between"
            >
              <span>Contact Concierge</span>
              <PhoneCall className="w-4 h-4 text-slate-400" />
            </button>
          </nav>

          <div className="pt-4 border-t border-white/10">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#0B132B] font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-[#D4AF37]">{user.role === 'admin' ? 'Admin' : 'Guest Member'}</div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('admin');
                    }}
                    className="w-full text-left py-2 text-amber-300 flex items-center gap-2 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('profile');
                  }}
                  className="w-full text-left py-2 text-slate-300 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" /> Profile & Settings
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    onNavigate('home');
                  }}
                  className="w-full text-left py-2 text-red-400 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 rounded-lg border border-[#D4AF37]/50 text-white font-medium text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#0B132B] font-bold text-center"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

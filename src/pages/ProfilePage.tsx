import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold">Please sign in to view your profile</h2>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-[#0B132B] text-white rounded-lg text-xs"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);

    try {
      const res = await api.updateProfile({ name, phone });
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileSuccess('Profile details successfully updated.');
      } else {
        setProfileError(res.message || 'Error updating profile.');
      }
    } catch {
      setProfileError('Server error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await api.updatePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordSuccess('Password successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message || 'Incorrect current password.');
      }
    } catch {
      setPasswordError('Server error updating password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6D23]">
            <Sparkles className="w-3.5 h-3.5" /> Account Center
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#0B132B]">
            Guest Profile & Preferences
          </h1>
        </div>

        <button
          onClick={() => {
            logout();
            onNavigate('home');
          }}
          className="px-3.5 py-2 border border-slate-300 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-[#0B132B] text-2xl font-bold flex items-center justify-center mx-auto shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900">{user.name}</h2>
              <span className="text-xs text-[#8C6D23] font-semibold uppercase tracking-wider block mt-0.5">
                {user.role === 'admin' ? 'System Administrator' : 'Privileged Guest Member'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity Verified</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs text-slate-600">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">Quick Navigation</span>
            <button
              onClick={() => onNavigate('my-bookings')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-medium text-slate-800 transition cursor-pointer"
            >
              View My Bookings
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left font-semibold text-amber-900 transition cursor-pointer"
              >
                Access Admin Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Profile Edit & Security */}
        <div className="md:col-span-2 space-y-8">
          {/* Personal Details Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-slate-900">Personal Information</h3>
            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Primary authentication email cannot be modified directly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? 'Updating...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-slate-900">Account Security & Password</h3>
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C5A059] text-[#0B132B] rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Upload,
  Save,
  Loader2,
  User,
  Calendar,
  Lock,
  Bell,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { UserProfile, NotificationSettings, CalendarSyncData } from '../../types/api';

interface MyProfileSettingsProps {
  onBack: () => void;
}

const REMINDER_UNITS = [
  { value: 0, label: 'Minutes' },
  { value: 1, label: 'Hours' },
  { value: 2, label: 'Days' },
  { value: 3, label: 'Weeks' },
];

export function MyProfileSettings({ onBack }: MyProfileSettingsProps) {
  const { user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Loading / saving states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Profile form data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    comment: 'all',
    commentMail: 'none',
  });

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calendar sync
  const [googleSync, setGoogleSync] = useState<CalendarSyncData>({
    type: 'google',
    isActivated: false,
  });
  const [microsoftSync, setMicrosoftSync] = useState<CalendarSyncData>({
    type: 'microsoft',
    isActivated: false,
  });
  const [googleSyncDate, setGoogleSyncDate] = useState('');
  const [microsoftSyncDate, setMicrosoftSyncDate] = useState('');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isConnectingMicrosoft, setIsConnectingMicrosoft] = useState(false);

  // Fetch profile + notification data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [profileData, notifData] = await Promise.all([
          apiClient.get<UserProfile>(ENDPOINTS.MY_PROFILE),
          apiClient.get<NotificationSettings>(ENDPOINTS.MY_NOTIFICATION_SETTINGS),
        ]);

        setProfile(profileData);

        // Initialize calendar sync state from profile
        if (profileData.calendarSync) {
          setGoogleSync(profileData.calendarSync);
          if (profileData.calendarSync.from) {
            setGoogleSyncDate(toInputDate(profileData.calendarSync.from));
          }
        }
        if (profileData.microsoftCalendarSync) {
          setMicrosoftSync(profileData.microsoftCalendarSync);
          if (profileData.microsoftCalendarSync.from) {
            setMicrosoftSyncDate(toInputDate(profileData.microsoftCalendarSync.from));
          }
        }

        // Initialize notification settings with defaults
        setNotifications({
          comment: notifData.comment || 'all',
          commentMail: notifData.commentMail || 'none',
        });
      } catch (err: any) {
        console.error('Failed to fetch profile data:', err);
        setError(err.message || 'Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Check for calendar sync result from OAuth redirect
    const syncResult = localStorage.getItem('workdeck-calendar-sync-result');
    if (syncResult) {
      try {
        const result = JSON.parse(syncResult);
        if (result.success) {
          toast.success(`${result.vendor === 'google' ? 'Google' : 'Microsoft'} Calendar connected successfully`);
        } else {
          toast.error(`Failed to connect ${result.vendor === 'google' ? 'Google' : 'Microsoft'} Calendar`);
        }
      } catch {
        // ignore parse errors
      }
      localStorage.removeItem('workdeck-calendar-sync-result');
    }
  }, []);

  // Convert DD/MM/YYYY to YYYY-MM-DD for <input type="date">
  function toInputDate(ddmmyyyy: string): string {
    const parts = ddmmyyyy.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return '';
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY for API
  function toApiDate(isoDate: string): string {
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return '';
  }

  const updateProfile = (field: string, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev);
    setHasChanges(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  const getInitials = (): string => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.fullName) {
      return profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return '??';
  };

  // Main save
  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);

      // Save profile
      const profilePayload: Record<string, any> = {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone || '',
        language: profile.language,
        eventReminderValue: profile.eventReminderValue ?? 15,
        eventReminderUnit: profile.eventReminderUnit ?? 0,
        planTime: profile.planTime ?? false,
        calendarSync: googleSync,
        microsoftCalendarSync: microsoftSync,
      };

      // Save notification settings
      await Promise.all([
        apiClient.post(ENDPOINTS.UPDATE_MY_PROFILE, profilePayload),
        apiClient.post(ENDPOINTS.UPDATE_NOTIFICATION_SETTINGS, notifications),
      ]);

      setHasChanges(false);
      toast.success('Profile saved successfully');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Password change
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!passwordData.newPassword || !passwordData.oldPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    try {
      setIsChangingPassword(true);
      await apiClient.post(ENDPOINTS.AUTH_UPDATE_PASSWORD, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Calendar OAuth flow
  const handleCalendarConnect = async (vendor: 'google' | 'microsoft') => {
    const syncDate = vendor === 'google' ? googleSyncDate : microsoftSyncDate;
    if (!syncDate) {
      toast.error('Please select a sync start date');
      return;
    }

    const setConnecting = vendor === 'google' ? setIsConnectingGoogle : setIsConnectingMicrosoft;
    setConnecting(true);

    try {
      const authUrlEndpoint = vendor === 'google'
        ? ENDPOINTS.CALENDAR_GOOGLE_AUTH_URL
        : ENDPOINTS.CALENDAR_MICROSOFT_AUTH_URL;

      const authUrl = await apiClient.get<string>(authUrlEndpoint);

      // Save pending sync info
      localStorage.setItem('workdeck-calendar-sync-pending', JSON.stringify({
        vendor,
        from: toApiDate(syncDate),
      }));

      // Build full URL with login hint and state
      const dateForState = toApiDate(syncDate);
      const separator = authUrl.includes('?') ? '&' : '?';
      const fullUrl = `${authUrl}${separator}login_hint=${encodeURIComponent(profile?.email || '')}&state=${encodeURIComponent(JSON.stringify({ from: dateForState }))}`;

      window.location.href = fullUrl;
    } catch (err: any) {
      console.error(`Failed to get ${vendor} auth URL:`, err);
      toast.error(`Failed to connect ${vendor === 'google' ? 'Google' : 'Microsoft'} Calendar`);
      setConnecting(false);
    }
  };

  const handleToggleGoogleSync = (checked: boolean) => {
    if (checked) {
      setGoogleSync(prev => ({ ...prev, isActivated: true }));
      if (!googleSyncDate) {
        setGoogleSyncDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      setGoogleSync(prev => ({ ...prev, isActivated: false }));
    }
    setHasChanges(true);
  };

  const handleToggleMicrosoftSync = (checked: boolean) => {
    if (checked) {
      setMicrosoftSync(prev => ({ ...prev, isActivated: true }));
      if (!microsoftSyncDate) {
        setMicrosoftSyncDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      setMicrosoftSync(prev => ({ ...prev, isActivated: false }));
    }
    setHasChanges(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">My Profile</h1>
                <p className="text-[13px] text-[#6B7280]">Manage your personal information and preferences</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin" />
          <p className="text-[14px] text-[#6B7280] mt-3">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">My Profile</h1>
                <p className="text-[13px] text-[#6B7280]">Manage your personal information and preferences</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <p className="text-[14px] text-[#EF4444] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">My Profile</h1>
                <p className="text-[13px] text-[#6B7280]">Manage your personal information and preferences</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8 pb-24">
        <div className="bg-white rounded-lg border border-[#E5E7EB] divide-y divide-[#E5E7EB]">

          {/* Section 1: Profile Header */}
          <div className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-medium overflow-hidden"
                  style={{ backgroundColor: '#0066FF' }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : profile?.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#D1D5DB] rounded-full flex items-center justify-center hover:bg-[#F9FAFB] transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-[#6B7280]" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-[18px] font-medium text-[#1F2937]">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile?.fullName || 'User'}
                </h2>
                <p className="text-[14px] text-[#6B7280]">{profile?.email}</p>
                {profile?.rol && (
                  <p className="text-[13px] text-[#9CA3AF] mt-0.5">{profile.rol}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#6B7280]" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Editable fields */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">First Name</label>
                <input
                  type="text"
                  value={profile?.firstName || ''}
                  onChange={(e) => updateProfile('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Last Name</label>
                <input
                  type="text"
                  value={profile?.lastName || ''}
                  onChange={(e) => updateProfile('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile?.phone || ''}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Language</label>
                <select
                  value={profile?.language?.id || ''}
                  onChange={(e) => {
                    const langId = e.target.value;
                    const langName = e.target.options[e.target.selectedIndex].text;
                    updateProfile('language', { id: langId, name: langName });
                  }}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                >
                  <option value="">Select language</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>

              {/* Read-only fields */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Department</label>
                <input
                  type="text"
                  value={profile?.department?.name || '-'}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Manager</label>
                <input
                  type="text"
                  value={profile?.manager?.fullName || '-'}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Office</label>
                <input
                  type="text"
                  value={profile?.office?.name || '-'}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Job Title</label>
                <input
                  type="text"
                  value={profile?.rol || '-'}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Leave Allowance</label>
                <input
                  type="text"
                  value={profile?.remainingHolidays != null ? `${profile.remainingHolidays} days` : '-'}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Pending Requests</label>
                <input
                  type="text"
                  value={profile?.pendingLeaves != null ? String(profile.pendingLeaves) : '-'}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Event Reminders */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6B7280]" />
              Event Reminders
            </h3>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Reminder before event</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={profile?.eventReminderValue ?? 15}
                    onChange={(e) => updateProfile('eventReminderValue', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                  <select
                    value={profile?.eventReminderUnit ?? 0}
                    onChange={(e) => updateProfile('eventReminderUnit', parseInt(e.target.value))}
                    className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  >
                    {REMINDER_UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Calendar Synchronization */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6B7280]" />
              Calendar Synchronization
            </h3>
            <div className="space-y-4">
              {/* Google Calendar */}
              <div className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z" fill="#fff"/>
                      <path d="M17.64 12.2c0-.63-.06-1.25-.16-1.84H12v3.49h3.16a2.7 2.7 0 01-1.17 1.77v1.47h1.9c1.1-1.02 1.74-2.52 1.74-4.89z" fill="#4285F4"/>
                      <path d="M12 18c1.58 0 2.91-.52 3.88-1.41l-1.9-1.47c-.52.35-1.19.56-1.98.56-1.53 0-2.82-1.03-3.28-2.42H6.77v1.52A5.997 5.997 0 0012 18z" fill="#34A853"/>
                      <path d="M8.72 13.26a3.6 3.6 0 010-2.3V9.44H6.77a5.99 5.99 0 000 5.38l1.95-1.56z" fill="#FBBC05"/>
                      <path d="M12 8.58c.86 0 1.64.3 2.25.88l1.69-1.69A5.97 5.97 0 0012 6c-2.35 0-4.38 1.35-5.37 3.32l1.95 1.52c.46-1.39 1.75-2.42 3.28-2.42z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[14px] font-medium text-[#1F2937]">Google Calendar</span>
                    {googleSync.isActivated && googleSync.from && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={googleSync.isActivated}
                      onChange={(e) => handleToggleGoogleSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D1D5DB] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]" />
                  </label>
                </div>
                {googleSync.isActivated && !googleSync.from && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-[13px] text-[#6B7280]">Sync events from:</label>
                    <input
                      type="date"
                      value={googleSyncDate}
                      onChange={(e) => setGoogleSyncDate(e.target.value)}
                      className="px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    />
                    <button
                      onClick={() => handleCalendarConnect('google')}
                      disabled={isConnectingGoogle || !googleSyncDate}
                      className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isConnectingGoogle && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Connect
                    </button>
                  </div>
                )}
                {googleSync.isActivated && googleSync.from && (
                  <p className="mt-2 text-[12px] text-[#6B7280]">
                    Syncing events from {googleSync.from}
                  </p>
                )}
              </div>

              {/* Microsoft Calendar */}
              <div className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                    </svg>
                    <span className="text-[14px] font-medium text-[#1F2937]">Microsoft Calendar</span>
                    {microsoftSync.isActivated && microsoftSync.from && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={microsoftSync.isActivated}
                      onChange={(e) => handleToggleMicrosoftSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D1D5DB] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]" />
                  </label>
                </div>
                {microsoftSync.isActivated && !microsoftSync.from && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-[13px] text-[#6B7280]">Sync events from:</label>
                    <input
                      type="date"
                      value={microsoftSyncDate}
                      onChange={(e) => setMicrosoftSyncDate(e.target.value)}
                      className="px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    />
                    <button
                      onClick={() => handleCalendarConnect('microsoft')}
                      disabled={isConnectingMicrosoft || !microsoftSyncDate}
                      className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isConnectingMicrosoft && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Connect
                    </button>
                  </div>
                )}
                {microsoftSync.isActivated && microsoftSync.from && (
                  <p className="mt-2 text-[12px] text-[#6B7280]">
                    Syncing events from {microsoftSync.from}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Security */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#6B7280]" />
              Security
            </h3>
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
              >
                Change Password
              </button>
            ) : (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#374151]"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#374151]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#374151]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-[12px] text-[#EF4444] mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !passwordData.oldPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                    className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Notification Preferences */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6B7280]" />
              Notification Preferences
            </h3>
            <div className="space-y-6">
              {/* FYI Notifications */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  FYI Notifications — Comments
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'all', label: 'All' },
                    { value: 'mentioned', label: 'Mentions only' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notif-comment"
                        value={opt.value}
                        checked={notifications.comment === opt.value}
                        onChange={(e) => {
                          setNotifications(prev => ({ ...prev, comment: e.target.value }));
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-[#0066FF] focus:ring-2 focus:ring-[#0066FF]"
                      />
                      <span className="text-[13px] text-[#374151]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email Notifications */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Email Notifications — Comments
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'all', label: 'All' },
                    { value: 'mentioned', label: 'Mentions only' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notif-commentMail"
                        value={opt.value}
                        checked={notifications.commentMail === opt.value}
                        onChange={(e) => {
                          setNotifications(prev => ({ ...prev, commentMail: e.target.value }));
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-[#0066FF] focus:ring-2 focus:ring-[#0066FF]"
                      />
                      <span className="text-[13px] text-[#374151]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1F2937] text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4 z-50">
          <p className="text-[13px]">You have unsaved changes</p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] rounded text-[12px] font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save now'}
          </button>
        </div>
      )}
    </div>
  );
}

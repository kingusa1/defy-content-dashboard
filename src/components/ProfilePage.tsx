import React, { useState } from 'react';
import {
  User,
  Building,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Save,
  RefreshCw,
  Check,
  Edit2,
  Award,
  Activity,
  TrendingUp,
  FileText,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack: _onBack }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || 'User',
    email: user?.email || 'user@defyinsurance.com',
    phone: '+1 (555) 123-4567',
    company: 'Defy Insurance',
    department: 'Marketing',
    location: 'New York, NY',
    bio: 'Content marketing specialist focused on insurance industry trends and customer success stories.',
    joinDate: '2025-01-15',
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  // Mock activity stats
  const stats = {
    articlesCreated: 24,
    storiesCompleted: 18,
    metricsUpdated: 156,
    lastActive: 'Just now',
  };

  // Mock recent activity
  const recentActivity = [
    { action: 'Updated week metrics', time: '2 minutes ago', icon: <TrendingUp size={14} /> },
    { action: 'Published new article', time: '1 hour ago', icon: <FileText size={14} /> },
    { action: 'Completed success story', time: '3 hours ago', icon: <Award size={14} /> },
    { action: 'Modified posting schedule', time: 'Yesterday', icon: <Clock size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1e4c]">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and preferences</p>
        </div>
        {editing ? (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : saved ? (
                <Check size={18} />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Edit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Cover */}
            <div className="h-24 bg-gradient-to-r from-[#1b1e4c] to-[#2a2e5c]" />

            {/* Avatar */}
            <div className="px-6 -mt-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                {editing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#13BCC5] text-white rounded-lg flex items-center justify-center hover:bg-[#0FA8B0] transition-colors">
                    <Camera size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-6 pt-4">
              <h2 className="text-xl font-bold text-[#1b1e4c]">{profile.name}</h2>
              <p className="text-slate-500 text-sm">{profile.email}</p>

              <div className="mt-4 flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  <Shield size={12} className="inline mr-1" />
                  {user?.role || 'User'}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                  Active
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-600">{profile.bio}</p>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Building size={16} className="text-slate-400" />
                  <span className="text-slate-600">{profile.company}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="text-slate-600">{profile.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-slate-600">Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-6">
            <h3 className="font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
              <Activity size={18} />
              Activity Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-[#13BCC5]">{stats.articlesCreated}</p>
                <p className="text-xs text-slate-500">Articles</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-[#1b1e4c]">{stats.storiesCompleted}</p>
                <p className="text-xs text-slate-500">Stories</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{stats.metricsUpdated}</p>
                <p className="text-xs text-slate-500">Updates</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-sm font-bold text-emerald-600">{stats.lastActive}</p>
                <p className="text-xs text-slate-500">Last Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-[#1b1e4c] mb-6 flex items-center gap-2">
              <User size={18} />
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!editing}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-[#1b1e4c] mb-6 flex items-center gap-2">
              <Clock size={18} />
              Recent Activity
            </h3>

            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-[#13BCC5]/10 flex items-center justify-center text-[#13BCC5]">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1b1e4c] text-sm">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full py-2 text-sm text-[#13BCC5] hover:bg-[#13BCC5]/5 rounded-xl transition-colors">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

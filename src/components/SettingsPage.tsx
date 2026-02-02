import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Save,
  RefreshCw,
  Check,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Zap,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack: _onBack }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    alertsOnNewContent: true,
    alertsOnMetrics: false,
    // Appearance
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    // Data
    autoRefresh: true,
    refreshInterval: 30,
    cacheEnabled: true,
  });

  const handleSave = () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      localStorage.setItem('defy_settings', JSON.stringify(settings));
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const sections = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'data', label: 'Data & Sync', icon: <Database size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1e4c]">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your dashboard preferences and account settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : saved ? (
            <Check size={18} />
          ) : (
            <Save size={18} />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-[#13BCC5] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {section.icon}
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
                    <Globe size={20} />
                    General Settings
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date Format</label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
                    <Bell size={20} />
                    Notification Preferences
                  </h3>
                </div>

                <div className="space-y-4">
                  <ToggleSetting
                    label="Email Notifications"
                    description="Receive important updates via email"
                    checked={settings.emailNotifications}
                    onChange={(val) => setSettings({ ...settings, emailNotifications: val })}
                  />
                  <ToggleSetting
                    label="Push Notifications"
                    description="Get real-time alerts in your browser"
                    checked={settings.pushNotifications}
                    onChange={(val) => setSettings({ ...settings, pushNotifications: val })}
                  />
                  <ToggleSetting
                    label="Weekly Digest"
                    description="Receive a weekly summary of your content performance"
                    checked={settings.weeklyDigest}
                    onChange={(val) => setSettings({ ...settings, weeklyDigest: val })}
                  />
                  <ToggleSetting
                    label="New Content Alerts"
                    description="Get notified when new content is published"
                    checked={settings.alertsOnNewContent}
                    onChange={(val) => setSettings({ ...settings, alertsOnNewContent: val })}
                  />
                  <ToggleSetting
                    label="Metrics Alerts"
                    description="Alert when metrics reach certain thresholds"
                    checked={settings.alertsOnMetrics}
                    onChange={(val) => setSettings({ ...settings, alertsOnMetrics: val })}
                  />
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
                    <Palette size={20} />
                    Appearance
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: <Sun size={20} /> },
                      { id: 'dark', label: 'Dark', icon: <Moon size={20} /> },
                      { id: 'system', label: 'System', icon: <Monitor size={20} /> },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings({ ...settings, theme: theme.id })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          settings.theme === theme.id
                            ? 'border-[#13BCC5] bg-[#13BCC5]/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={settings.theme === theme.id ? 'text-[#13BCC5]' : 'text-slate-500'}>
                          {theme.icon}
                        </span>
                        <span className="text-sm font-medium">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <ToggleSetting
                    label="Compact Mode"
                    description="Use a more condensed layout"
                    checked={settings.compactMode}
                    onChange={(val) => setSettings({ ...settings, compactMode: val })}
                  />
                  <ToggleSetting
                    label="Show Animations"
                    description="Enable smooth transitions and animations"
                    checked={settings.showAnimations}
                    onChange={(val) => setSettings({ ...settings, showAnimations: val })}
                  />
                </div>
              </div>
            )}

            {/* Data & Sync */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
                    <Database size={20} />
                    Data & Synchronization
                  </h3>
                </div>

                <div className="space-y-4">
                  <ToggleSetting
                    label="Auto Refresh"
                    description="Automatically refresh data from Google Sheets"
                    checked={settings.autoRefresh}
                    onChange={(val) => setSettings({ ...settings, autoRefresh: val })}
                  />

                  {settings.autoRefresh && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Refresh Interval (seconds)
                      </label>
                      <select
                        value={settings.refreshInterval}
                        onChange={(e) => setSettings({ ...settings, refreshInterval: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                      >
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </div>
                  )}

                  <ToggleSetting
                    label="Enable Caching"
                    description="Cache data locally for faster loading"
                    checked={settings.cacheEnabled}
                    onChange={(val) => setSettings({ ...settings, cacheEnabled: val })}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-medium text-[#1b1e4c] mb-3">Google Sheets Connection</h4>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-800">Connected</p>
                      <p className="text-sm text-emerald-600">Last synced: Just now</p>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
                      View Sheet <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
                    <Shield size={20} />
                    Security Settings
                  </h3>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-[#1b1e4c] mb-2">Current Session</h4>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Smartphone size={16} />
                    <span>Logged in as <strong>{user?.email}</strong></span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-slate-500" />
                      <div className="text-left">
                        <p className="font-medium text-[#1b1e4c]">Change Password</p>
                        <p className="text-sm text-slate-500">Update your account password</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Zap size={18} className="text-slate-500" />
                      <div className="text-left">
                        <p className="font-medium text-[#1b1e4c]">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Coming Soon</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Danger Zone</p>
                        <p className="text-sm text-red-600 mt-1">
                          Permanently delete your account and all associated data.
                        </p>
                        <button className="mt-3 text-sm text-red-600 font-medium hover:text-red-700">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Setting Component
interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
    <div>
      <p className="font-medium text-[#1b1e4c]">{label}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-[#13BCC5]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  </div>
);

export default SettingsPage;

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Save,
  Loader2,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface WeekMetric {
  id: string;
  rowIndex: number;
  status: string;
  campaign: string;
  message: string;
  audience: string;
  agent: string;
  acceptanceRate: string;
  replies: string;
  replyPercent: string;
  defyLead: string;
  target: string;
  algoType: string;
  weekEnd: string;
  location: string;
  queue: string;
  totalInvited: string;
  totalAccepted: string;
  netNewConnects: string;
  startingConnects: string;
  endingConnections: string;
  totalMessaged: string;
  totalActions: string;
}

interface WeekMetricsFormProps {
  onRefresh: () => void;
}

const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

const WeekMetricsForm: React.FC<WeekMetricsFormProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<WeekMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editedMetrics, setEditedMetrics] = useState<Record<string, Partial<WeekMetric>>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState<Partial<WeekMetric>>({});

  const isAdmin = user?.role === 'admin';

  // All fields in the sheet
  const allFields = [
    { key: 'status', label: 'Status', adminOnly: true },
    { key: 'campaign', label: 'Campaign', adminOnly: true },
    { key: 'message', label: 'Message', adminOnly: true },
    { key: 'audience', label: 'Audience', adminOnly: true },
    { key: 'agent', label: 'Agent', adminOnly: true },
    { key: 'acceptanceRate', label: 'Acceptance Rate %', adminOnly: true },
    { key: 'replies', label: 'Replies', adminOnly: true },
    { key: 'replyPercent', label: 'Reply %', adminOnly: true },
    { key: 'defyLead', label: 'Defy Lead', adminOnly: false }, // Everyone can edit
    { key: 'target', label: 'Target', adminOnly: true },
    { key: 'algoType', label: 'Algo Type', adminOnly: true },
    { key: 'weekEnd', label: 'W. End', adminOnly: true },
    { key: 'location', label: 'Location', adminOnly: true },
    { key: 'queue', label: 'Queue', adminOnly: true },
    { key: 'totalInvited', label: 'Total Invited', adminOnly: true },
    { key: 'totalAccepted', label: 'Total Accepted', adminOnly: true },
    { key: 'netNewConnects', label: 'Net New Connects', adminOnly: true },
    { key: 'startingConnects', label: 'Starting Connects', adminOnly: true },
    { key: 'endingConnections', label: 'Ending Connections', adminOnly: true },
    { key: 'totalMessaged', label: 'Total Messaged', adminOnly: true },
    { key: 'totalActions', label: 'Total Actions', adminOnly: true },
  ];

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/metrics`);
      setMetrics(response.data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load week metrics. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const canEditField = (fieldKey: string) => {
    const field = allFields.find(f => f.key === fieldKey);
    if (!field) return false;
    if (isAdmin) return true;
    return !field.adminOnly;
  };

  const handleFieldChange = (metricId: string, field: string, value: string) => {
    if (!canEditField(field)) return;

    setEditedMetrics(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId);
    const changes = editedMetrics[metricId];

    if (!metric || !changes || Object.keys(changes).length === 0) return;

    try {
      setSaving(true);
      setError(null);

      await axios.post(`${API_URL}/metrics/update`, {
        rowIndex: metric.rowIndex,
        changes: changes,
        userRole: user?.role,
      });

      // Update local state
      setMetrics(prev => prev.map(m =>
        m.id === metricId ? { ...m, ...changes } : m
      ));

      // Clear edited state for this metric
      setEditedMetrics(prev => {
        const newState = { ...prev };
        delete newState[metricId];
        return newState;
      });

      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      onRefresh();
    } catch (err: unknown) {
      console.error('Error saving metrics:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to save changes');
      } else {
        setError('Failed to save changes');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (Object.keys(newMetric).length === 0) {
      setError('Please fill in at least one field');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await axios.post(`${API_URL}/metrics/add`, {
        data: newMetric,
        userRole: user?.role,
      });

      setNewMetric({});
      setShowAddForm(false);
      setSuccess('New row added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchMetrics();
      onRefresh();
    } catch (err: unknown) {
      console.error('Error adding metric:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to add new row');
      } else {
        setError('Failed to add new row');
      }
    } finally {
      setSaving(false);
    }
  };

  const getDisplayValue = (metric: WeekMetric, field: string) => {
    const edited = editedMetrics[metric.id];
    if (edited && field in edited) {
      return edited[field as keyof WeekMetric] || '';
    }
    return metric[field as keyof WeekMetric] || '';
  };

  const hasChanges = (metricId: string) => {
    return editedMetrics[metricId] && Object.keys(editedMetrics[metricId]).length > 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#13BCC5] animate-spin" />
          <p className="text-slate-500 mt-4">Loading week metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Defy Insurance Week Metrics</h3>
              <p className="text-white/60 text-sm flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <Unlock size={14} />
                    Admin Access - All fields editable
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    User Access - Only "Defy Lead" editable
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors"
              >
                <Plus size={16} />
                Add Row
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Add New Form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h4 className="font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
            <Plus size={18} />
            Add New Week Metrics Row
          </h4>
          <div className="grid md:grid-cols-4 gap-4">
            {allFields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={newMetric[field.key as keyof WeekMetric] || ''}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewMetric({});
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNew}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-lg hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Row
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1b1e4c]">{metrics.length}</p>
              <p className="text-xs text-slate-500">Total Rows</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1b1e4c]">
                {metrics.filter(m => m.defyLead).length}
              </p>
              <p className="text-xs text-slate-500">With Defy Lead</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1b1e4c]">
                {metrics.filter(m => m.campaign).length}
              </p>
              <p className="text-xs text-slate-500">Active Campaigns</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1b1e4c]">
                {[...new Set(metrics.map(m => m.weekEnd).filter(Boolean))].length}
              </p>
              <p className="text-xs text-slate-500">Week Ends</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h4 className="font-bold text-[#1b1e4c]">Week Metrics Data</h4>
          <p className="text-sm text-slate-500">
            {isAdmin ? 'Click on any row to expand and edit all fields' : 'Click on any row to edit the Defy Lead field'}
          </p>
        </div>

        {metrics.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No week metrics data yet</p>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-[#13BCC5] hover:underline"
              >
                Add your first row
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {metrics.map((metric) => (
              <div key={metric.id} className="hover:bg-slate-50 transition-colors">
                {/* Row Header */}
                <div
                  onClick={() => setExpandedRow(expandedRow === metric.id ? null : metric.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#13BCC5]/10 flex items-center justify-center text-[#13BCC5] font-bold text-sm">
                        {metric.rowIndex}
                      </div>
                      <div>
                        <p className="font-medium text-[#1b1e4c]">
                          {metric.campaign || metric.agent || `Row ${metric.rowIndex}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {metric.weekEnd && `Week End: ${metric.weekEnd}`}
                          {metric.defyLead && ` | Lead: ${metric.defyLead}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasChanges(metric.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave(metric.id);
                          }}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-[#13BCC5] text-white rounded-lg text-sm hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save
                        </button>
                      )}
                      {expandedRow === metric.id ? (
                        <ChevronUp size={18} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Row */}
                {expandedRow === metric.id && (
                  <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                    <div className="grid md:grid-cols-4 gap-4 pt-4">
                      {allFields.map(field => {
                        const editable = canEditField(field.key);
                        return (
                          <div key={field.key}>
                            <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                              {field.label}
                              {!editable && <Lock size={10} className="text-slate-400" />}
                              {field.key === 'defyLead' && !isAdmin && (
                                <span className="text-[#13BCC5]">(Editable)</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={getDisplayValue(metric, field.key)}
                              onChange={(e) => handleFieldChange(metric.id, field.key, e.target.value)}
                              disabled={!editable}
                              className={`w-full px-3 py-2 border rounded-lg text-sm transition-all ${
                                editable
                                  ? 'bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {hasChanges(metric.id) && (
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => handleSave(metric.id)}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-lg hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekMetricsForm;

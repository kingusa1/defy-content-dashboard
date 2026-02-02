import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  Eye,
  UserCircle,
  X,
  PlusCircle,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WeekMetricsAnalytics from './WeekMetricsAnalytics';
import axios from 'axios';

// Default agents list
const DEFAULT_AGENTS = ['Ramy Sharaf', 'Deniz', 'Mohamed Mounir'];

// Local storage key for agents
const AGENTS_STORAGE_KEY = 'weekMetrics_agents';

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
  const [activeView, setActiveView] = useState<'data' | 'analytics'>('analytics');

  // Agent filter state
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [agents, setAgents] = useState<string[]>(() => {
    const saved = localStorage.getItem(AGENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_AGENTS;
  });
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);

  // Add Lead Modal state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [addLeadStep, setAddLeadStep] = useState<1 | 2 | 3>(1);
  const [addLeadAgent, setAddLeadAgent] = useState<string>('');
  const [addLeadSelectedRow, setAddLeadSelectedRow] = useState<WeekMetric | null>(null);
  const [addLeadValue, setAddLeadValue] = useState('');
  const [addLeadSaving, setAddLeadSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Get rows for selected agent in Add Lead modal
  const agentRows = useMemo(() => {
    if (!addLeadAgent) return [];
    return metrics.filter(m =>
      m.agent?.toLowerCase().includes(addLeadAgent.toLowerCase())
    );
  }, [metrics, addLeadAgent]);

  // Filter metrics based on selected agent
  const filteredMetrics = useMemo(() => {
    if (selectedAgent === 'all') {
      return metrics;
    }
    return metrics.filter(m =>
      m.agent?.toLowerCase().includes(selectedAgent.toLowerCase()) ||
      m.defyLead?.toLowerCase().includes(selectedAgent.toLowerCase())
    );
  }, [metrics, selectedAgent]);

  // Save agents to localStorage when changed
  useEffect(() => {
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
  }, [agents]);

  // Add new agent
  const handleAddAgent = () => {
    if (newAgentName.trim() && !agents.includes(newAgentName.trim())) {
      setAgents(prev => [...prev, newAgentName.trim()]);
      setNewAgentName('');
      setShowAddAgentModal(false);
    }
  };

  // Remove agent
  const handleRemoveAgent = (agentToRemove: string) => {
    setAgents(prev => prev.filter(a => a !== agentToRemove));
    if (selectedAgent === agentToRemove) {
      setSelectedAgent('all');
    }
  };

  // Reset Add Lead Modal
  const resetAddLeadModal = () => {
    setShowAddLeadModal(false);
    setAddLeadStep(1);
    setAddLeadAgent('');
    setAddLeadSelectedRow(null);
    setAddLeadValue('');
  };

  // Handle Add Lead submission
  const handleAddLeadSubmit = async () => {
    if (!addLeadSelectedRow || !addLeadValue.trim()) return;

    try {
      setAddLeadSaving(true);
      setError(null);

      await axios.post(`${API_URL}/metrics/update`, {
        rowIndex: addLeadSelectedRow.rowIndex,
        changes: { defyLead: addLeadValue.trim() },
        userRole: user?.role,
      });

      // Update local state
      setMetrics(prev => prev.map(m =>
        m.id === addLeadSelectedRow.id ? { ...m, defyLead: addLeadValue.trim() } : m
      ));

      setSuccess(`Lead "${addLeadValue}" added successfully for ${addLeadAgent}!`);
      setTimeout(() => setSuccess(null), 3000);
      resetAddLeadModal();
      onRefresh();
    } catch (err: unknown) {
      console.error('Error adding lead:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to add lead');
      } else {
        setError('Failed to add lead');
      }
    } finally {
      setAddLeadSaving(false);
    }
  };

  // All fields in the sheet
  const allFields = [
    { key: 'status', label: 'Status', adminOnly: true },
    { key: 'campaign', label: 'Campaign', adminOnly: true },
    { key: 'message', label: 'Message', adminOnly: true },
    { key: 'audience', label: 'Audience', adminOnly: true },
    { key: 'agent', label: 'Agent', adminOnly: true },
    { key: 'acceptanceRate', label: 'Accept %', adminOnly: true },
    { key: 'replies', label: 'Replies', adminOnly: true },
    { key: 'replyPercent', label: 'Reply %', adminOnly: true },
    { key: 'defyLead', label: 'Defy Lead', adminOnly: false }, // Everyone can edit
    { key: 'target', label: 'Target', adminOnly: true },
    { key: 'algoType', label: 'Algo Type', adminOnly: true },
    { key: 'weekEnd', label: 'W. End', adminOnly: true },
    { key: 'location', label: 'Location', adminOnly: true },
    { key: 'queue', label: 'Queue', adminOnly: true },
    { key: 'totalInvited', label: 'Invited', adminOnly: true },
    { key: 'totalAccepted', label: 'Accepted', adminOnly: true },
    { key: 'netNewConnects', label: 'Net Connects', adminOnly: true },
    { key: 'startingConnects', label: 'Start Connects', adminOnly: true },
    { key: 'endingConnections', label: 'End Connects', adminOnly: true },
    { key: 'totalMessaged', label: 'Messaged', adminOnly: true },
    { key: 'totalActions', label: 'Actions', adminOnly: true },
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#13BCC5] animate-spin" />
          <p className="text-slate-500 mt-4">Loading week metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">Week Metrics</h3>
              <p className="text-white/60 text-xs md:text-sm flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <Unlock size={12} />
                    <span className="hidden sm:inline">Admin Access - All fields editable</span>
                    <span className="sm:hidden">Admin</span>
                  </>
                ) : (
                  <>
                    <Lock size={12} />
                    <span className="hidden sm:inline">User Access - Only "Defy Lead" editable</span>
                    <span className="sm:hidden">User</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Add Lead</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors text-sm"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Row</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Filter Dropdown */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-[#1b1e4c]">Filter by Agent</h4>
              <p className="text-xs text-slate-500">
                {selectedAgent === 'all'
                  ? `Showing all ${metrics.length} records`
                  : `Showing ${filteredMetrics.length} of ${metrics.length} records for ${selectedAgent}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Agent Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-[#1b1e4c] hover:bg-slate-200 transition-colors min-w-[160px] justify-between"
              >
                <span className="truncate">
                  {selectedAgent === 'all' ? 'All Agents' : selectedAgent}
                </span>
                <ChevronDown size={16} className={`transition-transform ${agentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {agentDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {/* All Agents Option */}
                    <button
                      onClick={() => {
                        setSelectedAgent('all');
                        setAgentDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                        selectedAgent === 'all' ? 'bg-[#13BCC5]/10 text-[#13BCC5]' : 'text-[#1b1e4c]'
                      }`}
                    >
                      <Users size={16} />
                      <span className="font-medium">All Agents</span>
                      {selectedAgent === 'all' && <CheckCircle2 size={14} className="ml-auto" />}
                    </button>

                    <div className="border-t border-slate-100" />

                    {/* Individual Agents */}
                    {agents.map((agent) => (
                      <div
                        key={agent}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                          selectedAgent === agent ? 'bg-[#13BCC5]/10 text-[#13BCC5]' : 'text-[#1b1e4c]'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setAgentDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1b1e4c] to-[#2a2e5c] flex items-center justify-center text-white text-xs font-bold">
                            {agent.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{agent}</span>
                          {selectedAgent === agent && <CheckCircle2 size={14} className="ml-auto" />}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAgent(agent);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add New Agent Button */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-slate-100" />
                        <button
                          onClick={() => {
                            setShowAddAgentModal(true);
                            setAgentDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 text-[#13BCC5] hover:bg-[#13BCC5]/5 transition-colors"
                        >
                          <PlusCircle size={16} />
                          <span className="font-medium">Add New Agent</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick agent chips */}
            <div className="hidden md:flex items-center gap-2">
              {agents.slice(0, 3).map((agent) => (
                <button
                  key={agent}
                  onClick={() => setSelectedAgent(selectedAgent === agent ? 'all' : agent)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedAgent === agent
                      ? 'bg-[#13BCC5] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {agent.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-[#1b1e4c] text-lg">Add New Agent</h4>
              <button
                onClick={() => {
                  setShowAddAgentModal(false);
                  setNewAgentName('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAgent()}
                  placeholder="Enter agent name..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddAgentModal(false);
                    setNewAgentName('');
                  }}
                  className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAgent}
                  disabled={!newAgentName.trim()}
                  className="flex-1 px-4 py-3 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Add Lead</h4>
                    <p className="text-white/80 text-sm">Step {addLeadStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={resetAddLeadModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Progress Bar */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      step <= addLeadStep ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Select Agent */}
              {addLeadStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-[#1b1e4c] mb-1">Select Agent</h5>
                    <p className="text-sm text-slate-500">Choose the agent for this lead</p>
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {agents.map((agent) => (
                      <button
                        key={agent}
                        onClick={() => {
                          setAddLeadAgent(agent);
                          setAddLeadStep(2);
                        }}
                        className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all hover:border-emerald-500 hover:bg-emerald-50 ${
                          addLeadAgent === agent ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1b1e4c] to-[#2a2e5c] flex items-center justify-center text-white font-bold text-lg">
                          {agent.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1b1e4c]">{agent}</p>
                          <p className="text-xs text-slate-500">
                            {metrics.filter(m => m.agent?.toLowerCase().includes(agent.toLowerCase())).length} records
                          </p>
                        </div>
                        <ArrowRight size={20} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Date/Row */}
              {addLeadStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-[#1b1e4c] mb-1">Select Date</h5>
                      <p className="text-sm text-slate-500">
                        Choose a date for <span className="font-medium text-emerald-600">{addLeadAgent}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAddLeadStep(1);
                        setAddLeadAgent('');
                      }}
                      className="flex items-center gap-1 text-sm text-slate-600 hover:text-[#1b1e4c]"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                  </div>

                  {agentRows.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No records found for {addLeadAgent}</p>
                      <button
                        onClick={() => setAddLeadStep(1)}
                        className="mt-4 text-emerald-600 hover:underline text-sm"
                      >
                        Select a different agent
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {agentRows.map((row) => (
                        <button
                          key={row.id}
                          onClick={() => {
                            setAddLeadSelectedRow(row);
                            setAddLeadStep(3);
                          }}
                          className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all hover:border-emerald-500 hover:bg-emerald-50 ${
                            addLeadSelectedRow?.id === row.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Calendar size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1b1e4c]">
                              {row.weekEnd || `Row ${row.rowIndex}`}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {row.campaign && `Campaign: ${row.campaign}`}
                              {row.defyLead && (
                                <span className="ml-2 text-emerald-600">
                                  Current Lead: {row.defyLead}
                                </span>
                              )}
                            </p>
                          </div>
                          {row.defyLead ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg font-medium">
                              Has Lead
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium">
                              No Lead
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Enter Lead Name */}
              {addLeadStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-[#1b1e4c] mb-1">Enter Lead</h5>
                      <p className="text-sm text-slate-500">Add lead for the selected date</p>
                    </div>
                    <button
                      onClick={() => {
                        setAddLeadStep(2);
                        setAddLeadSelectedRow(null);
                      }}
                      className="flex items-center gap-1 text-sm text-slate-600 hover:text-[#1b1e4c]"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Agent:</span>
                      <span className="font-medium text-[#1b1e4c]">{addLeadAgent}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Date (W. End):</span>
                      <span className="font-medium text-[#1b1e4c]">
                        {addLeadSelectedRow?.weekEnd || `Row ${addLeadSelectedRow?.rowIndex}`}
                      </span>
                    </div>
                    {addLeadSelectedRow?.campaign && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Campaign:</span>
                        <span className="font-medium text-[#1b1e4c]">{addLeadSelectedRow.campaign}</span>
                      </div>
                    )}
                    {addLeadSelectedRow?.defyLead && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Current Lead:</span>
                        <span className="font-medium text-amber-600">{addLeadSelectedRow.defyLead}</span>
                      </div>
                    )}
                  </div>

                  {/* Lead Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Lead Name
                    </label>
                    <input
                      type="text"
                      value={addLeadValue}
                      onChange={(e) => setAddLeadValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLeadValue.trim() && handleAddLeadSubmit()}
                      placeholder="Enter lead name..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      autoFocus
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAddLeadSubmit}
                    disabled={!addLeadValue.trim() || addLeadSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addLeadSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Add Lead to Google Sheet
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveView('analytics')}
          className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'analytics'
              ? 'bg-white text-[#1b1e4c] shadow-sm'
              : 'text-slate-600 hover:text-[#1b1e4c]'
          }`}
        >
          <BarChart3 size={16} />
          <span className="hidden sm:inline">Analytics</span>
        </button>
        <button
          onClick={() => setActiveView('data')}
          className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'data'
              ? 'bg-white text-[#1b1e4c] shadow-sm'
              : 'text-slate-600 hover:text-[#1b1e4c]'
          }`}
        >
          <Eye size={16} />
          <span className="hidden sm:inline">Data View</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 md:p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add New Form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6">
          <h4 className="font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
            <Plus size={18} />
            Add New Week Metrics Row
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNew}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-lg hover:bg-[#0FA8B0] transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Row
            </button>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <WeekMetricsAnalytics metrics={filteredMetrics} />
      )}

      {/* Data View */}
      {activeView === 'data' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg md:text-2xl font-bold text-[#1b1e4c]">{filteredMetrics.length}</p>
                  <p className="text-xs text-slate-500 truncate">Total Rows</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg md:text-2xl font-bold text-[#1b1e4c]">
                    {filteredMetrics.filter(m => m.defyLead).length}
                  </p>
                  <p className="text-xs text-slate-500 truncate">With Lead</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg md:text-2xl font-bold text-[#1b1e4c]">
                    {filteredMetrics.filter(m => m.campaign).length}
                  </p>
                  <p className="text-xs text-slate-500 truncate">Campaigns</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg md:text-2xl font-bold text-[#1b1e4c]">
                    {[...new Set(filteredMetrics.map(m => m.weekEnd).filter(Boolean))].length}
                  </p>
                  <p className="text-xs text-slate-500 truncate">Week Ends</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="font-bold text-[#1b1e4c]">Week Metrics Data</h4>
              <p className="text-xs md:text-sm text-slate-500">
                {isAdmin ? 'Tap any row to edit all fields' : 'Tap any row to edit Defy Lead'}
              </p>
            </div>

            {filteredMetrics.length === 0 ? (
              <div className="p-8 md:p-12 text-center">
                <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {selectedAgent === 'all'
                    ? 'No week metrics data yet'
                    : `No data found for ${selectedAgent}`
                  }
                </p>
                {isAdmin && selectedAgent === 'all' && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 text-[#13BCC5] hover:underline text-sm"
                  >
                    Add your first row
                  </button>
                )}
                {selectedAgent !== 'all' && (
                  <button
                    onClick={() => setSelectedAgent('all')}
                    className="mt-4 text-[#13BCC5] hover:underline text-sm"
                  >
                    Show all agents
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredMetrics.map((metric) => (
                  <div key={metric.id} className="hover:bg-slate-50 transition-colors">
                    {/* Row Header */}
                    <div
                      onClick={() => setExpandedRow(expandedRow === metric.id ? null : metric.id)}
                      className="p-3 md:p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#13BCC5]/10 flex items-center justify-center text-[#13BCC5] font-bold text-xs md:text-sm flex-shrink-0">
                            {metric.rowIndex}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#1b1e4c] text-sm md:text-base truncate">
                              {metric.campaign || metric.agent || `Row ${metric.rowIndex}`}
                            </p>
                            <p className="text-xs md:text-sm text-slate-500 truncate">
                              {metric.weekEnd && `W.End: ${metric.weekEnd}`}
                              {metric.defyLead && ` | ${metric.defyLead}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                          {hasChanges(metric.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave(metric.id);
                              }}
                              disabled={saving}
                              className="flex items-center gap-1 px-2 md:px-3 py-1 bg-[#13BCC5] text-white rounded-lg text-xs hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
                            >
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              <span className="hidden sm:inline">Save</span>
                            </button>
                          )}
                          {expandedRow === metric.id ? (
                            <ChevronUp size={16} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Row */}
                    {expandedRow === metric.id && (
                      <div className="px-3 md:px-4 pb-4 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pt-4">
                          {allFields.map(field => {
                            const editable = canEditField(field.key);
                            return (
                              <div key={field.key}>
                                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                                  {field.label}
                                  {!editable && <Lock size={10} className="text-slate-400" />}
                                  {field.key === 'defyLead' && !isAdmin && (
                                    <span className="text-[#13BCC5] text-[10px]">(Edit)</span>
                                  )}
                                </label>
                                <input
                                  type="text"
                                  value={getDisplayValue(metric, field.key)}
                                  onChange={(e) => handleFieldChange(metric.id, field.key, e.target.value)}
                                  disabled={!editable}
                                  className={`w-full px-2 md:px-3 py-2 border rounded-lg text-xs md:text-sm transition-all ${
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
                              className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-lg hover:bg-[#0FA8B0] transition-colors disabled:opacity-50 text-sm"
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
        </>
      )}
    </div>
  );
};

export default WeekMetricsForm;

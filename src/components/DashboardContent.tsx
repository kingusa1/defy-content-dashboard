import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    ShieldCheck,
    AlertCircle,
    Users,
    DollarSign,
    FileText,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    RefreshCw
} from 'lucide-react';
import type { DashboardData } from '../hooks/useGoogleSheets';

interface DashboardContentProps {
    data: DashboardData;
    lastUpdated?: Date;
}

const COLORS = {
    teal: '#13BCC5',
    tealLight: '#1DD4DE',
    navy: '#1b1e4c',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    green: '#10B981',
    red: '#EF4444',
    blue: '#3B82F6'
};

const PIE_COLORS = [COLORS.teal, COLORS.navy, COLORS.purple, COLORS.orange];

const DashboardContent: React.FC<DashboardContentProps> = ({ data, lastUpdated }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1b1e4c] font-[Manrope]">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Real-time insurance metrics and analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <RefreshCw size={14} className="animate-spin-slow" />
                        <span>Auto-updating every 30s</span>
                    </div>
                    {lastUpdated && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Premiums"
                    value={`$${data.premiums.toLocaleString()}`}
                    change={12.5}
                    trend="up"
                    icon={<DollarSign className="w-6 h-6" />}
                    color="teal"
                />
                <StatCard
                    title="Active Policies"
                    value={data.activePolicies.toLocaleString()}
                    change={5.2}
                    trend="up"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    color="navy"
                />
                <StatCard
                    title="Claims Ratio"
                    value={`${data.claimsRatio}%`}
                    change={2.4}
                    trend="down"
                    icon={<AlertCircle className="w-6 h-6" />}
                    color="orange"
                    invertTrend
                />
                <StatCard
                    title="New Leads"
                    value={data.newLeads.toString()}
                    change={18.7}
                    trend="up"
                    icon={<Users className="w-6 h-6" />}
                    color="purple"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Premium Performance Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#1b1e4c]">Premium Performance</h3>
                            <p className="text-sm text-slate-500">Monthly premium collection trends</p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <MoreHorizontal size={20} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthlyPerformance}>
                                <defs>
                                    <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                                    }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Premium']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={COLORS.teal}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPremium)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Policy Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#1b1e4c]">Policy Mix</h3>
                            <p className="text-sm text-slate-500">Distribution by type</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.policyDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {data.policyDistribution.map((_entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {data.policyDistribution.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                                <span className="text-sm text-slate-600">{entry.name}</span>
                                <span className="text-sm font-semibold text-slate-800 ml-auto">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickStat
                    label="Pending Claims"
                    value="23"
                    icon={<Clock size={18} />}
                    color="orange"
                />
                <QuickStat
                    label="Renewals Due"
                    value="47"
                    icon={<RefreshCw size={18} />}
                    color="blue"
                />
                <QuickStat
                    label="New Policies"
                    value="12"
                    icon={<FileText size={18} />}
                    color="green"
                />
                <QuickStat
                    label="Active Agents"
                    value="8"
                    icon={<Users size={18} />}
                    color="purple"
                />
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-[#1b1e4c]">Recent Policies</h3>
                        <p className="text-sm text-slate-500">Latest policy activities</p>
                    </div>
                    <button className="text-sm font-semibold text-[#13BCC5] hover:text-[#0FA8B0] transition-colors flex items-center gap-1">
                        View All <ArrowUpRight size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Policy Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Premium
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.recentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13BCC5]/20 to-[#1b1e4c]/20 flex items-center justify-center text-[#1b1e4c] font-semibold text-sm">
                                                {tx.client.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-semibold text-[#1b1e4c]">{tx.client}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                            <ShieldCheck size={14} className="text-[#13BCC5]" />
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-[#1b1e4c]">
                                            ${tx.amount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={tx.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                            <MoreHorizontal size={18} className="text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string;
    change: number;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: 'teal' | 'navy' | 'orange' | 'purple' | 'green' | 'red';
    invertTrend?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon, color, invertTrend }) => {
    const colorStyles = {
        teal: { bg: 'bg-[#13BCC5]/10', text: 'text-[#13BCC5]', icon: 'bg-[#13BCC5]' },
        navy: { bg: 'bg-[#1b1e4c]/10', text: 'text-[#1b1e4c]', icon: 'bg-[#1b1e4c]' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'bg-orange-500' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'bg-purple-500' },
        green: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'bg-emerald-500' },
        red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'bg-red-500' }
    };

    const isPositive = invertTrend ? trend === 'down' : trend === 'up';

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 card-hover">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorStyles[color].icon}`}>
                    <div className="text-white">{icon}</div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {change}%
                </div>
            </div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">{title}</h4>
            <p className="text-2xl font-bold text-[#1b1e4c]">{value}</p>
        </div>
    );
};

// Quick Stat Component
interface QuickStatProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: 'teal' | 'navy' | 'orange' | 'purple' | 'green' | 'red' | 'blue';
}

const QuickStat: React.FC<QuickStatProps> = ({ label, value, icon, color }) => {
    const colorMap = {
        teal: 'text-[#13BCC5] bg-[#13BCC5]/10',
        navy: 'text-[#1b1e4c] bg-[#1b1e4c]/10',
        orange: 'text-orange-500 bg-orange-100',
        purple: 'text-purple-500 bg-purple-100',
        green: 'text-emerald-500 bg-emerald-100',
        red: 'text-red-500 bg-red-100',
        blue: 'text-blue-500 bg-blue-100'
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-[#1b1e4c]">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
            </div>
        </div>
    );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        Pending: 'bg-amber-100 text-amber-700 border-amber-200',
        Expired: 'bg-red-100 text-red-700 border-red-200',
        Processing: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.Pending}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'Active' ? 'bg-emerald-500' : status === 'Pending' ? 'bg-amber-500' : status === 'Expired' ? 'bg-red-500' : 'bg-blue-500'}`} />
            {status}
        </span>
    );
};

export default DashboardContent;

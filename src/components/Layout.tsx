import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileText,
    Users,
    Calendar,
    Bell,
    Search,
    Settings,
    Menu,
    X,
    ChevronDown,
    LogOut,
    User,
    HelpCircle,
    Clock,
    Bot,
    Sparkles,
    Shield,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useNavigation, type PageType } from '../context/NavigationContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);
    const { user, logout } = useAuth();
    const { searchQuery, setSearchQuery } = useSearch();
    const { currentPage, navigateTo } = useNavigation();

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
                setMobileSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile sidebar when navigating
    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [currentPage]);

    // Get user initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get role badge color
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'manager': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const handleNavigation = (page: PageType) => {
        navigateTo(page);
        setMobileSidebarOpen(false);
    };

    const isOnDashboard = currentPage === 'dashboard';

    return (
        <div className="flex h-screen bg-[#F1F5F9]">
            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative inset-y-0 left-0 z-50
                ${sidebarOpen ? 'w-64' : 'w-20'}
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                bg-[#1b1e4c] flex flex-col transition-all duration-300 ease-in-out
            `}>
                {/* Logo Section */}
                <div className="p-4 lg:p-6 border-b border-white/10">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                                <img src="/defy_logo.png" alt="Defy" className="w-8 h-8 object-contain" />
                            </div>
                            {sidebarOpen && (
                                <div>
                                    <h1 className="text-white font-bold text-lg">Defy Insurance</h1>
                                    <p className="text-white/40 text-xs">Content Dashboard</p>
                                </div>
                            )}
                        </div>
                        {/* Mobile close button */}
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="lg:hidden p-2 text-white/60 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    <div className={`${sidebarOpen ? 'px-3' : 'px-0 text-center'} mb-4`}>
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                            {sidebarOpen ? 'Content' : ''}
                        </span>
                    </div>
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={currentPage === 'dashboard'}
                        collapsed={!sidebarOpen}
                        onClick={() => handleNavigation('dashboard')}
                    />
                    <NavItem
                        icon={<FileText size={20} />}
                        label="News Articles"
                        collapsed={!sidebarOpen}
                        onClick={() => handleNavigation('dashboard')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="Success Stories"
                        collapsed={!sidebarOpen}
                        onClick={() => handleNavigation('dashboard')}
                    />
                    <NavItem
                        icon={<Calendar size={20} />}
                        label="Content Calendar"
                        collapsed={!sidebarOpen}
                        onClick={() => handleNavigation('dashboard')}
                    />
                    <NavItem
                        icon={<Clock size={20} />}
                        label="Schedule"
                        collapsed={!sidebarOpen}
                        onClick={() => handleNavigation('dashboard')}
                    />

                    <div className={`${sidebarOpen ? 'px-3' : 'px-0 text-center'} pt-6 mt-6 border-t border-white/10`}>
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                            {sidebarOpen ? 'AI & Tools' : ''}
                        </span>
                    </div>
                    <NavItem
                        icon={<Bot size={20} />}
                        label="AI Assistant"
                        collapsed={!sidebarOpen}
                        badge={<Sparkles size={12} className="text-[#13BCC5]" />}
                        onClick={() => handleNavigation('dashboard')}
                    />

                    <div className={`${sidebarOpen ? 'px-3' : 'px-0 text-center'} pt-6 mt-6 border-t border-white/10`}>
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                            {sidebarOpen ? 'System' : ''}
                        </span>
                    </div>
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Settings"
                        collapsed={!sidebarOpen}
                        active={currentPage === 'settings'}
                        onClick={() => handleNavigation('settings')}
                    />
                    <NavItem
                        icon={<HelpCircle size={20} />}
                        label="Help"
                        collapsed={!sidebarOpen}
                        active={currentPage === 'help'}
                        onClick={() => handleNavigation('help')}
                    />
                </nav>

                {/* User Info in Sidebar */}
                {sidebarOpen && user && (
                    <div className="px-4 py-3 mx-3 mb-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0">
                                {getInitials(user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{user.name}</p>
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-[#13BCC5]" />
                                    <span className="text-white/50 text-xs capitalize">{user.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Collapse Button - Desktop only */}
                <div className="hidden lg:block p-4 border-t border-white/10">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        {sidebarOpen && <span className="text-sm">Collapse</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Topbar */}
                <header className="h-14 lg:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm">
                    <div className="flex items-center gap-3 lg:gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:text-[#1b1e4c] hover:bg-slate-100 rounded-xl"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Back button when not on dashboard */}
                        {!isOnDashboard && (
                            <button
                                onClick={() => navigateTo('dashboard')}
                                className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-[#1b1e4c]"
                            >
                                <ArrowLeft size={18} />
                                <span className="text-sm">Back</span>
                            </button>
                        )}

                        {/* Search - Hidden on mobile when not on dashboard */}
                        <div className={`relative ${isOnDashboard ? 'flex' : 'hidden lg:flex'}`}>
                            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-40 sm:w-56 lg:w-80 bg-slate-50 border border-slate-200 rounded-full py-2 lg:py-2.5 pl-9 lg:pl-11 pr-3 lg:pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-6">
                        {/* Live Indicator - Hidden on small mobile */}
                        <div className="hidden sm:flex items-center gap-2 text-xs lg:text-sm text-slate-500">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="hidden md:inline">Live from Google Sheets</span>
                            <span className="md:hidden">Live</span>
                        </div>

                        {/* Notifications */}
                        <button className="relative p-2 text-slate-500 hover:text-[#13BCC5] hover:bg-slate-50 rounded-xl transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileDropdown(!profileDropdown)}
                                className="flex items-center gap-2 lg:gap-3 p-1.5 lg:pr-3 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center text-white font-semibold text-xs lg:text-sm">
                                    {user ? getInitials(user.name) : 'U'}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <p className="text-sm font-semibold text-slate-700">{user?.name || 'User'}</p>
                                    <p className="text-xs text-slate-400 capitalize">{user?.role || 'Guest'}</p>
                                </div>
                                <ChevronDown size={16} className={`hidden lg:block text-slate-400 transition-transform ${profileDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {profileDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setProfileDropdown(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <p className="font-semibold text-slate-700">{user?.name}</p>
                                            <p className="text-xs text-slate-400">{user?.email}</p>
                                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
                                                <Shield size={10} />
                                                {user?.role}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setProfileDropdown(false);
                                                navigateTo('profile');
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <User size={16} /> Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setProfileDropdown(false);
                                                navigateTo('settings');
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Settings size={16} /> Settings
                                        </button>
                                        <hr className="my-2 border-slate-100" />
                                        <button
                                            onClick={logout}
                                            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: React.ReactNode;
    collapsed?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, badge, collapsed = false, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${active
                ? 'bg-[#13BCC5] text-white shadow-lg shadow-[#13BCC5]/30'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
        title={collapsed ? label : undefined}
    >
        <div className="flex items-center gap-3">
            {icon}
            {!collapsed && <span>{label}</span>}
        </div>
        {!collapsed && badge && (
            <span className={`${typeof badge === 'number' ? 'px-2 py-0.5 text-xs font-bold rounded-full' : ''} ${active ? 'text-white' : ''}`}>
                {badge}
            </span>
        )}
    </button>
);

export default Layout;

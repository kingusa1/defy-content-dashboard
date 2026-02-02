import React, { useState } from 'react';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Bot,
  Settings,
  Shield,
  Zap,
  Info,
  Video,
  BookOpen,
  Lightbulb
} from 'lucide-react';

interface HelpPageProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const HelpPage: React.FC<HelpPageProps> = ({ onBack: _onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    {
      question: 'How do I connect my Google Sheets?',
      answer: 'Your dashboard is automatically connected to your Google Sheets. The service account email (defy-dashboard@defy-insurance-486209.iam.gserviceaccount.com) needs to be given Editor access to your spreadsheet. Go to your Google Sheet, click Share, and add this email with Editor permissions.',
      category: 'setup'
    },
    {
      question: 'How do I add new week metrics?',
      answer: 'Navigate to the "Week Metrics" tab in the dashboard. Click the "Add New Row" button to create a new entry. Admin users can edit all fields, while regular users can only update the "Defy Lead" field. Changes are automatically saved to Google Sheets.',
      category: 'metrics'
    },
    {
      question: 'What is the difference between Admin and User roles?',
      answer: 'Admin users have full access to all features including editing all fields in week metrics, managing settings, and accessing advanced analytics. Regular users have read access to most features but can only edit limited fields like "Defy Lead" in the metrics form.',
      category: 'permissions'
    },
    {
      question: 'How does the AI Assistant work?',
      answer: 'The AI Assistant uses advanced language models to analyze your content data. You can ask it questions about your performance, get content suggestions, analyze trends, and receive strategic recommendations. It has access to your dashboard data to provide contextual insights.',
      category: 'ai'
    },
    {
      question: 'How often does the data refresh?',
      answer: 'Data from Google Sheets is fetched when you first load the dashboard and can be manually refreshed using the Refresh button. The "Live from Google Sheets" indicator shows your connection status. For real-time updates, click the Refresh button.',
      category: 'data'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Click the Export button in the dashboard header. You can export all data, just articles, or just success stories. Data is exported in Excel format (.xlsx) for easy analysis and sharing.',
      category: 'data'
    },
    {
      question: 'How do I search for specific content?',
      answer: 'Use the search bar in the top navigation. Search works across articles, success stories, and other content. Results are filtered in real-time as you type. You can clear the search by clicking the X button.',
      category: 'navigation'
    },
    {
      question: 'What do the different status colors mean?',
      answer: 'Green indicates completed/published items, blue indicates scheduled/pending items, amber/yellow indicates items needing attention, and red indicates errors or failures. These colors are consistent throughout the dashboard.',
      category: 'navigation'
    },
    {
      question: 'How do I change my notification preferences?',
      answer: 'Go to Settings (gear icon in sidebar) and navigate to the Notifications section. You can enable/disable email notifications, push notifications, and customize what types of alerts you receive.',
      category: 'settings'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. We use industry-standard security practices. Data is transmitted over HTTPS, authentication is handled securely, and your Google Sheets credentials are stored safely. Only authorized users can access the dashboard.',
      category: 'security'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: <BookOpen size={16} /> },
    { id: 'setup', label: 'Setup & Config', icon: <Settings size={16} /> },
    { id: 'metrics', label: 'Week Metrics', icon: <TrendingUp size={16} /> },
    { id: 'data', label: 'Data & Export', icon: <FileText size={16} /> },
    { id: 'navigation', label: 'Navigation', icon: <Search size={16} /> },
    { id: 'ai', label: 'AI Assistant', icon: <Bot size={16} /> },
    { id: 'permissions', label: 'Permissions', icon: <Shield size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', description: 'Learn the basics of using the dashboard', icon: <Book size={20} />, color: 'bg-blue-500' },
    { title: 'Video Tutorials', description: 'Watch step-by-step video guides', icon: <Video size={20} />, color: 'bg-purple-500' },
    { title: 'API Documentation', description: 'Technical docs for developers', icon: <FileText size={20} />, color: 'bg-emerald-500' },
    { title: 'Best Practices', description: 'Tips for maximizing productivity', icon: <Lightbulb size={20} />, color: 'bg-amber-500' }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1e4c]">Help Center</h1>
          <p className="text-slate-500 mt-1">Find answers, tutorials, and support resources</p>
        </div>
        <div className="flex gap-3">
          <a
            href="mailto:support@defyinsurance.com"
            className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors"
          >
            <Mail size={18} />
            Contact Support
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative text-center">
          <h2 className="text-2xl font-bold text-white mb-2">How can we help you?</h2>
          <p className="text-white/60 mb-6">Search our knowledge base or browse categories below</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-xl py-3 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#13BCC5] shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, idx) => (
          <button
            key={idx}
            className="bg-white rounded-xl border border-slate-100 p-4 text-left hover:shadow-lg hover:border-[#13BCC5]/30 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
              {link.icon}
            </div>
            <h3 className="font-semibold text-[#1b1e4c] mb-1">{link.title}</h3>
            <p className="text-sm text-slate-500">{link.description}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sticky top-4">
            <h3 className="font-bold text-[#1b1e4c] mb-4">Categories</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#13BCC5] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-[#1b1e4c] flex items-center gap-2">
                <HelpCircle size={20} />
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'} found
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredFAQs.map((faq, idx) => (
                <div key={idx} className="group">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-[#1b1e4c] pr-4">{faq.question}</span>
                    {expandedFAQ === idx ? (
                      <ChevronDown size={20} className="text-[#13BCC5] flex-shrink-0" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-6 pb-4 text-slate-600 text-sm leading-relaxed bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}

              {filteredFAQs.length === 0 && (
                <div className="p-8 text-center">
                  <Info size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No results found for your search.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                    className="mt-2 text-[#13BCC5] text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Guide */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-[#1b1e4c] mb-6 flex items-center gap-2">
          <Zap size={20} />
          Dashboard Features Guide
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<FileText size={24} />}
            title="News Articles"
            description="View and manage insurance news articles. Copy LinkedIn and Twitter posts with one click. Filter by date and status."
            color="blue"
          />
          <FeatureCard
            icon={<Users size={24} />}
            title="Success Stories"
            description="Track customer success stories. View completion status, copy social media captions, and monitor progress."
            color="purple"
          />
          <FeatureCard
            icon={<Calendar size={24} />}
            title="Content Schedule"
            description="View your posting schedule across all platforms. See which agents post when throughout the week."
            color="emerald"
          />
          <FeatureCard
            icon={<TrendingUp size={24} />}
            title="Week Metrics"
            description="Track campaign performance with detailed metrics. Add new rows, update data, and analyze trends."
            color="amber"
          />
          <FeatureCard
            icon={<Bot size={24} />}
            title="AI Assistant"
            description="Get intelligent insights about your content. Ask questions, get recommendations, and analyze data with AI."
            color="cyan"
          />
          <FeatureCard
            icon={<Shield size={24} />}
            title="Role-Based Access"
            description="Secure access control. Admins have full access, while users have appropriate permissions for their role."
            color="rose"
          />
        </div>
      </div>

      {/* Contact Support */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] rounded-2xl p-6 text-white">
          <MessageCircle size={32} className="mb-4" />
          <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
          <p className="text-white/80 mb-4">
            Can't find what you're looking for? Our support team is here to help you with any questions.
          </p>
          <div className="space-y-2">
            <a href="mailto:support@defyinsurance.com" className="flex items-center gap-2 text-white/90 hover:text-white">
              <Mail size={16} />
              support@defyinsurance.com
            </a>
            <a href="tel:+15551234567" className="flex items-center gap-2 text-white/90 hover:text-white">
              <Phone size={16} />
              +1 (555) 123-4567
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <Book size={32} className="mb-4 text-[#1b1e4c]" />
          <h3 className="text-xl font-bold text-[#1b1e4c] mb-2">Documentation</h3>
          <p className="text-slate-600 mb-4">
            Access our full documentation for detailed guides, API references, and advanced tutorials.
          </p>
          <button className="flex items-center gap-2 text-[#13BCC5] font-medium hover:underline">
            View Documentation
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
          <Zap size={18} />
          Keyboard Shortcuts
        </h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <ShortcutItem keys={['Ctrl', 'K']} description="Open search" />
          <ShortcutItem keys={['Ctrl', 'R']} description="Refresh data" />
          <ShortcutItem keys={['Ctrl', 'E']} description="Export data" />
          <ShortcutItem keys={['Ctrl', '1-7']} description="Switch tabs" />
          <ShortcutItem keys={['Esc']} description="Close modals" />
          <ShortcutItem keys={['?']} description="Show help" />
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    rose: 'bg-rose-100 text-rose-600'
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h4 className="font-semibold text-[#1b1e4c] mb-1">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
};

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
    <span className="text-sm text-slate-600">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, idx) => (
        <React.Fragment key={key}>
          <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600 shadow-sm">
            {key}
          </kbd>
          {idx < keys.length - 1 && <span className="text-slate-400 text-xs">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default HelpPage;

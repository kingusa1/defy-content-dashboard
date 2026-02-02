import React from 'react';
import Layout from './components/Layout';
import ContentDashboard from './components/ContentDashboard';
import { useContentData } from './hooks/useContentData';
import { AlertTriangle, Loader2, Info } from 'lucide-react';

const App: React.FC = () => {
  const { data, loading, error, refresh } = useContentData();

  // Initial loading state
  if (loading && data.articles.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="text-center">
          <div className="relative">
            <img src="/defy_logo.png" alt="Defy Insurance" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
            <Loader2 className="w-20 h-20 absolute -inset-2 mx-auto text-[#13BCC5] animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-[#1b1e4c] mt-4">Loading Dashboard</h2>
          <p className="text-slate-500 mt-1">Fetching content from Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Connection Issue</p>
            <p className="text-sm text-amber-600 mt-1">{error}</p>
            <p className="text-sm text-amber-600">Data may be outdated. Click refresh to try again.</p>
          </div>
        </div>
      )}

      {/* Info Banner for Empty Data */}
      {!error && data.articles.length === 0 && data.successStories.length === 0 && (
        <div className="mb-6 p-4 bg-[#13BCC5]/10 border border-[#13BCC5]/20 rounded-xl flex items-start gap-3">
          <Info className="text-[#13BCC5] w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[#1b1e4c]">Connecting to Google Sheets</p>
            <p className="text-sm text-slate-600 mt-1">
              Make sure your Google Sheet is shared with the service account email.
            </p>
            <p className="text-sm text-slate-600">
              Email: <code className="bg-slate-100 px-1 rounded text-xs">defy-dashboard@defy-insurance-486209.iam.gserviceaccount.com</code>
            </p>
          </div>
        </div>
      )}

      <ContentDashboard data={data} onRefresh={refresh} loading={loading} />
    </Layout>
  );
};

export default App;

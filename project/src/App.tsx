import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MyFiles } from './components/MyFiles';
import { Settings } from './components/Settings';
import { Starred } from './components/Starred';
import { SharedFiles } from './components/SharedFiles';
import { Archived } from './components/Archived';
import { Trash } from './components/Trash';
import { Correspondences } from './components/Correspondences';
import { TaskContext } from './components/TaskContext';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { RetentionDashboard } from './components/RetentionDashboard';
import { ActivityAuditLog } from './components/ActivityAuditLog';
import BatchScan from './components/BatchScan';
import { ManageDocumentPermissions } from './components/ManageDocumentPermissions';

type View = 'dashboard' | 'files' | 'settings' | 'starred' | 'shared' | 'archived' | 'trash' | 'correspondences' | 'retention' | 'audit-log' | 'batch-scan';

function AppLayout() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const getViewFromPath = (pathname: string): View => {
    if (pathname.startsWith('/files')) return 'files';
    if (pathname.startsWith('/starred')) return 'starred';
    if (pathname.startsWith('/shared')) return 'shared';
    if (pathname.startsWith('/archived')) return 'archived';
    if (pathname.startsWith('/trash')) return 'trash';
    if (pathname.startsWith('/correspondences') || pathname.startsWith('/tasks/correspondences')) return 'correspondences';
    if (pathname.startsWith('/retention')) return 'retention';
    if (pathname.startsWith('/activity-audit-log')) return 'audit-log';
    if (pathname.startsWith('/batch-scan')) return 'batch-scan';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const handleViewChange = (view: View) => {
    const routes: Record<View, string> = {
      dashboard: '/',
      files: '/files',
      starred: '/starred',
      shared: '/shared',
      archived: '/archived',
      trash: '/trash',
      correspondences: '/correspondences',
      retention: '/retention',
      'audit-log': '/activity-audit-log',
      'batch-scan': '/batch-scan',
      settings: '/settings',
    };
    navigate(routes[view]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={getViewFromPath(location.pathname)}
        onViewChange={handleViewChange}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/files" element={<MyFiles />} />
        <Route path="/files/:fileId/permissions" element={<ManageDocumentPermissions />} />
        <Route path="/starred" element={<Starred />} />
        <Route path="/shared" element={<SharedFiles />} />
        <Route path="/archived" element={<Archived />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/correspondences" element={<Correspondences />} />
        <Route path="/tasks/correspondences/:taskId/*" element={<TaskContext />} />
        <Route path="/retention" element={<RetentionDashboard />} />
        <Route path="/activity-audit-log" element={<ActivityAuditLog />} />
        <Route path="/batch-scan" element={<BatchScan />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;

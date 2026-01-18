import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Archive,
  Trash2,
  FolderSymlink,
  RefreshCw,
  Clock,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface WidgetData {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  type: 'chart' | 'counter';
  value?: string | number;
  chartData?: { label: string; value: number; color: string }[];
  note?: string;
  chips?: string[];
  route: string;
}

export function RetentionDashboard() {
  const { user, currentDepartment } = useApp();
  const navigate = useNavigate();
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);

  // Mock permission check - in production, this would come from user.can_access_archived_docs
  const hasAccess = user?.role === 'admin' || true; // For demo, allow access

  const lastUpdated = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Mock data for widgets
  const widgets: WidgetData[] = [
    {
      id: 'active-docs',
      title: 'Active Documents',
      description: 'Document activity status',
      icon: BarChart3,
      type: 'chart',
      chartData: [
        { label: 'Active', value: 1250, color: 'bg-emerald-500' },
        { label: 'Inactive', value: 340, color: 'bg-gray-300' },
      ],
      route: '/search?filter=active_inactive',
    },
    {
      id: 'archived-docs',
      title: 'Archived Documents',
      description: 'Archival compliance tracking',
      icon: Archive,
      type: 'chart',
      chartData: [
        { label: 'Archived', value: 892, color: 'bg-emerald-500' },
        { label: 'Not Archived', value: 698, color: 'bg-amber-400' },
      ],
      route: '/search?filter=archived',
    },
    {
      id: 'disposed-docs',
      title: 'Disposed Documents',
      description: 'Physical disposal tracking',
      icon: Trash2,
      type: 'chart',
      chartData: [
        { label: 'Disposed', value: 156, color: 'bg-emerald-500' },
        { label: 'Eligible', value: 89, color: 'bg-blue-400' },
      ],
      note: 'Eligible = archived & not disposed',
      route: '/search?filter=disposed_or_eligible',
    },
    {
      id: 'relocated-docs',
      title: 'Relocated Documents',
      description: 'Document relocation status',
      icon: FolderSymlink,
      type: 'chart',
      chartData: [
        { label: 'Relocated', value: 234, color: 'bg-emerald-500' },
        { label: 'Eligible', value: 67, color: 'bg-blue-400' },
      ],
      note: 'Eligible = permanent flag true & not disposed',
      route: '/search?filter=relocated_or_eligible',
    },
    {
      id: 'disposal-events',
      title: 'Disposal Events',
      description: 'Approved disposal workflows',
      icon: Clock,
      type: 'counter',
      value: 42,
      chips: ['Date', 'Creator', 'Assignee'],
      route: '/workflows/disposal?status=approved',
    },
    {
      id: 'relocation-events',
      title: 'Relocation Events',
      description: 'Approved relocation workflows',
      icon: TrendingUp,
      type: 'counter',
      value: 28,
      chips: ['Date', 'Creator', 'Assignee'],
      route: '/workflows/relocation?status=approved',
    },
    {
      id: 'legal-holds',
      title: 'Legal Holds',
      description: 'Documents under legal hold',
      icon: ShieldAlert,
      type: 'counter',
      value: 15,
      note: 'Hold prevents deletion; access remains same',
      route: '/search?filter=legal_hold',
    },
  ];

  const handleWidgetClick = (route: string) => {
    // Navigate to mock route (in production, these would be real routes)
    console.log('Navigating to:', route);
    // navigate(route);
  };

  const handleRefresh = () => {
    console.log('Refreshing dashboard data...');
    // In production, this would reload data from the backend
  };

  if (!hasAccess) {
    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Retention & Archiving Dashboards</h1>
            <p className="text-gray-600">Compliance KPIs for retention, archiving, disposal, relocation, and legal holds</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-1">Access Restricted</h3>
              <p className="text-amber-700">
                You don't have access to retention dashboards. Please contact your administrator if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Retention & Archiving Dashboards</h1>
              <p className="text-gray-600">
                Compliance KPIs for retention, archiving, disposal, relocation, and legal holds
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border-2 border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {widgets.map((widget) => {
            const Icon = widget.icon;
            const isHovered = hoveredWidget === widget.id;

            return (
              <div
                key={widget.id}
                onClick={() => handleWidgetClick(widget.route)}
                onMouseEnter={() => setHoveredWidget(widget.id)}
                onMouseLeave={() => setHoveredWidget(null)}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all transform hover:scale-102 ${
                  isHovered ? 'border-emerald-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                {/* Widget Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    isHovered ? 'bg-emerald-500' : 'bg-emerald-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${isHovered ? 'text-white' : 'text-emerald-600'}`} />
                  </div>
                </div>

                {/* Widget Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{widget.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{widget.description}</p>

                {/* Widget Content */}
                {widget.type === 'chart' && widget.chartData && (
                  <div className="space-y-3">
                    {widget.chartData.map((data, index) => {
                      const total = widget.chartData!.reduce((sum, d) => sum + d.value, 0);
                      const percentage = Math.round((data.value / total) * 100);

                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{data.label}</span>
                            <span className="text-sm font-bold text-gray-900">{data.value}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${data.color} h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {widget.type === 'counter' && (
                  <div>
                    <div className="text-4xl font-bold text-emerald-600 mb-3">{widget.value}</div>
                    {widget.chips && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {widget.chips.map((chip, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Note */}
                {widget.note && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">{widget.note}</p>
                  </div>
                )}

                {/* Hover Hint */}
                {isHovered && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <span>View details</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 mb-1">Dashboard Information</h4>
              <p className="text-sm text-emerald-700">
                This dashboard displays compliance metrics for document retention, archiving, disposal, relocation, and legal holds.
                Click on any widget to view detailed information and filter documents. All data is updated in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

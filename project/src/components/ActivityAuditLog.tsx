import { useState } from 'react';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Download,
  AlertCircle,
  FileText,
  User as UserIcon,
  Building2,
  Calendar,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type ActivityTab = 'documents' | 'users';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorId: string;
  actionType: string;
  targetType: 'document' | 'user' | 'site';
  targetName: string;
  targetId: string;
  classification: 'public' | 'confidential' | 'secret' | 'top_secret';
  result?: 'success' | 'failure';
  machineIp?: string;
  documentType?: string;
  version?: string;
  department?: string;
  metadata?: Record<string, any>;
}

export function ActivityAuditLog() {
  const { user, currentDepartment } = useApp();
  const [activeTab, setActiveTab] = useState<ActivityTab>('documents');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    user: 'Any',
    activityType: [] as string[],
    classification: 'Any',
    targetType: 'Any',
    result: 'Any',
    machineIp: '',
    searchKeyword: '',
  });

  const hasAccess = user?.role === 'admin' || true;
  const canReadConfidential = user?.role === 'admin' || true;
  const canReadSecret = user?.role === 'admin' || true;
  const canReadTopSecret = user?.role === 'admin' || false;

  const mockDocumentLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      actor: 'John Doe',
      actorId: 'user-001',
      actionType: 'Document Uploaded',
      targetType: 'document',
      targetName: 'Q4_Financial_Report.pdf',
      targetId: 'doc-001',
      classification: 'confidential',
      documentType: 'PDF',
      version: '1.0',
      department: currentDepartment?.name || 'Finance',
      metadata: { size: '2.4 MB', pages: 45 },
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: 'Jane Smith',
      actorId: 'user-002',
      actionType: 'Document Downloaded',
      targetType: 'document',
      targetName: 'Employee_Handbook_2024.docx',
      targetId: 'doc-002',
      classification: 'public',
      documentType: 'DOCX',
      version: '3.2',
      department: 'HR',
      metadata: { size: '1.8 MB' },
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      actor: 'Mike Johnson',
      actorId: 'user-003',
      actionType: 'Document Edited',
      targetType: 'document',
      targetName: 'Project_Proposal_Alpha.xlsx',
      targetId: 'doc-003',
      classification: 'secret',
      documentType: 'XLSX',
      version: '2.1',
      department: 'Operations',
      metadata: { changesCount: 12 },
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      actor: 'Sarah Williams',
      actorId: 'user-004',
      actionType: 'Document Shared',
      targetType: 'document',
      targetName: 'Marketing_Strategy_2024.pptx',
      targetId: 'doc-004',
      classification: 'confidential',
      documentType: 'PPTX',
      version: '1.5',
      department: 'Marketing',
      metadata: { sharedWith: ['user-005', 'user-006'] },
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      actor: 'David Brown',
      actorId: 'user-005',
      actionType: 'Document Deleted',
      targetType: 'document',
      targetName: 'Old_Contract_Template.pdf',
      targetId: 'doc-005',
      classification: 'public',
      documentType: 'PDF',
      version: '0.9',
      department: 'Legal',
      metadata: { reason: 'Outdated' },
    },
  ];

  const mockUserLogs: AuditLog[] = [
    {
      id: '6',
      timestamp: new Date().toISOString(),
      actor: 'Emily Davis',
      actorId: 'user-006',
      actionType: 'Login',
      targetType: 'user',
      targetName: 'Emily Davis',
      targetId: 'user-006',
      classification: 'public',
      result: 'success',
      machineIp: '192.168.1.101',
      metadata: { browser: 'Chrome', os: 'Windows 10' },
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      actor: 'Robert Taylor',
      actorId: 'user-007',
      actionType: 'Login',
      targetType: 'user',
      targetName: 'Robert Taylor',
      targetId: 'user-007',
      classification: 'public',
      result: 'failure',
      machineIp: '192.168.1.102',
      metadata: { reason: 'Invalid password', attempts: 3 },
    },
    {
      id: '8',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: 'Admin User',
      actorId: 'user-admin',
      actionType: 'User Created',
      targetType: 'user',
      targetName: 'New Employee',
      targetId: 'user-008',
      classification: 'confidential',
      metadata: { role: 'user', department: 'Sales' },
    },
    {
      id: '9',
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      actor: 'Jessica Martinez',
      actorId: 'user-009',
      actionType: 'Password Changed',
      targetType: 'user',
      targetName: 'Jessica Martinez',
      targetId: 'user-009',
      classification: 'confidential',
      machineIp: '192.168.1.103',
      metadata: { method: 'Self-service' },
    },
    {
      id: '10',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      actor: 'Admin User',
      actorId: 'user-admin',
      actionType: 'Permissions Updated',
      targetType: 'user',
      targetName: 'Michael Lee',
      targetId: 'user-010',
      classification: 'secret',
      metadata: { changes: ['can_access_logs: true'] },
    },
  ];

  const currentLogs = activeTab === 'documents' ? mockDocumentLogs : mockUserLogs;

  const filteredLogs = currentLogs.filter((log) => {
    if (!canReadConfidential && log.classification === 'confidential') return false;
    if (!canReadSecret && log.classification === 'secret') return false;
    if (!canReadTopSecret && log.classification === 'top_secret') return false;

    const matchesSearch =
      !filters.searchKeyword ||
      log.targetName.toLowerCase().includes(filters.searchKeyword.toLowerCase()) ||
      log.actor.toLowerCase().includes(filters.searchKeyword.toLowerCase()) ||
      log.actionType.toLowerCase().includes(filters.searchKeyword.toLowerCase());

    const matchesUser = filters.user === 'Any' || log.actor === filters.user;
    const matchesClassification =
      filters.classification === 'Any' || log.classification === filters.classification.toLowerCase();
    const matchesTargetType = filters.targetType === 'Any' || log.targetType === filters.targetType.toLowerCase();
    const matchesResult = filters.result === 'Any' || log.result === filters.result.toLowerCase();
    const matchesIp = !filters.machineIp || log.machineIp?.includes(filters.machineIp);

    return matchesSearch && matchesUser && matchesClassification && matchesTargetType && matchesResult && matchesIp;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'public':
        return 'bg-blue-100 text-blue-700';
      case 'confidential':
        return 'bg-orange-100 text-orange-700';
      case 'secret':
        return 'bg-red-100 text-red-700';
      case 'top_secret':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getResultIcon = (result?: string) => {
    if (result === 'success') return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (result === 'failure') return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      user: 'Any',
      activityType: [],
      classification: 'Any',
      targetType: 'Any',
      result: 'Any',
      machineIp: '',
      searchKeyword: '',
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting audit logs as ${format.toUpperCase()}...`);
    setShowExportModal(false);
  };

  if (!hasAccess) {
    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Audit Log</h1>
            <p className="text-gray-600">Comprehensive audit trail for compliance and security</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Access Denied</h3>
              <p className="text-red-700">
                You don't have permission to access the activity audit log. Please contact your administrator if you
                need access to this feature.
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
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Audit Log</h1>
              <p className="text-gray-600">Comprehensive audit trail for compliance and security</p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800">
            <strong>Security Notice:</strong> Sensitive records are only visible to authorized users. Classification
            filters are applied based on your permissions.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'documents'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Activities
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'users'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  User Activities
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-4 items-center mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by actor, action, or target..."
                  value={filters.searchKeyword}
                  onChange={(e) => setFilters({ ...filters, searchKeyword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  showFilters
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-gray-200 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Date From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Date To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">User</label>
                    <select
                      value={filters.user}
                      onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                      <option>Mike Johnson</option>
                      <option>Sarah Williams</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Classification</label>
                    <select
                      value={filters.classification}
                      onChange={(e) => setFilters({ ...filters, classification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Public</option>
                      <option>Confidential</option>
                      <option>Secret</option>
                      <option>Top Secret</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Target Type</label>
                    <select
                      value={filters.targetType}
                      onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Document</option>
                      <option>User</option>
                      <option>Site</option>
                    </select>
                  </div>

                  {activeTab === 'users' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Result</label>
                        <select
                          value={filters.result}
                          onChange={(e) => setFilters({ ...filters, result: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option>Any</option>
                          <option>Success</option>
                          <option>Failure</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Machine IP</label>
                        <input
                          type="text"
                          placeholder="e.g. 192.168.1.1"
                          value={filters.machineIp}
                          onChange={(e) => setFilters({ ...filters, machineIp: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Classification
                    </th>
                    {activeTab === 'users' && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        IP
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'users' ? 7 : 6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FileCheck className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-500 font-medium">No logs found</p>
                          <p className="text-sm text-gray-400">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsModal(true);
                        }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.actor}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{log.actionType}</span>
                            {log.result && getResultIcon(log.result)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{log.targetName}</div>
                          <div className="text-xs text-gray-500 capitalize">{log.targetType}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase ${getClassificationBadge(
                              log.classification
                            )}`}
                          >
                            {log.classification.replace('_', ' ')}
                          </span>
                        </td>
                        {activeTab === 'users' && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 font-mono">{log.machineIp || '-'}</span>
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredLogs.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Log Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Timestamp</label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatTimestamp(selectedLog.timestamp)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Actor</label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    {selectedLog.actor}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Action Type</label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <FileText className="w-4 h-4 text-gray-400" />
                    {selectedLog.actionType}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Target Type</label>
                  <div className="text-sm text-gray-900 capitalize">{selectedLog.targetType}</div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Target Name</label>
                  <div className="text-sm text-gray-900">{selectedLog.targetName}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Classification</label>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium uppercase ${getClassificationBadge(
                      selectedLog.classification
                    )}`}
                  >
                    {selectedLog.classification.replace('_', ' ')}
                  </span>
                </div>

                {selectedLog.result && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Result</label>
                    <div className="flex items-center gap-2">
                      {getResultIcon(selectedLog.result)}
                      <span className="text-sm text-gray-900 capitalize">{selectedLog.result}</span>
                    </div>
                  </div>
                )}

                {selectedLog.machineIp && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Machine IP</label>
                    <div className="text-sm text-gray-900 font-mono">{selectedLog.machineIp}</div>
                  </div>
                )}

                {selectedLog.department && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Department</label>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {selectedLog.department}
                    </div>
                  </div>
                )}

                {selectedLog.documentType && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Document Type</label>
                    <div className="text-sm text-gray-900">{selectedLog.documentType}</div>
                  </div>
                )}

                {selectedLog.version && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Version</label>
                    <div className="text-sm text-gray-900">{selectedLog.version}</div>
                  </div>
                )}
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Additional Metadata
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedLog.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="text-sm text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Export Audit Logs</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Export audit logs with current filters applied. Select your preferred format:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">CSV Format</div>
                      <div className="text-xs text-gray-500">Spreadsheet compatible</div>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">PDF Format</div>
                      <div className="text-xs text-gray-500">Printable document</div>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The export will include {filteredLogs.length} log entries based on your current
                  filter settings.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

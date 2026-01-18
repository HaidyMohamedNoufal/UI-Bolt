import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  AlertCircle,
  User,
  Users,
  FileText,
  Plus,
  Plane,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { VacationRequestModal } from './VacationRequestModal';
import { VacationRequestsList } from './VacationRequestsList';

type TabScope = 'assigned' | 'started' | 'department' | 'vacation-requests';

interface ExtendedTask extends Task {
  workflow_type?: string;
  started_at?: string;
  created_by_name?: string;
  assigned_to_name?: string;
  confidentiality_level?: string;
}

interface Filters {
  status: string;
  priority: string;
  workflowType: string;
  dueDateFrom: string;
  dueDateTo: string;
  startDateFrom: string;
  startDateTo: string;
  department: string;
}

const CLEARANCE_HIERARCHY: { [key: string]: number } = {
  unclassified: 0,
  internal: 1,
  confidential: 2,
  secret: 3,
  top_secret: 4,
};

export function Correspondences() {
  const { user, currentDepartment } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabScope>('assigned');
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationViewMode, setVacationViewMode] = useState<'my-requests' | 'department-requests'>('my-requests');

  const [filters, setFilters] = useState<Filters>({
    status: 'Any',
    priority: 'Any',
    workflowType: 'Any',
    dueDateFrom: '',
    dueDateTo: '',
    startDateFrom: '',
    startDateTo: '',
    department: 'Any',
  });

  const canManageDepartment =
    user?.site_department_manager === true || user?.can_manage_dept_tasks === true;

  const userClearanceLevel = CLEARANCE_HIERARCHY[user?.security_clearance || 'internal'] || 1;

  useEffect(() => {
    loadTasks();
  }, [activeTab, currentDepartment, user, sortColumn, sortDirection, currentPage, pageSize, filters]);

  const loadTasks = async () => {
    if (!currentDepartment || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let query = supabase
      .from('tasks')
      .select('*, created_by_user:users!tasks_created_by_fkey(full_name), assigned_to_user:users!tasks_assigned_to_fkey(full_name)', { count: 'exact' })
      .eq('department_id', currentDepartment.id);

    if (activeTab === 'assigned') {
      query = query.eq('assigned_to', user.id);
    } else if (activeTab === 'started') {
      query = query.eq('created_by', user.id);
    }

    if (filters.status !== 'Any') {
      query = query.eq('status', filters.status.toLowerCase().replace(' ', '_'));
    }
    if (filters.priority !== 'Any') {
      query = query.eq('priority', filters.priority.toLowerCase());
    }
    if (filters.workflowType !== 'Any') {
      query = query.eq('workflow_type', filters.workflowType.toLowerCase().replace(' ', '_'));
    }
    if (filters.dueDateFrom) {
      query = query.gte('due_date', filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      query = query.lte('due_date', filters.dueDateTo);
    }
    if (filters.startDateFrom) {
      query = query.gte('started_at', filters.startDateFrom);
    }
    if (filters.startDateTo) {
      query = query.lte('started_at', filters.startDateTo);
    }

    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (!error && data) {
      const tasksWithNames = data.map((task: any) => ({
        ...task,
        created_by_name: task.created_by_user?.full_name || 'System',
        assigned_to_name: task.assigned_to_user?.full_name || null,
      }));

      const securityFilteredTasks = tasksWithNames.filter((task) => {
        const taskClearanceLevel =
          CLEARANCE_HIERARCHY[task.confidentiality_level || 'internal'] || 1;
        return taskClearanceLevel <= userClearanceLevel;
      });

      setTasks(securityFilteredTasks);
      setTotalCount(securityFilteredTasks.length);
    }
    setIsLoading(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'Any',
      priority: 'Any',
      workflowType: 'Any',
      dueDateFrom: '',
      dueDateTo: '',
      startDateFrom: '',
      startDateTo: '',
      department: 'Any',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700',
      pending_review: 'bg-amber-100 text-amber-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-gray-100 text-gray-600',
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleRowClick = (taskId: string) => {
    navigate(`/tasks/correspondences/${taskId}/edit`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getTabTitle = () => {
    if (activeTab === 'assigned') return 'Assigned to Me';
    if (activeTab === 'started') return 'Started by Me';
    if (activeTab === 'vacation-requests') {
      return vacationViewMode === 'my-requests' ? 'My Vacation Requests' : 'Department Vacation Requests';
    }
    return 'Department Tasks';
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Inbox className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Correspondences</h1>
              <p className="text-gray-500 text-sm">
                {totalCount} {totalCount === 1 ? 'task' : 'tasks'} in {getTabTitle()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('assigned');
                  setCurrentPage(1);
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'assigned'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned to Me
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('started');
                  setCurrentPage(1);
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'started'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Started by Me
                </div>
              </button>
              {canManageDepartment && (
                <button
                  onClick={() => {
                    setActiveTab('department');
                    setCurrentPage(1);
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'department'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    Department Tasks
                  </div>
                </button>
              )}
              <button
                onClick={() => {
                  setActiveTab('vacation-requests');
                  setCurrentPage(1);
                  setVacationViewMode('my-requests');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'vacation-requests'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Plane className="w-4 h-4" />
                  Vacation Requests
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'vacation-requests' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVacationViewMode('my-requests')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        vacationViewMode === 'my-requests'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      My Requests
                    </button>
                    {canManageDepartment && (
                      <button
                        onClick={() => setVacationViewMode('department-requests')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          vacationViewMode === 'department-requests'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Department Requests
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowVacationModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
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

                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages || 1} ({totalCount} total)
                </div>
              </div>
            )}

            {showFilters && activeTab !== 'vacation-requests' && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Workflow Type</label>
                    <select
                      value={filters.workflowType}
                      onChange={(e) => setFilters({ ...filters, workflowType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Document Approval</option>
                      <option>Purchase Request</option>
                      <option>Leave Request</option>
                      <option>Contract Review</option>
                      <option>General</option>
                    </select>
                  </div>

                  {activeTab === 'department' && canManageDepartment && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Department</label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option>Any</option>
                        <option>Engineering</option>
                        <option>HR</option>
                        <option>Finance</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date From</label>
                    <input
                      type="date"
                      value={filters.dueDateFrom}
                      onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date To</label>
                    <input
                      type="date"
                      value={filters.dueDateTo}
                      onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date From</label>
                    <input
                      type="date"
                      value={filters.startDateFrom}
                      onChange={(e) => setFilters({ ...filters, startDateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date To</label>
                    <input
                      type="date"
                      value={filters.startDateTo}
                      onChange={(e) => setFilters({ ...filters, startDateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
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
          </div>
        </div>

        {activeTab === 'vacation-requests' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <VacationRequestsList viewMode={vacationViewMode} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {activeTab === 'assigned' && 'You have no assigned tasks'}
                {activeTab === 'started' && 'You have not started any workflows'}
                {activeTab === 'department' && 'No department tasks available'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        onClick={() => handleSort('title')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Message / Title
                          {sortColumn === 'title' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('due_date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Due Date
                          {sortColumn === 'due_date' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('started_at')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Started Date
                          {sortColumn === 'started_at' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workflow Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => handleRowClick(task.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.due_date ? (
                            <div
                              className={`flex items-center gap-2 text-sm ${
                                isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-600'
                              }`}
                            >
                              {isOverdue(task.due_date) && <AlertCircle className="w-4 h-4" />}
                              <Calendar className="w-4 h-4" />
                              {formatDate(task.due_date)}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {formatDateTime(task.started_at || task.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 capitalize">
                            {task.workflow_type?.replace('_', ' ') || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {task.created_by_name || 'System'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {task.assigned_to_name || 'Unassigned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Items per page</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        )}

        <VacationRequestModal
          isOpen={showVacationModal}
          onClose={() => setShowVacationModal(false)}
          onSuccess={() => {
            setShowVacationModal(false);
            if (activeTab === 'vacation-requests') {
              window.location.reload();
            }
          }}
        />
      </div>
    </div>
  );
}

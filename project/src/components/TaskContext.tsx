import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  User,
  FileText,
  GitBranch,
  Network,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { taskService, TaskDetails } from '../services/taskService';
import { TaskEdit } from './TaskEdit';
import { TaskDetailsTab } from './TaskDetailsTab';
import { TaskWorkflowTab } from './TaskWorkflowTab';
import { TaskDiagramTab } from './TaskDiagramTab';

type TabType = 'edit' | 'details' | 'workflow' | 'diagram';

export function TaskContext() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('edit');

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/details')) setActiveTab('details');
    else if (path.includes('/workflow')) setActiveTab('workflow');
    else if (path.includes('/diagram')) setActiveTab('diagram');
    else setActiveTab('edit');
  }, [location.pathname]);

  const loadTask = async () => {
    if (!taskId) return;
    setIsLoading(true);
    const data = await taskService.getTaskById(taskId);
    setTask(data);
    setIsLoading(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/tasks/correspondences/${taskId}/${tab}`);
  };

  const handleBack = () => {
    navigate('/correspondences');
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

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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

  if (!task) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
          <p className="text-gray-500 mb-4">The task you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Correspondences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span>/</span>
            <span>Tasks</span>
            <span>/</span>
            <span>Correspondences</span>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {task.title}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                {task.description && (
                  <p className="text-gray-600 text-sm">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadge(
                    task.status
                  )}`}
                >
                  {task.status.replace('_', ' ')}
                </span>
                <span
                  className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPriorityBadge(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500 mb-1">Due Date</div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {formatDate(task.due_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Workflow Type</div>
                <div className="flex items-center gap-1 text-sm text-gray-900 capitalize">
                  <FileText className="w-4 h-4" />
                  {task.workflow_type?.replace('_', ' ') || 'General'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Created By</div>
                <div className="flex items-center gap-1 text-sm text-gray-900">
                  <User className="w-4 h-4" />
                  {task.created_by_user?.full_name || 'System'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                <div className="flex items-center gap-1 text-sm text-gray-900">
                  <User className="w-4 h-4" />
                  {task.assigned_to_user?.full_name || 'Unassigned'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleTabChange('edit')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'edit'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Edit / Act
                </div>
              </button>
              <button
                onClick={() => handleTabChange('details')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Task Details
                </div>
              </button>
              <button
                onClick={() => handleTabChange('workflow')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'workflow'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Workflow Details
                </div>
              </button>
              <button
                onClick={() => handleTabChange('diagram')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'diagram'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Network className="w-4 h-4" />
                  Process Diagram
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'edit' && <TaskEdit task={task} onUpdate={loadTask} />}
            {activeTab === 'details' && <TaskDetailsTab task={task} />}
            {activeTab === 'workflow' && <TaskWorkflowTab task={task} />}
            {activeTab === 'diagram' && <TaskDiagramTab task={task} />}
          </div>
        </div>
      </div>
    </div>
  );
}

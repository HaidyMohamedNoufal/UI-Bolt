import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  CheckSquare,
  Upload,
  Paperclip,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { taskService, TaskDetails, TaskPermissions } from '../services/taskService';

interface TaskEditProps {
  task: TaskDetails;
  onUpdate: () => void;
}

export function TaskEdit({ task, onUpdate }: TaskEditProps) {
  const { user } = useApp();
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const permissions: TaskPermissions = user
    ? taskService.getTaskPermissions(task, user.id)
    : {
        canApprove: false,
        canReject: false,
        canComplete: false,
        canClaim: false,
        canRelease: false,
        canReassign: false,
      };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (action: 'approve' | 'reject' | 'complete') => {
    if (action === 'reject' && !comment.trim()) {
      showNotificationMessage('Comment is required for rejection', 'error');
      return;
    }

    setIsSubmitting(true);

    const result = await taskService.performTaskAction(task.id, {
      action,
      comment: comment.trim() || undefined,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      showNotificationMessage(result.message, 'success');
      setComment('');
      setSelectedFiles([]);
      setSelectedAction(null);
      setTimeout(() => {
        onUpdate();
      }, 1500);
    } else {
      showNotificationMessage(result.message, 'error');
    }
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
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

  return (
    <div className="space-y-6">
      {showNotification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            notificationType === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notificationType === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notificationMessage}</span>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Title</div>
            <div className="text-sm font-medium text-gray-900">{task.title}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <span
              className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                task.status
              )}`}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Priority</div>
            <div className="text-sm font-medium text-gray-900 capitalize">{task.priority}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Due Date</div>
            <div className="text-sm font-medium text-gray-900">
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '-'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
        <div className="space-y-3">
          {permissions.canApprove && (
            <button
              onClick={() => setSelectedAction('approve')}
              className="w-full px-6 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-semibold text-emerald-900">Approve</div>
                <div className="text-sm text-emerald-700">Approve and move task forward</div>
              </div>
            </button>
          )}

          {permissions.canReject && (
            <button
              onClick={() => setSelectedAction('reject')}
              className="w-full px-6 py-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-semibold text-red-900">Reject</div>
                <div className="text-sm text-red-700">Reject and cancel task (comment required)</div>
              </div>
            </button>
          )}

          {permissions.canComplete && (
            <button
              onClick={() => setSelectedAction('complete')}
              className="w-full px-6 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-semibold text-emerald-900">Complete</div>
                <div className="text-sm text-emerald-700">Mark task as completed</div>
              </div>
            </button>
          )}

          {!permissions.canApprove && !permissions.canReject && !permissions.canComplete && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No actions available for this task</p>
              <p className="text-xs mt-1">
                {task.assigned_to !== user?.id
                  ? 'You are not assigned to this task'
                  : 'Task status does not allow actions at this time'}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedAction && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment {selectedAction === 'reject' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={
                selectedAction === 'reject'
                  ? 'Please provide a reason for rejection (required)'
                  : 'Add an optional comment'
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-emerald-400 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 font-medium">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, JPG, PNG up to 10MB
                </span>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => handleSubmit(selectedAction as any)}
              disabled={isSubmitting || (selectedAction === 'reject' && !comment.trim())}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : `Confirm ${selectedAction}`}
            </button>
            <button
              onClick={() => {
                setSelectedAction(null);
                setComment('');
                setSelectedFiles([]);
              }}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

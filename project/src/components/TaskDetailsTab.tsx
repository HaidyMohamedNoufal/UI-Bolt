import { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  FileText,
  Paperclip,
  MessageSquare,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { TaskDetails, taskService, TaskAttachment, TaskComment, TaskHistoryEntry } from '../services/taskService';

interface TaskDetailsTabProps {
  task: TaskDetails;
}

export function TaskDetailsTab({ task }: TaskDetailsTabProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTaskDetails();
  }, [task.id]);

  const loadTaskDetails = async () => {
    setIsLoading(true);
    const [attachmentsData, commentsData, historyData] = await Promise.all([
      taskService.getTaskAttachments(task.id),
      taskService.getTaskComments(task.id),
      taskService.getTaskHistory(task.id),
    ]);
    setAttachments(attachmentsData);
    setComments(commentsData);
    setHistory(historyData);
    setIsLoading(false);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Task Metadata
        </h3>
        <div className="grid grid-cols-2 gap-6">
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
            <div className="text-sm text-gray-500 mb-1">Workflow Type</div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {task.workflow_type?.replace('_', ' ') || 'General'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Due Date</div>
            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(task.due_date)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Created Date</div>
            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(task.created_at)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Created By (Initiator)</div>
            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <User className="w-4 h-4" />
              {task.created_by_user?.full_name || 'System'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Assigned To</div>
            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <User className="w-4 h-4" />
              {task.assigned_to_user?.full_name || 'Unassigned'}
            </div>
          </div>
          {task.completed_at && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Completed Date</div>
              <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(task.completed_at)}
              </div>
            </div>
          )}
        </div>
        {task.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Description</div>
            <div className="text-sm text-gray-900">{task.description}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Attachments ({attachments.length})
        </h3>
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No attachments available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{attachment.file_name}</div>
                    <div className="text-xs text-gray-500">
                      {(attachment.file_size / 1024).toFixed(1)} KB • Uploaded by {attachment.uploaded_by}
                    </div>
                  </div>
                </div>
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-emerald-200 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-semibold text-gray-900">{comment.user_name}</div>
                  <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                </div>
                <div className="text-sm text-gray-700">{comment.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          History ({history.length})
        </h3>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No history available</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-8">
                  <div className="absolute left-0 top-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-gray-900">{entry.action}</div>
                      <div className="text-xs text-gray-500">{formatDate(entry.created_at)}</div>
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      By: <span className="font-medium">{entry.user_name}</span>
                    </div>
                    {entry.old_status && entry.new_status && (
                      <div className="text-xs text-gray-600 mb-2">
                        Status: {entry.old_status} → {entry.new_status}
                      </div>
                    )}
                    {entry.comment && (
                      <div className="text-sm text-gray-600 mt-2 italic">"{entry.comment}"</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

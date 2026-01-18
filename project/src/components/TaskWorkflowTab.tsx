import { useState, useEffect } from 'react';
import {
  GitBranch,
  User,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { TaskDetails, taskService, WorkflowDetails } from '../services/taskService';

interface TaskWorkflowTabProps {
  task: TaskDetails;
}

export function TaskWorkflowTab({ task }: TaskWorkflowTabProps) {
  const [workflow, setWorkflow] = useState<WorkflowDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkflowDetails();
  }, [task.id]);

  const loadWorkflowDetails = async () => {
    setIsLoading(true);
    const data = await taskService.getWorkflowDetails(task.id);
    setWorkflow(data);
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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12 text-gray-500">
        <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">Workflow details not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Workflow Metadata
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Workflow Name</div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {workflow.workflow_name.replace('_', ' ')}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Workflow Type</div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {workflow.workflow_type.replace('_', ' ')}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Initiator</div>
            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <User className="w-4 h-4" />
              {workflow.initiator_name}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Start Date</div>
            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(workflow.start_date)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Step</div>
            <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
              {workflow.current_step}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Assignees</div>
            <div className="text-sm font-medium text-gray-900">
              {workflow.current_assignees.join(', ')}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Workflow Timeline
        </h3>
        {workflow.transitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No transitions yet</p>
            <p className="text-xs mt-1">The workflow is in its initial state</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {workflow.transitions.map((transition, index) => (
                <div key={transition.id} className="relative pl-12">
                  <div className="absolute left-0 top-2 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="capitalize">{transition.action}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-emerald-600">{transition.to_step}</span>
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(transition.performed_at)}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      <span>By: <span className="font-medium">{transition.performed_by}</span></span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      From: <span className="font-medium">{transition.from_step}</span> → To: <span className="font-medium">{transition.to_step}</span>
                    </div>
                    {transition.comment && (
                      <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200 italic">
                        "{transition.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <GitBranch className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900 mb-1">Workflow Information</h4>
            <p className="text-sm text-emerald-700">
              This workflow is currently at the <span className="font-semibold">{workflow.current_step}</span> step.
              {workflow.current_assignees.length > 0 && (
                <span> Assigned to: <span className="font-semibold">{workflow.current_assignees.join(', ')}</span>.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

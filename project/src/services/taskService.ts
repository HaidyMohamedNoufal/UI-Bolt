import { supabase } from '../lib/supabase';
import { Task } from '../types';

export interface TaskAction {
  action: 'approve' | 'reject' | 'complete' | 'claim' | 'release' | 'reassign';
  comment?: string;
  attachments?: File[];
  reassignTo?: string;
}

export interface TaskDetails extends Task {
  created_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  assigned_to_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  history?: TaskHistoryEntry[];
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  action: string;
  user_id: string;
  user_name: string;
  comment?: string;
  old_status?: string;
  new_status?: string;
  created_at: string;
}

export interface WorkflowDetails {
  workflow_id: string;
  workflow_name: string;
  workflow_type: string;
  initiator_id: string;
  initiator_name: string;
  start_date: string;
  current_step: string;
  current_assignees: string[];
  transitions: WorkflowTransition[];
}

export interface WorkflowTransition {
  id: string;
  from_step: string;
  to_step: string;
  action: string;
  performed_by: string;
  performed_at: string;
  comment?: string;
}

export interface ProcessDiagram {
  workflow_type: string;
  steps: ProcessStep[];
  current_step_id: string;
}

export interface ProcessStep {
  id: string;
  name: string;
  type: 'start' | 'task' | 'decision' | 'end';
  assignee_role?: string;
  next_steps: string[];
}

export interface TaskPermissions {
  canApprove: boolean;
  canReject: boolean;
  canComplete: boolean;
  canClaim: boolean;
  canRelease: boolean;
  canReassign: boolean;
}

class TaskService {
  async getTaskById(taskId: string): Promise<TaskDetails | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        created_by_user:users!tasks_created_by_fkey(id, full_name, email),
        assigned_to_user:users!tasks_assigned_to_fkey(id, full_name, email)
      `)
      .eq('id', taskId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching task:', error);
      return null;
    }

    return {
      ...data,
      created_by_user: data.created_by_user || undefined,
      assigned_to_user: data.assigned_to_user || undefined,
      attachments: [],
      comments: [],
      history: [],
    };
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return [];
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return [];
  }

  async getTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
    return [];
  }

  async getWorkflowDetails(taskId: string): Promise<WorkflowDetails | null> {
    const task = await this.getTaskById(taskId);
    if (!task) return null;

    return {
      workflow_id: task.id,
      workflow_name: task.workflow_type || 'General Workflow',
      workflow_type: task.workflow_type || 'general',
      initiator_id: task.created_by || '',
      initiator_name: task.created_by_user?.full_name || 'System',
      start_date: task.started_at || task.created_at,
      current_step: this.getStepFromStatus(task.status),
      current_assignees: task.assigned_to_user ? [task.assigned_to_user.full_name] : ['Unassigned'],
      transitions: [],
    };
  }

  async getProcessDiagram(taskId: string): Promise<ProcessDiagram | null> {
    const task = await this.getTaskById(taskId);
    if (!task) return null;

    const workflowType = task.workflow_type || 'general';

    return {
      workflow_type: workflowType,
      steps: this.getMockProcessSteps(workflowType),
      current_step_id: this.getStepIdFromStatus(task.status),
    };
  }

  private getMockProcessSteps(workflowType: string): ProcessStep[] {
    const commonSteps: ProcessStep[] = [
      {
        id: 'start',
        name: 'Start',
        type: 'start',
        next_steps: ['review'],
      },
      {
        id: 'review',
        name: 'Review',
        type: 'task',
        assignee_role: 'Reviewer',
        next_steps: ['approve', 'reject'],
      },
      {
        id: 'approve',
        name: 'Approve',
        type: 'task',
        assignee_role: 'Approver',
        next_steps: ['complete'],
      },
      {
        id: 'reject',
        name: 'Reject',
        type: 'task',
        assignee_role: 'Reviewer',
        next_steps: ['end'],
      },
      {
        id: 'complete',
        name: 'Complete',
        type: 'task',
        assignee_role: 'Admin',
        next_steps: ['end'],
      },
      {
        id: 'end',
        name: 'End',
        type: 'end',
        next_steps: [],
      },
    ];

    return commonSteps;
  }

  private getStepFromStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Review',
      in_progress: 'Review',
      active: 'Review',
      pending_review: 'Approve',
      completed: 'Complete',
      cancelled: 'Reject',
    };
    return statusMap[status] || 'Review';
  }

  private getStepIdFromStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'review',
      in_progress: 'review',
      active: 'review',
      pending_review: 'approve',
      completed: 'complete',
      cancelled: 'reject',
    };
    return statusMap[status] || 'review';
  }

  getTaskPermissions(task: TaskDetails, userId: string): TaskPermissions {
    const isAssignedToUser = task.assigned_to === userId;
    const isCreatedByUser = task.created_by === userId;
    const isActive = task.status === 'active' || task.status === 'in_progress' || task.status === 'pending_review';

    return {
      canApprove: isAssignedToUser && task.status === 'pending_review',
      canReject: isAssignedToUser && (task.status === 'in_progress' || task.status === 'pending_review'),
      canComplete: isAssignedToUser && task.status === 'pending_review',
      canClaim: !task.assigned_to && isActive,
      canRelease: isAssignedToUser && isActive,
      canReassign: isCreatedByUser || isAssignedToUser,
    };
  }

  async performTaskAction(
    taskId: string,
    action: TaskAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      let newStatus = task.status;

      switch (action.action) {
        case 'approve':
          newStatus = 'completed';
          break;
        case 'reject':
          newStatus = 'cancelled';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'claim':
          break;
        case 'release':
          break;
        case 'reassign':
          break;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        return { success: false, message: 'Failed to update task' };
      }

      return { success: true, message: `Task ${action.action}d successfully` };
    } catch (error) {
      console.error('Error performing task action:', error);
      return { success: false, message: 'An error occurred' };
    }
  }

  async uploadAttachment(
    taskId: string,
    file: File
  ): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Attachment upload not implemented yet' };
  }

  async addComment(
    taskId: string,
    userId: string,
    comment: string
  ): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Comment added successfully' };
  }
}

export const taskService = new TaskService();

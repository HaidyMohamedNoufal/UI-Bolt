import { useState, useEffect } from 'react';
import {
  Network,
  Circle,
  Square,
  Diamond,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { TaskDetails, taskService, ProcessDiagram, ProcessStep } from '../services/taskService';

interface TaskDiagramTabProps {
  task: TaskDetails;
}

export function TaskDiagramTab({ task }: TaskDiagramTabProps) {
  const [diagram, setDiagram] = useState<ProcessDiagram | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProcessDiagram();
  }, [task.id]);

  const loadProcessDiagram = async () => {
    setIsLoading(true);
    const data = await taskService.getProcessDiagram(task.id);
    setDiagram(data);
    setIsLoading(false);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Circle className="w-6 h-6" />;
      case 'task':
        return <Square className="w-6 h-6" />;
      case 'decision':
        return <Diamond className="w-6 h-6" />;
      case 'end':
        return <CheckCircle className="w-6 h-6" />;
      default:
        return <Square className="w-6 h-6" />;
    }
  };

  const getStepColor = (step: ProcessStep, currentStepId: string) => {
    if (step.id === currentStepId) {
      return 'bg-emerald-500 text-white border-emerald-600';
    }
    switch (step.type) {
      case 'start':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'end':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'decision':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">Process diagram not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Network className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900 mb-1">Process Flow</h4>
            <p className="text-sm text-emerald-700">
              This diagram shows the workflow process for <span className="font-semibold capitalize">{diagram.workflow_type.replace('_', ' ')}</span>.
              The current step is highlighted in mint green.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Network className="w-5 h-5" />
          Workflow Steps
        </h3>

        <div className="space-y-4">
          {diagram.steps.map((step, index) => (
            <div key={step.id}>
              <div
                className={`relative p-6 rounded-lg border-2 transition-all ${getStepColor(
                  step,
                  diagram.current_step_id
                )}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.id === diagram.current_step_id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white'
                    }`}
                  >
                    {getStepIcon(step.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base">{step.name}</h4>
                      {step.id === diagram.current_step_id && (
                        <span className="px-2 py-0.5 bg-white text-emerald-600 text-xs font-semibold rounded-full">
                          Current Step
                        </span>
                      )}
                    </div>
                    <div className="text-sm opacity-90">
                      Type: <span className="font-medium capitalize">{step.type}</span>
                    </div>
                    {step.assignee_role && (
                      <div className="text-sm opacity-90 mt-1">
                        Assignee Role: <span className="font-medium">{step.assignee_role}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {step.next_steps.length > 0 && index < diagram.steps.length - 1 && (
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center">
              <Circle className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-sm text-gray-700">Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center">
              <Square className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-sm text-gray-700">Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-300 rounded-full flex items-center justify-center">
              <Diamond className="w-4 h-4 text-yellow-700" />
            </div>
            <span className="text-sm text-gray-700">Decision</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm text-gray-700">End</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <div className="w-8 h-8 bg-emerald-500 border-2 border-emerald-600 rounded-full flex items-center justify-center">
              <Square className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-700 font-medium">Current Step (Active)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

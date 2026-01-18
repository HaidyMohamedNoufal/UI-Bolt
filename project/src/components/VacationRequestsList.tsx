import { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface VacationRequest {
  id: string;
  submitted_by: string;
  manager_id: string | null;
  department_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  document_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  submitter?: {
    full_name: string;
    email: string;
  };
  manager?: {
    full_name: string;
  };
}

interface VacationRequestsListProps {
  viewMode: 'my-requests' | 'department-requests';
}

export function VacationRequestsList({ viewMode }: VacationRequestsListProps) {
  const { user, currentDepartment } = useApp();
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const isManager = user?.site_department_manager || user?.can_manage_dept_tasks;

  useEffect(() => {
    loadRequests();
  }, [viewMode, currentDepartment, user]);

  const loadRequests = async () => {
    if (!currentDepartment || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let query = supabase
      .from('vacation_requests')
      .select(`
        *,
        submitter:users!vacation_requests_submitted_by_fkey(full_name, email),
        manager:users!vacation_requests_manager_id_fkey(full_name)
      `)
      .eq('department_id', currentDepartment.id)
      .order('created_at', { ascending: false });

    if (viewMode === 'my-requests') {
      query = query.eq('submitted_by', user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRequests(data as any);
    }

    setIsLoading(false);
  };

  const handleReview = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    if (!isManager) return;

    setIsReviewing(true);

    const { error } = await supabase
      .from('vacation_requests')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq('id', requestId);

    if (!error) {
      setSelectedRequest(null);
      setReviewNotes('');
      loadRequests();
    }

    setIsReviewing(false);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: Clock,
      },
      approved: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: CheckCircle,
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
      },
    };

    const { bg, text, icon: Icon } = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No vacation requests</h3>
        <p className="text-gray-500">
          {viewMode === 'my-requests'
            ? 'You have not submitted any vacation requests yet'
            : 'No vacation requests in your department'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {request.submitter?.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">{request.submitter?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted {formatDate(request.created_at)}
                  </p>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  <span className="font-medium">From:</span> {formatDate(request.start_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  <span className="font-medium">To:</span> {formatDate(request.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  <span className="font-medium">Duration:</span>{' '}
                  {calculateDuration(request.start_date, request.end_date)}
                </span>
              </div>
              {request.manager && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    <span className="font-medium">Manager:</span> {request.manager.full_name}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-gray-700">{request.reason}</p>
                </div>
              </div>
            </div>

            {request.document_url && (
              <div className="mb-4">
                <a
                  href={request.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Supporting Document
                </a>
              </div>
            )}

            {request.review_notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-900 mb-1">Manager's Notes</p>
                    <p className="text-sm text-blue-700">{request.review_notes}</p>
                    {request.reviewed_at && (
                      <p className="text-xs text-blue-600 mt-1">
                        Reviewed {formatDate(request.reviewed_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isManager && request.status === 'pending' && viewMode === 'department-requests' && (
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setReviewNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Review Vacation Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Review the vacation request from{' '}
              <span className="font-medium">{selectedRequest.submitter?.full_name}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Add any notes about your decision..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewNotes('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedRequest.id, 'rejected')}
                disabled={isReviewing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReviewing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleReview(selectedRequest.id, 'approved')}
                disabled={isReviewing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReviewing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

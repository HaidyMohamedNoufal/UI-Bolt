import { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Lock,
  Unlock,
  X,
  AlertCircle,
  CheckCircle,
  User,
  Clock,
} from 'lucide-react';
import { checkoutService, CheckoutInfo } from '../services/checkoutService';
import { useApp } from '../context/AppContext';

interface FileCheckoutMenuProps {
  fileId: string;
  fileName: string;
  fileUrl: string;
  onClose: () => void;
  onCheckoutChange: () => void;
}

export function FileCheckoutMenu({
  fileId,
  fileName,
  fileUrl,
  onClose,
  onCheckoutChange,
}: FileCheckoutMenuProps) {
  const { user } = useApp();
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isManager = user?.site_department_manager || user?.can_manage_dept_tasks;
  const isCheckedOutByMe = checkoutInfo?.checked_out_by === user?.id;
  const isCheckedOutByOther = checkoutInfo?.checked_out && !isCheckedOutByMe;

  useEffect(() => {
    loadCheckoutInfo();
  }, [fileId]);

  const loadCheckoutInfo = async () => {
    setIsLoading(true);
    const info = await checkoutService.getCheckoutInfo(fileId);
    setCheckoutInfo(info);
    setIsLoading(false);
  };

  const handleCheckOut = async () => {
    if (!user) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const result = await checkoutService.checkOut(fileId, user.id, notes);

    if (result.success) {
      setSuccess('File checked out successfully. You can now download and edit it offline.');

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();

      await loadCheckoutInfo();
      onCheckoutChange();
    } else {
      setError(result.error || 'Failed to check out file');
    }

    setIsProcessing(false);
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const result = await checkoutService.checkIn(fileId, user.id);

    if (result.success) {
      setSuccess('File checked in successfully. New version created.');
      await loadCheckoutInfo();
      onCheckoutChange();
    } else {
      setError(result.error || 'Failed to check in file');
    }

    setIsProcessing(false);
  };

  const handleCancelCheckout = async () => {
    if (!user) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const result = await checkoutService.cancelCheckout(fileId, user.id, isManager);

    if (result.success) {
      setSuccess('Checkout cancelled successfully. You can now close this dialog.');
      await loadCheckoutInfo();
      onCheckoutChange();
    } else {
      setError(result.error || 'Failed to cancel checkout');
    }

    setIsProcessing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Offline</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{fileName}</p>
                <p className="text-sm text-gray-500 mt-1">Version {checkoutInfo?.version_number || 1}</p>
              </div>
            </div>
          </div>

          {checkoutInfo?.checked_out && (
            <div className={`border rounded-lg p-4 ${
              isCheckedOutByMe ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-2 mb-3">
                {isCheckedOutByMe ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${isCheckedOutByMe ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {isCheckedOutByMe ? 'Checked out by you' : 'Checked out by another user'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{checkoutInfo.checker_name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(checkoutInfo.checked_out_at)}</span>
                </div>
                {checkoutInfo.checkout_notes && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Notes:</p>
                    <p className="text-gray-700">{checkoutInfo.checkout_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!checkoutInfo?.checked_out && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Checkout Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Add a note about why you're checking out this file..."
              />
            </div>
          )}

          <div className="space-y-3">
            {!checkoutInfo?.checked_out && (
              <button
                onClick={handleCheckOut}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isProcessing ? 'Checking out...' : 'Check Out & Download'}
              </button>
            )}

            {isCheckedOutByMe && (
              <>
                <button
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {isProcessing ? 'Checking in...' : 'Check In (New Version)'}
                </button>
                <button
                  onClick={handleCancelCheckout}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Unlock className="w-5 h-5" />
                  {isProcessing ? 'Cancelling...' : 'Cancel Checkout'}
                </button>
              </>
            )}

            {isCheckedOutByOther && isManager && (
              <button
                onClick={handleCancelCheckout}
                disabled={isProcessing}
                className="w-full px-4 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Unlock className="w-5 h-5" />
                {isProcessing ? 'Cancelling...' : 'Force Cancel Checkout (Manager)'}
              </button>
            )}

            {isCheckedOutByOther && !isManager && (
              <div className="text-center text-sm text-gray-600 py-2">
                This file is locked for editing by another user.
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">How it works:</p>
            <ul className="space-y-1 list-disc list-inside text-blue-800">
              <li>Check out to download and lock the file</li>
              <li>Edit the file on your computer</li>
              <li>Check in to upload your changes as a new version</li>
              <li>Or cancel checkout to unlock without changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

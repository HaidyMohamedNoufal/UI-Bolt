import React, { useState, useEffect } from 'react';
import { X, Lock, Search, UserPlus } from 'lucide-react';

type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted' | 'secret' | 'top_secret';

interface SetConfidentialityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confidentiality: ConfidentialityLevel, assignees: string[]) => void;
  fileName: string;
  mode: 'upload' | 'edit';
  existingConfidentiality?: ConfidentialityLevel;
  existingAssignees?: string[];
}

const MOCK_USERS = [
  'Maiar Mahmoud',
  'HR Manager',
  'Site Manager',
  'Security Admin',
  'Finance Lead',
  'Legal Officer',
  'John Doe',
  'Jane Smith',
  'Engineering Lead',
  'Operations Manager'
];

export function SetConfidentialityModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  mode,
  existingConfidentiality,
  existingAssignees = []
}: SetConfidentialityModalProps) {
  const [confidentiality, setConfidentiality] = useState<ConfidentialityLevel | ''>('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfidentiality(existingConfidentiality || '');
      setAssignees(existingAssignees);
      setSearchQuery('');
      setShowUserDropdown(false);
    }
  }, [isOpen, existingConfidentiality, existingAssignees]);

  if (!isOpen) return null;

  const confidentialityHierarchy: ConfidentialityLevel[] = [
    'public',
    'internal',
    'confidential',
    'restricted',
    'secret',
    'top_secret'
  ];

  const getMinimumConfidentialityIndex = () => {
    if (mode === 'edit' && existingConfidentiality) {
      return confidentialityHierarchy.indexOf(existingConfidentiality);
    }
    return 0;
  };

  const minimumConfidentialityIndex = getMinimumConfidentialityIndex();
  const allowedLevels = confidentialityHierarchy.slice(minimumConfidentialityIndex);

  const requiresAssignees = confidentiality && confidentiality !== 'public';
  const isValid = confidentiality && (!requiresAssignees || assignees.length > 0);

  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !assignees.includes(user)
  );

  const handleConfidentialityChange = (value: string) => {
    setConfidentiality(value as ConfidentialityLevel);
    if (value === 'public') {
      setAssignees([]);
    }
  };

  const addAssignee = (user: string) => {
    if (!assignees.includes(user)) {
      setAssignees([...assignees, user]);
    }
    setSearchQuery('');
    setShowUserDropdown(false);
  };

  const removeAssignee = (user: string) => {
    setAssignees(assignees.filter((a) => a !== user));
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(confidentiality as ConfidentialityLevel, assignees);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Set Confidentiality</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name
            </label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
              {fileName}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidentiality <span className="text-red-500">*</span>
            </label>
            <select
              value={confidentiality}
              onChange={(e) => handleConfidentialityChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select confidentiality level...</option>
              {allowedLevels.map((level) => (
                <option key={level} value={level}>
                  {level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            {mode === 'edit' && existingConfidentiality && (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You can only maintain or increase the confidentiality level. Current level: <strong>{existingConfidentiality.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</strong></span>
              </p>
            )}
          </div>

          {confidentiality === 'public' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-blue-800">
                Public documents are visible to all users with site access.
              </p>
            </div>
          )}

          {requiresAssignees && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignees <span className="text-red-500">*</span>
              </label>

              <div className="relative mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user}
                        onClick={() => addAssignee(user)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-emerald-700">
                            {user.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{user}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {assignees.map((user) => (
                    <div
                      key={user}
                      className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 text-sm font-medium"
                    >
                      <span>{user}</span>
                      <button
                        onClick={() => removeAssignee(user)}
                        className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    Please select at least one assignee.
                  </p>
                </div>
              )}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Only the creator, assigned users, and authorized managers can access this document.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
              isValid
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm & {mode === 'upload' ? 'Upload' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

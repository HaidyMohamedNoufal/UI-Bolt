import { useState, useRef } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  FileText,
  Info,
} from 'lucide-react';
import { versionService } from '../services/versionService';
import { useApp } from '../context/AppContext';

interface UploadVersionModalProps {
  fileId: string;
  fileName: string;
  currentVersion: number;
  departmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadVersionModal({
  fileId,
  fileName,
  currentVersion,
  departmentId,
  onClose,
  onSuccess,
}: UploadVersionModalProps) {
  const { user } = useApp();
  const [versionType, setVersionType] = useState<'major' | 'minor'>('minor');
  const [changeNotes, setChangeNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateNewVersion = () => {
    if (versionType === 'major') {
      return Math.floor(currentVersion) + 1;
    }
    return Number((currentVersion + 0.1).toFixed(1));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const mockFileUrl = URL.createObjectURL(selectedFile);

    const result = await versionService.uploadNewVersion({
      fileId,
      userId: user.id,
      departmentId,
      newFileUrl: mockFileUrl,
      newFileSize: selectedFile.size,
      versionType,
      changeNotes: changeNotes.trim() || undefined,
    });

    if (result.success) {
      setSuccess(`Successfully uploaded version ${result.newVersion}!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } else {
      setError(result.error || 'Failed to upload new version');
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Upload New Version</h2>
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
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{fileName}</p>
                <p className="text-sm text-gray-500 mt-1">Current Version: {currentVersion}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Version Control</p>
                <ul className="space-y-1 list-disc list-inside text-blue-800">
                  <li>Minor updates: Bug fixes, small changes (e.g., 1.1 → 1.2)</li>
                  <li>Major updates: Significant changes (e.g., 1.9 → 2.0)</li>
                  <li>Previous versions are preserved for reference</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVersionType('minor')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                  versionType === 'minor'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold">Minor Update</div>
                  <div className="text-xs mt-1">
                    {currentVersion} → {Number((currentVersion + 0.1).toFixed(1))}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setVersionType('major')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                  versionType === 'major'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold">Major Update</div>
                  <div className="text-xs mt-1">
                    {currentVersion} → {Math.floor(currentVersion) + 1}.0
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Change Notes (Optional)
            </label>
            <textarea
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Describe what changed in this version..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all text-gray-600 hover:text-emerald-700 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {selectedFile ? selectedFile.name : 'Click to select file'}
            </button>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isProcessing || !selectedFile}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {isProcessing ? 'Uploading...' : `Upload v${calculateNewVersion()}`}
            </button>
          </div>

          <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-medium text-amber-900 mb-1">Important:</p>
            <ul className="space-y-1 list-disc list-inside text-amber-800">
              <li>The original file will be preserved in version history</li>
              <li>All metadata and permissions will be maintained</li>
              <li>This action will be logged in the audit trail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

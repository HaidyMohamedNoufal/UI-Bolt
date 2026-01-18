import { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Shield,
  FileText,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

interface DocumentType {
  id: string;
  name: string;
  document_main_type: string;
  retention_period_years: number;
  retention_starts_from: string;
  permanent: boolean;
  description: string;
}

interface NCARMetadataModalProps {
  mode: 'create' | 'upload';
  fileName?: string;
  fileData?: File;
  folderId: string | null;
  onClose: () => void;
  onSave: (metadata: NCARMetadata) => Promise<void>;
}

export interface NCARMetadata {
  documentTypeId: string;
  documentMainType: string;
  documentType: string;
  department: string;
  retentionPeriod: number;
  retentionStartsFrom: string;
  permanent: boolean;
  relocated: boolean;
  physicallyDisposed: boolean;
  archived: boolean;
  archivedDate: string | null;
  activationDate: string;
  documentStatus: 'Active' | 'Inactive';
  endDate: string | null;
  confidentiality: 'Public' | 'Confidential' | 'Secret' | 'Top Secret';
  personalData: boolean;
  editArchivedDocument?: boolean;
}

export function NCARMetadataModal({
  mode,
  fileName,
  fileData,
  folderId,
  onClose,
  onSave,
}: NCARMetadataModalProps) {
  const { user, currentDepartment } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [docTypeSearch, setDocTypeSearch] = useState('');
  const [showDocTypeDropdown, setShowDocTypeDropdown] = useState(false);

  const [metadata, setMetadata] = useState<NCARMetadata>({
    documentTypeId: '',
    documentMainType: 'General',
    documentType: 'Standard Document',
    department: currentDepartment?.name || '',
    retentionPeriod: 7,
    retentionStartsFrom: 'Creation Date',
    permanent: false,
    relocated: false,
    physicallyDisposed: false,
    archived: false,
    archivedDate: null,
    activationDate: new Date().toISOString().split('T')[0],
    documentStatus: 'Active',
    endDate: null,
    confidentiality: 'Public',
    personalData: false,
  });

  const canEditArchived = user?.can_change_edit_archived_docs_status || false;

  useEffect(() => {
    if (currentDepartment) {
      loadDocumentTypes();
    }
  }, [currentDepartment]);

  const loadDocumentTypes = async () => {
    if (!currentDepartment) return;

    const { data, error: fetchError } = await supabase
      .from('document_types')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .order('name', { ascending: true });

    if (!fetchError && data) {
      setDocumentTypes(data);
    }
  };

  const handleDocTypeSelect = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setDocTypeSearch(docType.name);
    setShowDocTypeDropdown(false);
    setMetadata(prev => ({
      ...prev,
      documentTypeId: docType.id,
      documentMainType: docType.document_main_type,
      documentType: docType.name,
      retentionPeriod: docType.retention_period_years,
      retentionStartsFrom: docType.retention_starts_from,
      permanent: docType.permanent,
    }));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.documentType;
      return newErrors;
    });
  };

  const filteredDocTypes = documentTypes.filter(dt =>
    dt.name.toLowerCase().includes(docTypeSearch.toLowerCase()) ||
    dt.document_main_type.toLowerCase().includes(docTypeSearch.toLowerCase())
  );

  useEffect(() => {
    if (metadata.documentStatus === 'Active') {
      setMetadata(prev => ({ ...prev, endDate: null }));
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  }, [metadata.documentStatus]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!metadata.documentTypeId || !selectedDocType) {
      errors.documentType = 'Document Type is required';
    }

    if (!metadata.activationDate) {
      errors.activationDate = 'Activation Date is required';
    }

    if (!metadata.documentStatus) {
      errors.documentStatus = 'Document Status is required';
    }

    if (metadata.documentStatus === 'Inactive' && !metadata.endDate) {
      errors.endDate = 'End Date is required when status is Inactive';
    }

    if (!metadata.confidentiality) {
      errors.confidentiality = 'Confidentiality level is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before proceeding');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await onSave(metadata);
      setSuccess(`Document ${mode === 'create' ? 'created' : 'uploaded'} successfully`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} document`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Document Properties (NCAR Metadata)</h2>
            {fileName && (
              <p className="text-sm text-gray-600 mt-1">File: {fileName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Section A: Document Information</p>
                <p className="text-blue-800">
                  Template-specific fields will be configured per document type in later phase.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Section B: NCAR Core Fields
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={docTypeSearch}
                      onChange={(e) => {
                        setDocTypeSearch(e.target.value);
                        setShowDocTypeDropdown(true);
                      }}
                      onFocus={() => setShowDocTypeDropdown(true)}
                      placeholder="Search document types..."
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        validationErrors.documentType ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {validationErrors.documentType && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.documentType}</p>
                  )}
                  {selectedDocType && !validationErrors.documentType && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900">
                        <span className="font-medium">Retention info:</span> {selectedDocType.retention_period_years} years from {selectedDocType.retention_starts_from}
                        {selectedDocType.permanent && ' (Permanent)'}
                      </p>
                    </div>
                  )}
                  {showDocTypeDropdown && filteredDocTypes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {filteredDocTypes.map((docType) => (
                        <button
                          key={docType.id}
                          type="button"
                          onClick={() => handleDocTypeSelect(docType)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-medium text-gray-900 text-sm">{docType.name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{docType.document_main_type}</p>
                          {docType.description && (
                            <p className="text-xs text-gray-500 mt-1">{docType.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Main Type
                  </label>
                  <input
                    type="text"
                    value={metadata.documentMainType}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-set from selected document type</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={metadata.department}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retention Period (years)
                  </label>
                  <input
                    type="number"
                    value={metadata.retentionPeriod}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retention Starts From
                  </label>
                  <input
                    type="text"
                    value={metadata.retentionStartsFrom}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activation Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={metadata.activationDate}
                      onChange={(e) => setMetadata(prev => ({ ...prev, activationDate: e.target.value }))}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        validationErrors.activationDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {validationErrors.activationDate && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.activationDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={metadata.documentStatus}
                    onChange={(e) => setMetadata(prev => ({ ...prev, documentStatus: e.target.value as 'Active' | 'Inactive' }))}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      validationErrors.documentStatus ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {validationErrors.documentStatus && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.documentStatus}</p>
                  )}
                </div>

                {metadata.documentStatus === 'Inactive' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={metadata.endDate || ''}
                        onChange={(e) => setMetadata(prev => ({ ...prev, endDate: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {validationErrors.endDate && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.endDate}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidentiality <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={metadata.confidentiality}
                      onChange={(e) => setMetadata(prev => ({ ...prev, confidentiality: e.target.value as any }))}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        validationErrors.confidentiality ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="Public">Public</option>
                      <option value="Confidential">Confidential</option>
                      <option value="Secret">Secret</option>
                      <option value="Top Secret">Top Secret</option>
                    </select>
                  </div>
                  {validationErrors.confidentiality && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.confidentiality}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="personalData"
                  checked={metadata.personalData}
                  onChange={(e) => setMetadata(prev => ({ ...prev, personalData: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="personalData" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Contains Personal Data
                </label>
              </div>

              {canEditArchived && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div>
                      <label htmlFor="editArchived" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Edit Archived Document
                      </label>
                      <p className="text-xs text-gray-600 mt-1">Allow editing of archived documents</p>
                    </div>
                    <input
                      type="checkbox"
                      id="editArchived"
                      checked={metadata.editArchivedDocument || false}
                      onChange={(e) => setMetadata(prev => ({ ...prev, editArchivedDocument: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Read-only Status Fields</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Permanent:</span>
                    <span className="ml-2 font-medium text-gray-900">{metadata.permanent ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Relocated:</span>
                    <span className="ml-2 font-medium text-gray-900">{metadata.relocated ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Physically Disposed:</span>
                    <span className="ml-2 font-medium text-gray-900">{metadata.physicallyDisposed ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Archived:</span>
                    <span className="ml-2 font-medium text-gray-900">{metadata.archived ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Uploading...'}
              </>
            ) : (
              <>{mode === 'create' ? 'Create Document' : 'Upload Document'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

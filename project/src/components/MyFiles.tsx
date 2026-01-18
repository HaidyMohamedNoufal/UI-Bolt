import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Upload,
  FolderPlus,
  Grid3x3,
  List as ListIcon,
  ChevronRight,
  FileText,
  FolderIcon,
  Download,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Share2,
  Lock,
  CheckCircle,
  MoreVertical,
  Edit,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { File, Folder } from '../types';
import { SetConfidentialityModal } from './SetConfidentialityModal';
import { FileCheckoutMenu } from './FileCheckoutMenu';
import { UploadVersionModal } from './UploadVersionModal';
import { NCARMetadataModal, NCARMetadata } from './NCARMetadataModal';
import { settingsService } from '../services/settingsService';

type ViewMode = 'grid' | 'list';
type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted' | 'secret' | 'top_secret';

export function MyFiles() {
  const { currentDepartment, user } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; name: string } | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [fileMenuOpen, setFileMenuOpen] = useState<string | null>(null);
  const [checkoutMenuFile, setCheckoutMenuFile] = useState<File | null>(null);
  const [versionUploadFile, setVersionUploadFile] = useState<File | null>(null);
  const [showNCARModal, setShowNCARModal] = useState(false);
  const [ncarPendingFile, setNCARPendingFile] = useState<{ file: File; rawFile: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    fileType: 'Any',
    status: 'Any',
    confidentiality: 'Any',
    modifiedBy: 'Any',
    modifiedDate: 'Any',
    tags: 'Any',
  });

  useEffect(() => {
    if (currentDepartment) {
      loadFiles();
    }
  }, [currentDepartment, currentFolder]);

  const loadFiles = async () => {
    if (!currentDepartment) return;

    let filesQuery = supabase
      .from('files')
      .select(`
        *,
        checked_out_user:users!files_checked_out_by_fkey(full_name)
      `)
      .eq('department_id', currentDepartment.id);

    if (currentFolder) {
      filesQuery = filesQuery.eq('folder_id', currentFolder.id);
    }

    const { data: filesData } = await filesQuery.order('created_at', { ascending: false });

    const { data: foldersData } = await supabase
      .from('folders')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .eq('parent_id', currentFolder?.id || null)
      .order('name', { ascending: true });

    if (currentFolder) {
      const { data: folderData } = await supabase
        .from('folders')
        .select('is_leaf')
        .eq('id', currentFolder.id)
        .maybeSingle();

      if (folderData) {
        setCurrentFolder({ ...currentFolder, is_leaf: folderData.is_leaf });
      }
    }

    setFiles(filesData || []);
    setFolders(foldersData || []);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const mockFile: File = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedFile.name,
      file_type: selectedFile.name.split('.').pop() || 'file',
      file_size: selectedFile.size,
      file_url: URL.createObjectURL(selectedFile),
      department_id: currentDepartment?.id || '',
      uploaded_by: user?.id,
      status: 'draft',
      confidentiality: 'internal',
      tags: [],
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      folder_id: currentFolder?.id || null,
    };

    const isLeafFolder = currentFolder?.is_leaf === true;

    if (isLeafFolder) {
      setNCARPendingFile({ file: mockFile, rawFile: selectedFile });
      setShowNCARModal(true);
    } else {
      setPendingFile({ file: mockFile, name: selectedFile.name });
      setShowModal(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfidentialityConfirm = (confidentiality: ConfidentialityLevel, assignees: string[]) => {
    if (editingFile) {
      const updatedFiles = files.map((f) =>
        f.id === editingFile.id ? { ...f, confidentiality, assignees } : f
      );
      setFiles(updatedFiles);
      showToast('Confidentiality updated successfully');
      setEditingFile(null);
    } else if (pendingFile) {
      const newFile: File = {
        ...pendingFile.file,
        confidentiality,
        assignees,
      };
      setFiles([newFile, ...files]);
      showToast('File uploaded with confidentiality applied');
      setPendingFile(null);
    }
    setShowModal(false);
  };

  const handleEditConfidentiality = (file: File) => {
    setEditingFile(file);
    setShowModal(true);
    setFileMenuOpen(null);
  };

  const handleEditOffline = (file: File) => {
    setCheckoutMenuFile(file);
    setFileMenuOpen(null);
  };

  const handleCheckoutChange = () => {
    loadFiles();
  };

  const handleUploadVersion = (file: File) => {
    setVersionUploadFile(file);
    setFileMenuOpen(null);
  };

  const handleManagePermissions = (file: File) => {
    navigate(`/files/${file.id}/permissions`);
    setFileMenuOpen(null);
  };

  const canManagePermissions = () => {
    return user?.role === 'admin' || user?.site_department_manager || false;
  };

  const isPermissionsFeatureEnabled = () => {
    return settingsService.isDocumentPermissionsEnabled();
  };

  const handleVersionUploadSuccess = () => {
    loadFiles();
    showToast('New version uploaded successfully');
  };

  const handleNCARSave = async (metadata: NCARMetadata) => {
    if (!ncarPendingFile || !currentDepartment) {
      throw new Error('Missing file or department information');
    }

    const newFile: File = {
      ...ncarPendingFile.file,
      confidentiality: metadata.confidentiality.toLowerCase() as any,
      status: metadata.documentStatus.toLowerCase() as any,
    };

    setFiles([newFile, ...files]);
    showToast('Document uploaded with NCAR metadata');
    setNCARPendingFile(null);
    setShowNCARModal(false);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const canUserAccessFile = (file: File): boolean => {
    const currentUser = user?.full_name || 'John Doe';

    if (file.confidentiality === 'public') return true;

    if (file.uploaded_by === user?.id) return true;

    if (file.assignees && file.assignees.includes(currentUser)) return true;

    if (user?.role === 'admin' || user?.site_department_manager) return true;

    return false;
  };

  const navigateToFolder = (folder: Folder) => {
    setCurrentFolder(folder);
    setBreadcrumbs([...breadcrumbs, folder]);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      const folder = breadcrumbs[index];
      setCurrentFolder(folder);
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf' || type === 'doc' || type === 'docx' || type === 'txt') {
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    if (type === 'xlsx' || type === 'xls' || type === 'csv') {
      return { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-100' };
    }
    if (type === 'jpg' || type === 'jpeg' || type === 'png' || type === 'gif' || type === 'svg') {
      return { icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' };
    }
    if (type === 'mp4' || type === 'avi' || type === 'mov' || type === 'wmv') {
      return { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
    return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const toggleFileSelection = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const clearFilters = () => {
    setFilters({
      fileType: 'Any',
      status: 'Any',
      confidentiality: 'Any',
      modifiedBy: 'Any',
      modifiedDate: 'Any',
      tags: 'Any',
    });
  };

  const filteredFiles = files.filter((file) => {
    if (!canUserAccessFile(file)) return false;

    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'Any' || file.status === filters.status.toLowerCase();
    const matchesConfidentiality =
      filters.confidentiality === 'Any' || file.confidentiality === filters.confidentiality.toLowerCase();
    const matchesFileType = filters.fileType === 'Any' || file.file_type === filters.fileType.toLowerCase();
    return matchesSearch && matchesStatus && matchesConfidentiality && matchesFileType;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'review':
        return 'bg-amber-100 text-amber-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getConfidentialityBadgeStyles = (confidentiality: string) => {
    switch (confidentiality) {
      case 'public':
        return 'bg-blue-100 text-blue-700';
      case 'internal':
        return 'bg-cyan-100 text-cyan-700';
      case 'confidential':
        return 'bg-orange-100 text-orange-700';
      case 'restricted':
        return 'bg-red-100 text-red-700';
      case 'secret':
        return 'bg-red-200 text-red-800';
      case 'top_secret':
        return 'bg-red-300 text-red-900';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isRestrictedFile = (confidentiality: string) => {
    return ['confidential', 'secret', 'top_secret'].includes(confidentiality);
  };

  const totalFiles = files.length + folders.length;

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
                <p className="text-gray-500 text-sm">{totalFiles} files</p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              <button className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium shadow-sm">
                <FolderPlus className="w-4 h-4" />
                Create New
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex gap-4 items-center mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files by name, type, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  showFilters
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">file Type</label>
                    <select
                      value={filters.fileType}
                      onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>PDF</option>
                      <option>DOCX</option>
                      <option>XLSX</option>
                      <option>JPG</option>
                      <option>PNG</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Draft</option>
                      <option>Review</option>
                      <option>Approved</option>
                      <option>Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">confidentiality</label>
                    <select
                      value={filters.confidentiality}
                      onChange={(e) => setFilters({ ...filters, confidentiality: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Public</option>
                      <option>Internal</option>
                      <option>Confidential</option>
                      <option>Restricted</option>
                      <option>Secret</option>
                      <option>Top Secret</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">modified By</label>
                    <select
                      value={filters.modifiedBy}
                      onChange={(e) => setFilters({ ...filters, modifiedBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">modified Date</label>
                    <select
                      value={filters.modifiedDate}
                      onChange={(e) => setFilters({ ...filters, modifiedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">tags</label>
                    <select
                      value={filters.tags}
                      onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Any</option>
                      <option>Finance</option>
                      <option>HR</option>
                      <option>Marketing</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Files</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedFiles.size} Selected
              </span>
              {selectedFiles.size > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Move to folder"
                  >
                    <FolderIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/>
              </svg>
              Press & Hold CTRL for Multiple Selection
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => navigateToFolder(folder)}
                    className="p-5 border-2 border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                      <FolderIcon className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
                  </button>
                ))}

                {filteredFiles.map((file) => {
                  const { icon: Icon, color, bg } = getFileIcon(file.file_type);
                  const isSelected = selectedFiles.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={(e) => toggleFileSelection(file.id, e)}
                      className={`relative p-5 border-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                        <Icon className={`w-7 h-7 ${color}`} />
                      </div>

                      <div className="absolute top-3 right-3 flex gap-2">
                        {isRestrictedFile(file.confidentiality) && (
                          <div className="bg-red-100 p-1.5 rounded">
                            <Lock className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {(file as any).checked_out && (
                          <div className="bg-amber-100 p-1.5 rounded" title={`Checked out by ${(file as any).checked_out_user?.full_name || 'Unknown'}`}>
                            <Lock className="w-4 h-4 text-amber-600" />
                          </div>
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileMenuOpen(fileMenuOpen === file.id ? null : file.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          {fileMenuOpen === file.id && (
                            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => handleEditOffline(file)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Offline
                              </button>
                              <button
                                onClick={() => handleUploadVersion(file)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                              >
                                <Upload className="w-4 h-4" />
                                Upload New Version
                              </button>
                              <button
                                onClick={() => handleEditConfidentiality(file)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                              >
                                <Lock className="w-4 h-4" />
                                Edit Confidentiality
                              </button>
                              {isPermissionsFeatureEnabled() && canManagePermissions() && (
                                <button
                                  onClick={() => handleManagePermissions(file)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  Manage Permissions
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{file.name}</p>
                      {(file as any).checked_out && (
                        <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Checked out by {(file as any).checked_out_user?.full_name || 'Unknown'}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadgeStyles(file.status)}`}>
                          {file.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${getConfidentialityBadgeStyles(file.confidentiality)}`}>
                          {isRestrictedFile(file.confidentiality) && <Lock className="w-3 h-3" />}
                          {file.confidentiality}
                        </span>
                      </div>

                      {isRestrictedFile(file.confidentiality) && file.assignees && file.assignees.length > 0 && (
                        <div className="mb-3 p-2 bg-amber-50 rounded-lg">
                          <p className="text-xs font-medium text-amber-800 mb-1">Authorized Users:</p>
                          <p className="text-xs text-amber-700">{file.assignees.slice(0, 2).join(', ')}
                            {file.assignees.length > 2 && ` +${file.assignees.length - 2} more`}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1 text-xs text-gray-600 mb-3">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">{formatFileSize(file.file_size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modified:</span>
                          <span className="font-medium">{formatDate(file.modified_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>By:</span>
                          <span className="font-medium">John Doe</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {file.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs text-gray-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => navigateToFolder(folder)}
                    className="w-full p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{folder.name}</p>
                      <p className="text-sm text-gray-500">Folder</p>
                    </div>
                  </button>
                ))}

                {filteredFiles.map((file) => {
                  const { icon: Icon, color, bg } = getFileIcon(file.file_type);
                  const isSelected = selectedFiles.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={(e) => toggleFileSelection(file.id, e)}
                      className={`relative p-4 border rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {isSelected && (
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 mb-1">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.file_size)} • Modified {formatDate(file.modified_at)} by John Doe
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadgeStyles(file.status)}`}>
                            {file.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${getConfidentialityBadgeStyles(file.confidentiality)}`}>
                            {isRestrictedFile(file.confidentiality) && <Lock className="w-3 h-3" />}
                            {file.confidentiality}
                          </span>
                          {file.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs text-gray-600">
                              #{tag}
                            </span>
                          ))}
                          {(file as any).checked_out && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              {(file as any).checked_out_user?.full_name || 'Checked out'}
                            </span>
                          )}
                          <div className="relative ml-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileMenuOpen(fileMenuOpen === file.id ? null : file.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                            {fileMenuOpen === file.id && (
                              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <button
                                  onClick={() => handleEditOffline(file)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Offline
                                </button>
                                <button
                                  onClick={() => handleUploadVersion(file)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                                >
                                  <Upload className="w-4 h-4" />
                                  Upload New Version
                                </button>
                                <button
                                  onClick={() => handleEditConfidentiality(file)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                                >
                                  <Lock className="w-4 h-4" />
                                  Edit Confidentiality
                                </button>
                                {isPermissionsFeatureEnabled() && canManagePermissions() && (
                                  <button
                                    onClick={() => handleManagePermissions(file)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    Manage Permissions
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

      </div>

      <SetConfidentialityModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingFile(null);
          setEditingFile(null);
        }}
        onConfirm={handleConfidentialityConfirm}
        fileName={editingFile?.name || pendingFile?.name || ''}
        mode={editingFile ? 'edit' : 'upload'}
        existingConfidentiality={editingFile?.confidentiality as any}
        existingAssignees={editingFile?.assignees}
      />

      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-up">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {checkoutMenuFile && (
        <FileCheckoutMenu
          fileId={checkoutMenuFile.id}
          fileName={checkoutMenuFile.name}
          fileUrl={checkoutMenuFile.file_url}
          onClose={() => setCheckoutMenuFile(null)}
          onCheckoutChange={handleCheckoutChange}
        />
      )}

      {versionUploadFile && currentDepartment && (
        <UploadVersionModal
          fileId={versionUploadFile.id}
          fileName={versionUploadFile.name}
          currentVersion={(versionUploadFile as any).version_number || 1}
          departmentId={currentDepartment.id}
          onClose={() => setVersionUploadFile(null)}
          onSuccess={handleVersionUploadSuccess}
        />
      )}

      {showNCARModal && ncarPendingFile && (
        <NCARMetadataModal
          mode="upload"
          fileName={ncarPendingFile.file.name}
          fileData={ncarPendingFile.rawFile}
          folderId={currentFolder?.id || null}
          onClose={() => {
            setShowNCARModal(false);
            setNCARPendingFile(null);
          }}
          onSave={handleNCARSave}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, FileText, Image, FileSpreadsheet, Video, FileArchive, File as FileIcon, Folder } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { File } from '../types';
import { FileSearchBar, SearchFilters } from './FileSearchBar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { currentDepartment } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    fileType: 'Any',
    status: 'Any',
    confidentiality: 'Any',
    modifiedBy: 'Any',
    modifiedDate: 'Any',
    tags: 'Any',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentDepartment) {
      loadFiles();
    }
  }, [isOpen, currentDepartment]);

  const loadFiles = async () => {
    if (!currentDepartment) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFiles(data);
    }
    setIsLoading(false);
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filters.status === 'Any' || file.status === filters.status.toLowerCase();
    const matchesConfidentiality =
      filters.confidentiality === 'Any' || file.confidentiality === filters.confidentiality.toLowerCase();
    const matchesFileType = filters.fileType === 'Any' || file.file_type.toLowerCase() === filters.fileType.toLowerCase();
    return matchesSearch && matchesStatus && matchesConfidentiality && matchesFileType;
  });

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf' || type === 'doc' || type === 'docx' || type === 'txt') {
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    if (type === 'xlsx' || type === 'xls' || type === 'csv') {
      return { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-100' };
    }
    if (type === 'jpg' || type === 'jpeg' || type === 'png' || type === 'gif' || type === 'svg') {
      return { icon: Image, color: 'text-emerald-600', bg: 'bg-emerald-100' };
    }
    if (type === 'mp4' || type === 'avi' || type === 'mov' || type === 'wmv') {
      return { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
    return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-gray-50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Search Files</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          <FileSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => {
                const { icon: Icon, color, bg } = getFileIcon(file.file_type);

                return (
                  <div
                    key={file.id}
                    className="bg-white p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeStyles(file.status)}`}>
                        {file.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Modified: {formatDate(file.modified_at)}</span>
                    </div>

                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {file.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs text-gray-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

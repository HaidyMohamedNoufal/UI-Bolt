import { useState, useEffect } from 'react';
import { Users, Download, Trash2, FolderInput, FileText, Image, FileSpreadsheet, Video, FileArchive, File as FileIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { File } from '../types';

export function SharedFiles() {
  const { currentDepartment } = useApp();
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSharedFiles();
  }, [currentDepartment]);

  const loadSharedFiles = async () => {
    if (!currentDepartment) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .in('confidentiality', ['public', 'internal'])
      .order('modified_at', { ascending: false });

    if (!error && data) {
      setFiles(data);
    }
    setIsLoading(false);
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(type)) {
      return <Image className="w-8 h-8 text-emerald-500" />;
    }
    if (['pdf'].includes(type)) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(type)) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(type)) {
      return <Video className="w-8 h-8 text-purple-500" />;
    }
    if (['zip', 'rar', '7z', 'tar'].includes(type)) {
      return <FileArchive className="w-8 h-8 text-orange-500" />;
    }
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getConfidentialityBadge = (confidentiality: string) => {
    const colors = {
      public: 'bg-blue-100 text-blue-700',
      internal: 'bg-cyan-100 text-cyan-700',
      confidential: 'bg-orange-100 text-orange-700',
      restricted: 'bg-red-100 text-red-700',
    };
    return colors[confidentiality as keyof typeof colors] || colors.internal;
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              Shared Files
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Files shared across the department
            </p>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shared files</h3>
            <p className="text-gray-500">Shared files will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.file_type)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500">{file.file_type.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidentialityBadge(file.confidentiality)}`}>
                          {file.confidentiality}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.modified_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-gray-400 hover:text-emerald-500">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-blue-500">
                            <FolderInput className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

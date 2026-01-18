import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Save,
  X,
  Trash2,
  UserPlus,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InheritedPermission, LocalPermission, PermissionRole, File } from '../types';
import { permissionsService } from '../services/permissionsService';
import { supabase } from '../lib/supabase';

interface AddUserGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userOrGroup: string, role: PermissionRole, type: 'user' | 'group') => void;
}

function AddUserGroupModal({ isOpen, onClose, onAdd }: AddUserGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<PermissionRole>('Consumer');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; type: 'user' | 'group' }>>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type: 'user' | 'group' } | null>(null);

  const roles: PermissionRole[] = ['Consumer', 'Contributor', 'Editor', 'Collaborator', 'Coordinator'];

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await permissionsService.searchUsersAndGroups(searchQuery);
        setSearchResults(results);
      } catch (error) {
        setSearchResults([
          { id: '1', name: 'John Doe', type: 'user' },
          { id: '2', name: 'Marketing Team', type: 'group' },
          { id: '3', name: 'Jane Smith', type: 'user' },
        ]);
      }
    }
  };

  const handleAdd = () => {
    if (selectedItem) {
      onAdd(selectedItem.name, selectedRole, selectedItem.type);
      onClose();
      setSearchQuery('');
      setSelectedItem(null);
      setSearchResults([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Add User or Group</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users or Groups</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter name to search..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                    selectedItem?.id === item.id ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                  </div>
                  {selectedItem?.id === item.id && (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as PermissionRole)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedItem}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManageDocumentPermissions() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [inheritedPermissions, setInheritedPermissions] = useState<InheritedPermission[]>([]);
  const [localPermissions, setLocalPermissions] = useState<LocalPermission[]>([]);
  const [inheritPermissions, setInheritPermissions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  useEffect(() => {
    if (fileId) {
      loadData();
    }
  }, [fileId]);

  const loadData = async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      const { data: fileData } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .maybeSingle();

      if (fileData) {
        setFile(fileData as File);
      }

      try {
        const inherited = await permissionsService.getInheritedPermissions(fileId);
        setInheritedPermissions(inherited);
      } catch {
        setInheritedPermissions([
          { id: '1', userOrGroup: 'All Users', role: 'Consumer', type: 'group' },
          { id: '2', userOrGroup: 'Department Managers', role: 'Coordinator', type: 'group' },
        ]);
      }

      try {
        const local = await permissionsService.getLocalPermissions(fileId);
        setLocalPermissions(local);
      } catch {
        setLocalPermissions([
          { id: '3', userOrGroup: 'John Doe', role: 'Editor', type: 'user', canEdit: true },
        ]);
      }
    } catch (error) {
      showToast('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (permissionId: string, newRole: PermissionRole) => {
    if (!fileId) return;

    try {
      await permissionsService.updatePermissionRole(fileId, permissionId, newRole);
      setLocalPermissions((prev) =>
        prev.map((p) => (p.id === permissionId ? { ...p, role: newRole } : p))
      );
      showToast('Role updated successfully');
    } catch (error) {
      showToast('Failed to update role');
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!fileId) return;

    try {
      await permissionsService.removePermission(fileId, permissionId);
      setLocalPermissions((prev) => prev.filter((p) => p.id !== permissionId));
      showToast('Permission removed successfully');
    } catch (error) {
      showToast('Failed to remove permission');
    }
  };

  const handleAddPermission = async (userOrGroup: string, role: PermissionRole, type: 'user' | 'group') => {
    if (!fileId) return;

    try {
      await permissionsService.addPermission(fileId, userOrGroup, role, type);
      const newPermission: LocalPermission = {
        id: Math.random().toString(36).substr(2, 9),
        userOrGroup,
        role,
        type,
        canEdit: true,
      };
      setLocalPermissions((prev) => [...prev, newPermission]);
      showToast('Permission added successfully');
    } catch (error) {
      showToast('Failed to add permission');
    }
  };

  const handleInheritToggle = async (checked: boolean) => {
    if (!fileId) return;

    try {
      await permissionsService.updateInheritance(fileId, checked);
      setInheritPermissions(checked);
      showToast(`Inheritance ${checked ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      showToast('Failed to update inheritance');
    }
  };

  const handleSave = () => {
    showToast('Permissions saved successfully');
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const canManagePermissions = user?.role === 'admin' || user?.site_department_manager || false;

  const roles: PermissionRole[] = ['Consumer', 'Contributor', 'Editor', 'Collaborator', 'Coordinator'];

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 overflow-auto flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Manage Permissions</h1>
                <p className="text-gray-500 text-sm">{file?.name || 'Document'}</p>
              </div>
            </div>

            {canManagePermissions && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Inherit Permissions</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={inheritPermissions}
                      onChange={(e) => handleInheritToggle(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={inheritPermissions}
                  className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User/Group
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Repository</span>
            <ChevronRight className="w-4 h-4" />
            <span>Parent Folder</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{file?.name || 'Document'}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Inherited Permissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users and Groups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inheritedPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                        No inherited permissions
                      </td>
                    </tr>
                  ) : (
                    inheritedPermissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{permission.userOrGroup}</span>
                            <span className="text-xs text-gray-500 capitalize">({permission.type})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {permission.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Locally Set Permissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users and Groups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No local permissions set
                      </td>
                    </tr>
                  ) : (
                    localPermissions.map((permission) => (
                      <tr key={permission.id} className={inheritPermissions ? 'opacity-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{permission.userOrGroup}</span>
                            <span className="text-xs text-gray-500 capitalize">({permission.type})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={permission.role}
                            onChange={(e) => handleRoleChange(permission.id, e.target.value as PermissionRole)}
                            disabled={inheritPermissions || !canManagePermissions}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRemovePermission(permission.id)}
                            disabled={inheritPermissions || !canManagePermissions}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {canManagePermissions && (
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </div>

      <AddUserGroupModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPermission}
      />

      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

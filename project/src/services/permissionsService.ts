import { InheritedPermission, LocalPermission, PermissionRole } from '../types';

export const permissionsService = {
  async getInheritedPermissions(documentId: string): Promise<InheritedPermission[]> {
    const response = await fetch(`/api/documents/${documentId}/permissions/inherited`);
    if (!response.ok) {
      throw new Error('Failed to fetch inherited permissions');
    }
    return response.json();
  },

  async getLocalPermissions(documentId: string): Promise<LocalPermission[]> {
    const response = await fetch(`/api/documents/${documentId}/permissions/local`);
    if (!response.ok) {
      throw new Error('Failed to fetch local permissions');
    }
    return response.json();
  },

  async updatePermissionRole(documentId: string, permissionId: string, role: PermissionRole): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}/permissions/${permissionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      throw new Error('Failed to update permission role');
    }
  },

  async removePermission(documentId: string, permissionId: string): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove permission');
    }
  },

  async addPermission(
    documentId: string,
    userOrGroup: string,
    role: PermissionRole,
    type: 'user' | 'group'
  ): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userOrGroup, role, type }),
    });
    if (!response.ok) {
      throw new Error('Failed to add permission');
    }
  },

  async updateInheritance(documentId: string, inherit: boolean): Promise<void> {
    const response = await fetch(`/api/documents/${documentId}/permissions/inheritance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inherit }),
    });
    if (!response.ok) {
      throw new Error('Failed to update inheritance setting');
    }
  },

  async searchUsersAndGroups(query: string): Promise<Array<{ id: string; name: string; type: 'user' | 'group' }>> {
    const response = await fetch(`/api/search/users-groups?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search users and groups');
    }
    return response.json();
  },
};

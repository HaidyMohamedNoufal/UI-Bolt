import { supabase } from '../lib/supabase';

export interface VersionInfo {
  id: string;
  file_id: string;
  version_number: number;
  version_type: 'major' | 'minor';
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  change_notes: string | null;
  metadata: any;
  uploader_name?: string;
}

export interface UploadVersionOptions {
  fileId: string;
  userId: string;
  departmentId: string;
  newFileUrl: string;
  newFileSize: number;
  versionType: 'major' | 'minor';
  changeNotes?: string;
}

export const versionService = {
  async uploadNewVersion(options: UploadVersionOptions): Promise<{ success: boolean; error?: string; newVersion?: number }> {
    const { fileId, userId, departmentId, newFileUrl, newFileSize, versionType, changeNotes } = options;

    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*, checked_out, checked_out_by')
      .eq('id', fileId)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    if (file.checked_out && file.checked_out_by !== userId) {
      return {
        success: false,
        error: 'Cannot upload new version: File is checked out by another user'
      };
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('site_department_manager, can_manage_dept_tasks')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      return { success: false, error: userError.message };
    }

    const isOwner = file.uploaded_by === userId;
    const isManager = user?.site_department_manager || user?.can_manage_dept_tasks;

    if (!isOwner && !isManager) {
      return {
        success: false,
        error: 'You do not have permission to upload a new version of this file'
      };
    }

    const currentVersion = file.version_number || 1;
    const newVersion = versionType === 'major'
      ? Math.floor(currentVersion) + 1
      : currentVersion + 0.1;

    const versionMetadata = {
      name: file.name,
      file_type: file.file_type,
      status: file.status,
      confidentiality: file.confidentiality,
      tags: file.tags,
      department_id: file.department_id,
    };

    const { error: versionError } = await supabase
      .from('file_versions')
      .insert({
        file_id: fileId,
        version_number: currentVersion,
        version_type: versionType,
        file_url: file.file_url,
        file_size: file.file_size,
        uploaded_by: userId,
        change_notes: changeNotes || null,
        metadata: versionMetadata,
      });

    if (versionError) {
      return { success: false, error: `Failed to save version history: ${versionError.message}` };
    }

    const { error: updateError } = await supabase
      .from('files')
      .update({
        file_url: newFileUrl,
        file_size: newFileSize,
        version_number: Number(newVersion.toFixed(1)),
        modified_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    if (updateError) {
      return { success: false, error: `Failed to update file: ${updateError.message}` };
    }

    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        entity_type: 'file',
        entity_id: fileId,
        action: 'version_uploaded',
        user_id: userId,
        department_id: departmentId,
        details: {
          version_from: currentVersion,
          version_to: newVersion,
          version_type: versionType,
          file_name: file.name,
          change_notes: changeNotes || null,
        },
      });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return { success: true, newVersion };
  },

  async getVersionHistory(fileId: string): Promise<VersionInfo[]> {
    const { data, error } = await supabase
      .from('file_versions')
      .select(`
        *,
        uploader:users!file_versions_uploaded_by_fkey(full_name)
      `)
      .eq('file_id', fileId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Failed to fetch version history:', error);
      return [];
    }

    return (data || []).map((version: any) => ({
      ...version,
      uploader_name: version.uploader?.full_name,
    }));
  },

  async getLatestVersion(fileId: string): Promise<number> {
    const { data, error } = await supabase
      .from('files')
      .select('version_number')
      .eq('id', fileId)
      .maybeSingle();

    if (error || !data) {
      return 1;
    }

    return data.version_number || 1;
  },

  async canUploadVersion(fileId: string, userId: string): Promise<{ canUpload: boolean; reason?: string }> {
    const { data: file, error } = await supabase
      .from('files')
      .select('uploaded_by, checked_out, checked_out_by, department_id')
      .eq('id', fileId)
      .maybeSingle();

    if (error || !file) {
      return { canUpload: false, reason: 'File not found' };
    }

    if (file.checked_out && file.checked_out_by !== userId) {
      return { canUpload: false, reason: 'File is checked out by another user' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('site_department_manager, can_manage_dept_tasks')
      .eq('id', userId)
      .maybeSingle();

    const isOwner = file.uploaded_by === userId;
    const isManager = user?.site_department_manager || user?.can_manage_dept_tasks;

    if (!isOwner && !isManager) {
      return { canUpload: false, reason: 'You do not have permission to upload versions' };
    }

    return { canUpload: true };
  },
};

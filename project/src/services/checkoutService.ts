import { supabase } from '../lib/supabase';

export interface CheckoutInfo {
  checked_out: boolean;
  checked_out_by: string | null;
  checked_out_at: string | null;
  checkout_notes: string | null;
  version_number: number;
  checker_name?: string;
}

export const checkoutService = {
  async checkOut(fileId: string, userId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('checked_out, checked_out_by')
      .eq('id', fileId)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    if (file.checked_out && file.checked_out_by !== userId) {
      return { success: false, error: 'File is already checked out by another user' };
    }

    const { error } = await supabase
      .from('files')
      .update({
        checked_out: true,
        checked_out_by: userId,
        checked_out_at: new Date().toISOString(),
        checkout_notes: notes || null,
      })
      .eq('id', fileId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async checkIn(fileId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('checked_out, checked_out_by, version_number')
      .eq('id', fileId)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    if (!file.checked_out) {
      return { success: false, error: 'File is not checked out' };
    }

    if (file.checked_out_by !== userId) {
      return { success: false, error: 'You do not have permission to check in this file' };
    }

    const { error } = await supabase
      .from('files')
      .update({
        checked_out: false,
        checked_out_by: null,
        checked_out_at: null,
        checkout_notes: null,
        version_number: (file.version_number || 1) + 1,
        modified_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async cancelCheckout(fileId: string, userId: string, isManager: boolean = false): Promise<{ success: boolean; error?: string }> {
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('checked_out, checked_out_by')
      .eq('id', fileId)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    if (!file.checked_out) {
      return { success: false, error: 'File is not checked out' };
    }

    if (file.checked_out_by !== userId && !isManager) {
      return { success: false, error: 'You do not have permission to cancel this checkout' };
    }

    const { error } = await supabase
      .from('files')
      .update({
        checked_out: false,
        checked_out_by: null,
        checked_out_at: null,
        checkout_notes: null,
      })
      .eq('id', fileId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async getCheckoutInfo(fileId: string): Promise<CheckoutInfo | null> {
    const { data, error } = await supabase
      .from('files')
      .select(`
        checked_out,
        checked_out_by,
        checked_out_at,
        checkout_notes,
        version_number,
        checker:users!files_checked_out_by_fkey(full_name)
      `)
      .eq('id', fileId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      checked_out: data.checked_out || false,
      checked_out_by: data.checked_out_by,
      checked_out_at: data.checked_out_at,
      checkout_notes: data.checkout_notes,
      version_number: data.version_number || 1,
      checker_name: (data as any).checker?.full_name,
    };
  },

  async getMyCheckedOutFiles(userId: string, departmentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('checked_out', true)
      .eq('checked_out_by', userId)
      .eq('department_id', departmentId)
      .order('checked_out_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  },
};

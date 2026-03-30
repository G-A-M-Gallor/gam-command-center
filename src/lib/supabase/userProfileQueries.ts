import { _createClient } from './client';

export type UserRole = 'internal' | 'client' | 'talent' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  workspace_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) return null;
  return getUserProfile(_user.id);
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);
  return !error;
}

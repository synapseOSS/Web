import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface UserProfile {
  uid: string;
  username: string;
  display_name: string;
  email?: string;
  bio?: string;
  avatar: string;
  profile_cover_image?: string;
  verify: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following?: boolean;
  is_followed_by?: boolean;
  region?: string;
  join_date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  
  currentProfile = signal<UserProfile | null>(null);
  viewedProfile = signal<UserProfile | null>(null);
  loading = signal(false);

  async fetchProfile(username: string) {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      const currentUserId = this.auth.currentUser()?.id;
      let isFollowing = false;
      let isFollowedBy = false;

      if (currentUserId && data.uid !== currentUserId) {
        isFollowing = await this.checkIfFollowing(currentUserId, data.uid);
        isFollowedBy = await this.checkIfFollowing(data.uid, currentUserId);
      }

      const profile = {
        ...data,
        is_following: isFollowing,
        is_followed_by: isFollowedBy
      };

      this.viewedProfile.set(profile);
      return profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async fetchCurrentUserProfile() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('uid', userId)
        .single();

      if (error) throw error;
      this.currentProfile.set(data);
      return data;
    } catch (err) {
      console.error('Error fetching current profile:', err);
    }
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    return !!data;
  }

  async updateProfile(updates: Partial<UserProfile>) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('uid', userId);

      if (error) throw error;
      await this.fetchCurrentUserProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('user-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      await this.updateProfile({ avatar: data.publicUrl });
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      throw err;
    }
  }

  async uploadCoverImage(file: File): Promise<string> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_cover_${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('user-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      await this.updateProfile({ profile_cover_image: data.publicUrl });
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading cover image:', err);
      throw err;
    }
  }

  async fetchUserPosts(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:author_uid (
            uid,
            username,
            display_name,
            avatar,
            verify
          )
        `)
        .eq('author_uid', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user posts:', err);
      return [];
    }
  }

  async fetchFollowers(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          follower_id,
          users:follower_id (
            uid,
            username,
            display_name,
            avatar,
            verify,
            followers_count
          )
        `)
        .eq('following_id', userId);

      if (error) throw error;
      return (data || []).map((f: any) => f.users);
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  }

  async fetchFollowing(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          following_id,
          users:following_id (
            uid,
            username,
            display_name,
            avatar,
            verify,
            followers_count
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;
      return (data || []).map((f: any) => f.users);
    } catch (err) {
      console.error('Error fetching following:', err);
      return [];
    }
  }

  constructor() {
    this.fetchCurrentUserProfile();
  }
}

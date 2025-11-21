import { Injectable, signal, inject, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ImageUploadService } from './image-upload.service';

export interface UserProfile {
  id: string;
  uid: string;
  email?: string;
  username: string;
  nickname?: string;
  display_name: string;
  biography?: string;
  bio?: string;
  avatar: string;
  profile_image_url?: string;
  profile_cover_image?: string;
  account_premium: boolean;
  user_level_xp: number;
  verify: boolean;
  account_type: string;
  gender: string;
  banned: boolean;
  status: string;
  join_date?: string;
  last_seen?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  region?: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateData {
  display_name?: string;
  username?: string;
  bio?: string;
  biography?: string;
  avatar?: string;
  profile_cover_image?: string;
  region?: string;
  gender?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private imageUpload = inject(ImageUploadService);

  currentProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Load profile when user is authenticated
    const checkUser = () => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadCurrentUserProfile();
      } else {
        this.currentProfile.set(null);
      }
    };
    
    // Initial check
    checkUser();
    
    // Watch for auth changes
    this.supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
  }

  async loadCurrentUserProfile() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();

      if (error) throw error;
      
      this.currentProfile.set(data as UserProfile);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      this.error.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }

  async getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }

  async updateProfile(updates: ProfileUpdateData): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) {
      this.error.set('Not authenticated');
      return false;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('uid', user.id)
        .select()
        .single();

      if (error) throw error;

      this.currentProfile.set(data as UserProfile);
      return true;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      this.error.set(err.message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async uploadAvatar(file: File): Promise<string | null> {
    const user = this.auth.currentUser();
    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    try {
      console.log('Uploading avatar...');
      
      const url = await this.imageUpload.uploadImage(file, `avatar-${user.id}`);
      
      if (!url) {
        throw new Error('Upload failed');
      }

      console.log('✅ Avatar uploaded:', url);
      return url;
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      this.error.set(err.message || 'Failed to upload avatar');
      return null;
    }
  }

  async uploadCoverImage(file: File): Promise<string | null> {
    const user = this.auth.currentUser();
    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    try {
      console.log('Uploading cover image...');
      
      const url = await this.imageUpload.uploadImage(file, `cover-${user.id}`);
      
      if (!url) {
        throw new Error('Upload failed');
      }

      console.log('✅ Cover image uploaded:', url);
      return url;
    } catch (err: any) {
      console.error('Error uploading cover image:', err);
      this.error.set(err.message || 'Failed to upload cover image');
      return null;
    }
  }

  async getUserPosts(uid: string) {
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
            verify,
            followers_count,
            following_count
          )
        `)
        .eq('author_uid', uid)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user posts:', err);
      return [];
    }
  }

  async followUser(targetUid: string): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) return false;

    try {
      const { error } = await this.supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUid
        });

      if (error) throw error;

      // Update counts
      await this.updateFollowCounts(user.id, targetUid);
      return true;
    } catch (err) {
      console.error('Error following user:', err);
      return false;
    }
  }

  async unfollowUser(targetUid: string): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) return false;

    try {
      const { error } = await this.supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUid);

      if (error) throw error;

      // Update counts
      await this.updateFollowCounts(user.id, targetUid);
      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      return false;
    }
  }

  async isFollowing(targetUid: string): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) return false;

    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUid)
        .single();

      return !!data;
    } catch (err) {
      return false;
    }
  }

  private async updateFollowCounts(followerId: string, followingId: string) {
    // Update follower's following_count
    const { data: followerData } = await this.supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId);

    await this.supabase
      .from('users')
      .update({ following_count: followerData?.length || 0 })
      .eq('uid', followerId);

    // Update following's followers_count
    const { data: followingData } = await this.supabase
      .from('follows')
      .select('id')
      .eq('following_id', followingId);

    await this.supabase
      .from('users')
      .update({ followers_count: followingData?.length || 0 })
      .eq('uid', followingId);
  }

  async getFollowers(uid: string) {
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
            bio
          )
        `)
        .eq('following_id', uid);

      if (error) throw error;
      return data?.map(f => f.users) || [];
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  }

  async getFollowing(uid: string) {
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
            bio
          )
        `)
        .eq('follower_id', uid);

      if (error) throw error;
      return data?.map(f => f.users) || [];
    } catch (err) {
      console.error('Error fetching following:', err);
      return [];
    }
  }
}

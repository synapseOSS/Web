import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  content?: string;
  duration: number;
  created_at: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  is_viewed?: boolean;
  user?: {
    uid: string;
    username: string;
    display_name: string;
    avatar: string;
    verify: boolean;
  };
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  
  stories = signal<Story[]>([]);
  myStories = signal<Story[]>([]);
  storyViews = signal<StoryView[]>([]);
  loading = signal(false);

  async fetchStories() {
    this.loading.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      
      // Fetch stories from followed users
      const { data: followingData } = await this.supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId || '');

      const followingIds = (followingData || []).map((f: any) => f.following_id);
      
      const { data, error } = await this.supabase
        .from('stories')
        .select(`
          *,
          users:user_id (
            uid,
            username,
            display_name,
            avatar,
            verify
          )
        `)
        .in('user_id', followingIds)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which stories have been viewed
      const storiesWithViews = await Promise.all(
        (data || []).map(async (story: any) => {
          const isViewed = userId ? await this.checkIfViewed(story.id, userId) : false;
          return {
            ...story,
            user: story.users,
            is_viewed: isViewed
          };
        })
      );

      this.stories.set(storiesWithViews);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchMyStories() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.myStories.set(data || []);
    } catch (err) {
      console.error('Error fetching my stories:', err);
    }
  }

  async checkIfViewed(storyId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('story_views')
      .select('id')
      .eq('story_id', storyId)
      .eq('viewer_id', userId)
      .single();
    return !!data;
  }

  async createStory(file: File, content?: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Upload media
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_story_${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('user-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = this.supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      // Create story record
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: insertError } = await this.supabase
        .from('stories')
        .insert({
          user_id: userId,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          content,
          duration: 24,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) throw insertError;

      await this.fetchMyStories();
    } catch (err) {
      console.error('Error creating story:', err);
      throw err;
    }
  }

  async viewStory(storyId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      // Check if already viewed
      const alreadyViewed = await this.checkIfViewed(storyId, userId);
      if (alreadyViewed) return;

      // Record view
      const { error } = await this.supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: userId
        });

      if (error) throw error;

      // Increment views count
      await this.supabase
        .from('stories')
        .update({ views_count: this.supabase.raw('views_count + 1') })
        .eq('id', storyId);

      await this.fetchStories();
    } catch (err) {
      console.error('Error viewing story:', err);
    }
  }

  async fetchStoryViews(storyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('story_views')
        .select(`
          *,
          viewer:viewer_id (
            username,
            display_name,
            avatar
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      this.storyViews.set(data || []);
    } catch (err) {
      console.error('Error fetching story views:', err);
    }
  }

  async deleteStory(storyId: string) {
    try {
      const { error } = await this.supabase
        .from('stories')
        .update({ is_active: false })
        .eq('id', storyId);

      if (error) throw error;
      await this.fetchMyStories();
    } catch (err) {
      console.error('Error deleting story:', err);
      throw err;
    }
  }

  constructor() {
    this.fetchStories();
    this.fetchMyStories();
  }
}

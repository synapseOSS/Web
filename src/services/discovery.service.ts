import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Story, MediaType } from './story.service';

export interface ExploreStory extends Story {
  user: {
    uid: string;
    username: string;
    display_name: string;
    avatar: string;
    verify: boolean;
  };
}

export interface DiscoveryFilters {
  contentType?: MediaType;
  hashtag?: string;
  location?: string;
}

export interface UserDiscoverySettings {
  user_id: string;
  discovery_opt_out: boolean;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscoveryService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  exploreStories = signal<ExploreStory[]>([]);
  loading = signal(false);

  /**
   * Fetch explore feed - shows public stories from users the viewer doesn't follow
   * Validates: Requirements 9.1
   */
  async fetchExploreFeed(filters?: DiscoveryFilters, limit: number = 50): Promise<ExploreStory[]> {
    this.loading.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return [];

      // Get list of users the current user follows
      const { data: followingData } = await this.supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = (followingData || []).map((f: any) => f.following_id);
      
      // Add current user to exclusion list
      followingIds.push(userId);

      // Get users who have opted out of discovery
      const { data: optOutData } = await this.supabase
        .from('user_discovery_settings')
        .select('user_id')
        .eq('discovery_opt_out', true);

      const optOutUserIds = (optOutData || []).map((u: any) => u.user_id);

      // Build query for public stories from unfollowed users
      let query = this.supabase
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
        .eq('is_active', true)
        .eq('privacy_setting', 'public')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply content type filter
      if (filters?.contentType) {
        query = query.eq('media_type', filters.contentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out followed users and opted-out users client-side
      let stories = (data || []).filter((story: any) => 
        !followingIds.includes(story.user_id) && 
        !optOutUserIds.includes(story.user_id)
      );

      // Map to include user data
      stories = stories.map((story: any) => ({
        ...story,
        user: story.users
      }));

      // Apply hashtag filter if specified
      if (filters?.hashtag) {
        stories = await this.filterByHashtag(stories, filters.hashtag);
      }

      // Apply location filter if specified
      if (filters?.location) {
        stories = await this.filterByLocation(stories, filters.location);
      }

      this.exploreStories.set(stories);
      return stories;
    } catch (err) {
      console.error('Error fetching explore feed:', err);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Search stories by hashtag
   * Returns all public stories containing the specified hashtag
   * Validates: Requirements 9.2
   */
  async searchByHashtag(hashtag: string, limit: number = 50): Promise<ExploreStory[]> {
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return [];

      const normalized = hashtag.toLowerCase().replace(/^#/, '');

      // Get users who have opted out of discovery
      const { data: optOutData } = await this.supabase
        .from('user_discovery_settings')
        .select('user_id')
        .eq('discovery_opt_out', true);

      const optOutUserIds = (optOutData || []).map((u: any) => u.user_id);

      // Search for stories with the hashtag
      let query = this.supabase
        .from('story_hashtags')
        .select(`
          story_id,
          stories!inner (
            *,
            users:user_id (
              uid,
              username,
              display_name,
              avatar,
              verify
            )
          )
        `)
        .eq('normalized_hashtag', normalized)
        .eq('stories.is_active', true)
        .eq('stories.privacy_setting', 'public')
        .gt('stories.expires_at', new Date().toISOString())
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Filter out opted-out users and check privacy
      const stories: ExploreStory[] = [];
      
      for (const item of (data || [])) {
        const story = (item as any).stories;
        
        if (!story) continue;
        
        // Skip opted-out users
        if (optOutUserIds.includes(story.user_id)) continue;

        // Check if user can view the story (respects privacy)
        const canView = await this.canViewStory(story.id, userId);
        
        if (canView) {
          stories.push({
            ...story,
            user: story.users
          });
        }
      }

      return stories;
    } catch (err) {
      console.error('Error searching by hashtag:', err);
      return [];
    }
  }

  /**
   * Search stories by location
   * Returns all public stories tagged with the specified location
   * Validates: Requirements 9.3
   */
  async searchByLocation(locationQuery: string, limit: number = 50): Promise<ExploreStory[]> {
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return [];

      // Get users who have opted out of discovery
      const { data: optOutData } = await this.supabase
        .from('user_discovery_settings')
        .select('user_id')
        .eq('discovery_opt_out', true);

      const optOutUserIds = (optOutData || []).map((u: any) => u.user_id);

      // Search for stories with location elements matching the query
      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .select(`
          story_id,
          stories:story_id (
            *,
            users:user_id (
              uid,
              username,
              display_name,
              avatar,
              verify
            )
          )
        `)
        .eq('element_type', 'location')
        .ilike('element_data->>name', `%${locationQuery}%`)
        .limit(limit);

      if (error) throw error;

      // Filter for public stories that are still active and not expired
      const stories: ExploreStory[] = [];
      
      for (const item of (data || [])) {
        const story = (item as any).stories;
        
        if (!story) continue;

        // Only include public, active, non-expired stories
        if (
          story.privacy_setting === 'public' &&
          story.is_active === true &&
          new Date(story.expires_at) > new Date() &&
          !optOutUserIds.includes(story.user_id)
        ) {
          // Check if user can view the story (respects privacy)
          const canView = await this.canViewStory(story.id, userId);
          
          if (canView) {
            stories.push({
              ...story,
              user: story.users
            });
          }
        }
      }

      return stories;
    } catch (err) {
      console.error('Error searching by location:', err);
      return [];
    }
  }

  /**
   * Filter stories by content type (image/video)
   * Validates: Requirements 9.4
   */
  filterByContentType(stories: ExploreStory[], contentType: MediaType): ExploreStory[] {
    return stories.filter(story => story.media_type === contentType);
  }

  /**
   * Record a view from explore feed
   * Validates: Requirements 9.6
   */
  async recordExploreView(storyId: string, viewDuration?: number, completed: boolean = false): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      // Check if already viewed
      const { data: existingView } = await this.supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('viewer_id', userId)
        .single();

      if (existingView) return;

      // Record view atomically (same as regular story view)
      const { error } = await this.supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: userId,
          view_duration_seconds: viewDuration,
          completed
        });

      if (error) throw error;

      // Increment views count using RPC for atomicity
      await this.supabase.rpc('increment_story_views', { story_id: storyId });
    } catch (err) {
      console.error('Error recording explore view:', err);
    }
  }

  /**
   * Set discovery opt-out preference for current user
   * Validates: Requirements 9.8
   */
  async setDiscoveryOptOut(optOut: boolean): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Upsert discovery settings
      const { error } = await this.supabase
        .from('user_discovery_settings')
        .upsert({
          user_id: userId,
          discovery_opt_out: optOut,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error setting discovery opt-out:', err);
      throw err;
    }
  }

  /**
   * Get discovery opt-out preference for current user
   */
  async getDiscoveryOptOut(): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    try {
      const { data, error } = await this.supabase
        .from('user_discovery_settings')
        .select('discovery_opt_out')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, default to false
          return false;
        }
        throw error;
      }

      return data?.discovery_opt_out || false;
    } catch (err) {
      console.error('Error getting discovery opt-out:', err);
      return false;
    }
  }

  /**
   * Check if a follow action should add stories to feed
   * Validates: Requirements 9.7
   */
  async onUserFollowed(followedUserId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      // Fetch active stories from the followed user
      const { data: stories, error } = await this.supabase
        .from('stories')
        .select('id')
        .eq('user_id', followedUserId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Stories will automatically appear in feed due to RLS policies
      // This method is here for potential future enhancements like notifications
      console.log(`User ${userId} followed ${followedUserId}, ${stories?.length || 0} active stories available`);
    } catch (err) {
      console.error('Error handling user follow:', err);
    }
  }

  /**
   * Helper: Filter stories by hashtag
   */
  private async filterByHashtag(stories: ExploreStory[], hashtag: string): Promise<ExploreStory[]> {
    const normalized = hashtag.toLowerCase().replace(/^#/, '');

    try {
      const { data, error } = await this.supabase
        .from('story_hashtags')
        .select('story_id')
        .eq('normalized_hashtag', normalized);

      if (error) throw error;

      const storyIdsWithHashtag = new Set((data || []).map(h => h.story_id));
      return stories.filter(story => storyIdsWithHashtag.has(story.id));
    } catch (err) {
      console.error('Error filtering by hashtag:', err);
      return stories;
    }
  }

  /**
   * Helper: Filter stories by location
   */
  private async filterByLocation(stories: ExploreStory[], locationQuery: string): Promise<ExploreStory[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .select('story_id')
        .eq('element_type', 'location')
        .ilike('element_data->>name', `%${locationQuery}%`);

      if (error) throw error;

      const storyIdsWithLocation = new Set((data || []).map(l => l.story_id));
      return stories.filter(story => storyIdsWithLocation.has(story.id));
    } catch (err) {
      console.error('Error filtering by location:', err);
      return stories;
    }
  }

  /**
   * Check if user can view a story (respects privacy settings)
   * Validates: Requirements 9.10
   */
  private async canViewStory(storyId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('can_view_story', {
          story_uuid: storyId,
          viewer_uuid: userId
        });

      if (error) {
        // If RPC doesn't exist, fall back to basic check for public stories
        return true;
      }
      
      return data as boolean;
    } catch (err) {
      // If RPC fails, allow viewing (fail open for public stories)
      return true;
    }
  }
}

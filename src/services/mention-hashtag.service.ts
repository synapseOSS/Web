import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface StoryMention {
  id: string;
  story_id: string;
  mentioned_user_id: string;
  position_x?: number;
  position_y?: number;
  created_at: string;
  mentioned_user?: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

export interface Hashtag {
  tag: string;
  normalized_tag: string;
  story_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class MentionHashtagService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  /**
   * Validate that mentioned users exist in the system
   */
  async validateMentions(userIds: string[]): Promise<void> {
    if (!userIds || userIds.length === 0) return;

    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    // Check if all users exist
    const { data, error } = await this.supabase
      .from('users')
      .select('uid')
      .in('uid', uniqueUserIds);

    if (error) throw error;

    const existingUserIds = (data || []).map(u => u.uid);
    const missingUserIds = uniqueUserIds.filter(id => !existingUserIds.includes(id));

    if (missingUserIds.length > 0) {
      throw new Error(`Cannot mention non-existent users: ${missingUserIds.join(', ')}`);
    }
  }

  /**
   * Validate mentions by username
   */
  async validateMentionsByUsername(usernames: string[]): Promise<string[]> {
    if (!usernames || usernames.length === 0) return [];

    // Remove duplicates and clean usernames
    const uniqueUsernames = [...new Set(usernames.map(u => u.trim().toLowerCase()))];

    // Look up user IDs
    const { data, error } = await this.supabase
      .from('users')
      .select('uid, username')
      .in('username', uniqueUsernames);

    if (error) throw error;

    const foundUsers = data || [];
    const foundUsernames = foundUsers.map(u => u.username.toLowerCase());
    const missingUsernames = uniqueUsernames.filter(u => !foundUsernames.includes(u));

    if (missingUsernames.length > 0) {
      throw new Error(`Cannot mention non-existent users: @${missingUsernames.join(', @')}`);
    }

    return foundUsers.map(u => u.uid);
  }

  /**
   * Add mentions to a story
   */
  async addMentions(
    storyId: string,
    userIds: string[],
    positions?: { userId: string; x: number; y: number }[]
  ): Promise<StoryMention[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Validate mentions
    await this.validateMentions(userIds);

    // Verify user owns the story
    const { data: story, error: storyError } = await this.supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story || story.user_id !== userId) {
      throw new Error('You can only add mentions to your own stories');
    }

    // Create mention records
    const records = userIds.map(mentionedUserId => {
      const position = positions?.find(p => p.userId === mentionedUserId);
      return {
        story_id: storyId,
        mentioned_user_id: mentionedUserId,
        position_x: position?.x,
        position_y: position?.y
      };
    });

    const { data, error } = await this.supabase
      .from('story_mentions')
      .insert(records)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Get mentions for a story
   */
  async getStoryMentions(storyId: string): Promise<StoryMention[]> {
    const { data, error } = await this.supabase
      .from('story_mentions')
      .select(`
        *,
        mentioned_user:mentioned_user_id (
          username,
          display_name,
          avatar
        )
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching story mentions:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Get stories where a user is mentioned
   */
  async getMentionedStories(userId?: string): Promise<string[]> {
    const currentUserId = userId || this.auth.currentUser()?.id;
    if (!currentUserId) return [];

    const { data, error } = await this.supabase
      .from('story_mentions')
      .select('story_id')
      .eq('mentioned_user_id', currentUserId);

    if (error) {
      console.error('Error fetching mentioned stories:', error);
      return [];
    }
    return (data || []).map(m => m.story_id);
  }

  /**
   * Delete a mention
   */
  async deleteMention(mentionId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Verify user owns the story
    const { data: mention, error: mentionError } = await this.supabase
      .from('story_mentions')
      .select('story_id, stories!inner(user_id)')
      .eq('id', mentionId)
      .single();

    if (mentionError) throw mentionError;
    if (!mention || (mention as any).stories.user_id !== userId) {
      throw new Error('You can only delete mentions from your own stories');
    }

    const { error } = await this.supabase
      .from('story_mentions')
      .delete()
      .eq('id', mentionId);

    if (error) throw error;
  }

  /**
   * Parse hashtags from text content
   * Returns array of normalized hashtags
   */
  parseHashtags(content: string): string[] {
    if (!content) return [];

    // Match hashtags: # followed by alphanumeric characters and underscores
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = content.matchAll(hashtagRegex);
    
    const hashtags = new Set<string>();
    for (const match of matches) {
      const tag = match[1];
      // Normalize: lowercase
      const normalized = tag.toLowerCase();
      hashtags.add(normalized);
    }

    return Array.from(hashtags);
  }

  /**
   * Index hashtags for a story
   * This creates entries in a hashtag index table for search
   */
  async indexHashtags(storyId: string, content: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Verify user owns the story
    const { data: story, error: storyError } = await this.supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story || story.user_id !== userId) {
      throw new Error('You can only index hashtags for your own stories');
    }

    // Parse hashtags
    const hashtags = this.parseHashtags(content);
    if (hashtags.length === 0) return;

    // Create hashtag index records
    const records = hashtags.map(tag => ({
      story_id: storyId,
      hashtag: tag,
      normalized_hashtag: tag.toLowerCase()
    }));

    // First, delete existing hashtags for this story
    await this.supabase
      .from('story_hashtags')
      .delete()
      .eq('story_id', storyId);

    // Insert new hashtags
    const { error } = await this.supabase
      .from('story_hashtags')
      .insert(records);

    if (error) {
      console.error('Error indexing hashtags:', error);
      throw error;
    }
  }

  /**
   * Search stories by hashtag
   */
  async searchByHashtag(hashtag: string, limit: number = 50): Promise<string[]> {
    const normalized = hashtag.toLowerCase().replace(/^#/, '');

    const { data, error } = await this.supabase
      .from('story_hashtags')
      .select('story_id, stories!inner(is_active, expires_at, privacy_setting)')
      .eq('normalized_hashtag', normalized)
      .eq('stories.is_active', true)
      .gt('stories.expires_at', new Date().toISOString())
      .limit(limit);

    if (error) {
      console.error('Error searching hashtags:', error);
      return [];
    }

    return (data || []).map(h => h.story_id);
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 20): Promise<Hashtag[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data, error } = await this.supabase
      .from('story_hashtags')
      .select(`
        normalized_hashtag,
        stories!inner(created_at, is_active, expires_at)
      `)
      .eq('stories.is_active', true)
      .gt('stories.expires_at', new Date().toISOString())
      .gte('stories.created_at', oneDayAgo.toISOString());

    if (error) {
      console.error('Error fetching trending hashtags:', error);
      return [];
    }

    // Count occurrences
    const hashtagCounts: { [key: string]: number } = {};
    for (const item of data || []) {
      const tag = item.normalized_hashtag;
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    }

    // Convert to array and sort by count
    const trending = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({
        tag: `#${tag}`,
        normalized_tag: tag,
        story_count: count
      }))
      .sort((a, b) => b.story_count - a.story_count)
      .slice(0, limit);

    return trending;
  }

  /**
   * Get all hashtags for a story
   */
  async getStoryHashtags(storyId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('story_hashtags')
      .select('hashtag')
      .eq('story_id', storyId);

    if (error) {
      console.error('Error fetching story hashtags:', error);
      return [];
    }
    return (data || []).map(h => `#${h.hashtag}`);
  }

  /**
   * Extract mentions from text content
   * Returns array of usernames (without @)
   */
  extractMentions(content: string): string[] {
    if (!content) return [];

    // Match mentions: @ followed by alphanumeric characters and underscores
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = content.matchAll(mentionRegex);
    
    const mentions = new Set<string>();
    for (const match of matches) {
      const username = match[1];
      mentions.add(username.toLowerCase());
    }

    return Array.from(mentions);
  }

  /**
   * Process story content to extract and validate mentions and hashtags
   */
  async processStoryContent(storyId: string, content: string): Promise<{
    mentions: StoryMention[];
    hashtags: string[];
  }> {
    // Extract mentions from content
    const mentionUsernames = this.extractMentions(content);
    let mentions: StoryMention[] = [];

    if (mentionUsernames.length > 0) {
      try {
        const userIds = await this.validateMentionsByUsername(mentionUsernames);
        mentions = await this.addMentions(storyId, userIds);
      } catch (error) {
        console.error('Error processing mentions:', error);
        // Continue even if mentions fail
      }
    }

    // Index hashtags
    await this.indexHashtags(storyId, content);
    const hashtags = this.parseHashtags(content);

    return { mentions, hashtags };
  }
}

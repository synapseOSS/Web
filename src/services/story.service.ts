import { Injectable, signal, inject, Injector } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import { PerformanceService } from './performance.service';

export type PrivacySetting = 'public' | 'followers' | 'close_friends' | 'custom';
export type MediaType = 'image' | 'video';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  thumbnail_url?: string;
  content?: string;
  duration_hours: number;
  created_at: string;
  expires_at: string;
  views_count: number;
  reactions_count: number;
  replies_count: number;
  is_active: boolean;
  privacy_setting: PrivacySetting;
  media_width?: number;
  media_height?: number;
  media_duration_seconds?: number;
  file_size_bytes?: number;
  is_viewed?: boolean;
  user?: {
    uid: string;
    username: string;
    display_name: string;
    avatar: string;
    verify: boolean;
  };
  interactive_elements?: InteractiveElement[];
  mentions?: StoryMention[];
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  view_duration_seconds?: number;
  completed: boolean;
  viewer?: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

export interface StoryReaction {
  id: string;
  story_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface StoryReply {
  id: string;
  story_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface InteractiveElement {
  id: string;
  story_id: string;
  element_type: 'poll' | 'question' | 'countdown' | 'link' | 'music' | 'location';
  element_data: any;
  position_x?: number;
  position_y?: number;
  created_at: string;
}

export interface StoryMention {
  id: string;
  story_id: string;
  mentioned_user_id: string;
  position_x?: number;
  position_y?: number;
  created_at: string;
}

export interface StoryPrivacySettings {
  privacy_setting: PrivacySetting;
  custom_allowed_users?: string[];
  hidden_from_users?: string[];
}

export interface StoryCreationOptions {
  media: File;
  content?: string;
  privacy: StoryPrivacySettings;
  duration_hours?: number;
  interactive_elements?: Partial<InteractiveElement>[];
  mentions?: string[];
  location?: string;
}

// Story Model class with helper methods
export class StoryModel {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  content?: string;
  durationHours: number;
  createdAt: Date;
  expiresAt: Date;
  viewsCount: number;
  reactionsCount: number;
  repliesCount: number;
  isActive: boolean;
  privacySetting: PrivacySetting;
  isViewed: boolean = false;
  user?: {
    uid: string;
    username: string;
    display_name: string;
    avatar: string;
    verify: boolean;
  };

  constructor(data: Story) {
    this.id = data.id;
    this.userId = data.user_id;
    this.mediaUrl = data.media_url;
    this.mediaType = data.media_type;
    this.thumbnailUrl = data.thumbnail_url;
    this.content = data.content;
    this.durationHours = data.duration_hours;
    this.createdAt = new Date(data.created_at);
    this.expiresAt = new Date(data.expires_at);
    this.viewsCount = data.views_count;
    this.reactionsCount = data.reactions_count;
    this.repliesCount = data.replies_count;
    this.isActive = data.is_active;
    this.privacySetting = data.privacy_setting;
    this.isViewed = data.is_viewed || false;
    this.user = data.user;
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  timeRemaining(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  timeRemainingFormatted(): string {
    const ms = this.timeRemaining();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  canEdit(currentUserId: string): boolean {
    return this.userId === currentUserId && !this.isExpired();
  }

  canDelete(currentUserId: string): boolean {
    return this.userId === currentUserId;
  }

  hasInteractions(): boolean {
    return this.viewsCount > 0 || this.reactionsCount > 0 || this.repliesCount > 0;
  }
}

// Story Feed Item (grouped by user)
export class StoryFeedItem {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  stories: StoryModel[];
  hasUnviewed: boolean;
  latestStoryTime: Date;

  constructor(data: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    stories: Story[];
    has_unviewed: boolean;
    latest_story_time: string;
  }) {
    this.userId = data.user_id;
    this.username = data.username;
    this.displayName = data.display_name;
    this.avatarUrl = data.avatar_url;
    this.stories = data.stories.map(s => new StoryModel(s));
    this.hasUnviewed = data.has_unviewed;
    this.latestStoryTime = new Date(data.latest_story_time);
  }

  get totalStories(): number {
    return this.stories.length;
  }

  get unviewedCount(): number {
    return this.stories.filter(s => !s.isViewed).length;
  }

  get firstUnviewedStory(): StoryModel | undefined {
    return this.stories.find(s => !s.isViewed);
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private injector = inject(Injector);
  private realtime?: RealtimeService;
  private performance = inject(PerformanceService);
  
  stories = signal<Story[]>([]);
  myStories = signal<Story[]>([]);
  storyViews = signal<StoryView[]>([]);
  loading = signal(false);
  
  // Real-time connection status
  realtimeConnected = signal(false);
  
  // Lazy loader for story feed
  private lazyLoader?: IntersectionObserver;

  async fetchStories() {
    this.loading.set(true);
    try {
      const userId = this.auth.currentUser()?.id;
      
      // Check cache first (Requirement 11.5: Client-side caching)
      const cacheKey = `stories_${userId}`;
      const cached = this.performance.getCachedStory(cacheKey);
      if (cached) {
        this.stories.set(cached);
        this.loading.set(false);
        
        // Preload next stories in background (Requirement 11.4: Image preloading)
        this.preloadNextStories(cached);
        return;
      }
      
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

      // Cache the results (Requirement 11.5: Client-side caching)
      this.performance.cacheStory(cacheKey, storiesWithViews);
      
      this.stories.set(storiesWithViews);
      
      // Preload next stories (Requirement 11.4: Image preloading)
      this.preloadNextStories(storiesWithViews);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * Preload images for next stories
   * Requirement 11.4: Image preloading for next stories
   */
  private preloadNextStories(stories: Story[]): void {
    // Preload first 5 unviewed stories
    const unviewedStories = stories.filter(s => !s.is_viewed).slice(0, 5);
    const urls = unviewedStories
      .map(s => s.media_url)
      .filter(url => url);
    
    if (urls.length > 0) {
      this.performance.preloadImages(urls);
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

  async createStory(options: StoryCreationOptions): Promise<Story> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    let uploadedFilePath: string | null = null;
    let createdStoryId: string | null = null;

    try {
      // Validate file
      this.validateFile(options.media);

      // Compress and optimize media
      const optimizedMedia = await this.compressMedia(options.media);

      // Upload media to story-media bucket with retry logic
      const fileExt = options.media.name.split('.').pop();
      const fileName = `${userId}/story_${Date.now()}.${fileExt}`;
      uploadedFilePath = fileName;

      await this.uploadWithRetry(uploadedFilePath, optimizedMedia);

      const { data: urlData } = this.supabase.storage
        .from('story-media')
        .getPublicUrl(uploadedFilePath);

      // Generate and upload thumbnail (Requirement 11.2: Thumbnail generation)
      let thumbnailUrl: string | undefined;
      try {
        const thumbnail = await this.performance.generateThumbnail(optimizedMedia, {
          width: 200,
          height: 200,
          quality: 0.7
        });

        if (thumbnail) {
          const thumbFileName = `${userId}/thumb_${Date.now()}.jpg`;
          const { error: thumbError } = await this.supabase.storage
            .from('story-thumbnails')
            .upload(thumbFileName, thumbnail);

          if (!thumbError) {
            const { data: thumbUrlData } = this.supabase.storage
              .from('story-thumbnails')
              .getPublicUrl(thumbFileName);
            thumbnailUrl = thumbUrlData.publicUrl;
          }
        }
      } catch (thumbErr) {
        console.warn('Failed to generate thumbnail:', thumbErr);
        // Continue without thumbnail
      }

      // Calculate expiration
      const durationHours = options.duration_hours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + durationHours);

      // Determine media type
      const mediaType: MediaType = options.media.type.startsWith('video') ? 'video' : 'image';

      // Get media dimensions
      const dimensions = await this.getMediaDimensions(optimizedMedia, mediaType);

      // Create story record
      const { data: story, error: insertError } = await this.supabase
        .from('stories')
        .insert({
          user_id: userId,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          thumbnail_url: thumbnailUrl,
          content: options.content,
          duration_hours: durationHours,
          expires_at: expiresAt.toISOString(),
          privacy_setting: options.privacy.privacy_setting,
          file_size_bytes: optimizedMedia.size,
          media_width: dimensions.width,
          media_height: dimensions.height
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      createdStoryId = story.id;

      // Handle custom privacy
      if (options.privacy.privacy_setting === 'custom' && options.privacy.custom_allowed_users) {
        await this.setCustomPrivacy(story.id, options.privacy.custom_allowed_users);
      }

      // Handle hide list
      if (options.privacy.hidden_from_users) {
        await this.setHiddenFromUsers(story.id, options.privacy.hidden_from_users);
      }

      // Handle mentions
      if (options.mentions && options.mentions.length > 0) {
        await this.addMentions(story.id, options.mentions);
      }

      // Handle interactive elements
      if (options.interactive_elements && options.interactive_elements.length > 0) {
        await this.addInteractiveElements(story.id, options.interactive_elements);
      }

      await this.fetchMyStories();
      return story;
    } catch (err) {
      console.error('Error creating story:', err);
      // Rollback: delete uploaded media and story record
      await this.rollbackStoryCreation(uploadedFilePath, createdStoryId);
      throw err;
    }
  }

  private async uploadWithRetry(filePath: string, file: File, maxRetries = 3): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { error } = await this.supabase.storage
          .from('story-media')
          .upload(filePath, file);

        if (error) throw error;
        return; // Success
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw new Error(`Failed to upload media after ${maxRetries} attempts: ${error}`);
        }
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  private async compressMedia(file: File): Promise<File> {
    // Use performance service for compression (Requirement 11.1: Media compression pipeline)
    if (file.type.startsWith('image')) {
      return this.performance.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      });
    }
    // For videos, return as-is (compression would require server-side processing)
    return file;
  }

  private async getMediaDimensions(file: File, mediaType: MediaType): Promise<{ width?: number; height?: number }> {
    if (mediaType === 'image') {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({});
        };
        img.src = url;
      });
    } else if (mediaType === 'video') {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({});
        };
        video.src = url;
      });
    }
    return {};
  }

  private async rollbackStoryCreation(filePath: string | null, storyId: string | null): Promise<void> {
    try {
      // Delete uploaded media file
      if (filePath) {
        await this.supabase.storage
          .from('story-media')
          .remove([filePath]);
      }

      // Delete story record and related data
      if (storyId) {
        // Delete related records (cascading should handle this, but being explicit)
        await this.supabase.from('story_custom_privacy').delete().eq('story_id', storyId);
        await this.supabase.from('story_hidden_from').delete().eq('story_id', storyId);
        await this.supabase.from('story_mentions').delete().eq('story_id', storyId);
        await this.supabase.from('story_interactive_elements').delete().eq('story_id', storyId);
        
        // Delete story
        await this.supabase.from('stories').delete().eq('id', storyId);
      }
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateFile(file: File): void {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

    if (file.size > maxSize) {
      throw new Error('File size exceeds 100MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM');
    }
  }

  private async setCustomPrivacy(storyId: string, allowedUserIds: string[]): Promise<void> {
    const records = allowedUserIds.map(userId => ({
      story_id: storyId,
      allowed_user_id: userId
    }));

    const { error } = await this.supabase
      .from('story_custom_privacy')
      .insert(records);

    if (error) throw error;
  }

  private async setHiddenFromUsers(storyId: string, hiddenUserIds: string[]): Promise<void> {
    const records = hiddenUserIds.map(userId => ({
      story_id: storyId,
      hidden_user_id: userId
    }));

    const { error } = await this.supabase
      .from('story_hidden_from')
      .insert(records);

    if (error) throw error;
  }

  private async addMentions(storyId: string, mentionedUserIds: string[]): Promise<void> {
    const records = mentionedUserIds.map(userId => ({
      story_id: storyId,
      mentioned_user_id: userId
    }));

    const { error } = await this.supabase
      .from('story_mentions')
      .insert(records);

    if (error) throw error;
  }

  private async addInteractiveElements(storyId: string, elements: Partial<InteractiveElement>[]): Promise<void> {
    const records = elements.map(element => ({
      story_id: storyId,
      element_type: element.element_type,
      element_data: element.element_data,
      position_x: element.position_x,
      position_y: element.position_y
    }));

    const { error } = await this.supabase
      .from('story_interactive_elements')
      .insert(records);

    if (error) throw error;
  }

  async viewStory(storyId: string, viewDuration?: number, completed: boolean = false): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      // Check if already viewed
      const alreadyViewed = await this.checkIfViewed(storyId, userId);
      if (alreadyViewed) return;

      // Record view atomically
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

      await this.fetchStories();
    } catch (err) {
      console.error('Error viewing story:', err);
    }
  }

  async canViewStory(storyId: string): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    try {
      const { data, error } = await this.supabase
        .rpc('can_view_story', {
          story_uuid: storyId,
          viewer_uuid: userId
        });

      if (error) throw error;
      return data as boolean;
    } catch (err) {
      console.error('Error checking story visibility:', err);
      return false;
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

  async updateStory(storyId: string, content?: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Update only the content field, preserving media and view history
      const { error } = await this.supabase
        .from('stories')
        .update({ content })
        .eq('id', storyId)
        .eq('user_id', userId);

      if (error) throw error;
      await this.fetchMyStories();
    } catch (err) {
      console.error('Error updating story:', err);
      throw err;
    }
  }

  async updateInteractiveElement(elementId: string, elementData: any): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Update only the element data, preserving existing responses
      const { error } = await this.supabase
        .from('story_interactive_elements')
        .update({ element_data: elementData })
        .eq('id', elementId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating interactive element:', err);
      throw err;
    }
  }

  async deleteStory(storyId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // First, get the story data for archival
      const { data: story, error: fetchError } = await this.supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!story) throw new Error('Story not found or unauthorized');

      // Archive the story
      const { error: archiveError } = await this.supabase
        .from('story_archive')
        .insert({
          user_id: story.user_id,
          original_story_id: story.id,
          media_url: story.media_url,
          thumbnail_url: story.thumbnail_url,
          content: story.content,
          created_at: story.created_at,
          views_count: story.views_count,
          reactions_count: story.reactions_count
        });

      if (archiveError) throw archiveError;

      // Mark story as inactive (soft delete)
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

  async addReaction(storyId: string, reactionType: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      const { error } = await this.supabase
        .from('story_reactions')
        .insert({
          story_id: storyId,
          user_id: userId,
          reaction_type: reactionType
        });

      if (error) throw error;

      // Increment reactions count
      await this.supabase.rpc('increment_story_reactions', { story_id: storyId });
    } catch (err) {
      console.error('Error adding reaction:', err);
      throw err;
    }
  }

  async removeReaction(storyId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      const { error } = await this.supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId);

      if (error) throw error;

      // Decrement reactions count
      await this.supabase.rpc('decrement_story_reactions', { story_id: storyId });
    } catch (err) {
      console.error('Error removing reaction:', err);
      throw err;
    }
  }

  async sendReply(storyId: string, message: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Get the story to find the creator
      const { data: story, error: storyError } = await this.supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      if (!story) throw new Error('Story not found');

      // Insert reply record
      const { error } = await this.supabase
        .from('story_replies')
        .insert({
          story_id: storyId,
          sender_id: userId,
          message
        });

      if (error) throw error;

      // Increment replies count
      await this.supabase.rpc('increment_story_replies', { story_id: storyId });

      // Create or get existing chat with story creator
      // First check if a chat already exists between these users
      const { data: existingChats } = await this.supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      let chatId: string | null = null;

      if (existingChats && existingChats.length > 0) {
        // Check if any of these chats include the story creator
        for (const chat of existingChats) {
          const { data: participants } = await this.supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chat.chat_id);

          if (participants && participants.some(p => p.user_id === story.user_id)) {
            chatId = chat.chat_id;
            break;
          }
        }
      }

      // If no existing chat, create one
      if (!chatId) {
        chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const { error: chatError } = await this.supabase
          .from('chats')
          .insert({
            chat_id: chatId,
            is_group: false,
            created_by: userId,
            participants_count: 2
          });

        if (chatError) throw chatError;

        // Add participants
        const { error: participantsError } = await this.supabase
          .from('chat_participants')
          .insert([
            { chat_id: chatId, user_id: userId, role: 'member' },
            { chat_id: chatId, user_id: story.user_id, role: 'member' }
          ]);

        if (participantsError) throw participantsError;
      }

      // Send message in the chat with story reference
      const now = new Date().toISOString();
      const messageContent = `Replied to your story: ${message}`;
      
      const { error: messageError } = await this.supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          content: messageContent,
          message_type: 'story_reply',
          delivery_status: 'sent',
          created_at: now,
          message_state: 'sent',
          metadata: { story_id: storyId }
        });

      if (messageError) throw messageError;

      // Update chat's last message
      await this.supabase
        .from('chats')
        .update({
          last_message: messageContent,
          last_message_time: now,
          last_message_sender: userId,
          updated_at: now
        })
        .eq('chat_id', chatId);
    } catch (err) {
      console.error('Error sending reply:', err);
      throw err;
    }
  }

  async getStoryReplies(storyId: string): Promise<StoryReply[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_replies')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching story replies:', err);
      return [];
    }
  }

  async updateStoryPrivacy(storyId: string, privacy: StoryPrivacySettings): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Update privacy setting
      const { error: updateError } = await this.supabase
        .from('stories')
        .update({ privacy_setting: privacy.privacy_setting })
        .eq('id', storyId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Clear existing custom privacy
      await this.supabase
        .from('story_custom_privacy')
        .delete()
        .eq('story_id', storyId);

      // Set new custom privacy if applicable
      if (privacy.privacy_setting === 'custom' && privacy.custom_allowed_users) {
        await this.setCustomPrivacy(storyId, privacy.custom_allowed_users);
      }

      // Update hide list
      if (privacy.hidden_from_users) {
        await this.supabase
          .from('story_hidden_from')
          .delete()
          .eq('story_id', storyId);
        
        await this.setHiddenFromUsers(storyId, privacy.hidden_from_users);
      }

      await this.fetchMyStories();
    } catch (err) {
      console.error('Error updating story privacy:', err);
      throw err;
    }
  }

  async manageCloseFriends(friendIds: string[]): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Clear existing close friends
      await this.supabase
        .from('close_friends')
        .delete()
        .eq('user_id', userId);

      // Add new close friends
      const records = friendIds.map(friendId => ({
        user_id: userId,
        friend_id: friendId
      }));

      const { error } = await this.supabase
        .from('close_friends')
        .insert(records);

      if (error) throw error;
    } catch (err) {
      console.error('Error managing close friends:', err);
      throw err;
    }
  }

  async getCloseFriends(): Promise<string[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return [];

    try {
      const { data, error } = await this.supabase
        .from('close_friends')
        .select('friend_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(cf => cf.friend_id);
    } catch (err) {
      console.error('Error fetching close friends:', err);
      return [];
    }
  }

  /**
   * Get RealtimeService with lazy injection to avoid circular dependency
   */
  private getRealtimeService(): RealtimeService {
    if (!this.realtime) {
      this.realtime = this.injector.get(RealtimeService);
    }
    return this.realtime;
  }

  /**
   * Initialize real-time subscriptions for story updates
   * Requirement 10.1: New stories pushed within 5 seconds
   * Requirement 10.2: Deletions removed immediately
   * Requirement 10.3: Privacy changes updated within 5 seconds
   * Requirement 11.6: Debouncing for real-time updates
   */
  initializeRealtimeSubscriptions() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const realtime = this.getRealtimeService();

    // Subscribe to new story creation
    realtime.subscribeToStoryCreation(userId, (newStory) => {
      console.log('Real-time: New story created', newStory);
      
      // Add to stories feed if not already present
      const currentStories = this.stories();
      const exists = currentStories.some(s => s.id === newStory.id);
      
      if (!exists) {
        this.stories.set([newStory, ...currentStories]);
        
        // Invalidate cache
        const cacheKey = `stories_${userId}`;
        this.performance.cacheStory(cacheKey, [newStory, ...currentStories]);
      }
    });

    // Subscribe to story updates and deletions with debouncing (Requirement 11.6)
    const debouncedUpdate = this.performance.debounce(
      'story-updates',
      (update: any) => {
        console.log('Real-time: Story updated', update);
        
        const currentStories = this.stories();
        
        if (update.event === 'DELETE') {
          // Remove deleted story immediately (no debounce for deletions)
          const filtered = currentStories.filter(s => s.id !== update.id);
          this.stories.set(filtered);
          
          // Update cache
          const cacheKey = `stories_${userId}`;
          this.performance.cacheStory(cacheKey, filtered);
        } else if (update.event === 'UPDATE') {
          // Update story or remove if viewer can no longer see it
          if (update.can_view) {
            const updated = currentStories.map(s => 
              s.id === update.id ? { ...s, ...update } : s
            );
            this.stories.set(updated);
            
            // Update cache
            const cacheKey = `stories_${userId}`;
            this.performance.cacheStory(cacheKey, updated);
          } else {
            // Privacy changed - viewer can no longer see this story
            const filtered = currentStories.filter(s => s.id !== update.id);
            this.stories.set(filtered);
            
            // Update cache
            const cacheKey = `stories_${userId}`;
            this.performance.cacheStory(cacheKey, filtered);
          }
        }
      },
      500 // 500ms debounce for updates
    );

    realtime.subscribeToStoryUpdates(userId, (update) => {
      // Deletions are immediate, updates are debounced
      if (update.event === 'DELETE') {
        const currentStories = this.stories();
        const filtered = currentStories.filter(s => s.id !== update.id);
        this.stories.set(filtered);
        
        // Update cache
        const cacheKey = `stories_${userId}`;
        this.performance.cacheStory(cacheKey, filtered);
      } else {
        debouncedUpdate(update);
      }
    });

    // Monitor connection status
    realtime.monitorConnection((status) => {
      this.realtimeConnected.set(status === 'SUBSCRIBED');
      
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.warn('Real-time connection lost, will attempt to reconnect');
      } else if (status === 'SUBSCRIBED') {
        console.log('Real-time connection established');
      }
    });
  }

  /**
   * Subscribe to view updates for a specific story
   * Requirement 10.4: View counts updated in real-time
   */
  subscribeToStoryViews(storyId: string, callback: (data: { view: StoryView; views_count: number }) => void) {
    const realtime = this.getRealtimeService();
    return realtime.subscribeToStoryViews(storyId, callback);
  }

  /**
   * Subscribe to reaction updates for a specific story
   * Requirement 10.5: Reactions notified immediately
   */
  subscribeToStoryReactions(storyId: string, callback: (data: any) => void) {
    const realtime = this.getRealtimeService();
    return realtime.subscribeToStoryReactions(storyId, callback);
  }

  /**
   * Subscribe to reply updates for a specific story
   * Requirement 10.5: Replies notified immediately
   */
  subscribeToStoryReplies(storyId: string, callback: (data: any) => void) {
    const realtime = this.getRealtimeService();
    return realtime.subscribeToStoryReplies(storyId, callback);
  }

  /**
   * Unsubscribe from all story real-time updates
   */
  unsubscribeFromRealtimeUpdates() {
    const realtime = this.getRealtimeService();
    realtime.unsubscribeFromStories();
    this.realtimeConnected.set(false);
  }

  /**
   * Create lazy loader for story feed
   * Requirement 11.3: Lazy loading for story feed
   */
  createLazyLoader(): IntersectionObserver {
    if (!this.lazyLoader) {
      this.lazyLoader = this.performance.createLazyLoader({
        rootMargin: '50px',
        threshold: 0.01
      });
    }
    return this.lazyLoader;
  }

  /**
   * Observe element for lazy loading
   * Requirement 11.3: Lazy loading for story feed
   */
  observeForLazyLoad(element: HTMLElement): void {
    const loader = this.createLazyLoader();
    loader.observe(element);
  }

  /**
   * Unobserve element from lazy loading
   */
  unobserveForLazyLoad(element: HTMLElement): void {
    if (this.lazyLoader) {
      this.lazyLoader.unobserve(element);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performance.getMetrics();
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.performance.clearCache();
  }

  /**
   * Cleanup method to be called when service is destroyed
   */
  cleanup() {
    this.unsubscribeFromRealtimeUpdates();
    
    // Disconnect lazy loader
    if (this.lazyLoader) {
      this.lazyLoader.disconnect();
      this.lazyLoader = undefined;
    }
    
    // Cleanup performance service
    this.performance.cleanup();
  }

  constructor() {
    this.fetchStories();
    this.fetchMyStories();
    
    // Initialize real-time subscriptions after a short delay to ensure auth is ready
    setTimeout(() => {
      if (this.auth.currentUser()) {
        this.initializeRealtimeSubscriptions();
      }
    }, 1000);
  }
}

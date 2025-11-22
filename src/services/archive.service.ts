import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface ArchivedStory {
  id: string;
  user_id: string;
  original_story_id: string;
  media_url: string;
  thumbnail_url?: string;
  content?: string;
  created_at: string;
  archived_at: string;
  views_count: number;
  reactions_count: number;
}

export interface ArchiveDownloadData {
  story: ArchivedStory;
  metadata: {
    views_count: number;
    reactions_count: number;
    created_at: string;
    archived_at: string;
    content?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  archivedStories = signal<ArchivedStory[]>([]);
  loading = signal(false);

  /**
   * Calculate expiration timestamp for a story
   * @param createdAt - Story creation timestamp
   * @param durationHours - Duration in hours (default 24)
   * @returns Expiration timestamp
   */
  calculateExpirationTimestamp(createdAt: Date, durationHours: number = 24): Date {
    const expiresAt = new Date(createdAt);
    expiresAt.setHours(expiresAt.getHours() + durationHours);
    return expiresAt;
  }

  /**
   * Validate custom duration is within acceptable range (1-168 hours)
   * @param durationHours - Duration to validate
   * @returns true if valid, false otherwise
   */
  validateCustomDuration(durationHours: number): boolean {
    return durationHours >= 1 && durationHours <= 168;
  }

  /**
   * Check if a story has expired
   * @param expiresAt - Story expiration timestamp
   * @returns true if expired, false otherwise
   */
  isStoryExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Fetch archived stories for the current user
   * Stories are ordered by creation date in descending order
   */
  async fetchArchivedStories(): Promise<ArchivedStory[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('story_archive')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.archivedStories.set(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching archived stories:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Download an archived story with all metadata
   * @param archiveId - ID of the archived story
   * @returns Archive download data including media and metadata
   */
  async downloadArchivedStory(archiveId: string): Promise<ArchiveDownloadData> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    try {
      const { data: story, error } = await this.supabase
        .from('story_archive')
        .select('*')
        .eq('id', archiveId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!story) throw new Error('Archived story not found');

      return {
        story,
        metadata: {
          views_count: story.views_count,
          reactions_count: story.reactions_count,
          created_at: story.created_at,
          archived_at: story.archived_at,
          content: story.content
        }
      };
    } catch (err) {
      console.error('Error downloading archived story:', err);
      throw err;
    }
  }

  /**
   * Permanently delete an archived story
   * Removes both database record and storage media
   * @param archiveId - ID of the archived story to delete
   */
  async permanentlyDeleteArchivedStory(archiveId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    try {
      // Get the archived story to find media URL
      const { data: stories, error: fetchError } = await this.supabase
        .from('story_archive')
        .select('*')
        .eq('id', archiveId);

      if (fetchError) throw fetchError;
      
      const story = stories && stories.length > 0 ? stories[0] : null;
      if (!story || story.user_id !== userId) throw new Error('Archived story not found');



      // Extract file path from media URL
      const mediaUrl = story.media_url;
      const filePath = this.extractFilePathFromUrl(mediaUrl);

      // Delete media from storage
      if (filePath) {
        const { error: storageError } = await this.supabase.storage
          .from('story-media')
          .remove([filePath]);

        if (storageError) {
          console.warn('Error deleting media from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete thumbnail if exists
      if (story.thumbnail_url) {
        const thumbnailPath = this.extractFilePathFromUrl(story.thumbnail_url);
        if (thumbnailPath) {
          await this.supabase.storage
            .from('story-thumbnails')
            .remove([thumbnailPath]);
        }
      }

      // Delete database record
      const { error: deleteError } = await this.supabase
        .from('story_archive')
        .delete()
        .eq('id', archiveId);

      if (deleteError) throw deleteError;

      // Update local state
      await this.fetchArchivedStories();
    } catch (err) {
      console.error('Error permanently deleting archived story:', err);
      throw err;
    }
  }

  /**
   * Restore an archived story if it hasn't expired
   * @param archiveId - ID of the archived story to restore
   * @returns true if restored successfully, false if story has expired
   */
  async restoreArchivedStory(archiveId: string): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    try {
      // Get the archived story
      const { data: stories, error: fetchError } = await this.supabase
        .from('story_archive')
        .select('*')
        .eq('id', archiveId);

      if (fetchError) throw fetchError;
      
      const archivedStory = stories && stories.length > 0 ? stories[0] : null;
      if (!archivedStory || archivedStory.user_id !== userId) throw new Error('Archived story not found');

      // Check if the story would have expired by now
      // Calculate when it would expire based on original creation time + 24 hours
      const createdAt = new Date(archivedStory.created_at);
      const expiresAt = this.calculateExpirationTimestamp(createdAt, 24);

      if (this.isStoryExpired(expiresAt)) {
        // Story has expired, cannot restore
        return false;
      }

      // Restore the story by creating a new active story record
      const { data: restoredStory, error: insertError } = await this.supabase
        .from('stories')
        .insert({
          id: archivedStory.original_story_id,
          user_id: archivedStory.user_id,
          media_url: archivedStory.media_url,
          thumbnail_url: archivedStory.thumbnail_url,
          content: archivedStory.content,
          created_at: archivedStory.created_at,
          expires_at: expiresAt.toISOString(),
          views_count: archivedStory.views_count,
          reactions_count: archivedStory.reactions_count,
          is_active: true,
          privacy_setting: 'followers', // Default to followers on restore
          duration_hours: 24
        })
        .select()
        .single();

      if (insertError) {
        // If insert fails due to duplicate ID, update existing record instead
        if (insertError.code === '23505') {
          const { error: updateError } = await this.supabase
            .from('stories')
            .update({ is_active: true })
            .eq('id', archivedStory.original_story_id)
            .eq('user_id', userId);

          if (updateError) throw updateError;
        } else {
          throw insertError;
        }
      }

      // Remove from archive
      const { error: deleteError } = await this.supabase
        .from('story_archive')
        .delete()
        .eq('id', archiveId);

      if (deleteError) throw deleteError;

      // Update local state
      await this.fetchArchivedStories();

      return true;
    } catch (err) {
      console.error('Error restoring archived story:', err);
      throw err;
    }
  }

  /**
   * Archive expired stories (called by background job)
   * Moves expired stories to archive table
   * @returns Number of stories archived
   */
  async archiveExpiredStories(): Promise<number> {
    try {
      // Call the database function to archive expired stories
      const { data, error } = await this.supabase
        .rpc('archive_expired_stories');

      if (error) throw error;

      return data as number;
    } catch (err) {
      console.error('Error archiving expired stories:', err);
      throw err;
    }
  }

  /**
   * Mark expired stories as inactive
   * @returns Number of stories marked as expired
   */
  async markExpiredStories(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // Update stories where expiration time has passed
      const { data, error } = await this.supabase
        .from('stories')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('expires_at', now)
        .select();

      if (error) throw error;

      return data?.length || 0;
    } catch (err) {
      console.error('Error marking expired stories:', err);
      throw err;
    }
  }

  /**
   * Extract file path from Supabase storage URL
   * @param url - Full storage URL
   * @returns File path or null
   */
  private extractFilePathFromUrl(url: string): string | null {
    try {
      // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('public') + 1;
      if (bucketIndex > 0 && bucketIndex < pathParts.length) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }
}

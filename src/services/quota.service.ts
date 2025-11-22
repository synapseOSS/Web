import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface StorageQuota {
  user_id: string;
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  quota_limit_bytes: number;
  percentage_used: number;
}

export interface StorageUsage {
  story_media_bytes: number;
  story_thumbnails_bytes: number;
  total_bytes: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuotaService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  // Default quota: 5GB per user
  private readonly DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;
  
  // Notification thresholds
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.95; // 95%

  currentQuota = signal<StorageQuota | null>(null);
  loading = signal(false);

  /**
   * Get storage quota information for the current user
   * @returns Storage quota details
   */
  async getStorageQuota(): Promise<StorageQuota> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    this.loading.set(true);
    try {
      const usage = await this.calculateStorageUsage(userId);
      const quotaLimit = await this.getQuotaLimit(userId);

      const quota: StorageQuota = {
        user_id: userId,
        total_bytes: usage.total_bytes,
        used_bytes: usage.total_bytes,
        available_bytes: Math.max(0, quotaLimit - usage.total_bytes),
        quota_limit_bytes: quotaLimit,
        percentage_used: (usage.total_bytes / quotaLimit) * 100
      };

      this.currentQuota.set(quota);
      return quota;
    } catch (err) {
      console.error('Error getting storage quota:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Calculate total storage usage for a user
   * @param userId - User ID
   * @returns Storage usage breakdown
   */
  private async calculateStorageUsage(userId: string): Promise<StorageUsage> {
    try {
      // Get all active stories for the user
      const { data: stories, error: storiesError } = await this.supabase
        .from('stories')
        .select('file_size_bytes')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (storiesError) throw storiesError;

      // Get all archived stories for the user
      const { data: archived, error: archivedError } = await this.supabase
        .from('story_archive')
        .select('*')
        .eq('user_id', userId);

      if (archivedError) throw archivedError;

      // Calculate total from active stories
      const activeStoriesBytes = stories?.reduce((sum, story) => {
        return sum + (story.file_size_bytes || 0);
      }, 0) || 0;

      // For archived stories, we need to estimate size from storage
      // In a real implementation, we'd store file_size_bytes in story_archive table
      const archivedStoriesBytes = archived?.length ? archived.length * 5 * 1024 * 1024 : 0; // Estimate 5MB per archived story

      return {
        story_media_bytes: activeStoriesBytes + archivedStoriesBytes,
        story_thumbnails_bytes: 0, // Thumbnails are typically small, can be calculated separately
        total_bytes: activeStoriesBytes + archivedStoriesBytes
      };
    } catch (err) {
      console.error('Error calculating storage usage:', err);
      throw err;
    }
  }

  /**
   * Get quota limit for a user
   * In a real implementation, this would check user's subscription tier
   * @param userId - User ID
   * @returns Quota limit in bytes
   */
  private async getQuotaLimit(userId: string): Promise<number> {
    // TODO: Implement subscription-based quota limits
    // For now, return default quota
    return this.DEFAULT_QUOTA_BYTES;
  }

  /**
   * Check if user has enough quota for a new upload
   * @param fileSizeBytes - Size of file to upload
   * @returns true if quota allows upload, false otherwise
   */
  async canUpload(fileSizeBytes: number): Promise<boolean> {
    const quota = await this.getStorageQuota();
    return quota.available_bytes >= fileSizeBytes;
  }

  /**
   * Enforce storage quota before upload
   * Throws error if quota exceeded
   * @param fileSizeBytes - Size of file to upload
   */
  async enforceQuota(fileSizeBytes: number): Promise<void> {
    const canUpload = await this.canUpload(fileSizeBytes);
    
    if (!canUpload) {
      const quota = this.currentQuota();
      throw new Error(
        `Storage quota exceeded. You have used ${this.formatBytes(quota?.used_bytes || 0)} ` +
        `of ${this.formatBytes(quota?.quota_limit_bytes || 0)}. ` +
        `Please delete some archived stories to free up space.`
      );
    }
  }

  /**
   * Check if user should receive quota warning notification
   * @returns Notification level: 'none', 'warning', 'critical', or 'exceeded'
   */
  async getQuotaNotificationLevel(): Promise<'none' | 'warning' | 'critical' | 'exceeded'> {
    const quota = await this.getStorageQuota();
    const percentageUsed = quota.percentage_used / 100;

    if (percentageUsed >= 1.0) {
      return 'exceeded';
    } else if (percentageUsed >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (percentageUsed >= this.WARNING_THRESHOLD) {
      return 'warning';
    }
    return 'none';
  }

  /**
   * Send quota notification to user
   * @param level - Notification level
   */
  async sendQuotaNotification(level: 'warning' | 'critical' | 'exceeded'): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const quota = this.currentQuota();
    if (!quota) return;

    let message = '';
    switch (level) {
      case 'warning':
        message = `You've used ${quota.percentage_used.toFixed(0)}% of your storage quota. Consider deleting old archived stories.`;
        break;
      case 'critical':
        message = `You've used ${quota.percentage_used.toFixed(0)}% of your storage quota. You're running out of space!`;
        break;
      case 'exceeded':
        message = `Storage quota exceeded! You cannot create new stories until you free up space by deleting archived stories.`;
        break;
    }

    // TODO: Integrate with notification service
    console.warn(`Quota notification for user ${userId}: ${message}`);
  }

  /**
   * Track storage usage for a new upload
   * @param userId - User ID
   * @param fileSizeBytes - Size of uploaded file
   */
  async trackUpload(userId: string, fileSizeBytes: number): Promise<void> {
    // Refresh quota after upload
    await this.getStorageQuota();

    // Check if notification is needed
    const level = await this.getQuotaNotificationLevel();
    if (level !== 'none') {
      await this.sendQuotaNotification(level);
    }
  }

  /**
   * Format bytes to human-readable string
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "1.5 GB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get storage usage statistics
   * @returns Usage statistics
   */
  async getUsageStatistics(): Promise<{
    activeStories: number;
    archivedStories: number;
    totalSize: string;
    quotaLimit: string;
    percentageUsed: number;
  }> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const quota = await this.getStorageQuota();

    // Get story counts
    const { count: activeCount } = await this.supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    const { count: archivedCount } = await this.supabase
      .from('story_archive')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      activeStories: activeCount || 0,
      archivedStories: archivedCount || 0,
      totalSize: this.formatBytes(quota.used_bytes),
      quotaLimit: this.formatBytes(quota.quota_limit_bytes),
      percentageUsed: quota.percentage_used
    };
  }
}

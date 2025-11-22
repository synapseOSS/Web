import { Injectable, inject } from '@angular/core';
import { StoryService, StoryCreationOptions, Story, StoryPrivacySettings } from './story.service';
import { ErrorHandlingService } from './error-handling.service';

/**
 * Story Service Wrapper with Enhanced Error Handling
 * 
 * This service wraps the StoryService to provide:
 * - Automatic error handling and user feedback
 * - Loading states for all operations
 * - Success notifications
 * - Retry logic for failed operations
 * - Graceful degradation
 * 
 * Requirements: 1.10, 14.1-14.10
 */
@Injectable({
  providedIn: 'root'
})
export class StoryErrorWrapperService {
  private storyService = inject(StoryService);
  private errorHandler = inject(ErrorHandlingService);

  /**
   * Create a story with comprehensive error handling
   * Implements retry logic for uploads and rollback on failure
   */
  async createStory(options: StoryCreationOptions): Promise<Story | null> {
    return this.errorHandler.executeWithHandling(
      'create-story',
      async () => {
        try {
          // Use retry logic for the upload operation
          const story = await this.errorHandler.executeWithRetry(
            () => this.storyService.createStory(options),
            {
              maxRetries: 3,
              delayMs: 1000,
              exponentialBackoff: true,
              operation: 'create-story',
              errorContext: 'Story creation'
            }
          );
          
          return story;
        } catch (error) {
          // Error is already handled by executeWithRetry
          throw error;
        }
      },
      {
        successMessage: 'Story created successfully!',
        errorContext: 'Creating story',
        onSuccess: (story) => {
          console.log('Story created:', story.id);
        }
      }
    );
  }

  /**
   * Fetch stories with error handling and graceful degradation
   */
  async fetchStories(): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'fetch-stories',
      async () => {
        await this.storyService.fetchStories();
      },
      {
        errorContext: 'Fetching stories'
      }
    );
  }

  /**
   * Fetch my stories with error handling
   */
  async fetchMyStories(): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'fetch-my-stories',
      async () => {
        await this.storyService.fetchMyStories();
      },
      {
        errorContext: 'Fetching your stories'
      }
    );
  }

  /**
   * View a story with error handling
   */
  async viewStory(storyId: string, viewDuration?: number, completed: boolean = false): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'view-story',
      async () => {
        await this.storyService.viewStory(storyId, viewDuration, completed);
      },
      {
        errorContext: 'Recording story view'
      }
    );
  }

  /**
   * Update story with error handling
   */
  async updateStory(storyId: string, content?: string): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'update-story',
      async () => {
        await this.storyService.updateStory(storyId, content);
      },
      {
        successMessage: 'Story updated successfully!',
        errorContext: 'Updating story'
      }
    );
  }

  /**
   * Delete story with error handling
   */
  async deleteStory(storyId: string): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'delete-story',
      async () => {
        await this.storyService.deleteStory(storyId);
      },
      {
        successMessage: 'Story deleted and archived',
        errorContext: 'Deleting story'
      }
    );
  }

  /**
   * Add reaction with error handling
   */
  async addReaction(storyId: string, reactionType: string): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'add-reaction',
      async () => {
        await this.storyService.addReaction(storyId, reactionType);
      },
      {
        successMessage: 'Reaction added!',
        errorContext: 'Adding reaction'
      }
    );
  }

  /**
   * Remove reaction with error handling
   */
  async removeReaction(storyId: string): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'remove-reaction',
      async () => {
        await this.storyService.removeReaction(storyId);
      },
      {
        successMessage: 'Reaction removed',
        errorContext: 'Removing reaction'
      }
    );
  }

  /**
   * Send reply with error handling
   */
  async sendReply(storyId: string, message: string): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'send-reply',
      async () => {
        await this.storyService.sendReply(storyId, message);
      },
      {
        successMessage: 'Reply sent!',
        errorContext: 'Sending reply'
      }
    );
  }

  /**
   * Update story privacy with error handling
   */
  async updateStoryPrivacy(storyId: string, privacy: StoryPrivacySettings): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'update-privacy',
      async () => {
        await this.storyService.updateStoryPrivacy(storyId, privacy);
      },
      {
        successMessage: 'Privacy settings updated',
        errorContext: 'Updating privacy settings'
      }
    );
  }

  /**
   * Manage close friends with error handling
   */
  async manageCloseFriends(friendIds: string[]): Promise<void> {
    await this.errorHandler.executeWithHandling(
      'manage-close-friends',
      async () => {
        await this.storyService.manageCloseFriends(friendIds);
      },
      {
        successMessage: 'Close friends list updated',
        errorContext: 'Managing close friends'
      }
    );
  }

  /**
   * Check if operation is loading
   */
  isLoading(operation: string): boolean {
    return this.errorHandler.isLoading(operation);
  }

  /**
   * Get loading progress
   */
  getProgress(operation: string): number | undefined {
    return this.errorHandler.getProgress(operation);
  }

  /**
   * Get current error
   */
  getCurrentError() {
    return this.errorHandler.currentError();
  }

  /**
   * Clear current error
   */
  clearError(): void {
    this.errorHandler.clearError();
  }

  /**
   * Get success notifications
   */
  getSuccessNotifications() {
    return this.errorHandler.successNotifications();
  }

  /**
   * Dismiss success notification
   */
  dismissSuccess(notification: any): void {
    this.errorHandler.dismissSuccess(notification);
  }

  // Expose underlying story service signals
  get stories() {
    return this.storyService.stories;
  }

  get myStories() {
    return this.storyService.myStories;
  }

  get storyViews() {
    return this.storyService.storyViews;
  }

  get loading() {
    return this.storyService.loading;
  }

  get realtimeConnected() {
    return this.storyService.realtimeConnected;
  }
}

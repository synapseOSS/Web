import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { StoryViewerComponent } from './story-viewer.component';
import { ArchiveService, ArchivedStory } from '../services/archive.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

interface GroupedArchive {
  date: string;
  displayDate: string;
  stories: ArchivedStory[];
}

@Component({
  selector: 'app-story-archive',
  standalone: true,
  imports: [CommonModule, IconComponent, StoryViewerComponent],
  template: `
    <div class="w-full max-w-6xl mx-auto p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
            Story Archive
          </h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Your expired stories are automatically saved here
          </p>
        </div>
        
        @if (archivedStories().length > 0) {
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-600 dark:text-slate-400">
              {{ archivedStories().length }} {{ archivedStories().length === 1 ? 'story' : 'stories' }}
            </span>
          </div>
        }
      </div>

      <!-- Loading State -->
      @if (archiveService.loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p class="text-slate-600 dark:text-slate-400">Loading archive...</p>
          </div>
        </div>
      } 
      <!-- Empty State -->
      @else if (archivedStories().length === 0) {
        <div class="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <app-icon name="archive" [size]="64" class="text-slate-400 mx-auto mb-4"></app-icon>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No archived stories yet
          </h3>
          <p class="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your expired stories will automatically appear here. Stories are archived 24 hours after posting.
          </p>
        </div>
      } 
      <!-- Archive Grid -->
      @else {
        <div class="space-y-8">
          @for (group of groupedArchive(); track group.date) {
            <div>
              <!-- Date Header -->
              <div class="flex items-center gap-3 mb-4">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  {{ group.displayDate }}
                </h3>
                <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {{ group.stories.length }} {{ group.stories.length === 1 ? 'story' : 'stories' }}
                </span>
              </div>

              <!-- Stories Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                @for (story of group.stories; track story.id) {
                  <div class="group relative">
                    <!-- Story Thumbnail -->
                    <div 
                      (click)="viewStory(story)"
                      class="relative aspect-[9/16] rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 cursor-pointer">
                      <img
                        [src]="story.thumbnail_url || story.media_url"
                        [alt]="story.content || 'Archived story'"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                      
                      <!-- Overlay on Hover -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <!-- Story Info -->
                        <div class="absolute bottom-0 left-0 right-0 p-3">
                          @if (story.content) {
                            <p class="text-white text-xs line-clamp-2 mb-2">
                              {{ story.content }}
                            </p>
                          }
                          <div class="flex items-center gap-3 text-white text-xs">
                            <div class="flex items-center gap-1">
                              <app-icon name="eye" [size]="12"></app-icon>
                              <span>{{ story.views_count }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <app-icon name="heart" [size]="12"></app-icon>
                              <span>{{ story.reactions_count }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Action Buttons -->
                      <div class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <!-- Download Button -->
                        <button
                          (click)="downloadStory(story.id); $event.stopPropagation()"
                          class="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-lg transition-colors"
                          title="Download story">
                          <app-icon name="download" [size]="16" class="text-slate-700 dark:text-slate-300"></app-icon>
                        </button>

                        <!-- Restore Button -->
                        <button
                          (click)="restoreStory(story.id); $event.stopPropagation()"
                          class="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-lg transition-colors"
                          title="Restore story">
                          <app-icon name="refresh-cw" [size]="16" class="text-slate-700 dark:text-slate-300"></app-icon>
                        </button>

                        <!-- Delete Button -->
                        <button
                          (click)="deleteStory(story.id); $event.stopPropagation()"
                          class="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full shadow-lg transition-colors"
                          title="Delete permanently">
                          <app-icon name="trash" [size]="16" class="text-slate-700 dark:text-slate-300 hover:text-red-600"></app-icon>
                        </button>
                      </div>
                    </div>

                    <!-- Story Date -->
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                      {{ formatTime(story.created_at) }}
                    </p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Story Viewer -->
      @if (viewingStory()) {
        <app-story-viewer
          [storyGroups]="storyGroups()"
          [initialGroupIndex]="0"
          [isOpen]="true"
          (closed)="closeViewer()">
        </app-story-viewer>
      }

      <!-- Download Progress Dialog -->
      @if (downloadingStory()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Downloading Story
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Preparing your story for download...
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Restore Confirmation Dialog -->
      @if (restoringStory()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Restoring Story
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Your story is being restored...
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StoryArchiveComponent implements OnInit {
  archiveService = inject(ArchiveService);
  authService = inject(AuthService);
  profileService = inject(ProfileService);

  // State
  archivedStories = computed(() => this.archiveService.archivedStories());
  downloadingStory = signal(false);
  restoringStory = signal(false);
  viewingStory = signal(false);
  storyGroups = signal<any[]>([]);

  // Computed: Group stories by date
  groupedArchive = computed(() => {
    const stories = this.archivedStories();
    const groups = new Map<string, ArchivedStory[]>();

    stories.forEach(story => {
      const date = new Date(story.created_at);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(story);
    });

    // Convert to array and sort by date (newest first)
    const result: GroupedArchive[] = Array.from(groups.entries())
      .map(([date, stories]) => ({
        date,
        displayDate: this.formatDate(date),
        stories: stories.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return result;
  });

  ngOnInit() {
    this.loadArchive();
  }

  async loadArchive() {
    try {
      await this.archiveService.fetchArchivedStories();
    } catch (error) {
      console.error('Error loading archive:', error);
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      // Format as "Month Day, Year"
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  }

  // Format time for individual stories
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // View story in viewer
  viewStory(story: ArchivedStory) {
    const currentProfile = this.profileService.currentProfile();
    
    // Convert archived story to story format for viewer
    const storyGroup = {
      userId: story.user_id,
      username: currentProfile?.username || 'You',
      displayName: currentProfile?.display_name || 'You',
      avatarUrl: currentProfile?.avatar || '',
      stories: [{
        id: story.original_story_id,
        user_id: story.user_id,
        media_url: story.media_url,
        media_type: 'image' as const,
        thumbnail_url: story.thumbnail_url,
        content: story.content,
        duration_hours: 24,
        created_at: story.created_at,
        expires_at: story.created_at,
        views_count: story.views_count,
        reactions_count: story.reactions_count,
        replies_count: 0,
        is_active: false,
        privacy_setting: 'followers' as const,
        media_width: undefined,
        media_height: undefined,
        media_duration_seconds: undefined,
        file_size_bytes: undefined,
        is_reported: false,
        moderation_status: 'approved' as const
      }]
    };

    this.storyGroups.set([storyGroup]);
    this.viewingStory.set(true);
  }

  closeViewer() {
    this.viewingStory.set(false);
    this.storyGroups.set([]);
  }

  // Download story
  async downloadStory(archiveId: string) {
    this.downloadingStory.set(true);
    try {
      const downloadData = await this.archiveService.downloadArchivedStory(archiveId);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = downloadData.story.media_url;
      link.download = `story-${downloadData.story.original_story_id}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also download metadata as JSON
      const metadataBlob = new Blob(
        [JSON.stringify(downloadData.metadata, null, 2)], 
        { type: 'application/json' }
      );
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const metadataLink = document.createElement('a');
      metadataLink.href = metadataUrl;
      metadataLink.download = `story-${downloadData.story.original_story_id}-metadata.json`;
      document.body.appendChild(metadataLink);
      metadataLink.click();
      document.body.removeChild(metadataLink);
      URL.revokeObjectURL(metadataUrl);

    } catch (error) {
      console.error('Error downloading story:', error);
      alert('Failed to download story. Please try again.');
    } finally {
      this.downloadingStory.set(false);
    }
  }

  // Restore story
  async restoreStory(archiveId: string) {
    if (!confirm('Restore this story? It will be visible to your followers again.')) {
      return;
    }

    this.restoringStory.set(true);
    try {
      const restored = await this.archiveService.restoreArchivedStory(archiveId);
      
      if (restored) {
        alert('Story restored successfully!');
      } else {
        alert('Cannot restore this story as it has already expired.');
      }
    } catch (error) {
      console.error('Error restoring story:', error);
      alert('Failed to restore story. Please try again.');
    } finally {
      this.restoringStory.set(false);
    }
  }

  // Delete story permanently
  async deleteStory(archiveId: string) {
    if (!confirm('Permanently delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      await this.archiveService.permanentlyDeleteArchivedStory(archiveId);
      alert('Story deleted permanently.');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    }
  }
}

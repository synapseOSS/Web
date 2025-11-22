import { Component, inject, signal, computed, input, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { StoryViewerComponent } from './story-viewer.component';
import { HighlightService, HighlightWithStories, HighlightCreationOptions, HighlightUpdateOptions } from '../services/highlight.service';
import { Story, StoryService } from '../services/story.service';
import { AuthService } from '../services/auth.service';
import { ArchiveService } from '../services/archive.service';
import { ProfileService } from '../services/profile.service';

interface HighlightDialogMode {
  type: 'create' | 'edit' | 'select-stories' | 'reorder' | null;
  highlightId?: string;
  highlight?: HighlightWithStories;
}

@Component({
  selector: 'app-story-highlights',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StoryViewerComponent],
  template: `
    <div class="w-full">
      <!-- Highlights Display -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Story Highlights
        </h3>
        @if (isOwnProfile()) {
          <button
            (click)="openCreateDialog()"
            class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium">
            <app-icon name="plus" [size]="16"></app-icon>
            New Highlight
          </button>
        }
      </div>

      <!-- Highlights Grid -->
      @if (highlightService.loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      } @else if (highlights().length === 0) {
        <div class="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <app-icon name="bookmark" [size]="48" class="text-slate-400 mx-auto mb-3"></app-icon>
          <p class="text-slate-600 dark:text-slate-400">
            @if (isOwnProfile()) {
              No highlights yet. Create your first highlight to save your favorite stories!
            } @else {
              No highlights to show
            }
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          @for (highlight of highlights(); track highlight.id) {
            <div class="flex flex-col items-center gap-2 group">
              <!-- Highlight Circle -->
              <div 
                (click)="openHighlightViewer(highlight)"
                class="relative cursor-pointer">
                <div class="w-20 h-20 rounded-full border-2 border-slate-300 dark:border-slate-600 p-1 group-hover:border-indigo-500 transition-colors">
                  <div class="w-full h-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    @if (highlight.cover_image_url || highlight.stories[0]?.thumbnail_url || highlight.stories[0]?.media_url) {
                      <img 
                        [src]="highlight.cover_image_url || highlight.stories[0]?.thumbnail_url || highlight.stories[0]?.media_url"
                        [alt]="highlight.title"
                        class="w-full h-full object-cover">
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <app-icon name="bookmark" [size]="32" class="text-slate-400"></app-icon>
                      </div>
                    }
                  </div>
                </div>
                
                <!-- Story Count Badge -->
                @if (highlight.stories.length > 0) {
                  <div class="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-slate-950">
                    {{ highlight.stories.length }}
                  </div>
                }
              </div>
              
              <!-- Highlight Title -->
              <div class="text-center w-full">
                <p class="text-xs font-medium text-slate-900 dark:text-white truncate px-1">
                  {{ highlight.title }}
                </p>
              </div>
              
              <!-- Edit/Delete Actions (Own Profile Only) -->
              @if (isOwnProfile()) {
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    (click)="openEditDialog(highlight); $event.stopPropagation()"
                    class="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
                    title="Edit highlight">
                    <app-icon name="edit" [size]="14" class="text-slate-600 dark:text-slate-300"></app-icon>
                  </button>
                  <button
                    (click)="deleteHighlight(highlight.id); $event.stopPropagation()"
                    class="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    title="Delete highlight">
                    <app-icon name="trash" [size]="14" class="text-slate-600 dark:text-slate-300 hover:text-red-600"></app-icon>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Create/Edit Highlight Dialog -->
      @if (dialogMode().type === 'create' || dialogMode().type === 'edit') {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closeDialog()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-slate-900 dark:text-white">
                {{ dialogMode().type === 'create' ? 'Create Highlight' : 'Edit Highlight' }}
              </h3>
              <button
                (click)="closeDialog()"
                class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <app-icon name="x" [size]="20" class="text-slate-600 dark:text-slate-400"></app-icon>
              </button>
            </div>

            <form (submit)="saveHighlight(); $event.preventDefault()" class="space-y-4">
              <!-- Title Input -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Highlight Title
                </label>
                <input
                  type="text"
                  [(ngModel)]="highlightForm.title"
                  name="title"
                  placeholder="e.g., Summer 2024, Travel, Friends"
                  maxlength="100"
                  required
                  class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              </div>

              <!-- Cover Image URL (Optional) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  [(ngModel)]="highlightForm.cover_image_url"
                  name="cover_image_url"
                  placeholder="https://example.com/image.jpg"
                  class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Leave empty to use the first story's image
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  (click)="closeDialog()"
                  class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!highlightForm.title.trim()"
                  class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed">
                  {{ dialogMode().type === 'create' ? 'Create' : 'Save' }}
                </button>
              </div>

              <!-- Add Stories Button (Create Mode Only) -->
              @if (dialogMode().type === 'create') {
                <button
                  type="button"
                  (click)="openStorySelectionAfterCreate()"
                  class="w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <app-icon name="plus" [size]="16" class="inline mr-2"></app-icon>
                  Add Stories After Creating
                </button>
              }
            </form>

            <!-- Manage Stories (Edit Mode Only) -->
            @if (dialogMode().type === 'edit' && dialogMode().highlight) {
              <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                    Stories ({{ dialogMode().highlight!.stories.length }})
                  </h4>
                  <button
                    (click)="openStorySelection(dialogMode().highlightId!)"
                    class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
                    Add Stories
                  </button>
                </div>
                
                @if (dialogMode().highlight!.stories.length === 0) {
                  <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    No stories in this highlight yet
                  </p>
                } @else {
                  <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    @for (story of dialogMode().highlight!.stories; track story.id) {
                      <div class="relative group">
                        <img
                          [src]="story.thumbnail_url || story.media_url"
                          [alt]="story.content || 'Story'"
                          class="w-full aspect-square object-cover rounded-lg">
                        <button
                          (click)="removeStoryFromHighlight(dialogMode().highlightId!, story.id)"
                          class="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <app-icon name="x" [size]="12" class="text-white"></app-icon>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Story Selection Dialog -->
      @if (dialogMode().type === 'select-stories') {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closeDialog()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-xl font-semibold text-slate-900 dark:text-white">
                Select Stories
              </h3>
              <button
                (click)="closeDialog()"
                class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <app-icon name="x" [size]="20" class="text-slate-600 dark:text-slate-400"></app-icon>
              </button>
            </div>

            <!-- Stories Grid -->
            <div class="flex-1 overflow-y-auto p-6">
              @if (loadingArchiveStories()) {
                <div class="flex items-center justify-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              } @else if (archiveStories().length === 0) {
                <div class="text-center py-12">
                  <app-icon name="archive" [size]="48" class="text-slate-400 mx-auto mb-3"></app-icon>
                  <p class="text-slate-600 dark:text-slate-400">
                    No archived stories available
                  </p>
                </div>
              } @else {
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  @for (story of archiveStories(); track story.id) {
                    <div 
                      (click)="toggleStorySelection(story.id)"
                      class="relative cursor-pointer group">
                      <div 
                        class="aspect-square rounded-lg overflow-hidden border-2 transition-all"
                        [class.border-indigo-600]="selectedStoryIds().has(story.id)"
                        [class.border-slate-200]="!selectedStoryIds().has(story.id)"
                        [class.dark:border-indigo-500]="selectedStoryIds().has(story.id)"
                        [class.dark:border-slate-700]="!selectedStoryIds().has(story.id)">
                        <img
                          [src]="story.thumbnail_url || story.media_url"
                          [alt]="story.content || 'Story'"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                        
                        <!-- Selection Overlay -->
                        @if (selectedStoryIds().has(story.id)) {
                          <div class="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                              <app-icon name="check" [size]="20" class="text-white"></app-icon>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
              <p class="text-sm text-slate-600 dark:text-slate-400">
                {{ selectedStoryIds().size }} selected
              </p>
              <div class="flex gap-3">
                <button
                  (click)="closeDialog()"
                  class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button
                  (click)="addSelectedStoriesToHighlight()"
                  [disabled]="selectedStoryIds().size === 0"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed">
                  Add {{ selectedStoryIds().size }} Stories
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Story Viewer for Highlights -->
      @if (viewingHighlight()) {
        <app-story-viewer
          [storyGroups]="highlightStoryGroups()"
          [initialGroupIndex]="0"
          [isOpen]="true"
          (closed)="closeHighlightViewer()">
        </app-story-viewer>
      }
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class StoryHighlightsComponent implements OnInit {
  highlightService = inject(HighlightService);
  storyService = inject(StoryService);
  authService = inject(AuthService);
  archiveService = inject(ArchiveService);
  profileService = inject(ProfileService);

  // Input: User ID to display highlights for
  userId = input<string>();

  // Computed: Check if viewing own profile
  isOwnProfile = computed(() => {
    const targetUserId = this.userId();
    const currentUserId = this.authService.currentUser()?.id;
    return !targetUserId || targetUserId === currentUserId;
  });

  // Highlights data
  highlights = computed(() => this.highlightService.highlights());

  // Dialog state
  dialogMode = signal<HighlightDialogMode>({ type: null });
  
  // Form data
  highlightForm = {
    title: '',
    cover_image_url: ''
  };

  // Story selection state
  archiveStories = signal<Story[]>([]);
  loadingArchiveStories = signal(false);
  selectedStoryIds = signal<Set<string>>(new Set());
  currentHighlightId = signal<string | null>(null);

  // Story viewer state
  viewingHighlight = signal(false);
  highlightStoryGroups = signal<any[]>([]);

  constructor() {
    // Load highlights when user ID changes
    effect(() => {
      const targetUserId = this.userId();
      this.loadHighlights(targetUserId);
    });
  }

  ngOnInit() {
    this.loadHighlights(this.userId());
  }

  async loadHighlights(userId?: string) {
    await this.highlightService.fetchHighlights(userId);
  }

  // Dialog Management
  openCreateDialog() {
    this.highlightForm = {
      title: '',
      cover_image_url: ''
    };
    this.dialogMode.set({ type: 'create' });
  }

  openEditDialog(highlight: HighlightWithStories) {
    this.highlightForm = {
      title: highlight.title,
      cover_image_url: highlight.cover_image_url || ''
    };
    this.dialogMode.set({ 
      type: 'edit', 
      highlightId: highlight.id,
      highlight 
    });
  }

  closeDialog() {
    this.dialogMode.set({ type: null });
    this.selectedStoryIds.set(new Set());
    this.currentHighlightId.set(null);
  }

  // Highlight CRUD Operations
  async saveHighlight() {
    try {
      const mode = this.dialogMode();
      
      if (mode.type === 'create') {
        const options: HighlightCreationOptions = {
          title: this.highlightForm.title.trim(),
          cover_image_url: this.highlightForm.cover_image_url.trim() || undefined
        };
        
        await this.highlightService.createHighlight(options);
        this.closeDialog();
      } else if (mode.type === 'edit' && mode.highlightId) {
        const options: HighlightUpdateOptions = {
          title: this.highlightForm.title.trim(),
          cover_image_url: this.highlightForm.cover_image_url.trim() || undefined
        };
        
        await this.highlightService.updateHighlightMetadata(mode.highlightId, options);
        this.closeDialog();
      }
    } catch (error) {
      console.error('Error saving highlight:', error);
      alert('Failed to save highlight. Please try again.');
    }
  }

  async deleteHighlight(highlightId: string) {
    if (!confirm('Are you sure you want to delete this highlight? This cannot be undone.')) {
      return;
    }

    try {
      await this.highlightService.deleteHighlight(highlightId);
    } catch (error) {
      console.error('Error deleting highlight:', error);
      alert('Failed to delete highlight. Please try again.');
    }
  }

  // Story Selection
  async openStorySelection(highlightId: string) {
    this.currentHighlightId.set(highlightId);
    this.selectedStoryIds.set(new Set());
    this.dialogMode.set({ type: 'select-stories', highlightId });
    await this.loadArchiveStories();
  }

  openStorySelectionAfterCreate() {
    // This would be called after creating a highlight
    // For now, just close the dialog
    this.closeDialog();
  }

  async loadArchiveStories() {
    this.loadingArchiveStories.set(true);
    try {
      // Load archived stories from the archive service
      const archivedStories = await this.archiveService.fetchArchivedStories();
      
      // Convert archived stories to Story format for display
      const stories: Story[] = archivedStories.map(archived => ({
        id: archived.original_story_id,
        user_id: archived.user_id,
        media_url: archived.media_url,
        media_type: 'image' as const, // Default to image, could be enhanced
        thumbnail_url: archived.thumbnail_url,
        content: archived.content,
        duration_hours: 24,
        created_at: archived.created_at,
        expires_at: archived.created_at, // Already expired
        views_count: archived.views_count,
        reactions_count: archived.reactions_count,
        replies_count: 0,
        is_active: false,
        privacy_setting: 'followers' as const,
        media_width: undefined,
        media_height: undefined,
        media_duration_seconds: undefined,
        file_size_bytes: undefined,
        is_reported: false,
        moderation_status: 'approved' as const
      }));
      
      this.archiveStories.set(stories);
    } catch (error) {
      console.error('Error loading archive stories:', error);
      this.archiveStories.set([]);
    } finally {
      this.loadingArchiveStories.set(false);
    }
  }

  toggleStorySelection(storyId: string) {
    const current = new Set(this.selectedStoryIds());
    if (current.has(storyId)) {
      current.delete(storyId);
    } else {
      current.add(storyId);
    }
    this.selectedStoryIds.set(current);
  }

  async addSelectedStoriesToHighlight() {
    const highlightId = this.currentHighlightId();
    if (!highlightId) return;

    try {
      const storyIds = Array.from(this.selectedStoryIds());
      
      for (const storyId of storyIds) {
        await this.highlightService.addStoryToHighlight(highlightId, storyId);
      }
      
      this.closeDialog();
      
      // Reload the highlight to show updated stories
      await this.loadHighlights(this.userId());
    } catch (error) {
      console.error('Error adding stories to highlight:', error);
      alert('Failed to add stories. Please try again.');
    }
  }

  async removeStoryFromHighlight(highlightId: string, storyId: string) {
    if (!confirm('Remove this story from the highlight?')) {
      return;
    }

    try {
      await this.highlightService.removeStoryFromHighlight(highlightId, storyId);
      
      // Reload highlights to reflect changes
      await this.loadHighlights(this.userId());
    } catch (error) {
      console.error('Error removing story from highlight:', error);
      alert('Failed to remove story. Please try again.');
    }
  }

  // Highlight Viewer
  openHighlightViewer(highlight: HighlightWithStories) {
    if (highlight.stories.length === 0) {
      return;
    }

    // Get user profile for the story group
    const currentProfile = this.profileService.currentProfile();
    
    // Convert highlight stories to story groups format for the viewer
    const storyGroup = {
      userId: highlight.user_id,
      username: currentProfile?.username || 'User',
      displayName: currentProfile?.display_name || 'User',
      avatarUrl: currentProfile?.avatar || '',
      stories: highlight.stories
    };

    this.highlightStoryGroups.set([storyGroup]);
    this.viewingHighlight.set(true);
  }

  closeHighlightViewer() {
    this.viewingHighlight.set(false);
    this.highlightStoryGroups.set([]);
  }
}
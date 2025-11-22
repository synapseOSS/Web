import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from './icon.component';
import { DiscoveryService, ExploreStory, DiscoveryFilters } from '../services/discovery.service';
import { StoryViewerComponent } from './story-viewer.component';
import { MediaType } from '../services/story.service';

interface ContentTypeFilter {
  id: MediaType | 'all';
  name: string;
  icon: string;
}

@Component({
  selector: 'app-explore-stories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, StoryViewerComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
        <div class="px-4 py-3">
          <div class="flex items-center justify-between mb-3">
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Explore Stories</h1>
            
            <!-- Settings Button -->
            <button
              (click)="showSettings.set(!showSettings())"
              class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              [attr.aria-label]="'Settings'">
              <app-icon name="settings" [size]="20" class="text-slate-600 dark:text-slate-400"></app-icon>
            </button>
          </div>

          <!-- Search Bar -->
          <div class="relative mb-3">
            <app-icon name="search" [size]="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input 
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (keyup.enter)="performSearch()"
              type="text" 
              placeholder="Search by hashtag or location..."
              class="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
            @if (searchQuery) {
              <button 
                (click)="clearSearch()"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            }
          </div>

          <!-- Search Type Toggle -->
          @if (searchQuery) {
            <div class="flex gap-2 mb-3">
              <button
                (click)="searchType.set('hashtag')"
                [class.bg-indigo-600]="searchType() === 'hashtag'"
                [class.text-white]="searchType() === 'hashtag'"
                [class.bg-slate-100]="searchType() !== 'hashtag'"
                [class.dark:bg-slate-800]="searchType() !== 'hashtag'"
                [class.text-slate-600]="searchType() !== 'hashtag'"
                [class.dark:text-slate-400]="searchType() !== 'hashtag'"
                class="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2">
                <app-icon name="hash" [size]="16"></app-icon>
                <span>Hashtag</span>
              </button>
              <button
                (click)="searchType.set('location')"
                [class.bg-indigo-600]="searchType() === 'location'"
                [class.text-white]="searchType() === 'location'"
                [class.bg-slate-100]="searchType() !== 'location'"
                [class.dark:bg-slate-800]="searchType() !== 'location'"
                [class.text-slate-600]="searchType() !== 'location'"
                [class.dark:text-slate-400]="searchType() !== 'location'"
                class="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2">
                <app-icon name="map-pin" [size]="16"></app-icon>
                <span>Location</span>
              </button>
            </div>
          }

          <!-- Content Type Filters -->
          <div class="flex gap-2 overflow-x-auto scrollbar-hide">
            @for (filter of contentTypeFilters; track filter.id) {
              <button
                (click)="selectContentType(filter.id)"
                [class.bg-indigo-600]="selectedContentType() === filter.id"
                [class.text-white]="selectedContentType() === filter.id"
                [class.bg-slate-100]="selectedContentType() !== filter.id"
                [class.dark:bg-slate-800]="selectedContentType() !== filter.id"
                [class.text-slate-600]="selectedContentType() !== filter.id"
                [class.dark:text-slate-400]="selectedContentType() !== filter.id"
                class="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2">
                <app-icon [name]="filter.icon" [size]="16"></app-icon>
                <span>{{ filter.name }}</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Settings Panel -->
      @if (showSettings()) {
        <div class="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 p-4">
          <div class="max-w-2xl mx-auto">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Discovery Settings</h2>
            
            <!-- Discovery Opt-out Toggle -->
            <div class="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl">
              <div class="flex-1">
                <h3 class="font-semibold text-slate-900 dark:text-white mb-1">Hide from Discovery</h3>
                <p class="text-sm text-slate-500">Prevent your stories from appearing in explore and search results</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  [checked]="discoveryOptOut()"
                  (change)="toggleDiscoveryOptOut()"
                  class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            @if (settingsMessage()) {
              <div class="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-sm text-green-600 dark:text-green-400">{{ settingsMessage() }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Content -->
      <div class="pb-20">
        @if (loading()) {
          <!-- Loading State -->
          <div class="flex items-center justify-center py-20">
            <div class="text-center">
              <div class="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p class="text-slate-500">Loading stories...</p>
            </div>
          </div>
        } @else if (displayedStories().length === 0) {
          <!-- Empty State -->
          <div class="flex items-center justify-center py-20">
            <div class="text-center max-w-sm px-4">
              <app-icon name="compass" [size]="64" class="mx-auto mb-4 text-slate-300 dark:text-slate-700"></app-icon>
              @if (searchQuery) {
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">No stories found</h3>
                <p class="text-slate-500">Try searching for a different {{ searchType() }}</p>
              } @else {
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">No stories to explore</h3>
                <p class="text-slate-500">Check back later for new content from users you don't follow</p>
              }
            </div>
          </div>
        } @else {
          <!-- Story Grid -->
          <div class="p-4">
            @if (searchQuery) {
              <div class="mb-4">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                  Results for "{{ searchQuery }}"
                </h2>
                <p class="text-sm text-slate-500">{{ displayedStories().length }} stories found</p>
              </div>
            }

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              @for (story of displayedStories(); track story.id) {
                <div 
                  (click)="openStory(story)"
                  class="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group">
                  <!-- Story Thumbnail -->
                  @if (story.media_type === 'image') {
                    <img 
                      [src]="story.thumbnail_url || story.media_url" 
                      [alt]="'Story by ' + story.user.username"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  } @else {
                    <video 
                      [src]="story.media_url"
                      class="w-full h-full object-cover"
                      muted
                      playsinline></video>
                    <div class="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full">
                      <app-icon name="video" [size]="16" class="text-white"></app-icon>
                    </div>
                  }

                  <!-- Gradient Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  <!-- User Info -->
                  <div class="absolute bottom-0 left-0 right-0 p-3">
                    <div class="flex items-center gap-2 mb-2">
                      <img 
                        [src]="story.user.avatar" 
                        [alt]="story.user.username"
                        class="w-8 h-8 rounded-full border-2 border-white object-cover">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1">
                          <span class="text-white text-sm font-semibold truncate">{{ story.user.username }}</span>
                          @if (story.user.verify) {
                            <app-icon name="check-circle" [size]="14" class="text-indigo-400 flex-shrink-0"></app-icon>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Story Stats -->
                    <div class="flex items-center gap-3 text-white text-xs">
                      <div class="flex items-center gap-1">
                        <app-icon name="eye" [size]="14"></app-icon>
                        <span>{{ formatCount(story.views_count) }}</span>
                      </div>
                      @if (story.reactions_count > 0) {
                        <div class="flex items-center gap-1">
                          <app-icon name="heart" [size]="14"></app-icon>
                          <span>{{ formatCount(story.reactions_count) }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Hover Overlay -->
                  <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                      <app-icon name="play" [size]="24" class="text-white"></app-icon>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Load More Button -->
            @if (hasMore()) {
              <div class="mt-6 text-center">
                <button
                  (click)="loadMore()"
                  [disabled]="loadingMore()"
                  class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-full transition-all">
                  @if (loadingMore()) {
                    <span class="flex items-center gap-2">
                      <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Loading...
                    </span>
                  } @else {
                    Load More
                  }
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Story Viewer Modal -->
      @if (selectedStory()) {
        <div class="fixed inset-0 z-50 bg-black">
          <app-story-viewer
            [stories]="displayedStories()"
            [initialIndex]="selectedStoryIndex()"
            (close)="closeStory()"
            (viewRecorded)="onStoryViewed($event)">
          </app-story-viewer>
        </div>
      }
    </div>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class ExploreStoriesComponent implements OnInit, OnDestroy {
  private discoveryService = inject(DiscoveryService);

  // UI State
  loading = signal(false);
  loadingMore = signal(false);
  showSettings = signal(false);
  settingsMessage = signal('');

  // Search State
  searchQuery = '';
  searchType = signal<'hashtag' | 'location'>('hashtag');
  searchDebounceTimer: any;

  // Filter State
  selectedContentType = signal<MediaType | 'all'>('all');
  contentTypeFilters: ContentTypeFilter[] = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'image', name: 'Photos', icon: 'image' },
    { id: 'video', name: 'Videos', icon: 'video' }
  ];

  // Story State
  displayedStories = signal<ExploreStory[]>([]);
  selectedStory = signal<ExploreStory | null>(null);
  selectedStoryIndex = signal(0);
  hasMore = signal(true);
  currentPage = 1;
  pageSize = 20;

  // Settings
  discoveryOptOut = signal(false);

  ngOnInit() {
    this.loadInitialStories();
    this.loadDiscoverySettings();
  }

  ngOnDestroy() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  /**
   * Load initial explore feed
   */
  async loadInitialStories() {
    this.loading.set(true);
    try {
      const filters = this.buildFilters();
      const stories = await this.discoveryService.fetchExploreFeed(filters, this.pageSize);
      this.displayedStories.set(stories);
      this.hasMore.set(stories.length === this.pageSize);
      this.currentPage = 1;
    } catch (err) {
      console.error('Error loading explore stories:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load more stories (pagination)
   */
  async loadMore() {
    if (this.loadingMore()) return;

    this.loadingMore.set(true);
    try {
      this.currentPage++;
      const filters = this.buildFilters();
      const newStories = await this.discoveryService.fetchExploreFeed(
        filters,
        this.pageSize
      );

      // Append new stories, avoiding duplicates
      const existingIds = new Set(this.displayedStories().map(s => s.id));
      const uniqueNewStories = newStories.filter(s => !existingIds.has(s.id));

      this.displayedStories.update(stories => [...stories, ...uniqueNewStories]);
      this.hasMore.set(newStories.length === this.pageSize);
    } catch (err) {
      console.error('Error loading more stories:', err);
    } finally {
      this.loadingMore.set(false);
    }
  }

  /**
   * Build discovery filters from current UI state
   */
  private buildFilters(): DiscoveryFilters {
    const filters: DiscoveryFilters = {};

    if (this.selectedContentType() !== 'all') {
      filters.contentType = this.selectedContentType() as MediaType;
    }

    if (this.searchQuery && this.searchType() === 'hashtag') {
      filters.hashtag = this.searchQuery;
    }

    if (this.searchQuery && this.searchType() === 'location') {
      filters.location = this.searchQuery;
    }

    return filters;
  }

  /**
   * Handle search input with debouncing
   */
  onSearchInput() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch();
    }, 500);
  }

  /**
   * Perform search based on current query and type
   */
  async performSearch() {
    if (!this.searchQuery.trim()) {
      await this.loadInitialStories();
      return;
    }

    this.loading.set(true);
    try {
      let stories: ExploreStory[] = [];

      if (this.searchType() === 'hashtag') {
        stories = await this.discoveryService.searchByHashtag(this.searchQuery, this.pageSize);
      } else {
        stories = await this.discoveryService.searchByLocation(this.searchQuery, this.pageSize);
      }

      // Apply content type filter if needed
      if (this.selectedContentType() !== 'all') {
        stories = this.discoveryService.filterByContentType(
          stories,
          this.selectedContentType() as MediaType
        );
      }

      this.displayedStories.set(stories);
      this.hasMore.set(stories.length === this.pageSize);
      this.currentPage = 1;
    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Clear search and reload explore feed
   */
  clearSearch() {
    this.searchQuery = '';
    this.loadInitialStories();
  }

  /**
   * Select content type filter
   */
  async selectContentType(type: MediaType | 'all') {
    this.selectedContentType.set(type);
    
    if (this.searchQuery) {
      await this.performSearch();
    } else {
      await this.loadInitialStories();
    }
  }

  /**
   * Open story viewer
   */
  openStory(story: ExploreStory) {
    const index = this.displayedStories().findIndex(s => s.id === story.id);
    this.selectedStoryIndex.set(index);
    this.selectedStory.set(story);
  }

  /**
   * Close story viewer
   */
  closeStory() {
    this.selectedStory.set(null);
  }

  /**
   * Handle story view event
   */
  async onStoryViewed(event: { storyId: string; duration?: number; completed: boolean }) {
    await this.discoveryService.recordExploreView(
      event.storyId,
      event.duration,
      event.completed
    );

    // Update view count in displayed stories
    this.displayedStories.update(stories =>
      stories.map(s =>
        s.id === event.storyId
          ? { ...s, views_count: s.views_count + 1 }
          : s
      )
    );
  }

  /**
   * Load discovery settings
   */
  async loadDiscoverySettings() {
    try {
      const optOut = await this.discoveryService.getDiscoveryOptOut();
      this.discoveryOptOut.set(optOut);
    } catch (err) {
      console.error('Error loading discovery settings:', err);
    }
  }

  /**
   * Toggle discovery opt-out setting
   */
  async toggleDiscoveryOptOut() {
    const newValue = !this.discoveryOptOut();
    
    try {
      await this.discoveryService.setDiscoveryOptOut(newValue);
      this.discoveryOptOut.set(newValue);
      
      this.settingsMessage.set(
        newValue
          ? 'Your stories will no longer appear in explore and search'
          : 'Your stories can now appear in explore and search'
      );

      // Clear message after 3 seconds
      setTimeout(() => {
        this.settingsMessage.set('');
      }, 3000);
    } catch (err) {
      console.error('Error toggling discovery opt-out:', err);
      this.settingsMessage.set('Failed to update settings. Please try again.');
    }
  }

  /**
   * Format count for display (e.g., 1.2K, 3.4M)
   */
  formatCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
}

import { Component, inject, signal, computed, AfterViewInit, ElementRef, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialService } from '../services/social.service';
import { IconComponent } from './icon.component';
import { StoryViewerComponent } from './story-viewer.component';
import { StoryCreatorComponent } from './story-creator.component';
import { StoryService, Story } from '../services/story.service';

interface StoryGroup {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  stories: Story[];
  hasUnviewed: boolean;
  latestStoryTime: Date;
  totalStories: number;
  unviewedCount: number;
}

@Component({
  selector: 'app-story-rail',
  standalone: true,
  imports: [CommonModule, IconComponent, StoryViewerComponent, StoryCreatorComponent],
  template: `
    <!-- Performance Metrics (dev only) -->
    @if (showMetrics()) {
      <div class="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-lg text-xs z-50">
        <div class="font-bold mb-1">Performance Metrics</div>
        <div>Cache Hits: {{ metrics().cacheHits }}</div>
        <div>Cache Misses: {{ metrics().cacheMisses }}</div>
        <div>Preloaded: {{ metrics().preloadedImages }}</div>
        <div>Compression Saved: {{ formatBytes(metrics().compressionSavings) }}</div>
      </div>
    }
    
    <div class="w-full overflow-x-auto py-4 px-4 no-scrollbar">
      <div class="flex gap-4 min-w-min">
        <!-- Create Story Button -->
        <div 
          (click)="openStoryCreator()"
          class="flex flex-col items-center gap-2 cursor-pointer group"
          role="button"
          tabindex="0"
          (keydown.enter)="openStoryCreator()"
          (keydown.space)="openStoryCreator()">
          <div class="relative w-16 h-16 rounded-full border-2 border-slate-200 dark:border-white/10 p-0.5 group-hover:border-indigo-500 transition-colors">
             <div class="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
               <img [src]="currentUser().avatar" class="w-full h-full object-cover opacity-50" alt="Your avatar">
               <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                  <app-icon name="plus" [size]="24" class="text-white"></app-icon>
               </div>
             </div>
             <div class="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 border-2 border-white dark:border-slate-950">
               <app-icon name="plus" [size]="10" class="text-white"></app-icon>
             </div>
          </div>
          <span class="text-xs font-medium text-slate-600 dark:text-slate-400">Your Story</span>
        </div>

        <!-- User Stories -->
        @for (group of storyGroups(); track group.userId; let i = $index) {
          <div 
            (click)="openStoryViewer(i)"
            (mouseenter)="showPreview(group, $event)"
            (mouseleave)="hidePreview()"
            class="flex flex-col items-center gap-2 cursor-pointer group relative"
            role="button"
            tabindex="0"
            (keydown.enter)="openStoryViewer(i)"
            (keydown.space)="openStoryViewer(i)">
             <!-- Story Ring with Unviewed Indicator -->
             <div 
               class="w-16 h-16 rounded-full p-[2px] group-hover:scale-105 transition-transform relative"
               [class.bg-gradient-to-tr]="group.hasUnviewed"
               [class.from-indigo-500]="group.hasUnviewed"
               [class.via-purple-500]="group.hasUnviewed"
               [class.to-orange-500]="group.hasUnviewed"
               [class.bg-slate-300]="!group.hasUnviewed"
               [class.dark:bg-slate-700]="!group.hasUnviewed">
                <div class="w-full h-full rounded-full border-2 border-white dark:border-slate-950 overflow-hidden">
                  <img 
                    #storyAvatar
                    [attr.data-src]="group.avatarUrl"
                    [src]="group.avatarUrl" 
                    class="w-full h-full object-cover" 
                    [alt]="group.username"
                    loading="lazy">
                </div>
                
                <!-- Unviewed Count Badge -->
                @if (group.hasUnviewed && group.unviewedCount > 0) {
                  <div class="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-slate-950">
                    {{ group.unviewedCount }}
                  </div>
                }
             </div>
             
             <span class="text-xs font-medium truncate w-16 text-center"
                   [class.text-slate-900]="group.hasUnviewed"
                   [class.dark:text-white]="group.hasUnviewed"
                   [class.text-slate-600]="!group.hasUnviewed"
                   [class.dark:text-slate-400]="!group.hasUnviewed">
               {{ group.username }}
             </span>
          </div>
        }
      </div>
    </div>

    <!-- Story Preview Tooltip on Hover -->
    @if (previewGroup() && showPreviewTooltip()) {
      <div 
        class="fixed z-40 pointer-events-none"
        [style.left.px]="previewPosition().x"
        [style.top.px]="previewPosition().y">
        <div class="bg-slate-900 dark:bg-slate-800 rounded-lg shadow-2xl p-3 min-w-[200px] transform -translate-x-1/2 -translate-y-full mb-2">
          <!-- Preview Header -->
          <div class="flex items-center gap-2 mb-2">
            <img [src]="previewGroup()!.avatarUrl" class="w-8 h-8 rounded-full" [alt]="previewGroup()!.username">
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm truncate">{{ previewGroup()!.displayName }}</p>
              <p class="text-slate-400 text-xs">@{{ previewGroup()!.username }}</p>
            </div>
          </div>
          
          <!-- Preview Info -->
          <div class="space-y-1 text-xs">
            <div class="flex items-center justify-between text-slate-300">
              <span>Stories:</span>
              <span class="font-semibold">{{ previewGroup()!.totalStories }}</span>
            </div>
            @if (previewGroup()!.hasUnviewed) {
              <div class="flex items-center justify-between text-indigo-400">
                <span>Unviewed:</span>
                <span class="font-semibold">{{ previewGroup()!.unviewedCount }}</span>
              </div>
            }
            <div class="flex items-center justify-between text-slate-400">
              <span>Latest:</span>
              <span>{{ formatTimeAgo(previewGroup()!.latestStoryTime) }}</span>
            </div>
          </div>
          
          <!-- Preview Thumbnail -->
          @if (previewGroup()!.stories[0]?.thumbnail_url || previewGroup()!.stories[0]?.media_url) {
            <div class="mt-2 rounded overflow-hidden">
              <img 
                [src]="previewGroup()!.stories[0].thumbnail_url || previewGroup()!.stories[0].media_url" 
                class="w-full h-24 object-cover"
                alt="Story preview">
            </div>
          }
          
          <!-- Arrow -->
          <div class="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div class="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
          </div>
        </div>
      </div>
    }

    <!-- Story Creator Modal -->
    @if (showCreator()) {
      <app-story-creator
        (cancelled)="closeStoryCreator()"
        (storyCreated)="onStoryPublished()">
      </app-story-creator>
    }

    <!-- Story Viewer -->
    @if (showViewer()) {
      <app-story-viewer
        [storyGroups]="storyGroups()"
        [initialGroupIndex]="selectedGroupIndex()"
        [initialStoryIndex]="0"
        (closed)="closeStoryViewer()">
      </app-story-viewer>
    }
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
export class StoryRailComponent implements AfterViewInit, OnDestroy {
  socialService = inject(SocialService);
  storyService = inject(StoryService);
  
  @ViewChildren('storyAvatar') storyAvatars!: QueryList<ElementRef>;
  
  currentUser = this.socialService.currentUser;
  
  // Story viewer state
  showViewer = signal(false);
  selectedGroupIndex = signal(0);
  
  // Story creator state
  showCreator = signal(false);
  
  // Preview state
  showPreviewTooltip = signal(false);
  previewGroup = signal<StoryGroup | null>(null);
  previewPosition = signal({ x: 0, y: 0 });
  private previewTimeout: any = null;
  
  // Group stories by user with enhanced metadata
  storyGroups = signal<StoryGroup[]>([]);
  
  // Performance metrics
  metrics = this.storyService.getPerformanceMetrics;
  showMetrics = signal(false); // Set to true for development
  
  constructor() {
    // Load stories and group them
    this.loadStories();
  }
  
  ngAfterViewInit() {
    // Set up lazy loading for avatars (Requirement 11.3: Lazy loading)
    this.storyAvatars.changes.subscribe(() => {
      this.setupLazyLoading();
    });
    this.setupLazyLoading();
  }
  
  ngOnDestroy() {
    // Cleanup lazy loading observers
    this.storyAvatars.forEach(avatar => {
      this.storyService.unobserveForLazyLoad(avatar.nativeElement);
    });
  }
  
  private setupLazyLoading() {
    // Observe all avatar images for lazy loading
    this.storyAvatars.forEach(avatar => {
      this.storyService.observeForLazyLoad(avatar.nativeElement);
    });
  }
  
  async loadStories() {
    await this.storyService.fetchStories();
    const stories = this.storyService.stories();
    
    // Group stories by user
    const groupMap = new Map<string, StoryGroup>();
    
    for (const story of stories) {
      if (!story.user) continue;
      
      const userId = story.user_id;
      if (!groupMap.has(userId)) {
        groupMap.set(userId, {
          userId,
          username: story.user.username,
          displayName: story.user.display_name,
          avatarUrl: story.user.avatar,
          stories: [],
          hasUnviewed: false,
          latestStoryTime: new Date(story.created_at),
          totalStories: 0,
          unviewedCount: 0
        });
      }
      
      const group = groupMap.get(userId)!;
      group.stories.push(story);
      
      // Update latest story time
      const storyTime = new Date(story.created_at);
      if (storyTime > group.latestStoryTime) {
        group.latestStoryTime = storyTime;
      }
      
      // Track unviewed stories
      if (!story.is_viewed) {
        group.hasUnviewed = true;
        group.unviewedCount++;
      }
    }
    
    // Update total stories count and sort stories within each group
    groupMap.forEach(group => {
      group.totalStories = group.stories.length;
      // Sort stories by creation time (oldest first for viewing order)
      group.stories.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
    
    // Convert to array and sort groups
    // Priority: unviewed stories first, then by latest story time
    const groups = Array.from(groupMap.values()).sort((a, b) => {
      // Unviewed stories come first
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      
      // Then sort by latest story time
      return b.latestStoryTime.getTime() - a.latestStoryTime.getTime();
    });
    
    this.storyGroups.set(groups);
  }
  
  openStoryViewer(groupIndex: number) {
    this.selectedGroupIndex.set(groupIndex);
    this.showViewer.set(true);
    this.hidePreview(); // Hide preview when opening viewer
  }
  
  closeStoryViewer() {
    this.showViewer.set(false);
    // Reload stories to update viewed status
    this.loadStories();
  }
  
  openStoryCreator() {
    this.showCreator.set(true);
  }
  
  closeStoryCreator() {
    this.showCreator.set(false);
  }
  
  onStoryPublished() {
    this.closeStoryCreator();
    // Reload stories to show the new story
    this.loadStories();
  }
  
  showPreview(group: StoryGroup, event: MouseEvent) {
    // Clear any existing timeout
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
    }
    
    // Show preview after a short delay (500ms)
    this.previewTimeout = setTimeout(() => {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      this.previewGroup.set(group);
      this.previewPosition.set({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      this.showPreviewTooltip.set(true);
    }, 500);
  }
  
  hidePreview() {
    // Clear timeout if user moves away before preview shows
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
    
    this.showPreviewTooltip.set(false);
    this.previewGroup.set(null);
  }
  
  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
  
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

import { Component, input, output, signal, computed, effect, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { ReactionPickerComponent, ReactionType } from './reaction-picker.component';
import { Story, StoryService } from '../services/story.service';
import { InteractiveElementService } from '../services/interactive-element.service';

interface StoryGroup {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  stories: Story[];
}

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ReactionPickerComponent],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 z-50 bg-black"
        role="dialog"
        aria-modal="true"
        aria-label="Story viewer"
        [attr.aria-describedby]="'story-description-' + currentStory()?.id">
        <!-- Story Container -->
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- Navigation Areas -->
          <div class="absolute inset-0 flex">
            <!-- Left tap area - Previous story -->
            <div 
              class="w-1/3 h-full cursor-pointer"
              role="button"
              tabindex="0"
              aria-label="Previous story"
              (click)="previousStory()"
              (keydown.enter)="previousStory()"
              (keydown.space)="previousStory(); $event.preventDefault()"
              (mousedown)="pauseStory()"
              (mouseup)="resumeStory()"
              (touchstart)="pauseStory()"
              (touchend)="resumeStory()">
            </div>
            
            <!-- Middle tap area - Pause/Resume -->
            <div 
              class="w-1/3 h-full"
              role="button"
              tabindex="0"
              [attr.aria-label]="isPaused() ? 'Resume story' : 'Pause story'"
              (keydown.space)="togglePause(); $event.preventDefault()"
              (mousedown)="pauseStory()"
              (mouseup)="resumeStory()"
              (touchstart)="pauseStory()"
              (touchend)="resumeStory()">
            </div>
            
            <!-- Right tap area - Next story -->
            <div 
              class="w-1/3 h-full cursor-pointer"
              role="button"
              tabindex="0"
              aria-label="Next story"
              (click)="nextStory()"
              (keydown.enter)="nextStory()"
              (keydown.space)="nextStory(); $event.preventDefault()"
              (mousedown)="pauseStory()"
              (mouseup)="resumeStory()"
              (touchstart)="pauseStory()"
              (touchend)="resumeStory()">
            </div>
          </div>

          <!-- Story Content -->
          <div class="relative w-full max-w-md h-full bg-black">
            @if (currentStory()) {
              <!-- Progress Indicators -->
              <div 
                class="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2"
                role="progressbar"
                [attr.aria-valuenow]="progress()"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-label]="'Story ' + (currentStoryIndex() + 1) + ' of ' + (currentGroup()?.stories.length || 0)">
                @for (story of currentGroup()?.stories || []; track story.id; let i = $index) {
                  <div class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-white transition-all duration-100"
                      [style.width.%]="getProgressWidth(i)">
                    </div>
                  </div>
                }
              </div>

              <!-- Header -->
              <div class="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <img 
                    [src]="currentStory()?.user?.avatar" 
                    [alt]="currentStory()?.user?.username"
                    class="w-10 h-10 rounded-full border-2 border-white">
                  <div class="text-white">
                    <div class="font-semibold text-sm">{{ currentStory()?.user?.display_name }}</div>
                    <div class="text-xs opacity-75">{{ getTimeAgo(currentStory()?.created_at) }}</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  @if (isPaused()) {
                    <button 
                      class="text-white p-2"
                      aria-label="Story is paused">
                      <app-icon name="pause" [size]="20"></app-icon>
                    </button>
                  }
                  <button 
                    (click)="close()"
                    (keydown.enter)="close()"
                    aria-label="Close story viewer"
                    class="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <app-icon name="x" [size]="24"></app-icon>
                  </button>
                </div>
              </div>

              <!-- Media Content -->
              <div class="w-full h-full flex items-center justify-center">
                @if (currentStory()?.media_type === 'image') {
                  <img 
                    [src]="currentStory()?.media_url"
                    [alt]="getStoryAltText()"
                    role="img"
                    class="w-full h-full object-contain"
                    (load)="onMediaLoaded()">
                } @else if (currentStory()?.media_type === 'video') {
                  <video 
                    #videoPlayer
                    [src]="currentStory()?.media_url"
                    [attr.aria-label]="getStoryAltText()"
                    class="w-full h-full object-contain"
                    [muted]="isMuted()"
                    (loadeddata)="onMediaLoaded()"
                    (ended)="onVideoEnded()"
                    autoplay
                    playsinline>
                  </video>
                }
              </div>
              
              <!-- Screen Reader Announcement -->
              <div 
                class="sr-only" 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
                [attr.id]="'story-description-' + currentStory()?.id">
                {{ getScreenReaderAnnouncement() }}
              </div>

              <!-- Text Overlay -->
              @if (currentStory()?.content) {
                <div class="absolute inset-x-0 bottom-32 z-10 px-6 text-center">
                  <p class="text-white text-lg font-medium drop-shadow-lg">
                    {{ currentStory()?.content }}
                  </p>
                </div>
              }

              <!-- Interactive Elements -->
              @if (currentStory()?.interactive_elements && currentStory()?.interactive_elements!.length > 0) {
                <div class="absolute inset-0 z-10 pointer-events-none">
                  @for (element of currentStory()?.interactive_elements; track element.id) {
                    <div 
                      class="absolute pointer-events-auto"
                      [style.left.%]="(element.position_x || 50)"
                      [style.top.%]="(element.position_y || 50)"
                      [style.transform]="'translate(-50%, -50%)'">
                      @switch (element.element_type) {
                        @case ('poll') {
                          <div class="bg-black/60 backdrop-blur-sm rounded-2xl p-4 min-w-[250px]">
                            <div class="text-white font-semibold mb-3">{{ element.element_data.question }}</div>
                            @for (option of element.element_data.options; track option; let i = $index) {
                              <button
                                (click)="respondToPoll(element.id, i)"
                                [disabled]="hasRespondedToElement(element.id)"
                                class="w-full text-left px-4 py-2 mb-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50">
                                {{ option }}
                                @if (hasRespondedToElement(element.id) && pollResults()[element.id]) {
                                  <span class="float-right">{{ pollResults()[element.id][i] || 0 }}%</span>
                                }
                              </button>
                            }
                          </div>
                        }
                        @case ('question') {
                          <div class="bg-black/60 backdrop-blur-sm rounded-2xl p-4 min-w-[250px]">
                            <div class="text-white font-semibold mb-3">{{ element.element_data.question }}</div>
                            @if (!hasRespondedToElement(element.id)) {
                              <input
                                type="text"
                                [(ngModel)]="questionResponses()[element.id]"
                                (keyup.enter)="respondToQuestion(element.id)"
                                placeholder="Type your answer..."
                                class="w-full px-3 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/50">
                            } @else {
                              <div class="text-white/70 text-sm">✓ Response sent</div>
                            }
                          </div>
                        }
                        @case ('countdown') {
                          <div class="bg-black/60 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[200px]">
                            <div class="text-white font-semibold mb-2">{{ element.element_data.title }}</div>
                            <div class="text-white text-3xl font-bold">
                              {{ getCountdownTime(element.element_data.target_date) }}
                            </div>
                          </div>
                        }
                        @case ('link') {
                          <a
                            [href]="element.element_data.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block bg-black/60 backdrop-blur-sm rounded-2xl p-4 text-white hover:bg-black/70 transition-colors">
                            <div class="font-semibold">{{ element.element_data.title || 'Link' }}</div>
                            <div class="text-sm opacity-75 flex items-center gap-1 mt-1">
                              <app-icon name="external-link" [size]="14"></app-icon>
                              {{ element.element_data.url }}
                            </div>
                          </a>
                        }
                      }
                    </div>
                  }
                </div>
              }

              <!-- Bottom Actions -->
              <div class="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div class="flex items-center gap-3">
                  <!-- Reply Input -->
                  <div class="flex-1 relative">
                    <label for="story-reply-input" class="sr-only">Send a reply to this story</label>
                    <input
                      id="story-reply-input"
                      type="text"
                      [(ngModel)]="replyMessage"
                      (keyup.enter)="sendReply()"
                      placeholder="Send message..."
                      aria-label="Reply to story"
                      class="w-full px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40">
                  </div>

                  <!-- Reaction Button -->
                  <app-reaction-picker
                    (reactionSelected)="addReaction($event)"
                    triggerClass="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <button aria-label="Add reaction to story">
                      <app-icon name="heart" [size]="24" class="text-white"></app-icon>
                    </button>
                  </app-reaction-picker>

                  <!-- More Options -->
                  <button 
                    (click)="toggleOptions()"
                    (keydown.enter)="toggleOptions()"
                    aria-label="More options"
                    [attr.aria-expanded]="showOptions()"
                    class="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <app-icon name="more-vertical" [size]="24" class="text-white"></app-icon>
                  </button>
                </div>
              </div>

              <!-- Options Menu -->
              @if (showOptions()) {
                <div 
                  class="absolute bottom-20 right-4 z-30 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-white/10 py-2 min-w-[200px]"
                  role="menu"
                  aria-label="Story options">
                  <button
                    (click)="muteToggle()"
                    (keydown.enter)="muteToggle()"
                    role="menuitem"
                    [attr.aria-label]="isMuted() ? 'Unmute video' : 'Mute video'"
                    class="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                    <app-icon [name]="isMuted() ? 'volume-x' : 'volume-2'" [size]="18"></app-icon>
                    <span>{{ isMuted() ? 'Unmute' : 'Mute' }}</span>
                  </button>
                  <button
                    (click)="reportStory()"
                    (keydown.enter)="reportStory()"
                    role="menuitem"
                    aria-label="Report this story"
                    class="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-red-600">
                    <app-icon name="flag" [size]="18"></app-icon>
                    <span>Report</span>
                  </button>
                </div>
              }
            }
          </div>

          <!-- Swipe Down to Close Indicator -->
          <div class="absolute top-2 left-1/2 -translate-x-1/2 z-10">
            <div class="w-12 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class StoryViewerComponent implements OnDestroy {
  // Inputs
  storyGroups = input.required<StoryGroup[]>();
  initialGroupIndex = input<number>(0);
  initialStoryIndex = input<number>(0);
  
  // Outputs
  closed = output<void>();
  storyViewed = output<{ storyId: string; duration: number; completed: boolean }>();
  
  // Services
  private storyService = inject(StoryService);
  private interactiveService = inject(InteractiveElementService);
  
  // State
  isOpen = signal(true);
  currentGroupIndex = signal(0);
  currentStoryIndex = signal(0);
  isPaused = signal(false);
  isMuted = signal(false);
  showOptions = signal(false);
  
  // Progress tracking
  progress = signal(0);
  storyDuration = 5000; // 5 seconds per story
  progressInterval: any = null;
  viewStartTime = 0;
  
  // Reply and reactions
  replyMessage = signal('');
  
  // Interactive elements
  questionResponses = signal<Record<string, string>>({});
  pollResults = signal<Record<string, number[]>>({});
  respondedElements = signal<Set<string>>(new Set());
  
  // Computed
  currentGroup = computed(() => {
    const groups = this.storyGroups();
    const index = this.currentGroupIndex();
    return groups[index];
  });
  
  currentStory = computed(() => {
    const group = this.currentGroup();
    if (!group) return null;
    const index = this.currentStoryIndex();
    return group.stories[index];
  });
  
  constructor() {
    // Initialize from inputs
    effect(() => {
      this.currentGroupIndex.set(this.initialGroupIndex());
      this.currentStoryIndex.set(this.initialStoryIndex());
    });
    
    // Start story when component loads
    effect(() => {
      const story = this.currentStory();
      if (story) {
        this.startStory();
      }
    });
    
    // Handle keyboard navigation
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyboard);
      
      // Handle swipe gestures
      let touchStartY = 0;
      window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      });
      
      window.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchEndY - touchStartY;
        
        // Swipe down to close
        if (diff > 100) {
          this.close();
        }
      });
    }
  }
  
  ngOnDestroy() {
    this.stopProgress();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyboard);
    }
    this.recordView(false);
  }
  
  private handleKeyboard = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.previousStory();
        this.announceStoryChange();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextStory();
        this.announceStoryChange();
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case ' ':
        e.preventDefault();
        this.togglePause();
        break;
      case 'r':
      case 'R':
        // Focus reply input
        if (typeof document !== 'undefined') {
          const replyInput = document.getElementById('story-reply-input');
          if (replyInput) {
            replyInput.focus();
          }
        }
        break;
    }
  };
  
  togglePause() {
    if (this.isPaused()) {
      this.resumeStory();
    } else {
      this.pauseStory();
    }
  }
  
  getStoryAltText(): string {
    const story = this.currentStory();
    if (!story) return 'Story';
    
    // Use content as alt text if available, otherwise generate descriptive text
    if (story.content) {
      return story.content;
    }
    
    const username = story.user?.display_name || story.user?.username || 'User';
    const mediaType = story.media_type === 'video' ? 'video' : 'image';
    return `${username}'s story ${mediaType}`;
  }
  
  getScreenReaderAnnouncement(): string {
    const story = this.currentStory();
    const group = this.currentGroup();
    if (!story || !group) return '';
    
    const storyNum = this.currentStoryIndex() + 1;
    const totalStories = group.stories.length;
    const username = story.user?.display_name || story.user?.username || 'User';
    const timeAgo = this.getTimeAgo(story.created_at);
    
    let announcement = `Story ${storyNum} of ${totalStories} from ${username}, posted ${timeAgo}.`;
    
    if (story.content) {
      announcement += ` ${story.content}`;
    }
    
    if (story.interactive_elements && story.interactive_elements.length > 0) {
      const elementTypes = story.interactive_elements.map(el => el.element_type).join(', ');
      announcement += ` Contains interactive elements: ${elementTypes}.`;
    }
    
    if (this.isPaused()) {
      announcement += ' Story is paused.';
    }
    
    return announcement;
  }
  
  private announceStoryChange() {
    // Trigger screen reader announcement by updating the announcement text
    // The aria-live region will automatically announce the change
    setTimeout(() => {
      this.getScreenReaderAnnouncement();
    }, 100);
  }
  
  startStory() {
    this.stopProgress();
    this.progress.set(0);
    this.viewStartTime = Date.now();
    
    const story = this.currentStory();
    if (!story) return;
    
    // For videos, use video duration
    if (story.media_type === 'video' && story.media_duration_seconds) {
      this.storyDuration = story.media_duration_seconds * 1000;
    } else {
      this.storyDuration = 5000; // 5 seconds for images
    }
    
    this.startProgress();
  }
  
  startProgress() {
    const interval = 50; // Update every 50ms
    this.progressInterval = setInterval(() => {
      if (!this.isPaused()) {
        this.progress.update(p => {
          const newProgress = p + (interval / this.storyDuration) * 100;
          if (newProgress >= 100) {
            this.onStoryComplete();
            return 100;
          }
          return newProgress;
        });
      }
    }, interval);
  }
  
  stopProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  
  pauseStory() {
    this.isPaused.set(true);
  }
  
  resumeStory() {
    this.isPaused.set(false);
  }
  
  onStoryComplete() {
    this.recordView(true);
    this.nextStory();
  }
  
  onVideoEnded() {
    this.onStoryComplete();
  }
  
  onMediaLoaded() {
    // Media loaded, ensure progress is running
    if (!this.progressInterval) {
      this.startProgress();
    }
  }
  
  recordView(completed: boolean) {
    const story = this.currentStory();
    if (!story) return;
    
    const duration = Math.floor((Date.now() - this.viewStartTime) / 1000);
    
    // Record view in service
    this.storyService.viewStory(story.id, duration, completed);
    
    // Emit event
    this.storyViewed.emit({
      storyId: story.id,
      duration,
      completed
    });
  }
  
  nextStory() {
    const group = this.currentGroup();
    if (!group) return;
    
    this.recordView(false);
    
    // Check if there are more stories in current group
    if (this.currentStoryIndex() < group.stories.length - 1) {
      this.currentStoryIndex.update(i => i + 1);
    } else {
      // Move to next group
      const groups = this.storyGroups();
      if (this.currentGroupIndex() < groups.length - 1) {
        this.currentGroupIndex.update(i => i + 1);
        this.currentStoryIndex.set(0);
      } else {
        // No more stories, close viewer
        this.close();
      }
    }
  }
  
  previousStory() {
    this.recordView(false);
    
    // Check if there are previous stories in current group
    if (this.currentStoryIndex() > 0) {
      this.currentStoryIndex.update(i => i - 1);
    } else {
      // Move to previous group
      if (this.currentGroupIndex() > 0) {
        this.currentGroupIndex.update(i => i - 1);
        const prevGroup = this.currentGroup();
        if (prevGroup) {
          this.currentStoryIndex.set(prevGroup.stories.length - 1);
        }
      }
    }
  }
  
  getProgressWidth(index: number): number {
    const currentIndex = this.currentStoryIndex();
    if (index < currentIndex) return 100;
    if (index > currentIndex) return 0;
    return this.progress();
  }
  
  getTimeAgo(dateString?: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  async sendReply() {
    const message = this.replyMessage();
    if (!message.trim()) return;
    
    const story = this.currentStory();
    if (!story) return;
    
    try {
      await this.storyService.sendReply(story.id, message);
      this.replyMessage.set('');
      // Show success feedback
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  }
  
  async addReaction(reactionType: ReactionType) {
    const story = this.currentStory();
    if (!story) return;
    
    try {
      await this.storyService.addReaction(story.id, reactionType);
      // Show success feedback
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  }
  
  async respondToPoll(elementId: string, optionIndex: number) {
    const story = this.currentStory();
    if (!story) return;
    
    try {
      // Get the element to find the option text
      const element = await this.interactiveService.getElement(elementId);
      if (!element || element.element_type !== 'poll') return;
      
      const pollData = element.element_data as any;
      const selectedOption = pollData.options[optionIndex];
      
      await this.interactiveService.recordResponse(
        elementId,
        { selected_options: [selectedOption] }
      );
      
      // Mark as responded
      this.respondedElements.update(set => {
        const newSet = new Set(set);
        newSet.add(elementId);
        return newSet;
      });
      
      // Fetch and display results
      const results = await this.interactiveService.getPollResults(elementId);
      if (results) {
        const percentages = results.options.map(opt => opt.percentage);
        this.pollResults.update(pr => ({
          ...pr,
          [elementId]: percentages
        }));
      }
    } catch (err) {
      console.error('Error responding to poll:', err);
    }
  }
  
  async respondToQuestion(elementId: string) {
    const response = this.questionResponses()[elementId];
    if (!response?.trim()) return;
    
    try {
      await this.interactiveService.recordResponse(
        elementId,
        { answer: response }
      );
      
      // Mark as responded
      this.respondedElements.update(set => {
        const newSet = new Set(set);
        newSet.add(elementId);
        return newSet;
      });
    } catch (err) {
      console.error('Error responding to question:', err);
    }
  }
  
  hasRespondedToElement(elementId: string): boolean {
    return this.respondedElements().has(elementId);
  }
  
  getCountdownTime(targetDate: string): string {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
  
  toggleOptions() {
    this.showOptions.update(v => !v);
  }
  
  muteToggle() {
    this.isMuted.update(v => !v);
    this.showOptions.set(false);
  }
  
  reportStory() {
    const story = this.currentStory();
    if (!story) return;
    
    // TODO: Implement story reporting
    console.log('Report story:', story.id);
    this.showOptions.set(false);
  }
  
  close() {
    this.recordView(false);
    this.isOpen.set(false);
    this.closed.emit();
  }
}

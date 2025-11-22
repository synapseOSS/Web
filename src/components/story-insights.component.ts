import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { StoryAnalyticsService, StoryAnalytics, ViewerInfo } from '../services/story-analytics.service';

@Component({
  selector: 'app-story-insights',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Story Insights</h2>
          <button 
            (click)="close.emit()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <app-icon name="x" [size]="24"></app-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
          @if (loading()) {
            <div class="flex items-center justify-center p-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          } @else if (error()) {
            <div class="p-6 text-center">
              <div class="text-red-500 mb-2">
                <app-icon name="alert-circle" [size]="48"></app-icon>
              </div>
              <p class="text-gray-600 dark:text-gray-400">{{ error() }}</p>
              <button 
                (click)="loadAnalytics()"
                class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Retry
              </button>
            </div>
          } @else if (analytics()) {
            <!-- Overview Metrics -->
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <app-icon name="eye" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Views</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics()!.views_count }}
                </div>
              </div>

              <div class="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
                  <app-icon name="heart" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Reactions</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics()!.reactions_count }}
                </div>
              </div>

              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <app-icon name="message-circle" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Replies</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics()!.replies_count }}
                </div>
              </div>

              <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                  <app-icon name="activity" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Interactions</span>
                </div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics()!.interactive_responses_count }}
                </div>
              </div>
            </div>

            <!-- Engagement Metrics -->
            <div class="px-6 pb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Metrics</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ analytics()!.completion_rate.toFixed(1) }}%
                    </span>
                    <span class="text-sm text-gray-500">watched to end</span>
                  </div>
                  <div class="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      class="bg-green-500 h-2 rounded-full transition-all duration-500"
                      [style.width.%]="analytics()!.completion_rate">
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Exit Rate</div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ analytics()!.exit_rate.toFixed(1) }}%
                    </span>
                    <span class="text-sm text-gray-500">exited here</span>
                  </div>
                  <div class="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      class="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      [style.width.%]="analytics()!.exit_rate">
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Click-Through Rate</div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ analytics()!.click_through_rate.toFixed(1) }}%
                    </span>
                    <span class="text-sm text-gray-500">clicked links</span>
                  </div>
                  <div class="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      [style.width.%]="analytics()!.click_through_rate">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Engagement Stats -->
            <div class="px-6 pb-6">
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Viewers</div>
                  <div class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ analytics()!.engagement_metrics.unique_viewers }}
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. View Duration</div>
                  <div class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ formatDuration(analytics()!.engagement_metrics.average_view_duration) }}
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement Rate</div>
                  <div class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ calculateEngagementRate() }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Viewer List -->
            <div class="px-6 pb-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Viewers ({{ analytics()!.viewers.length }})
                </h3>
                <div class="flex items-center gap-2">
                  <button
                    (click)="toggleViewerSort()"
                    class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                    <app-icon name="arrow-down-up" [size]="16"></app-icon>
                    {{ sortByRecent() ? 'Most Recent' : 'Oldest First' }}
                  </button>
                </div>
              </div>

              <div class="space-y-2 max-h-96 overflow-y-auto">
                @if (sortedViewers().length === 0) {
                  <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No viewers yet
                  </div>
                } @else {
                  @for (viewer of sortedViewers(); track viewer.viewer_id) {
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div class="flex items-center gap-3">
                        <img 
                          [src]="viewer.avatar || '/assets/default-avatar.png'" 
                          [alt]="viewer.username"
                          class="w-10 h-10 rounded-full">
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">
                            {{ viewer.display_name }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            &#64;{{ viewer.username }}
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {{ formatTimeAgo(viewer.viewed_at) }}
                        </div>
                        @if (viewer.view_duration_seconds !== undefined && viewer.view_duration_seconds !== null) {
                          <div class="text-xs text-gray-500 dark:text-gray-500">
                            {{ formatDuration(viewer.view_duration_seconds) }}
                            @if (viewer.completed) {
                              <span class="text-green-500">✓</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>

        <!-- Footer with Export Button -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            @if (analytics()) {
              Last updated: {{ formatTimeAgo(new Date().toISOString()) }}
            }
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="exportAsJSON()"
              [disabled]="exporting()"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <app-icon name="download" [size]="16"></app-icon>
              Export JSON
            </button>
            <button
              (click)="exportAsCSV()"
              [disabled]="exporting()"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <app-icon name="download" [size]="16"></app-icon>
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StoryInsightsComponent implements OnInit {
  // Inputs
  storyId = input.required<string>();
  
  // Outputs
  close = output<void>();

  // Services
  private analyticsService = inject(StoryAnalyticsService);

  // State
  analytics = signal<StoryAnalytics | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  exporting = signal(false);
  sortByRecent = signal(true);

  // Computed
  sortedViewers = computed(() => {
    const viewers = this.analytics()?.viewers || [];
    if (this.sortByRecent()) {
      return [...viewers].sort((a, b) => 
        new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
      );
    } else {
      return [...viewers].sort((a, b) => 
        new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime()
      );
    }
  });

  ngOnInit() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.analyticsService.getStoryAnalytics(this.storyId());
      this.analytics.set(data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      this.error.set(err.message || 'Failed to load analytics');
    } finally {
      this.loading.set(false);
    }
  }

  toggleViewerSort() {
    this.sortByRecent.update(v => !v);
  }

  calculateEngagementRate(): string {
    const analytics = this.analytics();
    if (!analytics || analytics.views_count === 0) return '0.0';

    const totalEngagements = 
      analytics.reactions_count + 
      analytics.replies_count + 
      analytics.interactive_responses_count;

    const rate = (totalEngagements / analytics.views_count) * 100;
    return rate.toFixed(1);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString();
  }

  async exportAsJSON() {
    if (this.exporting()) return;
    
    this.exporting.set(true);
    try {
      const blob = await this.analyticsService.exportAnalyticsAsJSON(this.storyId());
      const filename = `story-insights-${this.storyId()}-${Date.now()}.json`;
      this.analyticsService.downloadAnalytics(blob, filename);
    } catch (err: any) {
      console.error('Failed to export JSON:', err);
      alert('Failed to export analytics. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }

  async exportAsCSV() {
    if (this.exporting()) return;
    
    this.exporting.set(true);
    try {
      const blob = await this.analyticsService.exportAnalyticsAsCSV(this.storyId());
      const filename = `story-insights-${this.storyId()}-${Date.now()}.csv`;
      this.analyticsService.downloadAnalytics(blob, filename);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export analytics. Please try again.');
    } finally {
      this.exporting.set(false);
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}

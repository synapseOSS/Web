import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryInsightsComponent } from './story-insights.component';

/**
 * Demo component showing how to integrate StoryInsightsComponent
 * 
 * Usage example:
 * 1. Import StoryInsightsComponent in your component
 * 2. Add a button/trigger to open insights
 * 3. Pass the story ID to the component
 * 4. Handle the close event
 */
@Component({
  selector: 'app-story-insights-demo',
  standalone: true,
  imports: [CommonModule, StoryInsightsComponent],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-4">Story Insights Demo</h1>
      
      <!-- Trigger Button -->
      <button
        (click)="showInsights.set(true)"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
        View Story Insights
      </button>

      <!-- Insights Modal -->
      @if (showInsights()) {
        <app-story-insights
          [storyId]="demoStoryId()"
          (close)="showInsights.set(false)">
        </app-story-insights>
      }
    </div>
  `
})
export class StoryInsightsDemoComponent {
  showInsights = signal(false);
  demoStoryId = signal('your-story-id-here');
}

/**
 * Integration Examples:
 * 
 * 1. In Story Viewer (for story creators):
 * 
 * ```typescript
 * // Add to story-viewer.component.ts
 * showInsights = signal(false);
 * 
 * // In template, add button in options menu:
 * @if (isOwnStory()) {
 *   <button
 *     (click)="showInsights.set(true)"
 *     class="w-full px-4 py-2 text-left hover:bg-slate-100">
 *     <app-icon name="bar-chart" [size]="18"></app-icon>
 *     <span>View Insights</span>
 *   </button>
 * }
 * 
 * // Add insights component:
 * @if (showInsights()) {
 *   <app-story-insights
 *     [storyId]="currentStory()!.id"
 *     (close)="showInsights.set(false)">
 *   </app-story-insights>
 * }
 * ```
 * 
 * 2. In Profile/Archive View:
 * 
 * ```typescript
 * // Add to profile.component.ts
 * selectedStoryForInsights = signal<string | null>(null);
 * 
 * // In template, add insights icon on story cards:
 * <button
 *   (click)="selectedStoryForInsights.set(story.id)"
 *   class="p-2 hover:bg-gray-100 rounded-full">
 *   <app-icon name="bar-chart" [size]="20"></app-icon>
 * </button>
 * 
 * // Add insights modal:
 * @if (selectedStoryForInsights()) {
 *   <app-story-insights
 *     [storyId]="selectedStoryForInsights()!"
 *     (close)="selectedStoryForInsights.set(null)">
 *   </app-story-insights>
 * }
 * ```
 * 
 * 3. In Story Management Dashboard:
 * 
 * ```typescript
 * // Add to admin/dashboard component
 * viewingInsightsFor = signal<string | null>(null);
 * 
 * // In story list:
 * @for (story of myStories(); track story.id) {
 *   <div class="story-card">
 *     <h3>{{ story.content }}</h3>
 *     <button (click)="viewingInsightsFor.set(story.id)">
 *       View Analytics
 *     </button>
 *   </div>
 * }
 * 
 * // Add insights modal:
 * @if (viewingInsightsFor()) {
 *   <app-story-insights
 *     [storyId]="viewingInsightsFor()!"
 *     (close)="viewingInsightsFor.set(null)">
 *   </app-story-insights>
 * }
 * ```
 */

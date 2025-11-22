# Story Insights Component

## Overview

The `StoryInsightsComponent` provides a comprehensive analytics dashboard for story creators to view detailed metrics about their story performance.

## Features

### 1. Overview Metrics
- **Views Count**: Total number of story views
- **Reactions Count**: Total reactions received
- **Replies Count**: Total replies received
- **Interactive Responses**: Total responses to polls, questions, etc.

### 2. Engagement Metrics Display
- **Completion Rate**: Percentage of viewers who watched the story to the end
- **Exit Rate**: Percentage of viewers who exited at this story
- **Click-Through Rate**: Percentage of viewers who clicked on links
- Visual progress bars for each metric

### 3. Additional Stats
- **Unique Viewers**: Count of distinct users who viewed the story
- **Average View Duration**: Mean time spent viewing the story
- **Engagement Rate**: Overall engagement percentage

### 4. Viewer List Display
- Complete list of all viewers with:
  - Avatar and display name
  - Username
  - View timestamp
  - View duration
  - Completion status (checkmark if completed)
- Sortable by most recent or oldest first
- Scrollable list for many viewers

### 5. Analytics Export
- **Export as JSON**: Download complete analytics data in JSON format
- **Export as CSV**: Download analytics in CSV format for spreadsheet analysis
- Includes all metrics and viewer details

## Usage

### Basic Integration

```typescript
import { Component, signal } from '@angular/core';
import { StoryInsightsComponent } from './components/story-insights.component';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [StoryInsightsComponent],
  template: `
    <button (click)="showInsights.set(true)">
      View Insights
    </button>

    @if (showInsights()) {
      <app-story-insights
        [storyId]="myStoryId"
        (close)="showInsights.set(false)">
      </app-story-insights>
    }
  `
})
export class MyComponent {
  showInsights = signal(false);
  myStoryId = 'story-uuid-here';
}
```

### Integration Points

1. **Story Viewer**: Add insights button for story creators
2. **Profile Page**: Show insights icon on archived stories
3. **Dashboard**: Bulk analytics view for all stories
4. **Story Management**: Quick access to insights from story list

## API

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `storyId` | `string` | Yes | The UUID of the story to display insights for |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `close` | `void` | Emitted when the user closes the insights modal |

## Requirements Validation

This component satisfies the following requirements from the spec:

- **Requirement 5.1**: Display total view count for each story ✓
- **Requirement 5.2**: Display list of all viewers with timestamps ✓
- **Requirement 5.3**: Display engagement metrics (reactions, replies, responses) ✓
- **Requirement 5.4**: Display completion rate ✓
- **Requirement 5.5**: Display exit rate ✓
- **Requirement 5.6**: Display click-through rate for stories with links ✓
- **Requirement 5.9**: Generate downloadable analytics report (JSON/CSV) ✓

## Styling

The component uses Tailwind CSS with dark mode support:
- Responsive design (mobile-first)
- Dark mode compatible
- Smooth transitions and animations
- Accessible color contrasts
- Loading and error states

## Error Handling

- Loading state with spinner
- Error state with retry button
- Graceful handling of missing data
- User-friendly error messages

## Performance

- Lazy loading of analytics data
- Efficient sorting with computed signals
- Optimized re-renders with Angular signals
- Minimal DOM updates

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Semantic HTML structure

## Future Enhancements

Potential improvements for future iterations:
- Real-time analytics updates
- Demographic breakdown charts
- Engagement over time graphs
- Comparison with previous stories
- Export to PDF format
- Share insights feature

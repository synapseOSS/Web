import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { StoryView } from './story.service';

export interface StoryAnalytics {
  story_id: string;
  views_count: number;
  reactions_count: number;
  replies_count: number;
  interactive_responses_count: number;
  completion_rate: number;
  exit_rate: number;
  click_through_rate: number;
  viewers: ViewerInfo[];
  engagement_metrics: EngagementMetrics;
}

export interface ViewerInfo {
  viewer_id: string;
  username: string;
  display_name: string;
  avatar: string;
  viewed_at: string;
  view_duration_seconds?: number;
  completed: boolean;
}

export interface EngagementMetrics {
  total_views: number;
  total_reactions: number;
  total_replies: number;
  total_interactive_responses: number;
  unique_viewers: number;
  average_view_duration: number;
}

export interface AnalyticsExport {
  story_id: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  reactions_count: number;
  replies_count: number;
  interactive_responses_count: number;
  completion_rate: number;
  exit_rate: number;
  click_through_rate: number;
  viewers: ViewerInfo[];
  engagement_metrics: EngagementMetrics;
  exported_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoryAnalyticsService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  /**
   * Get comprehensive analytics for a story
   */
  async getStoryAnalytics(storyId: string): Promise<StoryAnalytics> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Verify ownership
    const { data: story, error: storyError } = await this.supabase
      .from('stories')
      .select('user_id, created_at, expires_at')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story) throw new Error('Story not found');
    if (story.user_id !== userId) throw new Error('Not authorized to view analytics');

    // Fetch all analytics data in parallel
    const [
      viewers,
      viewsCount,
      reactionsCount,
      repliesCount,
      interactiveResponsesCount,
      completionRate,
      exitRate,
      clickThroughRate
    ] = await Promise.all([
      this.getViewerList(storyId),
      this.getViewsCount(storyId),
      this.getReactionsCount(storyId),
      this.getRepliesCount(storyId),
      this.getInteractiveResponsesCount(storyId),
      this.calculateCompletionRate(storyId),
      this.calculateExitRate(storyId),
      this.calculateClickThroughRate(storyId)
    ]);

    const engagementMetrics = this.calculateEngagementMetrics(
      viewers,
      reactionsCount,
      repliesCount,
      interactiveResponsesCount
    );

    return {
      story_id: storyId,
      views_count: viewsCount,
      reactions_count: reactionsCount,
      replies_count: repliesCount,
      interactive_responses_count: interactiveResponsesCount,
      completion_rate: completionRate,
      exit_rate: exitRate,
      click_through_rate: clickThroughRate,
      viewers,
      engagement_metrics: engagementMetrics
    };
  }

  /**
   * Get list of all viewers with timestamps
   * Property 27: Viewer list completeness
   */
  async getViewerList(storyId: string): Promise<ViewerInfo[]> {
    const { data, error } = await this.supabase
      .from('story_views')
      .select(`
        viewer_id,
        viewed_at,
        view_duration_seconds,
        completed,
        viewer:viewer_id (
          username,
          display_name,
          avatar
        )
      `)
      .eq('story_id', storyId)
      .order('viewed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((view: any) => ({
      viewer_id: view.viewer_id,
      username: view.viewer?.username || 'Unknown',
      display_name: view.viewer?.display_name || 'Unknown',
      avatar: view.viewer?.avatar || '',
      viewed_at: view.viewed_at,
      view_duration_seconds: view.view_duration_seconds,
      completed: view.completed
    }));
  }

  /**
   * Get total views count
   * Property 26: View count accuracy
   */
  async getViewsCount(storyId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get total reactions count
   * Property 28: Engagement metrics accuracy
   */
  async getReactionsCount(storyId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('story_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get total replies count
   * Property 28: Engagement metrics accuracy
   */
  async getRepliesCount(storyId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('story_replies')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get total interactive responses count
   * Property 28: Engagement metrics accuracy
   */
  async getInteractiveResponsesCount(storyId: string): Promise<number> {
    // First get all interactive elements for this story
    const { data: elements, error: elementsError } = await this.supabase
      .from('story_interactive_elements')
      .select('id')
      .eq('story_id', storyId);

    if (elementsError) throw elementsError;
    if (!elements || elements.length === 0) return 0;

    const elementIds = elements.map(e => e.id);

    // Count all responses for these elements
    const { count, error } = await this.supabase
      .from('story_interactive_responses')
      .select('*', { count: 'exact', head: true })
      .in('element_id', elementIds);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Calculate completion rate
   * Property 29: Completion rate calculation
   * Formula: (viewers who watched to end / total viewers) * 100%
   */
  async calculateCompletionRate(storyId: string): Promise<number> {
    const { data: views, error } = await this.supabase
      .from('story_views')
      .select('completed')
      .eq('story_id', storyId);

    if (error) throw error;
    if (!views || views.length === 0) return 0;

    const totalViewers = views.length;
    const completedViewers = views.filter(v => v.completed).length;

    return (completedViewers / totalViewers) * 100;
  }

  /**
   * Calculate exit rate for a story in a sequence
   * Property 30: Exit rate calculation
   * Formula: (viewers who exited at this story / viewers who reached this story) * 100%
   */
  async calculateExitRate(storyId: string): Promise<number> {
    // Get the story to find the user and creation time
    const { data: story, error: storyError } = await this.supabase
      .from('stories')
      .select('user_id, created_at')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story) return 0;

    // Get all stories from this user in the same sequence (same day)
    const { data: userStories, error: storiesError } = await this.supabase
      .from('stories')
      .select('id, created_at')
      .eq('user_id', story.user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (storiesError) throw storiesError;
    if (!userStories || userStories.length === 0) return 0;

    // Find the index of current story
    const currentIndex = userStories.findIndex(s => s.id === storyId);
    if (currentIndex === -1) return 0;

    // Get viewers who reached this story
    const { count: reachedCount, error: reachedError } = await this.supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (reachedError) throw reachedError;
    if (!reachedCount || reachedCount === 0) return 0;

    // If this is the last story, exit rate is based on completion
    if (currentIndex === userStories.length - 1) {
      const { data: views, error: viewsError } = await this.supabase
        .from('story_views')
        .select('completed')
        .eq('story_id', storyId);

      if (viewsError) throw viewsError;
      if (!views || views.length === 0) return 0;

      const exitedViewers = views.filter(v => !v.completed).length;
      return (exitedViewers / reachedCount) * 100;
    }

    // Get the next story
    const nextStoryId = userStories[currentIndex + 1].id;

    // Get viewers who viewed the next story
    const { count: nextCount, error: nextError } = await this.supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', nextStoryId);

    if (nextError) throw nextError;

    // Viewers who exited = viewers who reached this story - viewers who viewed next story
    const exitedViewers = reachedCount - (nextCount || 0);
    return (exitedViewers / reachedCount) * 100;
  }

  /**
   * Calculate click-through rate for stories with links
   * Property 31: Click-through rate calculation
   * Formula: (link clicks / total views) * 100%
   */
  async calculateClickThroughRate(storyId: string): Promise<number> {
    // Get total views
    const viewsCount = await this.getViewsCount(storyId);
    if (viewsCount === 0) return 0;

    // Get link elements for this story
    const { data: linkElements, error: elementsError } = await this.supabase
      .from('story_interactive_elements')
      .select('id')
      .eq('story_id', storyId)
      .eq('element_type', 'link');

    if (elementsError) throw elementsError;
    if (!linkElements || linkElements.length === 0) return 0;

    const elementIds = linkElements.map(e => e.id);

    // Count link clicks (responses to link elements)
    const { count: clickCount, error: clickError } = await this.supabase
      .from('story_interactive_responses')
      .select('*', { count: 'exact', head: true })
      .in('element_id', elementIds);

    if (clickError) throw clickError;

    return ((clickCount || 0) / viewsCount) * 100;
  }

  /**
   * Calculate engagement metrics
   * Property 28: Engagement metrics accuracy
   */
  private calculateEngagementMetrics(
    viewers: ViewerInfo[],
    reactionsCount: number,
    repliesCount: number,
    interactiveResponsesCount: number
  ): EngagementMetrics {
    const totalViews = viewers.length;
    const uniqueViewers = new Set(viewers.map(v => v.viewer_id)).size;

    // Calculate average view duration
    const viewsWithDuration = viewers.filter(v => v.view_duration_seconds !== undefined && v.view_duration_seconds !== null);
    const totalDuration = viewsWithDuration.reduce((sum, v) => sum + (v.view_duration_seconds || 0), 0);
    const averageViewDuration = viewsWithDuration.length > 0 ? totalDuration / viewsWithDuration.length : 0;

    return {
      total_views: totalViews,
      total_reactions: reactionsCount,
      total_replies: repliesCount,
      total_interactive_responses: interactiveResponsesCount,
      unique_viewers: uniqueViewers,
      average_view_duration: averageViewDuration
    };
  }

  /**
   * Export analytics data
   * Property 32: Analytics export completeness
   */
  async exportAnalytics(storyId: string): Promise<AnalyticsExport> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Get story details
    const { data: story, error: storyError } = await this.supabase
      .from('stories')
      .select('user_id, created_at, expires_at')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story) throw new Error('Story not found');
    if (story.user_id !== userId) throw new Error('Not authorized to export analytics');

    // Get full analytics
    const analytics = await this.getStoryAnalytics(storyId);

    return {
      story_id: storyId,
      created_at: story.created_at,
      expires_at: story.expires_at,
      views_count: analytics.views_count,
      reactions_count: analytics.reactions_count,
      replies_count: analytics.replies_count,
      interactive_responses_count: analytics.interactive_responses_count,
      completion_rate: analytics.completion_rate,
      exit_rate: analytics.exit_rate,
      click_through_rate: analytics.click_through_rate,
      viewers: analytics.viewers,
      engagement_metrics: analytics.engagement_metrics,
      exported_at: new Date().toISOString()
    };
  }

  /**
   * Export analytics as JSON file
   */
  async exportAnalyticsAsJSON(storyId: string): Promise<Blob> {
    const analytics = await this.exportAnalytics(storyId);
    const json = JSON.stringify(analytics, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Export analytics as CSV file
   */
  async exportAnalyticsAsCSV(storyId: string): Promise<Blob> {
    const analytics = await this.exportAnalytics(storyId);

    // Create CSV content
    const headers = [
      'Metric',
      'Value'
    ];

    const rows = [
      ['Story ID', analytics.story_id],
      ['Created At', analytics.created_at],
      ['Expires At', analytics.expires_at],
      ['Total Views', analytics.views_count.toString()],
      ['Total Reactions', analytics.reactions_count.toString()],
      ['Total Replies', analytics.replies_count.toString()],
      ['Interactive Responses', analytics.interactive_responses_count.toString()],
      ['Completion Rate (%)', analytics.completion_rate.toFixed(2)],
      ['Exit Rate (%)', analytics.exit_rate.toFixed(2)],
      ['Click-Through Rate (%)', analytics.click_through_rate.toFixed(2)],
      ['Unique Viewers', analytics.engagement_metrics.unique_viewers.toString()],
      ['Average View Duration (s)', analytics.engagement_metrics.average_view_duration.toFixed(2)],
      ['Exported At', analytics.exported_at]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add viewers section
    const viewersHeaders = ['Viewer ID', 'Username', 'Display Name', 'Viewed At', 'Duration (s)', 'Completed'];
    const viewersRows = analytics.viewers.map(v => [
      v.viewer_id,
      v.username,
      v.display_name,
      v.viewed_at,
      v.view_duration_seconds?.toString() || '',
      v.completed.toString()
    ]);

    const viewersCSV = [
      '',
      'Viewers',
      viewersHeaders.join(','),
      ...viewersRows.map(row => row.join(','))
    ].join('\n');

    return new Blob([csvContent + viewersCSV], { type: 'text/csv' });
  }

  /**
   * Download analytics export
   */
  downloadAnalytics(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

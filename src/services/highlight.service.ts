import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Story } from './story.service';

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image_url?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoryHighlightItem {
  id: string;
  highlight_id: string;
  story_id: string;
  display_order: number;
  added_at: string;
}

export interface HighlightWithStories extends StoryHighlight {
  stories: Story[];
}

export interface HighlightCreationOptions {
  title: string;
  cover_image_url?: string;
  story_ids?: string[];
}

export interface HighlightUpdateOptions {
  title?: string;
  cover_image_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HighlightService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  
  highlights = signal<HighlightWithStories[]>([]);
  loading = signal(false);

  /**
   * Fetch all highlights for a user
   */
  async fetchHighlights(userId?: string): Promise<HighlightWithStories[]> {
    this.loading.set(true);
    try {
      const targetUserId = userId || this.auth.currentUser()?.id;
      if (!targetUserId) return [];

      const { data: highlightsData, error: highlightsError } = await this.supabase
        .from('story_highlights')
        .select('*')
        .eq('user_id', targetUserId)
        .order('display_order', { ascending: true });

      if (highlightsError) throw highlightsError;

      // Fetch stories for each highlight
      const highlightsWithStories = await Promise.all(
        (highlightsData || []).map(async (highlight) => {
          const stories = await this.fetchHighlightStories(highlight.id);
          return {
            ...highlight,
            stories
          };
        })
      );

      this.highlights.set(highlightsWithStories);
      return highlightsWithStories;
    } catch (err) {
      console.error('Error fetching highlights:', err);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch stories for a specific highlight
   */
  private async fetchHighlightStories(highlightId: string): Promise<Story[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_highlight_items')
        .select(`
          display_order,
          stories:story_id (
            *,
            users:user_id (
              uid,
              username,
              display_name,
              avatar,
              verify
            )
          )
        `)
        .eq('highlight_id', highlightId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item.stories,
        user: item.stories.users
      }));
    } catch (err) {
      console.error('Error fetching highlight stories:', err);
      return [];
    }
  }

  /**
   * Create a new highlight collection
   * Property 41: Highlight collection creation with metadata
   */
  async createHighlight(options: HighlightCreationOptions): Promise<StoryHighlight> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Get the current max display_order
      const { data: existingHighlights } = await this.supabase
        .from('story_highlights')
        .select('display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingHighlights && existingHighlights.length > 0
        ? existingHighlights[0].display_order + 1
        : 0;

      // Create highlight collection
      const { data: highlight, error: highlightError } = await this.supabase
        .from('story_highlights')
        .insert({
          user_id: userId,
          title: options.title,
          cover_image_url: options.cover_image_url,
          display_order: nextOrder
        })
        .select()
        .single();

      if (highlightError) throw highlightError;

      // Add stories if provided
      if (options.story_ids && options.story_ids.length > 0) {
        await this.addStoriesToHighlight(highlight.id, options.story_ids);
      }

      await this.fetchHighlights();
      return highlight;
    } catch (err) {
      console.error('Error creating highlight:', err);
      throw err;
    }
  }

  /**
   * Add a story to a highlight collection
   * Property 38: Highlight creation duplicates story
   */
  async addStoryToHighlight(highlightId: string, storyId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Verify the highlight belongs to the user
      const { data: highlight, error: highlightError } = await this.supabase
        .from('story_highlights')
        .select('user_id')
        .eq('id', highlightId)
        .single();

      if (highlightError) throw highlightError;
      if (highlight.user_id !== userId) {
        throw new Error('Unauthorized: Highlight does not belong to user');
      }

      // Verify the story exists and belongs to the user
      const { data: story, error: storyError } = await this.supabase
        .from('stories')
        .select('id, user_id')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      if (story.user_id !== userId) {
        throw new Error('Unauthorized: Story does not belong to user');
      }

      // Get the current max display_order for this highlight
      const { data: existingItems } = await this.supabase
        .from('story_highlight_items')
        .select('display_order')
        .eq('highlight_id', highlightId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingItems && existingItems.length > 0
        ? existingItems[0].display_order + 1
        : 0;

      // Add story to highlight
      const { error: insertError } = await this.supabase
        .from('story_highlight_items')
        .insert({
          highlight_id: highlightId,
          story_id: storyId,
          display_order: nextOrder
        });

      if (insertError) {
        // Check if it's a duplicate key error
        if (insertError.code === '23505') {
          throw new Error('Story is already in this highlight');
        }
        throw insertError;
      }

      await this.fetchHighlights();
    } catch (err) {
      console.error('Error adding story to highlight:', err);
      throw err;
    }
  }

  /**
   * Add multiple stories to a highlight collection
   */
  private async addStoriesToHighlight(highlightId: string, storyIds: string[]): Promise<void> {
    const records = storyIds.map((storyId, index) => ({
      highlight_id: highlightId,
      story_id: storyId,
      display_order: index
    }));

    const { error } = await this.supabase
      .from('story_highlight_items')
      .insert(records);

    if (error) throw error;
  }

  /**
   * Remove a story from a highlight collection
   * Property 39: Highlight removal preserves archive
   */
  async removeStoryFromHighlight(highlightId: string, storyId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Verify the highlight belongs to the user
      const { data: highlight, error: highlightError } = await this.supabase
        .from('story_highlights')
        .select('user_id')
        .eq('id', highlightId)
        .single();

      if (highlightError) throw highlightError;
      if (highlight.user_id !== userId) {
        throw new Error('Unauthorized: Highlight does not belong to user');
      }

      // Remove the story from the highlight (only removes the highlight item, not the story itself)
      const { error: deleteError } = await this.supabase
        .from('story_highlight_items')
        .delete()
        .eq('highlight_id', highlightId)
        .eq('story_id', storyId);

      if (deleteError) throw deleteError;

      await this.fetchHighlights();
    } catch (err) {
      console.error('Error removing story from highlight:', err);
      throw err;
    }
  }

  /**
   * Reorder highlights
   * Property 40: Highlight reordering updates display order
   */
  async reorderHighlights(highlightIds: string[]): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Update display_order for each highlight
      const updates = highlightIds.map((highlightId, index) => ({
        id: highlightId,
        display_order: index,
        updated_at: new Date().toISOString()
      }));

      // Update each highlight individually
      for (const update of updates) {
        const { error } = await this.supabase
          .from('story_highlights')
          .update({
            display_order: update.display_order,
            updated_at: update.updated_at
          })
          .eq('id', update.id)
          .eq('user_id', userId);

        if (error) throw error;
      }

      await this.fetchHighlights();
    } catch (err) {
      console.error('Error reordering highlights:', err);
      throw err;
    }
  }

  /**
   * Reorder stories within a highlight
   */
  async reorderHighlightStories(highlightId: string, storyIds: string[]): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Verify the highlight belongs to the user
      const { data: highlight, error: highlightError } = await this.supabase
        .from('story_highlights')
        .select('user_id')
        .eq('id', highlightId)
        .single();

      if (highlightError) throw highlightError;
      if (highlight.user_id !== userId) {
        throw new Error('Unauthorized: Highlight does not belong to user');
      }

      // Update display_order for each story in the highlight
      for (let i = 0; i < storyIds.length; i++) {
        const { error } = await this.supabase
          .from('story_highlight_items')
          .update({ display_order: i })
          .eq('highlight_id', highlightId)
          .eq('story_id', storyIds[i]);

        if (error) throw error;
      }

      await this.fetchHighlights();
    } catch (err) {
      console.error('Error reordering highlight stories:', err);
      throw err;
    }
  }

  /**
   * Update highlight metadata (title, cover image)
   * Property 42: Highlight metadata edit preserves stories
   */
  async updateHighlightMetadata(highlightId: string, options: HighlightUpdateOptions): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (options.title !== undefined) {
        updateData.title = options.title;
      }

      if (options.cover_image_url !== undefined) {
        updateData.cover_image_url = options.cover_image_url;
      }

      // Update highlight metadata only (stories remain unchanged)
      const { error } = await this.supabase
        .from('story_highlights')
        .update(updateData)
        .eq('id', highlightId)
        .eq('user_id', userId);

      if (error) throw error;

      await this.fetchHighlights();
    } catch (err) {
      console.error('Error updating highlight metadata:', err);
      throw err;
    }
  }

  /**
   * Delete a highlight collection
   */
  async deleteHighlight(highlightId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    try {
      // Delete highlight (cascade will delete highlight_items)
      const { error } = await this.supabase
        .from('story_highlights')
        .delete()
        .eq('id', highlightId)
        .eq('user_id', userId);

      if (error) throw error;

      await this.fetchHighlights();
    } catch (err) {
      console.error('Error deleting highlight:', err);
      throw err;
    }
  }

  /**
   * Get a single highlight with its stories
   */
  async getHighlight(highlightId: string): Promise<HighlightWithStories | null> {
    try {
      const { data: highlight, error: highlightError } = await this.supabase
        .from('story_highlights')
        .select('*')
        .eq('id', highlightId)
        .single();

      if (highlightError) throw highlightError;

      const stories = await this.fetchHighlightStories(highlightId);

      return {
        ...highlight,
        stories
      };
    } catch (err) {
      console.error('Error fetching highlight:', err);
      return null;
    }
  }
}

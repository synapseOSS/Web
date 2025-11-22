import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface PollData {
  question: string;
  options: string[];
  allow_multiple?: boolean;
}

export interface QuestionData {
  question: string;
  placeholder?: string;
}

export interface CountdownData {
  title: string;
  target_date: string;
  end_message?: string;
}

export interface LinkData {
  url: string;
  title?: string;
}

export interface InteractiveElementData {
  id: string;
  story_id: string;
  element_type: 'poll' | 'question' | 'countdown' | 'link';
  element_data: PollData | QuestionData | CountdownData | LinkData;
  position_x?: number;
  position_y?: number;
  created_at: string;
}

export interface InteractiveResponse {
  id: string;
  element_id: string;
  user_id: string;
  response_data: any;
  created_at: string;
}

export interface PollResults {
  total_votes: number;
  options: {
    option: string;
    votes: number;
    percentage: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class InteractiveElementService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  /**
   * Validate interactive element configuration
   */
  validateElement(elementType: string, elementData: any): void {
    switch (elementType) {
      case 'poll':
        this.validatePoll(elementData);
        break;
      case 'question':
        this.validateQuestion(elementData);
        break;
      case 'countdown':
        this.validateCountdown(elementData);
        break;
      case 'link':
        this.validateLink(elementData);
        break;
      default:
        throw new Error(`Invalid element type: ${elementType}`);
    }
  }

  private validatePoll(data: any): void {
    if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
      throw new Error('Poll must have a valid question');
    }
    if (!Array.isArray(data.options) || data.options.length < 2 || data.options.length > 4) {
      throw new Error('Poll must have between 2 and 4 options');
    }
    for (const option of data.options) {
      if (typeof option !== 'string' || option.trim().length === 0) {
        throw new Error('All poll options must be non-empty strings');
      }
      if (option.length > 50) {
        throw new Error('Poll options must be 50 characters or less');
      }
    }
    if (data.question.length > 200) {
      throw new Error('Poll question must be 200 characters or less');
    }
  }

  private validateQuestion(data: any): void {
    if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
      throw new Error('Question must have valid text');
    }
    if (data.question.length > 200) {
      throw new Error('Question must be 200 characters or less');
    }
    if (data.placeholder && typeof data.placeholder !== 'string') {
      throw new Error('Question placeholder must be a string');
    }
    if (data.placeholder && data.placeholder.length > 100) {
      throw new Error('Question placeholder must be 100 characters or less');
    }
  }

  private validateCountdown(data: any): void {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('Countdown must have a valid title');
    }
    if (data.title.length > 100) {
      throw new Error('Countdown title must be 100 characters or less');
    }
    if (!data.target_date || typeof data.target_date !== 'string') {
      throw new Error('Countdown must have a valid target date');
    }
    const targetDate = new Date(data.target_date);
    if (isNaN(targetDate.getTime())) {
      throw new Error('Countdown target date must be a valid ISO date string');
    }
    if (targetDate <= new Date()) {
      throw new Error('Countdown target date must be in the future');
    }
    if (data.end_message && typeof data.end_message !== 'string') {
      throw new Error('Countdown end message must be a string');
    }
    if (data.end_message && data.end_message.length > 100) {
      throw new Error('Countdown end message must be 100 characters or less');
    }
  }

  private validateLink(data: any): void {
    if (!data.url || typeof data.url !== 'string' || data.url.trim().length === 0) {
      throw new Error('Link must have a valid URL');
    }
    try {
      const url = new URL(data.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Link URL must use HTTP or HTTPS protocol');
      }
    } catch {
      throw new Error('Link URL must be a valid URL');
    }
    if (data.title && typeof data.title !== 'string') {
      throw new Error('Link title must be a string');
    }
    if (data.title && data.title.length > 100) {
      throw new Error('Link title must be 100 characters or less');
    }
  }

  /**
   * Create an interactive element
   */
  async createElement(
    storyId: string,
    elementType: 'poll' | 'question' | 'countdown' | 'link',
    elementData: any,
    positionX?: number,
    positionY?: number
  ): Promise<InteractiveElementData> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Validate element
    this.validateElement(elementType, elementData);

    // Verify user owns the story
    const { data: story, error: storyError } = await this.supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story || story.user_id !== userId) {
      throw new Error('You can only add elements to your own stories');
    }

    // Create element
    const { data, error } = await this.supabase
      .from('story_interactive_elements')
      .insert({
        story_id: storyId,
        element_type: elementType,
        element_data: elementData,
        position_x: positionX,
        position_y: positionY
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Record a response to an interactive element
   */
  async recordResponse(elementId: string, responseData: any): Promise<InteractiveResponse> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Get element details
    const { data: element, error: elementError } = await this.supabase
      .from('story_interactive_elements')
      .select('element_type, element_data, story_id')
      .eq('id', elementId)
      .single();

    if (elementError) throw elementError;
    if (!element) throw new Error('Interactive element not found');

    // Validate response based on element type
    this.validateResponse(element.element_type, element.element_data, responseData);

    // Check if user can view the story
    const { data: canView, error: viewError } = await this.supabase
      .rpc('can_view_story', {
        story_uuid: element.story_id,
        viewer_uuid: userId
      });

    if (viewError) throw viewError;
    if (!canView) throw new Error('You cannot respond to this story');

    // Record response (upsert to handle duplicate responses)
    const { data, error } = await this.supabase
      .from('story_interactive_responses')
      .upsert({
        element_id: elementId,
        user_id: userId,
        response_data: responseData
      }, {
        onConflict: 'element_id,user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private validateResponse(elementType: string, elementData: any, responseData: any): void {
    switch (elementType) {
      case 'poll':
        this.validatePollResponse(elementData, responseData);
        break;
      case 'question':
        this.validateQuestionResponse(responseData);
        break;
      case 'countdown':
        // Countdown doesn't require response validation
        break;
      case 'link':
        // Link clicks are tracked but don't require validation
        break;
    }
  }

  private validatePollResponse(pollData: PollData, responseData: any): void {
    if (!responseData.selected_options || !Array.isArray(responseData.selected_options)) {
      throw new Error('Poll response must include selected_options array');
    }
    if (responseData.selected_options.length === 0) {
      throw new Error('Poll response must select at least one option');
    }
    if (!pollData.allow_multiple && responseData.selected_options.length > 1) {
      throw new Error('This poll only allows one selection');
    }
    for (const option of responseData.selected_options) {
      if (!pollData.options.includes(option)) {
        throw new Error(`Invalid poll option: ${option}`);
      }
    }
  }

  private validateQuestionResponse(responseData: any): void {
    if (!responseData.answer || typeof responseData.answer !== 'string') {
      throw new Error('Question response must include an answer string');
    }
    if (responseData.answer.trim().length === 0) {
      throw new Error('Question answer cannot be empty');
    }
    if (responseData.answer.length > 500) {
      throw new Error('Question answer must be 500 characters or less');
    }
  }

  /**
   * Get all responses for an element
   */
  async getResponses(elementId: string): Promise<InteractiveResponse[]> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Verify user owns the story
    const { data: element, error: elementError } = await this.supabase
      .from('story_interactive_elements')
      .select('story_id, stories!inner(user_id)')
      .eq('id', elementId)
      .single();

    if (elementError) throw elementError;
    if (!element || (element as any).stories.user_id !== userId) {
      throw new Error('You can only view responses to your own stories');
    }

    const { data, error } = await this.supabase
      .from('story_interactive_responses')
      .select('*')
      .eq('element_id', elementId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get aggregated poll results
   */
  async getPollResults(elementId: string): Promise<PollResults> {
    const responses = await this.getResponses(elementId);
    
    // Get element data
    const { data: element, error } = await this.supabase
      .from('story_interactive_elements')
      .select('element_data')
      .eq('id', elementId)
      .single();

    if (error) throw error;
    if (!element || element.element_data.options === undefined) {
      throw new Error('Invalid poll element');
    }

    const pollData = element.element_data as PollData;
    const voteCounts: { [key: string]: number } = {};
    
    // Initialize counts
    for (const option of pollData.options) {
      voteCounts[option] = 0;
    }

    // Count votes
    let totalVotes = 0;
    for (const response of responses) {
      const selectedOptions = response.response_data.selected_options || [];
      for (const option of selectedOptions) {
        if (voteCounts[option] !== undefined) {
          voteCounts[option]++;
          totalVotes++;
        }
      }
    }

    // Calculate percentages
    const options = pollData.options.map(option => ({
      option,
      votes: voteCounts[option],
      percentage: totalVotes > 0 ? Math.round((voteCounts[option] / totalVotes) * 100) : 0
    }));

    return {
      total_votes: totalVotes,
      options
    };
  }

  /**
   * Get all question responses
   */
  async getQuestionResponses(elementId: string): Promise<{ answer: string; user_id: string; created_at: string }[]> {
    const responses = await this.getResponses(elementId);
    
    return responses.map(r => ({
      answer: r.response_data.answer,
      user_id: r.user_id,
      created_at: r.created_at
    }));
  }

  /**
   * Get element by ID
   */
  async getElement(elementId: string): Promise<InteractiveElementData | null> {
    const { data, error } = await this.supabase
      .from('story_interactive_elements')
      .select('*')
      .eq('id', elementId)
      .single();

    if (error) {
      console.error('Error fetching element:', error);
      return null;
    }
    return data;
  }

  /**
   * Get all elements for a story
   */
  async getStoryElements(storyId: string): Promise<InteractiveElementData[]> {
    const { data, error } = await this.supabase
      .from('story_interactive_elements')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching story elements:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Delete an interactive element
   */
  async deleteElement(elementId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    // Verify user owns the story
    const { data: element, error: elementError } = await this.supabase
      .from('story_interactive_elements')
      .select('story_id, stories!inner(user_id)')
      .eq('id', elementId)
      .single();

    if (elementError) throw elementError;
    if (!element || (element as any).stories.user_id !== userId) {
      throw new Error('You can only delete elements from your own stories');
    }

    const { error } = await this.supabase
      .from('story_interactive_elements')
      .delete()
      .eq('id', elementId);

    if (error) throw error;
  }
}

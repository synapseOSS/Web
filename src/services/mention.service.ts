import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Mention {
  id: string;
  post_id?: string;
  comment_id?: string;
  mentioned_user_id: string;
  mentioned_by_user_id: string;
  mention_type: 'post' | 'comment';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class MentionService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async createMentions(
    mentions: string[], 
    targetId: string, 
    type: 'post' | 'comment'
  ): Promise<boolean> {
    const currentUser = this.auth.currentUser();
    if (!currentUser || mentions.length === 0) return false;

    try {
      // Get user IDs from usernames
      const { data: users, error: userError } = await this.supabase
        .from('users')
        .select('uid, username')
        .in('username', mentions);

      if (userError) throw userError;
      if (!users || users.length === 0) return false;

      // Create mention records
      const mentionRecords = users.map(user => ({
        [type === 'post' ? 'post_id' : 'comment_id']: targetId,
        mentioned_user_id: user.uid,
        mentioned_by_user_id: currentUser.id,
        mention_type: type
      }));

      const { error } = await this.supabase
        .from('mentions')
        .insert(mentionRecords);

      if (error) throw error;

      // Create notifications for mentioned users
      await this.createMentionNotifications(users, targetId, type);

      return true;
    } catch (err) {
      console.error('Error creating mentions:', err);
      return false;
    }
  }

  private async createMentionNotifications(
    users: any[], 
    targetId: string, 
    type: 'post' | 'comment'
  ) {
    const currentUser = this.auth.currentUser();
    if (!currentUser) return;

    const notifications = users.map(user => ({
      user_id: user.uid,
      sender_id: currentUser.id,
      type: 'mention',
      title: 'New Mention',
      message: `@${currentUser.user_metadata?.username || 'Someone'} mentioned you in a ${type}`,
      data: {
        target_id: targetId,
        target_type: type
      },
      action_url: type === 'post' ? `/app/post/${targetId}` : `/app/post/${targetId}#comment`
    }));

    await this.supabase
      .from('notifications')
      .insert(notifications);
  }

  async getMentionsForPost(postId: string): Promise<Mention[]> {
    try {
      const { data, error } = await this.supabase
        .from('mentions')
        .select('*')
        .eq('post_id', postId)
        .eq('mention_type', 'post');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching mentions:', err);
      return [];
    }
  }

  async getUserMentions(userId: string): Promise<Mention[]> {
    try {
      const { data, error } = await this.supabase
        .from('mentions')
        .select('*')
        .eq('mentioned_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user mentions:', err);
      return [];
    }
  }

  async searchUsers(query: string): Promise<any[]> {
    if (!query) return [];

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('uid, username, display_name, avatar, verify')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }
}

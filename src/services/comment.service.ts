import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  media_url?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'GIF' | 'VOICE';
  is_liked?: boolean;
  user?: {
    uid: string;
    username: string;
    display_name: string;
    avatar: string;
    verify: boolean;
  };
  replies?: Comment[];
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  comments = signal<Comment[]>([]);
  loading = signal(false);

  async fetchComments(postId: string) {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          users:user_id (
            uid,
            username,
            display_name,
            avatar,
            verify
          )
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userId = this.auth.currentUser()?.id;
      const commentsWithLikes = await Promise.all(
        (data || []).map(async (comment: any) => {
          const isLiked = userId ? await this.checkIfLiked(comment.id, userId) : false;
          const replies = await this.fetchReplies(comment.id);
          return {
            ...comment,
            user: comment.users,
            is_liked: isLiked,
            replies
          };
        })
      );

      this.comments.set(commentsWithLikes);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchReplies(parentId: string): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .from('comments')
      .select(`
        *,
        users:user_id (
          uid,
          username,
          display_name,
          avatar,
          verify
        )
      `)
      .eq('parent_comment_id', parentId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []).map((c: any) => ({ ...c, user: c.users }));
  }

  async checkIfLiked(commentId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('likes')
      .select('id')
      .eq('target_id', commentId)
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .single();
    return !!data;
  }

  async createComment(postId: string, content: string, parentId?: string) {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const { error } = await this.supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentId || null
        });

      if (error) throw error;

      await this.supabase.rpc('increment_comments_count', { post_id: postId });
      await this.fetchComments(postId);
    } catch (err) {
      console.error('Error creating comment:', err);
      throw err;
    }
  }

  async likeComment(commentId: string, postId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { error } = await this.supabase
      .from('likes')
      .insert({ user_id: userId, target_id: commentId, target_type: 'comment' });

    if (!error) {
      await this.fetchComments(postId);
    }
  }

  async unlikeComment(commentId: string, postId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { error } = await this.supabase
      .from('likes')
      .delete()
      .eq('target_id', commentId)
      .eq('user_id', userId)
      .eq('target_type', 'comment');

    if (!error) {
      await this.fetchComments(postId);
    }
  }

  async editComment(commentId: string, newContent: string) {
    try {
      const { error } = await this.supabase
        .from('comments')
        .update({
          content: newContent,
          is_edited: true
        })
        .eq('id', commentId);

      if (error) throw error;
    } catch (err) {
      console.error('Error editing comment:', err);
      throw err;
    }
  }

  async deleteComment(commentId: string) {
    try {
      const { error } = await this.supabase
        .from('comments')
        .update({
          is_deleted: true,
          content: '[deleted]'
        })
        .eq('id', commentId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }

  async addCommentReaction(commentId: string, userId: string, reactionType: string) {
    try {
      const { error } = await this.supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: userId,
          reaction_type: reactionType.toLowerCase()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error adding comment reaction:', err);
      throw err;
    }
  }

  async updateCommentReaction(commentId: string, userId: string, reactionType: string) {
    try {
      const { error } = await this.supabase
        .from('comment_reactions')
        .update({ reaction_type: reactionType.toLowerCase() })
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating comment reaction:', err);
      throw err;
    }
  }

  async removeCommentReaction(commentId: string, userId: string) {
    try {
      const { error } = await this.supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing comment reaction:', err);
      throw err;
    }
  }
}

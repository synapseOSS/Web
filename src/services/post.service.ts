import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Post {
  id: string;
  post_text: string;
  author_uid: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  users?: {
    display_name: string;
    username: string;
    avatar: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  posts = signal<Post[]>([]);
  loading = signal(false);

  async fetchPosts() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:author_uid (
            display_name,
            username,
            avatar
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.posts.set(data as any[]);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async createPost(text: string, mediaFiles?: File[]) {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      let mediaItems: any[] = [];
      let postType = 'TEXT';

      // Upload media files if provided
      if (mediaFiles && mediaFiles.length > 0) {
        mediaItems = await Promise.all(
          mediaFiles.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `posts/${fileName}`;

            const { error: uploadError } = await this.supabase.storage
              .from('user-media')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = this.supabase.storage
              .from('user-media')
              .getPublicUrl(filePath);

            const mediaType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
            if (postType === 'TEXT') postType = mediaType;

            return {
              type: mediaType,
              url: data.publicUrl
            };
          })
        );
      }

      // Extract hashtags from text
      const hashtags = this.extractHashtags(text);

      const { data: postData, error } = await this.supabase
        .from('posts')
        .insert({
          post_text: text,
          author_uid: user.id,
          post_type: postType,
          media_items: mediaItems,
          created_at: new Date().toISOString(),
          timestamp: Date.now()
        })
        .select()
        .single();

      if (error) throw error;

      // Save hashtags
      if (hashtags.length > 0 && postData) {
        await this.saveHashtags(postData.id, hashtags);
      }

      await this.fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  }

  private async saveHashtags(postId: string, hashtags: string[]) {
    for (const tag of hashtags) {
      // Upsert hashtag
      const { data: hashtagData } = await this.supabase
        .from('hashtags')
        .upsert({ tag }, { onConflict: 'tag' })
        .select()
        .single();

      if (hashtagData) {
        // Link hashtag to post
        await this.supabase
          .from('post_hashtags')
          .insert({ post_id: postId, hashtag_id: hashtagData.id });

        // Increment usage count
        await this.supabase
          .from('hashtags')
          .update({ usage_count: this.supabase.raw('usage_count + 1') })
          .eq('id', hashtagData.id);
      }
    }
  }

  async deletePost(postId: string) {
    try {
      const { error } = await this.supabase
        .from('posts')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      await this.fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  }

  async editPost(postId: string, newText: string) {
    try {
      const { error } = await this.supabase
        .from('posts')
        .update({
          post_text: newText,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      await this.fetchPosts();
    } catch (err) {
      console.error('Error editing post:', err);
      throw err;
    }
  }

  async bookmarkPost(postId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { error } = await this.supabase
        .from('favorites')
        .insert({ user_id: userId, post_id: postId });

      if (error) throw error;
    } catch (err) {
      console.error('Error bookmarking post:', err);
    }
  }

  async unbookmarkPost(postId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { error } = await this.supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  }
}
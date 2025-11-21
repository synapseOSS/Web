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

  async createPost(text: string) {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const { error } = await this.supabase
        .from('posts')
        .insert({
          post_text: text,
          author_uid: user.id,
          post_type: 'TEXT',
          created_at: new Date().toISOString(),
          timestamp: Date.now()
        });

      if (error) throw error;
      await this.fetchPosts(); // Refresh feed
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  }
}
import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SearchResult {
  type: 'user' | 'post' | 'hashtag';
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private supabase = inject(SupabaseService).client;
  
  searchResults = signal<SearchResult[]>([]);
  loading = signal(false);
  recentSearches = signal<string[]>([]);

  async search(query: string) {
    if (!query.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const results: SearchResult[] = [];

      // Search users
      const { data: users } = await this.supabase
        .from('users')
        .select('uid, username, display_name, avatar, verify, followers_count')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (users) {
        results.push(...users.map(user => ({ type: 'user' as const, data: user })));
      }

      // Search posts
      const { data: posts } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:author_uid (
            uid,
            username,
            display_name,
            avatar,
            verify
          )
        `)
        .ilike('post_text', `%${query}%`)
        .limit(10);

      if (posts) {
        results.push(...posts.map(post => ({ type: 'post' as const, data: post })));
      }

      // Search hashtags
      if (query.startsWith('#')) {
        const tag = query.substring(1);
        const { data: hashtags } = await this.supabase
          .from('hashtags')
          .select('*')
          .ilike('tag', `%${tag}%`)
          .limit(5);

        if (hashtags) {
          results.push(...hashtags.map(hashtag => ({ type: 'hashtag' as const, data: hashtag })));
        }
      }

      this.searchResults.set(results);
      this.addToRecentSearches(query);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async searchUsers(query: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('uid, username, display_name, avatar, verify, followers_count, bio')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }

  async searchHashtag(tag: string) {
    try {
      const { data: hashtagData } = await this.supabase
        .from('hashtags')
        .select('id')
        .eq('tag', tag)
        .single();

      if (!hashtagData) return [];

      const { data: posts } = await this.supabase
        .from('post_hashtags')
        .select(`
          post_id,
          posts:post_id (
            *,
            users:author_uid (
              uid,
              username,
              display_name,
              avatar,
              verify
            )
          )
        `)
        .eq('hashtag_id', hashtagData.id);

      return (posts || []).map((p: any) => p.posts);
    } catch (err) {
      console.error('Error searching hashtag:', err);
      return [];
    }
  }

  async getTrendingHashtags(limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('hashtags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
      return [];
    }
  }

  private addToRecentSearches(query: string) {
    const recent = this.recentSearches();
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
    this.recentSearches.set(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }

  loadRecentSearches() {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      this.recentSearches.set(JSON.parse(stored));
    }
  }

  clearRecentSearches() {
    this.recentSearches.set([]);
    localStorage.removeItem('recentSearches');
  }

  constructor() {
    this.loadRecentSearches();
  }
}

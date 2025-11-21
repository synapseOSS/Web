import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class HashtagService {
  private supabase = inject(SupabaseService).client;

  async createHashtags(
    hashtags: string[], 
    targetId: string, 
    type: 'post' | 'comment'
  ): Promise<boolean> {
    if (hashtags.length === 0) return false;

    try {
      // Upsert hashtags (create or increment usage_count)
      for (const tag of hashtags) {
        const { data: existing } = await this.supabase
          .from('hashtags')
          .select('id, usage_count')
          .eq('tag', tag.toLowerCase())
          .single();

        if (existing) {
          // Update usage count
          await this.supabase
            .from('hashtags')
            .update({ 
              usage_count: existing.usage_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          // Create new hashtag
          await this.supabase
            .from('hashtags')
            .insert({ 
              tag: tag.toLowerCase(),
              usage_count: 1
            });
        }
      }

      // Get hashtag IDs
      const { data: hashtagRecords } = await this.supabase
        .from('hashtags')
        .select('id, tag')
        .in('tag', hashtags.map(t => t.toLowerCase()));

      if (!hashtagRecords) return false;

      // Create associations
      const tableName = type === 'post' ? 'post_hashtags' : 'comment_hashtags';
      const idField = type === 'post' ? 'post_id' : 'comment_id';

      const associations = hashtagRecords.map(ht => ({
        [idField]: targetId,
        hashtag_id: ht.id
      }));

      const { error } = await this.supabase
        .from(tableName)
        .insert(associations);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error creating hashtags:', err);
      return false;
    }
  }

  async getHashtagsForPost(postId: string): Promise<Hashtag[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_hashtags')
        .select(`
          hashtag_id,
          hashtags:hashtag_id (
            id,
            tag,
            usage_count,
            created_at,
            updated_at
          )
        `)
        .eq('post_id', postId);

      if (error) throw error;
      return data?.map((item: any) => item.hashtags) || [];
    } catch (err) {
      console.error('Error fetching hashtags:', err);
      return [];
    }
  }

  async searchHashtags(query: string): Promise<Hashtag[]> {
    if (!query) return [];

    try {
      const { data, error } = await this.supabase
        .from('hashtags')
        .select('*')
        .ilike('tag', `%${query.toLowerCase()}%`)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching hashtags:', err);
      return [];
    }
  }

  async getTrendingHashtags(limit: number = 10): Promise<Hashtag[]> {
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

  async getPostsByHashtag(tag: string): Promise<any[]> {
    try {
      const { data: hashtagData } = await this.supabase
        .from('hashtags')
        .select('id')
        .eq('tag', tag.toLowerCase())
        .single();

      if (!hashtagData) return [];

      const { data, error } = await this.supabase
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

      if (error) throw error;
      return data?.map((item: any) => item.posts) || [];
    } catch (err) {
      console.error('Error fetching posts by hashtag:', err);
      return [];
    }
  }
}

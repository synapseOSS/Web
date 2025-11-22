
import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface User {
  id: string;
  uid: string;
  username: string;
  display_name: string;
  avatar: string;
  cover_image?: string;
  bio?: string;
  verify: boolean;
  followers_count: number;
  following_count: number;
  is_online?: boolean;
}

export interface Story {
  id: string;
  user_id: string;
  user: User;
  media_url: string;
  is_viewed: boolean;
}

export interface MediaItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail?: string;
}

export interface Post {
  id: string;
  author_uid: string;
  user: User;
  post_text: string;
  media: MediaItem[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  post_type?: 'TEXT' | 'IMAGE' | 'VIDEO';
  has_location?: boolean;
  location_name?: string;
  location_address?: string;
  location_latitude?: number;
  location_longitude?: number;
  collaborators?: Array<{
    uid: string;
    username: string;
    display_name: string;
    avatar: string;
  }>;
}

export interface Chat {
  id: string;
  chat_id: string;
  partner: User;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_me: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  
  // Current User from Auth
  currentUser = signal<User>({
    id: '',
    uid: '',
    username: 'loading',
    display_name: 'Loading...',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    verify: false,
    followers_count: 0,
    following_count: 0
  });

  // Mock Users
  private users: User[] = [
    {
      id: 'u2',
      uid: 'sarah-uid',
      username: 'sarah_connor',
      display_name: 'Sarah Connor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      verify: true,
      followers_count: 8900,
      following_count: 120,
      is_online: true
    },
    {
      id: 'u3',
      uid: 'tech-uid',
      username: 'tech_insider',
      display_name: 'Tech Insider',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
      verify: false,
      followers_count: 50000,
      following_count: 10
    },
    {
      id: 'u4',
      uid: 'photo-uid',
      username: 'lens_master',
      display_name: 'Lens Master',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lens',
      verify: true,
      followers_count: 340,
      following_count: 800,
      is_online: true
    }
  ];

  stories = signal<Story[]>([
    { id: 's1', user_id: 'u1', user: this.currentUser(), media_url: 'https://picsum.photos/id/10/300/500', is_viewed: false },
    { id: 's2', user_id: 'u2', user: this.users[0], media_url: 'https://picsum.photos/id/15/300/500', is_viewed: false },
    { id: 's3', user_id: 'u3', user: this.users[1], media_url: 'https://picsum.photos/id/20/300/500', is_viewed: false },
    { id: 's4', user_id: 'u4', user: this.users[2], media_url: 'https://picsum.photos/id/25/300/500', is_viewed: true },
  ]);

  posts = signal<Post[]>([
    {
      id: 'p1',
      author_uid: 'u2',
      user: this.users[0],
      post_text: 'Just deployed the new Synapse node! The speed is incredible compared to traditional servers. ⚡️ Thanks @alex_dev for the help! #Web3 #Decentralized #NodeJS',
      media: [
        { type: 'IMAGE', url: 'https://picsum.photos/id/48/800/400' }
      ],
      likes_count: 1240,
      comments_count: 85,
      views_count: 5000,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      is_liked: true,
      post_type: 'IMAGE'
    },
    {
      id: 'p2',
      author_uid: 'u3',
      user: this.users[1],
      post_text: 'Top 5 reasons to switch to a federated social network:\n1. Data ownership\n2. No algorithmic feed\n3. Privacy first\n4. Community governance\n5. Open source\n\nShoutout to @sarah_connor and @lens_master for the discussion! #SocialMedia #Privacy #OpenSource',
      media: [],
      likes_count: 890,
      comments_count: 120,
      views_count: 12000,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      is_bookmarked: true,
      post_type: 'TEXT'
    },
    {
      id: 'p3',
      author_uid: 'u4',
      user: this.users[2],
      post_text: 'Sunset views from the studio today. 📸 Here are some shots from the session. #Photography #Sunset #Nature #Art',
      media: [
         { type: 'IMAGE', url: 'https://picsum.photos/id/56/800/600' },
         { type: 'IMAGE', url: 'https://picsum.photos/id/57/800/600' },
         { type: 'IMAGE', url: 'https://picsum.photos/id/58/800/600' },
         { type: 'IMAGE', url: 'https://picsum.photos/id/59/800/600' },
         { type: 'IMAGE', url: 'https://picsum.photos/id/60/800/600' } // 5 images to test +1 overlay
      ],
      likes_count: 45,
      comments_count: 2,
      views_count: 200,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      post_type: 'IMAGE'
    },
    {
      id: 'p4',
      author_uid: 'u2',
      user: this.users[0],
      post_text: 'Working on the new UI design with @tech_insider. Thoughts? 🎨 #Design #UI #UX #WebDev',
      media: [
         { type: 'IMAGE', url: 'https://picsum.photos/id/101/800/800' },
         { type: 'IMAGE', url: 'https://picsum.photos/id/102/800/800' },
         { type: 'IMAGE', url: 'https://picsum.photos/id/103/800/800' }
      ],
      likes_count: 210,
      comments_count: 45,
      views_count: 3200,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      post_type: 'IMAGE'
    }
  ]);

  suggestedUsers = signal<User[]>(this.users);

  chats = signal<Chat[]>([
    {
      id: 'c1',
      chat_id: 'chat_1',
      partner: this.users[0],
      last_message: 'Did you see the new PR?',
      last_message_time: '2m',
      unread_count: 2
    },
    {
      id: 'c2',
      chat_id: 'chat_2',
      partner: this.users[2],
      last_message: 'Thanks for sharing!',
      last_message_time: '1h',
      unread_count: 0
    }
  ]);

  messages = signal<Message[]>([
    { id: 'm1', chat_id: 'chat_1', sender_id: 'u2', content: 'Hey Alex! How is the update coming along?', created_at: '10:00 AM', is_me: false },
    { id: 'm2', chat_id: 'chat_1', sender_id: 'u1', content: 'Almost done, just polishing the UI.', created_at: '10:05 AM', is_me: true },
    { id: 'm3', chat_id: 'chat_1', sender_id: 'u2', content: 'Awesome! Did you see the new PR?', created_at: '10:06 AM', is_me: false }
  ]);

  // Real-time subscriptions
  private setupRealtimeSubscriptions() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    // Subscribe to new posts
    this.supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
        () => this.fetchPosts())
      .subscribe();

    // Subscribe to likes
    this.supabase
      .channel('likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, 
        () => this.fetchPosts())
      .subscribe();
  }

  async fetchPosts() {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:author_uid (
            uid,
            username,
            display_name,
            avatar,
            verify,
            followers_count,
            following_count
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const userId = this.auth.currentUser()?.id;
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post: any) => {
          const isLiked = userId ? await this.checkIfLiked(post.id, userId) : false;
          return {
            id: post.id,
            author_uid: post.author_uid,
            user: post.users,
            post_text: post.post_text || '',
            media: post.media_items || [],
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            views_count: post.views_count || 0,
            created_at: post.created_at,
            is_liked: isLiked,
            post_type: post.post_type || 'TEXT'
          };
        })
      );

      this.posts.set(postsWithLikes);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  }

  async checkIfLiked(postId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('likes')
      .select('id')
      .eq('target_id', postId)
      .eq('user_id', userId)
      .eq('target_type', 'post')
      .single();
    return !!data;
  }

  async likePost(postId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { error } = await this.supabase
      .from('likes')
      .insert({ user_id: userId, target_id: postId, target_type: 'post' });

    if (!error) {
      await this.supabase.rpc('increment_likes_count', { post_id: postId });
      await this.fetchPosts();
    }
  }

  async unlikePost(postId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { error } = await this.supabase
      .from('likes')
      .delete()
      .eq('target_id', postId)
      .eq('user_id', userId)
      .eq('target_type', 'post');

    if (!error) {
      await this.supabase.rpc('decrement_likes_count', { post_id: postId });
      await this.fetchPosts();
    }
  }

  async followUser(userId: string) {
    const currentUserId = this.auth.currentUser()?.id;
    if (!currentUserId) return;

    const { error } = await this.supabase
      .from('follows')
      .insert({ follower_id: currentUserId, following_id: userId });

    if (!error) {
      await this.fetchSuggestedUsers();
    }
  }

  async unfollowUser(userId: string) {
    const currentUserId = this.auth.currentUser()?.id;
    if (!currentUserId) return;

    const { error } = await this.supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId);

    if (!error) {
      await this.fetchSuggestedUsers();
    }
  }

  async fetchSuggestedUsers() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .limit(10);

      if (error) throw error;
      this.suggestedUsers.set(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }

  async fetchStories() {
    try {
      const { data, error } = await this.supabase
        .from('stories')
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.stories.set(data?.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        user: s.users,
        media_url: s.media_url,
        is_viewed: false
      })) || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  }

  async fetchChats() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats:chat_id (
            id,
            chat_id,
            last_message,
            last_message_time
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      // Transform and set chats
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  }

  getPosts() {
    return this.posts();
  }

  getPostById(id: string): Post | undefined {
    return this.posts().find(p => p.id === id);
  }

  getStories() {
    return this.stories();
  }

  getSuggestedUsers() {
    return this.suggestedUsers();
  }

  addPost(post: Post) {
    this.posts.update(current => [post, ...current]);
  }

  deletePost(postId: string) {
    this.posts.update(current => current.filter(p => p.id !== postId));
  }

  updatePost(postId: string, updates: Partial<Post>) {
    this.posts.update(current => 
      current.map(p => p.id === postId ? { ...p, ...updates } : p)
    );
  }

  constructor() {
    this.loadCurrentUser();
    this.setupRealtimeSubscriptions();
    this.fetchPosts();
    this.fetchStories();
    this.fetchSuggestedUsers();
  }

  async loadCurrentUser() {
    const authUser = this.auth.currentUser();
    if (!authUser) return;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('uid', authUser.id)
        .single();

      if (error) throw error;

      if (data) {
        this.currentUser.set({
          id: data.uid,
          uid: data.uid,
          username: data.username || 'user',
          display_name: data.display_name || data.username || 'User',
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.uid}`,
          cover_image: data.profile_cover_image,
          bio: data.bio || data.biography,
          verify: data.verify || false,
          followers_count: data.followers_count || 0,
          following_count: data.following_count || 0
        });
      }
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  }
}


import { Injectable, signal } from '@angular/core';

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
  thumbnail?: string; // For videos
}

export interface Post {
  id: string;
  author_uid: string;
  user: User;
  post_text: string;
  media: MediaItem[]; // Changed from single post_image to array
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string; // ISO date
  is_liked?: boolean;
  is_bookmarked?: boolean;
  post_type?: 'TEXT' | 'IMAGE' | 'VIDEO';
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
  
  // Mock Current User
  currentUser = signal<User>({
    id: 'u1',
    uid: 'curr-user-123',
    username: 'alex_dev',
    display_name: 'Alex Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    cover_image: 'https://picsum.photos/id/20/1200/400',
    bio: 'Building the future of decentralized social media. 🚀 #Synapse',
    verify: true,
    followers_count: 1205,
    following_count: 450
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
      post_text: 'Just deployed the new Synapse node! The speed is incredible compared to traditional servers. ⚡️ #Web3 #Decentralized',
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
      post_text: 'Top 5 reasons to switch to a federated social network:\n1. Data ownership\n2. No algorithmic feed\n3. Privacy first\n4. Community governance\n5. Open source',
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
      post_text: 'Sunset views from the studio today. 📸 Here are some shots from the session.',
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
      post_text: 'Working on the new UI design. Thoughts? 🎨',
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
}

import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private supabase = inject(SupabaseService).client;
  private channels = new Map<string, RealtimeChannel>();
  
  isConnected = signal(false);

  // Subscribe to new posts in real-time
  subscribeToFeed(callback: (payload: any) => void) {
    const channel = this.supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('New post received:', payload);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected.set(true);
          console.log('✅ Subscribed to feed updates');
        }
      });

    this.channels.set('feed', channel);
    return channel;
  }

  // Subscribe to comments on a specific post
  subscribeToComments(postId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Comment update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(`comments:${postId}`, channel);
    return channel;
  }

  // Subscribe to direct messages
  subscribeToMessages(userId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          console.log('New message:', payload);
          callback(payload.new);
        }
      )
      .subscribe();

    this.channels.set(`messages:${userId}`, channel);
    return channel;
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          callback(payload.new);
        }
      )
      .subscribe();

    this.channels.set(`notifications:${userId}`, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel);
      console.log(`Unsubscribed from ${name}`);
    });
    this.channels.clear();
    this.isConnected.set(false);
  }

  // Presence - track online users
  trackPresence(userId: string, metadata: any = {}) {
    const channel = this.supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Online users:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata
          });
        }
      });

    this.channels.set('presence', channel);
    return channel;
  }
}

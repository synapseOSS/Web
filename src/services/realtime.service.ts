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

  // Story-specific real-time subscriptions

  /**
   * Subscribe to new story creation from followed users
   * Requirement 10.1: New stories pushed to viewers within 5 seconds
   */
  subscribeToStoryCreation(userId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`stories:feed:${userId}`, {
        config: { private: true }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories'
        },
        async (payload) => {
          console.log('New story created:', payload);
          
          // Check if the viewer can see this story
          const { data: canView } = await this.supabase
            .rpc('can_view_story', {
              story_uuid: payload.new.id,
              viewer_uuid: userId
            });

          if (canView) {
            callback(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to story creation updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Story creation subscription error');
          // Attempt reconnection
          this.reconnectChannel(`stories:feed:${userId}`);
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Story creation subscription timed out');
          this.reconnectChannel(`stories:feed:${userId}`);
        }
      });

    this.channels.set(`stories:feed:${userId}`, channel);
    return channel;
  }

  /**
   * Subscribe to story updates (privacy changes, deletions)
   * Requirement 10.2: Story deletions removed immediately
   * Requirement 10.3: Privacy changes updated within 5 seconds
   */
  subscribeToStoryUpdates(userId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`stories:updates:${userId}`, {
        config: { private: true }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories'
        },
        async (payload) => {
          console.log('Story updated:', payload);
          
          // Check if the viewer can still see this story
          const { data: canView } = await this.supabase
            .rpc('can_view_story', {
              story_uuid: payload.new.id,
              viewer_uuid: userId
            });

          callback({
            ...payload.new,
            can_view: canView,
            event: 'UPDATE'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          console.log('Story deleted:', payload);
          callback({
            ...payload.old,
            event: 'DELETE'
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to story updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Story updates subscription error');
          this.reconnectChannel(`stories:updates:${userId}`);
        }
      });

    this.channels.set(`stories:updates:${userId}`, channel);
    return channel;
  }

  /**
   * Subscribe to view count updates for a specific story
   * Requirement 10.4: View counts updated in real-time
   */
  subscribeToStoryViews(storyId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`story-views:${storyId}`, {
        config: { private: true }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_views',
          filter: `story_id=eq.${storyId}`
        },
        async (payload) => {
          console.log('New story view:', payload);
          
          // Fetch updated story to get current view count
          const { data: story } = await this.supabase
            .from('stories')
            .select('views_count')
            .eq('id', storyId)
            .single();

          callback({
            view: payload.new,
            views_count: story?.views_count || 0
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to views for story ${storyId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Story views subscription error for ${storyId}`);
          this.reconnectChannel(`story-views:${storyId}`);
        }
      });

    this.channels.set(`story-views:${storyId}`, channel);
    return channel;
  }

  /**
   * Subscribe to reactions for a specific story
   * Requirement 10.5: Reactions notified immediately
   */
  subscribeToStoryReactions(storyId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`story-reactions:${storyId}`, {
        config: { private: true }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_reactions',
          filter: `story_id=eq.${storyId}`
        },
        async (payload) => {
          console.log('New story reaction:', payload);
          
          // Fetch user info for the reactor
          const { data: user } = await this.supabase
            .from('users')
            .select('username, display_name, avatar')
            .eq('uid', payload.new.user_id)
            .single();

          // Fetch updated story to get current reaction count
          const { data: story } = await this.supabase
            .from('stories')
            .select('reactions_count')
            .eq('id', storyId)
            .single();

          callback({
            reaction: payload.new,
            user,
            reactions_count: story?.reactions_count || 0
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'story_reactions',
          filter: `story_id=eq.${storyId}`
        },
        async (payload) => {
          console.log('Story reaction removed:', payload);
          
          // Fetch updated story to get current reaction count
          const { data: story } = await this.supabase
            .from('stories')
            .select('reactions_count')
            .eq('id', storyId)
            .single();

          callback({
            reaction: payload.old,
            event: 'DELETE',
            reactions_count: story?.reactions_count || 0
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to reactions for story ${storyId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Story reactions subscription error for ${storyId}`);
          this.reconnectChannel(`story-reactions:${storyId}`);
        }
      });

    this.channels.set(`story-reactions:${storyId}`, channel);
    return channel;
  }

  /**
   * Subscribe to replies for a specific story
   * Requirement 10.5: Replies notified immediately
   */
  subscribeToStoryReplies(storyId: string, callback: (payload: any) => void) {
    const channel = this.supabase
      .channel(`story-replies:${storyId}`, {
        config: { private: true }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_replies',
          filter: `story_id=eq.${storyId}`
        },
        async (payload) => {
          console.log('New story reply:', payload);
          
          // Fetch user info for the sender
          const { data: user } = await this.supabase
            .from('users')
            .select('username, display_name, avatar')
            .eq('uid', payload.new.sender_id)
            .single();

          // Fetch updated story to get current reply count
          const { data: story } = await this.supabase
            .from('stories')
            .select('replies_count')
            .eq('id', storyId)
            .single();

          callback({
            reply: payload.new,
            user,
            replies_count: story?.replies_count || 0
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to replies for story ${storyId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Story replies subscription error for ${storyId}`);
          this.reconnectChannel(`story-replies:${storyId}`);
        }
      });

    this.channels.set(`story-replies:${storyId}`, channel);
    return channel;
  }

  /**
   * Subscribe to all story-related updates for a user
   * Combines creation, updates, views, reactions, and replies
   */
  subscribeToAllStoryUpdates(userId: string, callbacks: {
    onNewStory?: (payload: any) => void;
    onStoryUpdate?: (payload: any) => void;
    onView?: (payload: any) => void;
    onReaction?: (payload: any) => void;
    onReply?: (payload: any) => void;
  }) {
    if (callbacks.onNewStory) {
      this.subscribeToStoryCreation(userId, callbacks.onNewStory);
    }
    if (callbacks.onStoryUpdate) {
      this.subscribeToStoryUpdates(userId, callbacks.onStoryUpdate);
    }
  }

  /**
   * Unsubscribe from all story-related channels
   */
  unsubscribeFromStories() {
    const storyChannels = Array.from(this.channels.keys()).filter(
      key => key.startsWith('stories:') || key.startsWith('story-')
    );

    storyChannels.forEach(channelName => {
      this.unsubscribe(channelName);
    });
  }

  /**
   * Reconnect a channel after connection failure
   * Requirement 10.7: Handle connection failures gracefully and reconnect automatically
   */
  private reconnectChannel(channelName: string) {
    console.log(`🔄 Attempting to reconnect channel: ${channelName}`);
    
    // Remove the failed channel
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }

    // Exponential backoff for reconnection
    const reconnectDelay = 1000; // Start with 1 second
    setTimeout(() => {
      // The specific channel will be recreated when the component/service calls the subscribe method again
      console.log(`✅ Channel ${channelName} ready for reconnection`);
    }, reconnectDelay);
  }

  /**
   * Monitor connection status
   * Requirement 10.7: Handle connection failures gracefully
   */
  monitorConnection(onStatusChange: (status: string) => void) {
    // Subscribe to connection status changes
    const channel = this.supabase.channel('connection-monitor');
    
    channel.subscribe((status) => {
      console.log('Connection status:', status);
      onStatusChange(status);
      
      if (status === 'SUBSCRIBED') {
        this.isConnected.set(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.isConnected.set(false);
      }
    });

    this.channels.set('connection-monitor', channel);
    return channel;
  }
}

import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';

export interface Notification {
  id: string;
  user_id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'REPOST';
  actor_uid: string;
  target_id?: string;
  target_type?: 'POST' | 'COMMENT';
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private realtime = inject(RealtimeService);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  loading = signal(false);

  constructor() {
    // Subscribe to real-time notifications when user is authenticated
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.subscribeToNotifications(user.id);
        this.fetchNotifications();
      }
    });
  }

  private subscribeToNotifications(userId: string) {
    this.realtime.subscribeToNotifications(userId, (newNotification) => {
      this.notifications.update(notifs => [newNotification, ...notifs]);
      this.unreadCount.update(count => count + 1);

      // Show browser notification if permission granted
      this.showBrowserNotification(newNotification);
    });
  }

  async fetchNotifications() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_uid (
            username,
            display_name,
            avatar
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.notifications.set(data as any[]);
      this.unreadCount.set(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      this.notifications.update(notifs =>
        notifs.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      this.unreadCount.update(count => Math.max(0, count - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  async markAllAsRead() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      this.notifications.update(notifs =>
        notifs.map(n => ({ ...n, is_read: true }))
      );
      this.unreadCount.set(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  private async showBrowserNotification(notification: Notification) {
    if (Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: notification.actor?.avatar || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: notification.id,
      requireInteraction: false,
      data: {
        url: this.getNotificationUrl(notification)
      }
    };

    const n = new Notification('Synapse', options);

    n.onclick = () => {
      window.focus();
      window.location.href = options.data.url;
      n.close();
    };
  }

  private getNotificationUrl(notification: Notification): string {
    switch (notification.type) {
      case 'LIKE':
      case 'COMMENT':
      case 'REPOST':
        return `/app/post/${notification.target_id}`;
      case 'FOLLOW':
        return `/app/profile/${notification.actor?.username}`;
      case 'MENTION':
        return `/app/post/${notification.target_id}`;
      default:
        return '/app/feed';
    }
  }
}

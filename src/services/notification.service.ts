import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  type: string;
  title?: string;
  message: string;
  data?: any;
  read: boolean;
  action_url?: string;
  created_at: string;
  sender?: {
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
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  loading = signal(false);
  
  private notificationChannel?: RealtimeChannel;

  async fetchNotifications() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (
            username,
            display_name,
            avatar
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.notifications.set(data || []);
      this.updateUnreadCount();
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      this.loading.set(false);
    }
  }

  updateUnreadCount() {
    const unread = this.notifications().filter(n => !n.read).length;
    this.unreadCount.set(unread);
  }

  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      await this.fetchNotifications();
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
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      await this.fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      await this.fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }

  setupRealtimeNotifications() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.notificationChannel?.unsubscribe();
    
    this.notificationChannel = this.supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          this.notifications.update(current => [payload.new as Notification, ...current]);
          this.updateUnreadCount();
          this.showBrowserNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Notification', {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }

  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  cleanup() {
    this.notificationChannel?.unsubscribe();
  }

  constructor() {
    this.setupRealtimeNotifications();
    this.fetchNotifications();
  }
}

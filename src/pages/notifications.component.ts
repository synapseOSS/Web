import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-white/10">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
        <div class="px-4 py-3">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            @if (notificationService.unreadCount() > 0) {
              <button 
                (click)="markAllAsRead()"
                class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Mark all as read
              </button>
            }
          </div>

          <!-- Filter Tabs -->
          <div class="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            @for (filter of filters; track filter.id) {
              <button
                (click)="activeFilter.set(filter.id)"
                [class.bg-indigo-600]="activeFilter() === filter.id"
                [class.text-white]="activeFilter() === filter.id"
                [class.bg-slate-100]="activeFilter() !== filter.id"
                [class.dark:bg-slate-800]="activeFilter() !== filter.id"
                [class.text-slate-600]="activeFilter() !== filter.id"
                [class.dark:text-slate-400]="activeFilter() !== filter.id"
                class="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap">
                {{ filter.name }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="pb-20">
        @if (notificationService.loading()) {
          <div class="flex items-center justify-center py-20">
            <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        } @else if (filteredNotifications().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 px-4">
            <div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <app-icon name="bell" [size]="40" class="text-slate-400"></app-icon>
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">No notifications yet</h3>
            <p class="text-slate-500 text-center max-w-sm">
              When someone likes, comments, or follows you, you'll see it here
            </p>
          </div>
        } @else {
          @for (notification of filteredNotifications(); track notification.id) {
            <div 
              (click)="handleNotificationClick(notification)"
              [class.bg-indigo-50]="!notification.is_read"
              [class.dark:bg-indigo-950/20]="!notification.is_read"
              class="p-4 border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
              <div class="flex gap-3">
                <!-- Actor Avatar with Icon Badge -->
                <div class="relative flex-shrink-0">
                  <img 
                    [src]="notification.actor?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
                    class="w-12 h-12 rounded-full object-cover">
                  <div 
                    [class.bg-pink-500]="notification.type === 'LIKE'"
                    [class.bg-blue-500]="notification.type === 'COMMENT'"
                    [class.bg-indigo-500]="notification.type === 'FOLLOW'"
                    [class.bg-purple-500]="notification.type === 'MENTION'"
                    [class.bg-green-500]="notification.type === 'REPOST'"
                    class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                    @switch (notification.type) {
                      @case ('LIKE') {
                        <app-icon name="heart" [size]="12" class="text-white"></app-icon>
                      }
                      @case ('COMMENT') {
                        <app-icon name="message-circle" [size]="12" class="text-white"></app-icon>
                      }
                      @case ('FOLLOW') {
                        <app-icon name="user-plus" [size]="12" class="text-white"></app-icon>
                      }
                      @case ('MENTION') {
                        <app-icon name="at-sign" [size]="12" class="text-white"></app-icon>
                      }
                      @case ('REPOST') {
                        <app-icon name="repeat" [size]="12" class="text-white"></app-icon>
                      }
                    }
                  </div>
                </div>

                <!-- Notification Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-slate-900 dark:text-white">
                        <span class="font-bold">{{ notification.actor?.display_name || 'Someone' }}</span>
                        <span class="text-slate-600 dark:text-slate-400"> {{ getNotificationText(notification.type) }}</span>
                      </p>
                      <p class="text-xs text-slate-500 mt-1">{{ getTimeAgo(notification.created_at) }}</p>
                    </div>
                    @if (!notification.is_read) {
                      <div class="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
                    }
                  </div>

                  <!-- Preview Content (for post-related notifications) -->
                  @if (notification.target_type === 'POST' && notification.message) {
                    <div class="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                      <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{{ notification.message }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notificationService = inject(NotificationService);

  activeFilter = signal<string>('all');

  filters = [
    { id: 'all', name: 'All' },
    { id: 'likes', name: 'Likes' },
    { id: 'comments', name: 'Comments' },
    { id: 'follows', name: 'Follows' },
    { id: 'mentions', name: 'Mentions' }
  ];

  ngOnInit() {
    // Request notification permission
    this.notificationService.requestPermission();
  }

  filteredNotifications() {
    const all = this.notificationService.notifications();
    
    switch (this.activeFilter()) {
      case 'likes':
        return all.filter(n => n.type === 'LIKE');
      case 'comments':
        return all.filter(n => n.type === 'COMMENT');
      case 'follows':
        return all.filter(n => n.type === 'FOLLOW');
      case 'mentions':
        return all.filter(n => n.type === 'MENTION');
      default:
        return all;
    }
  }

  getNotificationText(type: string): string {
    switch (type) {
      case 'LIKE':
        return 'liked your post';
      case 'COMMENT':
        return 'commented on your post';
      case 'FOLLOW':
        return 'started following you';
      case 'MENTION':
        return 'mentioned you in a post';
      case 'REPOST':
        return 'reposted your post';
      default:
        return 'interacted with you';
    }
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return time.toLocaleDateString();
  }

  async handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.is_read) {
      await this.notificationService.markAsRead(notification.id);
    }

    // Navigate based on notification type
    // This would be implemented with router navigation
  }

  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
  }
}

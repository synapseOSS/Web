
import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from './icon.component';
import { ReactionPickerComponent, ReactionType } from './reaction-picker.component';
import { ActionMenuComponent, MenuItem } from './action-menu.component';
import { Post } from '../services/social.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, IconComponent, ReactionPickerComponent, ActionMenuComponent],
  template: `
    <div class="p-3 sm:p-4 border-b border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer animate-in fade-in duration-300" (click)="navigateToDetail()">
      <div class="flex gap-2 sm:gap-3">
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <img [src]="post().user.avatar" 
               class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-800 object-cover hover:opacity-80 transition-opacity" 
               alt="Avatar">
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 mb-0.5 overflow-hidden">
              <span class="font-bold text-slate-900 dark:text-white truncate hover:underline" (click)="$event.stopPropagation()">
                {{ post().user.display_name }}
              </span>
              @if (post().user.verify) {
                <app-icon name="verified" [size]="16" class="text-indigo-500 flex-shrink-0"></app-icon>
              }
              <span class="text-slate-500 text-sm truncate">
                @{{ post().user.username }}
              </span>
              <span class="text-slate-500 text-sm">·</span>
              <span class="text-slate-500 text-sm">{{ formatDate(post().created_at) }}</span>
            </div>
            <div (click)="$event.stopPropagation()">
              <app-action-menu 
                [items]="menuItems"
                (itemSelected)="handleMenuAction($event)">
              </app-action-menu>
            </div>
          </div>
          
          <!-- Text -->
          @if (post().post_text) {
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-wrap mb-3 text-sm sm:text-[15px] leading-relaxed">
              {{ post().post_text }}
            </p>
          }

          <!-- Facebook-style Grid Media Layout -->
          @if (post().media.length > 0) {
            <div class="mb-3 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative bg-slate-100 dark:bg-slate-900">
              
              <!-- 1 Media Item -->
              @if (post().media.length === 1) {
                <div class="w-full max-h-[500px] overflow-hidden relative group">
                   @if (post().media[0].type === 'VIDEO') {
                     <video [src]="post().media[0].url" class="w-full h-full object-cover" muted playsinline></video>
                     <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div class="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform">
                           <app-icon name="play" [size]="32" class="ml-1 fill-current"></app-icon>
                        </div>
                     </div>
                   } @else {
                     <img [src]="post().media[0].url" class="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500">
                   }
                </div>
              }

              <!-- 2 Media Items -->
              @if (post().media.length === 2) {
                <div class="grid grid-cols-2 gap-0.5 h-[300px]">
                  @for (item of post().media; track item.url) {
                     <div class="w-full h-full overflow-hidden relative group">
                        @if (item.type === 'VIDEO') {
                           <video [src]="item.url" class="w-full h-full object-cover" muted playsinline></video>
                           <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                              <div class="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                 <app-icon name="play" [size]="24" class="ml-1 fill-current"></app-icon>
                              </div>
                           </div>
                        } @else {
                           <img [src]="item.url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        }
                     </div>
                  }
                </div>
              }

              <!-- 3 Media Items -->
              @if (post().media.length === 3) {
                 <div class="grid grid-cols-2 gap-0.5 h-[300px]">
                    <div class="w-full h-full overflow-hidden relative group">
                       @if (post().media[0].type === 'VIDEO') {
                           <video [src]="post().media[0].url" class="w-full h-full object-cover" muted playsinline></video>
                           <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                              <div class="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                 <app-icon name="play" [size]="24" class="ml-1 fill-current"></app-icon>
                              </div>
                           </div>
                       } @else {
                           <img [src]="post().media[0].url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                       }
                    </div>
                    <div class="grid grid-rows-2 gap-0.5 h-full">
                       <!-- Item 2 -->
                       <div class="w-full h-full overflow-hidden relative group">
                          @if (post().media[1].type === 'VIDEO') {
                             <video [src]="post().media[1].url" class="w-full h-full object-cover" muted playsinline></video>
                             <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                                <div class="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                   <app-icon name="play" [size]="20" class="ml-0.5 fill-current"></app-icon>
                                </div>
                             </div>
                          } @else {
                             <img [src]="post().media[1].url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                          }
                       </div>
                       <!-- Item 3 -->
                       <div class="w-full h-full overflow-hidden relative group">
                          @if (post().media[2].type === 'VIDEO') {
                             <video [src]="post().media[2].url" class="w-full h-full object-cover" muted playsinline></video>
                             <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                                <div class="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                   <app-icon name="play" [size]="20" class="ml-0.5 fill-current"></app-icon>
                                </div>
                             </div>
                          } @else {
                             <img [src]="post().media[2].url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                          }
                       </div>
                    </div>
                 </div>
              }

              <!-- 4 or More Media Items -->
              @if (post().media.length >= 4) {
                 <div class="grid grid-cols-2 grid-rows-2 gap-0.5 h-[400px]">
                    <!-- First 3 are normal -->
                    @for (item of post().media.slice(0, 3); track item.url) {
                       <div class="w-full h-full overflow-hidden relative group">
                          @if (item.type === 'VIDEO') {
                             <video [src]="item.url" class="w-full h-full object-cover" muted playsinline></video>
                             <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                                <div class="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                   <app-icon name="play" [size]="20" class="ml-0.5 fill-current"></app-icon>
                                </div>
                             </div>
                          } @else {
                             <img [src]="item.url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                          }
                       </div>
                    }
                    
                    <!-- 4th item has overlay if count > 4 -->
                    <div class="w-full h-full overflow-hidden relative group">
                        @if (post().media[3].type === 'VIDEO') {
                           <video [src]="post().media[3].url" class="w-full h-full object-cover" muted playsinline></video>
                        } @else {
                           <img [src]="post().media[3].url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        }
                        
                        @if (post().media.length > 4) {
                           <div class="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-opacity cursor-pointer hover:bg-black/50">
                              <span class="text-white font-bold text-3xl">+{{ post().media.length - 4 }}</span>
                           </div>
                        } @else if (post().media[3].type === 'VIDEO') {
                             <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                                <div class="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                   <app-icon name="play" [size]="20" class="ml-0.5 fill-current"></app-icon>
                                </div>
                             </div>
                        }
                    </div>
                 </div>
              }

            </div>
          }

          <!-- Actions -->
          <div class="flex items-center justify-between max-w-md text-slate-500 mt-2" (click)="$event.stopPropagation()">
            <button class="group flex items-center gap-1 sm:gap-2 hover:text-indigo-500 transition-colors" title="Reply">
              <div class="p-1.5 sm:p-2 rounded-full group-hover:bg-indigo-500/10 transition-colors">
                <app-icon name="message-circle" [size]="18"></app-icon>
              </div>
              <span class="text-xs sm:text-sm group-hover:text-indigo-500">{{ post().comments_count }}</span>
            </button>

            <button class="group flex items-center gap-1 sm:gap-2 hover:text-green-500 transition-colors hidden sm:flex" title="Repost">
              <div class="p-1.5 sm:p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <app-icon name="repeat" [size]="18"></app-icon>
              </div>
              <span class="text-xs sm:text-sm group-hover:text-green-500">42</span>
            </button>

            <div (click)="$event.stopPropagation()">
              <app-reaction-picker 
                (reactionSelected)="handleReaction($event)"
                [triggerClass]="'group flex items-center gap-1 sm:gap-2 hover:text-pink-500 transition-colors'">
                <div class="p-1.5 sm:p-2 rounded-full group-hover:bg-pink-500/10 transition-colors relative flex items-center gap-1">
                  @if (currentReaction()) {
                    <span class="text-base sm:text-lg">{{ getReactionEmoji(currentReaction()) }}</span>
                  } @else {
                    <app-icon name="heart" [size]="18"></app-icon>
                  }
                </div>
                <span class="text-xs sm:text-sm group-hover:text-pink-500" [class]="getReactionColor(currentReaction())">
                  {{ likesCount() }}
                </span>
              </app-reaction-picker>
            </div>
            
            <button class="group flex items-center gap-1 sm:gap-2 hover:text-indigo-500 transition-colors hidden md:flex" title="Views">
               <div class="p-1.5 sm:p-2 rounded-full group-hover:bg-indigo-500/10 transition-colors">
                  <app-icon name="monitor" [size]="18"></app-icon>
               </div>
               <span class="text-xs sm:text-sm group-hover:text-indigo-500">{{ formatNumber(post().views_count) }}</span>
            </button>

            <button class="group flex items-center gap-1 sm:gap-2 hover:text-indigo-500 transition-colors" title="Share" (click)="share($event)">
              <div class="p-1.5 sm:p-2 rounded-full group-hover:bg-indigo-500/10 transition-colors relative">
                 @if (copied()) {
                    <app-icon name="check" [size]="18" class="text-green-500"></app-icon>
                 } @else {
                    <app-icon name="share" [size]="18"></app-icon>
                 }
              </div>
              @if (copied()) {
                <span class="text-xs sm:text-sm text-green-500 font-medium animate-in fade-in hidden sm:inline">Copied</span>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PostCardComponent {
  post = input.required<Post>();
  currentReaction = signal<ReactionType | null>(null);
  likesCount = signal(0);
  copied = signal(false);
  
  private router = inject(Router);

  menuItems: MenuItem[] = [
    { id: 'bookmark', label: 'Bookmark', icon: 'bookmark', show: true },
    { id: 'copy', label: 'Copy link', icon: 'link', show: true },
    { id: 'embed', label: 'Embed post', icon: 'code', show: true },
    { id: 'mute', label: 'Mute conversation', icon: 'volume-x', show: true },
    { id: 'report', label: 'Report post', icon: 'flag', danger: true, show: true },
  ];

  ngOnInit() {
    this.currentReaction.set(this.post().is_liked ? 'LIKE' : null);
    this.likesCount.set(this.post().likes_count);
  }

  getReactionEmoji(type: ReactionType | null): string {
    const reactions: Record<ReactionType, string> = {
      'LIKE': '👍',
      'LOVE': '❤️',
      'HAHA': '😂',
      'WOW': '😮',
      'SAD': '😢',
      'ANGRY': '😠'
    };
    return type ? reactions[type] : '';
  }

  getReactionColor(type: ReactionType | null): string {
    const colors: Record<ReactionType, string> = {
      'LIKE': 'text-blue-500',
      'LOVE': 'text-red-500',
      'HAHA': 'text-yellow-500',
      'WOW': 'text-yellow-500',
      'SAD': 'text-blue-400',
      'ANGRY': 'text-orange-500'
    };
    return type ? colors[type] : '';
  }

  navigateToDetail() {
    this.router.navigate(['/app/post', this.post().id]);
  }

  handleReaction(type: ReactionType) {
    const current = this.currentReaction();
    
    if (current === type) {
      // Remove reaction
      this.currentReaction.set(null);
      this.likesCount.update(v => Math.max(0, v - 1));
    } else if (current) {
      // Change reaction (count stays same)
      this.currentReaction.set(type);
    } else {
      // Add new reaction
      this.currentReaction.set(type);
      this.likesCount.update(v => v + 1);
    }
    
    // TODO: Call API to save reaction
    console.log('Reaction:', type);
  }

  handleMenuAction(action: string) {
    switch (action) {
      case 'bookmark':
        console.log('Bookmark post');
        break;
      case 'copy':
        this.share(new Event('click'));
        break;
      case 'embed':
        console.log('Embed post');
        break;
      case 'mute':
        console.log('Mute conversation');
        break;
      case 'report':
        if (confirm('Report this post?')) {
          console.log('Report post');
        }
        break;
    }
  }

  share(e: Event) {
    e.stopPropagation();
    const url = `${window.location.origin}/app/post/${this.post().id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }).catch(err => console.error('Failed to copy: ', err));
    }
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }
}


import { Component, inject, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { SocialService } from '../services/social.service';
import { PostCardComponent } from '../components/post-card.component';
import { StoryRailComponent } from '../components/story-rail.component';
import { RealtimeService } from '../services/realtime.service';
import { ScrollService } from '../services/scroll.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule, PostCardComponent, StoryRailComponent, RouterModule],
  template: `
    <div class="border-x border-slate-200 dark:border-white/10 min-h-screen">
      <!-- Header -->
      <div 
        [class]="'fixed top-0 left-0 right-0 md:sticky md:top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10 px-4 cursor-pointer transition-all duration-300 ' + (headerCollapsed() ? 'py-1.5 md:py-3' : 'py-3')" 
        [style.max-width]="'600px'"
        [style.margin]="'0 auto'"
        (click)="scrollToTop()">
        <div class="flex items-center justify-between">
          <h1 [class]="'font-bold text-slate-900 dark:text-white transition-all duration-300 ' + (headerCollapsed() ? 'text-base md:text-xl' : 'text-xl')">Home</h1>
          @if (realtimeService.isConnected()) {
            <div [class]="'flex items-center gap-2 text-xs text-green-500 transition-all duration-300 ' + (headerCollapsed() ? 'opacity-0 md:opacity-100' : 'opacity-100')">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          }
        </div>
      </div>

      <!-- Spacer for fixed header on mobile -->
      <div class="md:hidden" [style.height]="headerCollapsed() ? '40px' : '52px'"></div>

      <!-- New Posts Banner -->
      @if (newPostsCount() > 0) {
        <button 
          (click)="loadNewPosts()"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center justify-center gap-2">
          <app-icon name="arrow-up" [size]="16"></app-icon>
          {{ newPostsCount() }} new {{ newPostsCount() === 1 ? 'post' : 'posts' }}
        </button>
      }

      <!-- Stories -->
      <app-story-rail></app-story-rail>
      <div class="h-[1px] bg-slate-200 dark:bg-white/10"></div>

      <!-- Compose Box Trigger -->
      <div class="p-4 border-b border-slate-200 dark:border-white/10">
        <div class="flex gap-3">
           <div class="w-10 h-10 rounded-full overflow-hidden">
             <img [src]="socialService.currentUser().avatar" class="w-full h-full object-cover">
           </div>
           <div class="flex-1 cursor-pointer" routerLink="/app/compose">
             <div class="w-full bg-slate-100 dark:bg-slate-900/50 rounded-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-between">
                <span>What's happening?</span>
                <app-icon name="image" [size]="20" class="text-indigo-500"></app-icon>
             </div>
           </div>
        </div>
      </div>

      <!-- Feed -->
      <div>
        @for (post of posts(); track post.id) {
          <app-post-card [post]="post"></app-post-card>
        }
      </div>
    </div>
  `
})
export class FeedComponent implements OnInit, OnDestroy {
  socialService = inject(SocialService);
  realtimeService = inject(RealtimeService);
  scrollService = inject(ScrollService);
  
  posts = this.socialService.posts;
  newPostsCount = signal(0);
  pendingPosts: any[] = [];
  
  headerCollapsed = this.scrollService.headerCollapsed;

  @HostListener('window:scroll')
  onScroll() {
    this.scrollService.handleScroll();
  }

  ngOnInit() {
    // Subscribe to real-time feed updates
    this.realtimeService.subscribeToFeed((newPost) => {
      this.pendingPosts.unshift(newPost);
      this.newPostsCount.set(this.pendingPosts.length);
    });
  }

  ngOnDestroy() {
    this.realtimeService.unsubscribe('feed');
  }

  loadNewPosts() {
    // Add pending posts to the feed
    this.socialService.posts.update(posts => [...this.pendingPosts, ...posts]);
    this.pendingPosts = [];
    this.newPostsCount.set(0);
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.scrollService.reset();
  }
}

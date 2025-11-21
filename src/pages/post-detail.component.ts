
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { CommentSectionComponent } from '../components/comment-section.component';
import { SocialService, Post } from '../services/social.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, IconComponent, CommentSectionComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-white/10">
      
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10 px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4">
         <button (click)="goBack()" class="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 active:scale-95 transition-transform">
            <app-icon name="chevron-left" [size]="24"></app-icon>
         </button>
         <h1 class="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Post</h1>
      </div>

      @if (post(); as p) {
        <div class="pb-20">
           <!-- User Info -->
           <div class="p-3 sm:p-4 flex gap-2.5 sm:gap-3 items-center">
              <img [src]="p.user.avatar" class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0">
              <div class="flex-1 min-w-0">
                 <div class="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1 truncate">
                    <span class="truncate">{{ p.user.display_name }}</span>
                    @if (p.user.verify) { <app-icon name="verified" [size]="16" class="text-indigo-500 flex-shrink-0"></app-icon> }
                 </div>
                 <div class="text-slate-500 text-xs sm:text-sm truncate">@{{ p.user.username }}</div>
              </div>
              <button class="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-500 active:scale-95 transition-transform flex-shrink-0">
                 <app-icon name="more-horizontal" [size]="20"></app-icon>
              </button>
           </div>

           <!-- Text Content -->
           @if (p.post_text) {
              <div class="px-3 sm:px-4 mb-3 sm:mb-4 text-[15px] sm:text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed break-words">
                 {{ p.post_text }}
              </div>
           }

           <!-- Full Width Media List -->
           <div class="space-y-1 mb-3 sm:mb-4">
              @for (media of p.media; track media.url) {
                 <div class="w-full bg-slate-100 dark:bg-slate-900">
                    @if (media.type === 'IMAGE') {
                       <img [src]="media.url" class="w-full h-auto max-h-[60vh] sm:max-h-[70vh] object-contain mx-auto">
                    } @else {
                       <video [src]="media.url" controls class="w-full h-auto max-h-[60vh] sm:max-h-[70vh] mx-auto"></video>
                    }
                 </div>
              }
           </div>

           <!-- Metadata -->
           <div class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-white/10 text-slate-500 text-xs sm:text-sm flex flex-wrap items-center gap-x-1">
              <span class="hover:underline">{{ formatFullDate(p.created_at) }}</span>
              <span>·</span>
              <span class="text-slate-900 dark:text-white font-bold">{{ formatNumber(p.views_count) }}</span>
              <span>Views</span>
           </div>

           <!-- Stats -->
           <div class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-white/10 flex gap-4 sm:gap-6 text-xs sm:text-sm flex-wrap">
              <div class="flex gap-1 items-baseline">
                 <span class="font-bold text-slate-900 dark:text-white">{{ formatNumber(p.likes_count) }}</span>
                 <span class="text-slate-500">Likes</span>
              </div>
              <div class="flex gap-1 items-baseline">
                 <span class="font-bold text-slate-900 dark:text-white">42</span>
                 <span class="text-slate-500">Reposts</span>
              </div>
              <div class="flex gap-1 items-baseline">
                 <span class="font-bold text-slate-900 dark:text-white">12</span>
                 <span class="text-slate-500">Quotes</span>
              </div>
           </div>

           <!-- Action Bar -->
           <div class="px-1 sm:px-2 py-2 border-b border-slate-200 dark:border-white/10 flex justify-around text-slate-500">
              <button class="p-2.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-500 transition-colors active:scale-95 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center">
                 <app-icon name="message-circle" [size]="22"></app-icon>
              </button>
              <button class="p-2.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-green-500 transition-colors active:scale-95 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center">
                 <app-icon name="repeat" [size]="22"></app-icon>
              </button>
              <button class="p-2.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-pink-500 transition-colors active:scale-95 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" [class.text-pink-500]="p.is_liked">
                 <app-icon [name]="p.is_liked ? 'heart-filled' : 'heart'" [size]="22"></app-icon>
              </button>
              <button class="p-2.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-500 transition-colors active:scale-95 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center">
                 <app-icon name="share" [size]="22"></app-icon>
              </button>
           </div>

           <!-- Comments Section -->
           <app-comment-section [postId]="p.id"></app-comment-section>
        </div>
      } @else {
         <div class="p-6 sm:p-8 text-center text-slate-500">
            <p>Post not found.</p>
         </div>
      }
    </div>
  `
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  socialService = inject(SocialService);
  
  postId = signal<string | null>(null);
  post = computed(() => {
     const id = this.postId();
     if (!id) return null;
     return this.socialService.getPostById(id);
  });

  ngOnInit() {
     this.route.paramMap.subscribe(params => {
        this.postId.set(params.get('id'));
     });
  }

  goBack() {
     this.router.navigate(['/app/feed']);
  }

  formatFullDate(dateStr: string) {
     return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }
}

import { Component, input, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { CommentItemComponent } from './comment-item.component';
import { CommentService } from '../services/comment.service';
import { AuthService } from '../services/auth.service';
import { RealtimeService } from '../services/realtime.service';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CommentItemComponent],
  template: `
    <div class="border-t border-slate-200 dark:border-white/10">
      <!-- Comment Input -->
      <div class="p-3 sm:p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
        <div class="flex gap-2 sm:gap-3">
          <img [src]="authService.currentUser()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
               class="w-10 h-10 rounded-full object-cover flex-shrink-0">
          
          <div class="flex-1">
            <textarea 
              [(ngModel)]="commentText"
              class="w-full p-2 sm:p-3 text-xs sm:text-sm border border-slate-300 dark:border-white/20 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="3"
              placeholder="Write a comment..."
              (keydown.enter)="$event.ctrlKey && submitComment()"
            ></textarea>
            
            <!-- Media Toolbar -->
            <div class="flex items-center justify-between mt-2">
              <div class="flex gap-2">
                <button 
                  class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"
                  title="Add image">
                  <app-icon name="image" [size]="18"></app-icon>
                </button>
                <button 
                  class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"
                  title="Add GIF">
                  <app-icon name="file-image" [size]="18"></app-icon>
                </button>
                <button 
                  class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"
                  title="Record voice note">
                  <app-icon name="mic" [size]="18"></app-icon>
                </button>
              </div>
              
              <button 
                (click)="submitComment()"
                [disabled]="!commentText().trim() || isSubmitting()"
                class="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-full transition-colors">
                {{ isSubmitting() ? 'Posting...' : 'Comment' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sort Options -->
      <div class="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Comments ({{ comments().length }})
        </h3>
        
        <div class="flex gap-1 sm:gap-2">
          <button 
            (click)="sortBy.set('featured'); updateSortedComments()"
            [class.bg-indigo-100]="sortBy() === 'featured'"
            [class.dark:bg-indigo-900/30]="sortBy() === 'featured'"
            [class.text-indigo-600]="sortBy() === 'featured'"
            [class.dark:text-indigo-400]="sortBy() === 'featured'"
            class="px-3 py-1 text-xs font-medium rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            Featured
          </button>
          <button 
            (click)="sortBy.set('newest'); updateSortedComments()"
            [class.bg-indigo-100]="sortBy() === 'newest'"
            [class.dark:bg-indigo-900/30]="sortBy() === 'newest'"
            [class.text-indigo-600]="sortBy() === 'newest'"
            [class.dark:text-indigo-400]="sortBy() === 'newest'"
            class="px-3 py-1 text-xs font-medium rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            Newest
          </button>
          <button 
            (click)="sortBy.set('oldest'); updateSortedComments()"
            [class.bg-indigo-100]="sortBy() === 'oldest'"
            [class.dark:bg-indigo-900/30]="sortBy() === 'oldest'"
            [class.text-indigo-600]="sortBy() === 'oldest'"
            [class.dark:text-indigo-400]="sortBy() === 'oldest'"
            class="px-3 py-1 text-xs font-medium rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            Oldest
          </button>
        </div>
      </div>

      <!-- Comments List -->
      <div class="divide-y divide-slate-200 dark:divide-white/10">
        @if (commentService.loading()) {
          <div class="p-8 text-center">
            <div class="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-slate-500 mt-2">Loading comments...</p>
          </div>
        } @else if (sortedComments().length === 0) {
          <div class="p-8 text-center text-slate-500">
            <app-icon name="message-circle" [size]="48" class="mx-auto mb-2 opacity-30"></app-icon>
            <p class="font-medium">No comments yet</p>
            <p class="text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        } @else {
          <div class="px-4">
            @for (comment of sortedComments(); track comment.id) {
              <app-comment-item 
                [comment]="comment" 
                [postId]="postId()"
                (commentUpdated)="loadComments()"
              ></app-comment-item>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  postId = input.required<string>();

  commentService = inject(CommentService);
  authService = inject(AuthService);
  private realtimeService = inject(RealtimeService);

  commentText = signal('');
  isSubmitting = signal(false);
  sortBy = signal<'featured' | 'newest' | 'oldest'>('featured');
  
  comments = this.commentService.comments;

  sortedComments = signal<any[]>([]);

  ngOnInit() {
    this.loadComments();
    
    // Subscribe to real-time comment updates
    this.realtimeService.subscribeToComments(this.postId(), (payload) => {
      console.log('Comment update:', payload);
      this.loadComments();
    });
  }

  ngOnDestroy() {
    this.realtimeService.unsubscribe(`comments:${this.postId()}`);
  }

  async loadComments() {
    await this.commentService.fetchComments(this.postId());
    this.updateSortedComments();
  }

  updateSortedComments() {
    const comments = [...this.comments()];
    const sort = this.sortBy();
    
    switch (sort) {
      case 'newest':
        comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'featured':
      default:
        // Sort by likes, then by date
        comments.sort((a, b) => {
          if (b.likes_count !== a.likes_count) {
            return b.likes_count - a.likes_count;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
    }
    
    this.sortedComments.set(comments);
  }

  async submitComment() {
    if (!this.commentText().trim() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.commentService.createComment(this.postId(), this.commentText());
      this.commentText.set('');
      await this.loadComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

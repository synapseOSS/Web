import { Component, input, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { ReactionPickerComponent, ReactionType } from './reaction-picker.component';
import { ActionMenuComponent, MenuItem } from './action-menu.component';
import { TextFormatterComponent } from './text-formatter.component';
import { Comment, CommentService } from '../services/comment.service';
import { AuthService } from '../services/auth.service';
import { TextParserService } from '../services/text-parser.service';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ReactionPickerComponent, ActionMenuComponent, TextFormatterComponent],
  template: `
    <div class="flex gap-2 sm:gap-3 py-2 sm:py-3" [class.ml-8]="isReply()" [class.sm:ml-12]="isReply()">
      <!-- Avatar -->
      <img [src]="comment().user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
           class="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0">
      
      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
          <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
            {{ comment().user?.display_name || 'Unknown' }}
          </span>
          @if (comment().user?.verify) {
            <app-icon name="verified" [size]="12" class="text-indigo-500 sm:w-3.5 sm:h-3.5"></app-icon>
          }
          <span class="text-slate-500 text-[10px] sm:text-xs">
            @{{ comment().user?.username || 'unknown' }}
          </span>
          <span class="text-slate-500 text-[10px] sm:text-xs">·</span>
          <span class="text-slate-500 text-[10px] sm:text-xs">{{ formatDate(comment().created_at) }}</span>
          @if (comment().is_edited) {
            <span class="text-slate-400 text-[10px] sm:text-xs italic">(edited)</span>
          }
        </div>

        <!-- Content -->
        @if (!isEditing()) {
          <p class="text-slate-800 dark:text-slate-200 text-xs sm:text-sm mb-2 whitespace-pre-wrap">
            <app-text-formatter 
              [text]="comment().content"
              [segments]="parseText(comment().content)"
              (mentionClicked)="handleMentionClick($event)"
              (hashtagClicked)="handleHashtagClick($event)">
            </app-text-formatter>
          </p>
        } @else {
          <div class="mb-2">
            <textarea 
              [(ngModel)]="editText"
              class="w-full p-2 text-sm border border-slate-300 dark:border-white/20 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="3"
              placeholder="Edit your comment..."
            ></textarea>
            <div class="flex gap-2 mt-2">
              <button 
                (click)="saveEdit()"
                [disabled]="!editText.trim()"
                class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-full">
                Save
              </button>
              <button 
                (click)="cancelEdit()"
                class="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                Cancel
              </button>
            </div>
          </div>
        }

        <!-- Media -->
        @if (comment().media_url) {
          <div class="mb-2 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 max-w-sm">
            @if (comment().media_type === 'IMAGE' || comment().media_type === 'GIF') {
              <img [src]="comment().media_url" class="w-full h-auto">
            } @else if (comment().media_type === 'VIDEO') {
              <video [src]="comment().media_url" controls class="w-full h-auto"></video>
            } @else if (comment().media_type === 'VOICE') {
              <audio [src]="comment().media_url" controls class="w-full"></audio>
            }
          </div>
        }

        <!-- Reactions -->
        @if (comment().likes_count > 0) {
          <div class="flex items-center gap-1 mb-2">
            <div class="flex -space-x-1">
              @if (currentReaction()) {
                <div class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">
                  {{ getReactionEmoji(currentReaction()) }}
                </div>
              }
            </div>
            <span class="text-xs text-slate-500">{{ comment().likes_count }}</span>
          </div>
        }

        <!-- Actions -->
        <div class="flex items-center gap-4 text-slate-500 text-xs">
          <app-reaction-picker 
            (reactionSelected)="handleReaction($event)"
            [triggerClass]="'hover:text-pink-500 transition-colors font-medium ' + getReactionColor(currentReaction())">
            @if (currentReaction()) {
              <span class="flex items-center gap-1">
                <span>{{ getReactionEmoji(currentReaction()) }}</span>
                <span>{{ currentReaction() === 'LIKE' ? 'Like' : currentReaction() }}</span>
              </span>
            } @else {
              <span>Like</span>
            }
          </app-reaction-picker>
          
          <button 
            (click)="toggleReply()"
            class="hover:text-indigo-500 transition-colors font-medium">
            Reply
          </button>

          <app-action-menu 
            [items]="menuItems()"
            (itemSelected)="handleMenuAction($event)">
          </app-action-menu>
        </div>

        <!-- Reply Input -->
        @if (showReplyInput()) {
          <div class="mt-3 flex gap-2">
            <img [src]="authService.currentUser()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
                 class="w-8 h-8 rounded-full object-cover">
            <div class="flex-1">
              <textarea 
                [(ngModel)]="replyText"
                class="w-full p-2 text-sm border border-slate-300 dark:border-white/20 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="2"
                placeholder="Write a reply..."
                (keydown.enter)="$event.ctrlKey && submitReply()"
              ></textarea>
              <div class="flex gap-2 mt-2">
                <button 
                  (click)="submitReply()"
                  [disabled]="!replyText.trim() || isSubmitting()"
                  class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-full">
                  {{ isSubmitting() ? 'Posting...' : 'Reply' }}
                </button>
                <button 
                  (click)="cancelReply()"
                  class="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Replies -->
        @if (comment().replies && comment().replies!.length > 0) {
          <div class="mt-3 space-y-3">
            @for (reply of comment().replies; track reply.id) {
              <app-comment-item 
                [comment]="reply" 
                [postId]="postId()"
                [isReply]="true"
                (commentUpdated)="onReplyUpdated()"
              ></app-comment-item>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CommentItemComponent {
  comment = input.required<Comment>();
  postId = input.required<string>();
  isReply = input<boolean>(false);
  commentUpdated = output<void>();

  private commentService = inject(CommentService);
  authService = inject(AuthService);
  private textParser = inject(TextParserService);

  showReplyInput = signal(false);
  replyText = signal('');
  isSubmitting = signal(false);
  isEditing = signal(false);
  editText = signal('');
  currentReaction = signal<ReactionType | null>(null);

  menuItems = signal<MenuItem[]>([]);

  ngOnInit() {
    this.currentReaction.set(this.comment().is_liked ? 'LIKE' : null);
    this.updateMenuItems();
  }

  updateMenuItems() {
    const isOwner = this.isOwner();
    this.menuItems.set([
      { id: 'copy', label: 'Copy link', icon: 'link', show: true },
      { id: 'edit', label: 'Edit comment', icon: 'edit', show: isOwner },
      { id: 'delete', label: 'Delete comment', icon: 'trash', danger: true, show: isOwner },
      { id: 'report', label: 'Report comment', icon: 'flag', danger: true, show: !isOwner },
    ]);
  }

  isOwner() {
    return this.authService.currentUser()?.id === this.comment().user_id;
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

  toggleReply() {
    this.showReplyInput.update(v => !v);
    if (!this.showReplyInput()) {
      this.replyText.set('');
    }
  }

  async submitReply() {
    if (!this.replyText().trim() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.commentService.createComment(
        this.postId(),
        this.replyText(),
        this.comment().id
      );
      this.replyText.set('');
      this.showReplyInput.set(false);
      this.commentUpdated.emit();
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancelReply() {
    this.showReplyInput.set(false);
    this.replyText.set('');
  }

  async handleReaction(type: ReactionType) {
    const current = this.currentReaction();
    const commentId = this.comment().id;
    const userId = this.authService.currentUser()?.id;
    
    if (!userId) return;

    try {
      if (current === type) {
        // Remove reaction
        await this.commentService.removeCommentReaction(commentId, userId);
        this.currentReaction.set(null);
      } else if (current) {
        // Change reaction
        await this.commentService.updateCommentReaction(commentId, userId, type);
        this.currentReaction.set(type);
      } else {
        // Add new reaction
        await this.commentService.addCommentReaction(commentId, userId, type);
        this.currentReaction.set(type);
      }
      
      this.commentUpdated.emit();
    } catch (err) {
      console.error('Error saving comment reaction:', err);
    }
  }

  handleMenuAction(action: string) {
    switch (action) {
      case 'copy':
        const url = `${window.location.origin}/app/post/${this.postId()}#comment-${this.comment().id}`;
        navigator.clipboard.writeText(url);
        break;
      case 'edit':
        this.startEdit();
        break;
      case 'delete':
        this.deleteComment();
        break;
      case 'report':
        if (confirm('Report this comment?')) {
          console.log('Report comment');
        }
        break;
    }
  }

  startEdit() {
    this.isEditing.set(true);
    this.editText.set(this.comment().content);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editText.set('');
  }

  async saveEdit() {
    if (!this.editText().trim()) return;

    try {
      await this.commentService.editComment(this.comment().id, this.editText());
      this.isEditing.set(false);
      this.commentUpdated.emit();
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  }

  async deleteComment() {
    if (!confirm('Delete this comment?')) return;

    try {
      await this.commentService.deleteComment(this.comment().id);
      this.commentUpdated.emit();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  }

  onReplyUpdated() {
    this.commentUpdated.emit();
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  parseText(text: string) {
    return this.textParser.parseText(text);
  }

  handleMentionClick(username: string) {
    console.log('Mention clicked:', username);
  }

  handleHashtagClick(tag: string) {
    console.log('Hashtag clicked:', tag);
  }
}

import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-reaction-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block">
      <!-- Trigger Button -->
      <button
        (click)="togglePicker(); $event.stopPropagation()"
        (mouseenter)="showPickerDesktop()"
        class="group relative"
        [class]="triggerClass()">
        <ng-content></ng-content>
      </button>

      <!-- Reaction Picker Popup -->
      @if (isOpen()) {
        <div 
          (mouseleave)="hidePickerDesktop()"
          (click)="$event.stopPropagation()"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-slate-900 rounded-full shadow-2xl border border-slate-200 dark:border-white/10 px-1.5 sm:px-2 py-1.5 sm:py-2 flex gap-0.5 sm:gap-1 animate-in zoom-in-95 duration-200 z-50">
          @for (reaction of reactions; track reaction.type) {
            <button
              (click)="selectReaction(reaction.type); $event.stopPropagation()"
              class="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:scale-125 active:scale-110 transition-transform duration-200 flex items-center justify-center text-xl sm:text-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
              [title]="reaction.label">
              {{ reaction.emoji }}
            </button>
          }
          
          <!-- Arrow -->
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-white/10 rotate-45"></div>
        </div>
      }
    </div>
  `
})
export class ReactionPickerComponent {
  triggerClass = input<string>('');
  reactionSelected = output<ReactionType>();
  
  isOpen = signal(false);
  
  reactions: Reaction[] = [
    { type: 'LIKE', emoji: '👍', label: 'Like', color: 'text-blue-500' },
    { type: 'LOVE', emoji: '❤️', label: 'Love', color: 'text-red-500' },
    { type: 'HAHA', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
    { type: 'WOW', emoji: '😮', label: 'Wow', color: 'text-yellow-500' },
    { type: 'SAD', emoji: '😢', label: 'Sad', color: 'text-blue-400' },
    { type: 'ANGRY', emoji: '😠', label: 'Angry', color: 'text-orange-500' }
  ];

  showPickerDesktop() {
    // Only show on hover for desktop (non-touch devices)
    if (!('ontouchstart' in window)) {
      this.isOpen.set(true);
    }
  }

  hidePickerDesktop() {
    // Only hide on mouse leave for desktop
    if (!('ontouchstart' in window)) {
      setTimeout(() => this.isOpen.set(false), 200);
    }
  }

  togglePicker() {
    this.isOpen.update(v => !v);
  }

  selectReaction(type: ReactionType) {
    this.reactionSelected.emit(type);
    this.isOpen.set(false);
  }

  getReactionEmoji(type: ReactionType): string {
    return this.reactions.find(r => r.type === type)?.emoji || '👍';
  }

  getReactionColor(type: ReactionType): string {
    return this.reactions.find(r => r.type === type)?.color || 'text-blue-500';
  }
}

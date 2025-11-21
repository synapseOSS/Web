import { Component, input, output, signal, computed, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextParserService } from '../services/text-parser.service';
import { MentionService } from '../services/mention.service';
import { HashtagService } from '../services/hashtag.service';

interface Suggestion {
  type: 'mention' | 'hashtag';
  value: string;
  display: string;
  avatar?: string;
}

@Component({
  selector: 'app-mention-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <textarea
        #textArea
        [(ngModel)]="text"
        (ngModelChange)="onTextChange($event)"
        (keydown)="onKeyDown($event)"
        [placeholder]="placeholder()"
        [rows]="rows()"
        class="w-full p-3 text-[15px] border border-slate-300 dark:border-white/20 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      ></textarea>

      <!-- Suggestions Dropdown -->
      @if (showSuggestions() && suggestions().length > 0) {
        <div class="absolute z-50 mt-1 w-full max-w-xs bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-white/10 max-h-60 overflow-y-auto">
          @for (suggestion of suggestions(); track $index) {
            <button
              (click)="selectSuggestion(suggestion)"
              [class.bg-indigo-50]="selectedIndex() === $index"
              [class.dark:bg-indigo-900/20]="selectedIndex() === $index"
              class="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
              @if (suggestion.type === 'mention' && suggestion.avatar) {
                <img [src]="suggestion.avatar" class="w-8 h-8 rounded-full object-cover">
              } @else if (suggestion.type === 'hashtag') {
                <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span class="text-indigo-600 dark:text-indigo-400 font-bold">#</span>
                </div>
              }
              <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-900 dark:text-white truncate">
                  {{ suggestion.display }}
                </div>
                @if (suggestion.type === 'mention') {
                  <div class="text-xs text-slate-500 truncate">@{{ suggestion.value }}</div>
                }
              </div>
            </button>
          }
        </div>
      }

      <!-- Character Count -->
      @if (showCharCount()) {
        <div class="absolute bottom-2 right-2 text-xs" 
             [class.text-slate-400]="text().length <= maxLength()"
             [class.text-red-500]="text().length > maxLength()">
          {{ text().length }} / {{ maxLength() }}
        </div>
      }
    </div>
  `
})
export class MentionInputComponent implements AfterViewInit {
  @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;

  placeholder = input<string>('What\'s happening?');
  rows = input<number>(4);
  maxLength = input<number>(500);
  showCharCount = input<boolean>(true);
  initialValue = input<string>('');
  
  textChanged = output<string>();
  mentionAdded = output<string>();
  hashtagAdded = output<string>();

  private textParser = inject(TextParserService);
  private mentionService = inject(MentionService);
  private hashtagService = inject(HashtagService);

  text = signal('');
  showSuggestions = signal(false);
  selectedIndex = signal(0);
  currentQuery = signal('');
  currentType = signal<'mention' | 'hashtag' | null>(null);
  
  private userSuggestions = signal<any[]>([]);
  private hashtagSuggestions = signal<any[]>([]);

  suggestions = computed(() => {
    const type = this.currentType();
    
    if (type === 'mention') {
      return this.userSuggestions().map(u => ({
        type: 'mention' as const,
        value: u.username,
        display: u.display_name,
        avatar: u.avatar
      }));
    } else if (type === 'hashtag') {
      return this.hashtagSuggestions().map(h => ({
        type: 'hashtag' as const,
        value: h.tag,
        display: `#${h.tag}`
      }));
    }
    
    return [];
  });

  ngAfterViewInit() {
    if (this.initialValue()) {
      this.text.set(this.initialValue());
    }
  }

  onTextChange(value: string) {
    this.text.set(value);
    this.textChanged.emit(value);
    this.checkForMentionOrHashtag();
  }

  async checkForMentionOrHashtag() {
    const textarea = this.textArea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = this.text().substring(0, cursorPos);
    
    // Check for @ mention
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      this.currentType.set('mention');
      this.currentQuery.set(mentionMatch[1]);
      this.showSuggestions.set(true);
      this.selectedIndex.set(0);
      
      // Fetch user suggestions
      const users = await this.mentionService.searchUsers(mentionMatch[1]);
      this.userSuggestions.set(users);
      return;
    }

    // Check for # hashtag
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    if (hashtagMatch) {
      this.currentType.set('hashtag');
      this.currentQuery.set(hashtagMatch[1]);
      this.showSuggestions.set(true);
      this.selectedIndex.set(0);
      
      // Fetch hashtag suggestions
      const hashtags = await this.hashtagService.searchHashtags(hashtagMatch[1]);
      this.hashtagSuggestions.set(hashtags);
      return;
    }

    // No match found
    this.showSuggestions.set(false);
    this.currentType.set(null);
    this.currentQuery.set('');
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showSuggestions()) return;

    const suggestionsCount = this.suggestions().length;
    if (suggestionsCount === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => (i + 1) % suggestionsCount);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => (i - 1 + suggestionsCount) % suggestionsCount);
        break;
      case 'Enter':
      case 'Tab':
        if (this.showSuggestions()) {
          event.preventDefault();
          const selected = this.suggestions()[this.selectedIndex()];
          if (selected) {
            this.selectSuggestion(selected);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showSuggestions.set(false);
        break;
    }
  }

  selectSuggestion(suggestion: Suggestion) {
    const textarea = this.textArea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = this.text().substring(0, cursorPos);
    const textAfterCursor = this.text().substring(cursorPos);

    // Find the start of the mention/hashtag
    const pattern = suggestion.type === 'mention' ? /@\w*$/ : /#\w*$/;
    const match = textBeforeCursor.match(pattern);
    
    if (match) {
      const startPos = cursorPos - match[0].length;
      const replacement = suggestion.type === 'mention' 
        ? `@${suggestion.value} `
        : `#${suggestion.value} `;
      
      const newText = this.text().substring(0, startPos) + replacement + textAfterCursor;
      this.text.set(newText);
      this.textChanged.emit(newText);

      // Emit specific events
      if (suggestion.type === 'mention') {
        this.mentionAdded.emit(suggestion.value);
      } else {
        this.hashtagAdded.emit(suggestion.value);
      }

      // Set cursor position after the inserted text
      setTimeout(() => {
        const newCursorPos = startPos + replacement.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }

    this.showSuggestions.set(false);
    this.currentType.set(null);
    this.currentQuery.set('');
  }

  focus() {
    this.textArea.nativeElement.focus();
  }

  getValue(): string {
    return this.text();
  }

  setValue(value: string) {
    this.text.set(value);
  }

  clear() {
    this.text.set('');
    this.textChanged.emit('');
  }
}

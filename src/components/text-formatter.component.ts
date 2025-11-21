import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface TextSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url';
  content: string;
  value?: string; // For mentions (username) and hashtags (tag)
}

@Component({
  selector: 'app-text-formatter',
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (segment of segments(); track $index) {
      @if (segment.type === 'mention') {
        <span 
          (click)="handleMentionClick($event, segment.value!)"
          class="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium">
          {{ segment.content }}
        </span>
      } @else if (segment.type === 'hashtag') {
        <span 
          (click)="handleHashtagClick($event, segment.value!)"
          class="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium">
          {{ segment.content }}
        </span>
      } @else if (segment.type === 'url') {
        <a 
          [href]="segment.value!"
          target="_blank"
          rel="noopener noreferrer"
          (click)="$event.stopPropagation()"
          class="text-indigo-600 dark:text-indigo-400 hover:underline">
          {{ segment.content }}
        </a>
      } @else {
        <span>{{ segment.content }}</span>
      }
    }
  `
})
export class TextFormatterComponent {
  text = input.required<string>();
  mentionClicked = output<string>();
  hashtagClicked = output<string>();

  segments = input.required<TextSegment[]>();

  constructor(private router: Router) {}

  handleMentionClick(event: Event, username: string) {
    event.stopPropagation();
    this.mentionClicked.emit(username);
    // Navigate to user profile
    this.router.navigate(['/app/profile', username]);
  }

  handleHashtagClick(event: Event, tag: string) {
    event.stopPropagation();
    this.hashtagClicked.emit(tag);
    // Navigate to hashtag search/explore
    this.router.navigate(['/app/explore'], { queryParams: { q: `#${tag}` } });
  }
}

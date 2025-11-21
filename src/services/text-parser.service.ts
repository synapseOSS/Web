import { Injectable } from '@angular/core';

export interface TextSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url';
  content: string;
  value?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  
  parseText(text: string): TextSegment[] {
    if (!text) return [];

    const segments: TextSegment[] = [];
    
    // Combined regex to match mentions, hashtags, and URLs
    const pattern = /(@\w+)|(#\w+)|(https?:\/\/[^\s]+)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      // Add the matched segment
      if (match[1]) {
        // Mention (@username)
        segments.push({
          type: 'mention',
          content: match[1],
          value: match[1].substring(1) // Remove @ symbol
        });
      } else if (match[2]) {
        // Hashtag (#tag)
        segments.push({
          type: 'hashtag',
          content: match[2],
          value: match[2].substring(1) // Remove # symbol
        });
      } else if (match[3]) {
        // URL
        segments.push({
          type: 'url',
          content: match[3],
          value: match[3]
        });
      }

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return segments;
  }

  extractMentions(text: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  extractHashtags(text: string): string[] {
    const hashtagPattern = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;

    while ((match = hashtagPattern.exec(text)) !== null) {
      hashtags.push(match[1]);
    }

    return hashtags;
  }

  highlightText(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
  }
}

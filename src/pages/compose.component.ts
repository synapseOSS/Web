
import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { MentionInputComponent } from '../components/mention-input.component';
import { SocialService, Post, MediaItem } from '../services/social.service';
import { TextParserService } from '../services/text-parser.service';
import { MentionService } from '../services/mention.service';
import { HashtagService } from '../services/hashtag.service';

@Component({
  selector: 'app-compose',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, MentionInputComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-white/10 pb-20">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
           <button (click)="cancel()" class="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400">
              <app-icon name="x" [size]="24"></app-icon>
           </button>
           <h1 class="font-bold text-lg text-slate-900 dark:text-white">Create Post</h1>
        </div>
        <button 
          (click)="submit()" 
          [disabled]="(!text && mediaItems().length === 0) || isPosting()"
          class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/20">
          {{ isPosting() ? 'Posting...' : 'Post' }}
        </button>
      </div>

      <div class="p-4">
         <div class="flex gap-4 mb-4">
            <img [src]="socialService.currentUser().avatar" class="w-12 h-12 rounded-full object-cover">
            <div class="flex-1">
               <app-mention-input
                 #mentionInput
                 [placeholder]="'What\\'s on your mind?'"
                 [rows]="6"
                 [showCharCount]="true"
                 [maxLength]="500"
                 (textChanged)="onTextChanged($event)"
                 (mentionAdded)="onMentionAdded($event)"
                 (hashtagAdded)="onHashtagAdded($event)">
               </app-mention-input>
            </div>
         </div>

         <!-- Media Preview Grid -->
         @if (mediaItems().length > 0) {
            <div class="grid grid-cols-2 gap-2 mb-6">
               @for (item of mediaItems(); track item.url; let i = $index) {
                  <div class="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                     <img [src]="item.url" class="w-full h-full object-cover">
                     <button 
                       (click)="removeMedia(i)" 
                       class="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors">
                        <app-icon name="trash" [size]="16"></app-icon>
                     </button>
                     @if (item.type === 'VIDEO') {
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div class="p-3 bg-black/50 rounded-full text-white">
                              <app-icon name="video" [size]="24"></app-icon>
                           </div>
                        </div>
                     }
                  </div>
               }
            </div>
         }

         <!-- Media Selector Area -->
         <div class="border-t border-slate-200 dark:border-white/10 pt-6">
            <div class="flex gap-4 overflow-x-auto pb-4">
               <label class="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors text-slate-500 hover:text-indigo-500">
                  <input type="file" multiple accept="image/*,video/*" class="hidden" (change)="onFileSelected($event)">
                  <app-icon name="image-plus" [size]="24"></app-icon>
                  <span class="text-xs font-bold">Add Media</span>
               </label>
               
               <button class="flex-shrink-0 w-24 h-24 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-500">
                  <app-icon name="map-pin" [size]="24"></app-icon>
                  <span class="text-xs font-medium">Location</span>
               </button>
               
               <button class="flex-shrink-0 w-24 h-24 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-500">
                  <app-icon name="hash" [size]="24"></app-icon>
                  <span class="text-xs font-medium">Poll</span>
               </button>
            </div>
            
            <p class="text-sm text-slate-500 mt-4">
               <span class="font-bold text-indigo-500">Tip:</span> You can select multiple photos and videos at once. They will be displayed in a smart grid layout on your feed.
            </p>
         </div>
      </div>
    </div>
  `
})
export class ComposeComponent {
  @ViewChild('mentionInput') mentionInput!: MentionInputComponent;

  socialService = inject(SocialService);
  router = inject(Router);
  private textParser = inject(TextParserService);
  private mentionService = inject(MentionService);
  private hashtagService = inject(HashtagService);
  
  text = '';
  mediaItems = signal<MediaItem[]>([]);
  isPosting = signal(false);
  mentions = signal<string[]>([]);
  hashtags = signal<string[]>([]);

  cancel() {
    this.router.navigate(['/app/feed']);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Determine type
        const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
        // Create mock URL
        // In a real app, this would upload to cloud storage and get a URL
        // Here we fake it with a picsum or placeholder for demonstration, 
        // but normally we'd use URL.createObjectURL(file) for local preview.
        // To keep it looking consistent with the rest of the app (and avoid massive base64 strings),
        // I'll generate random picsum IDs for demo purposes if it's an image.
        
        const mockUrl = type === 'IMAGE' 
          ? `https://picsum.photos/seed/${Math.random()}/800/800` 
          : 'https://www.w3schools.com/html/mov_bbb.mp4'; // Sample video

        this.mediaItems.update(items => [...items, { type, url: mockUrl }]);
      });
    }
  }

  removeMedia(index: number) {
    this.mediaItems.update(items => items.filter((_, i) => i !== index));
  }

  onTextChanged(text: string) {
    this.text = text;
    // Extract mentions and hashtags
    this.mentions.set(this.textParser.extractMentions(text));
    this.hashtags.set(this.textParser.extractHashtags(text));
  }

  onMentionAdded(username: string) {
    console.log('Mention added:', username);
  }

  onHashtagAdded(tag: string) {
    console.log('Hashtag added:', tag);
  }

  async submit() {
    this.isPosting.set(true);
    
    try {
      const newPost: Post = {
        id: Math.random().toString(36).substring(7),
        author_uid: this.socialService.currentUser().id,
        user: this.socialService.currentUser(),
        post_text: this.text,
        media: this.mediaItems(),
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: new Date().toISOString(),
        post_type: this.mediaItems().length > 0 ? (this.mediaItems()[0].type === 'VIDEO' ? 'VIDEO' : 'IMAGE') : 'TEXT'
      };

      this.socialService.addPost(newPost);

      // Save mentions and hashtags to database
      if (this.mentions().length > 0) {
        await this.mentionService.createMentions(this.mentions(), newPost.id, 'post');
      }

      if (this.hashtags().length > 0) {
        await this.hashtagService.createHashtags(this.hashtags(), newPost.id, 'post');
      }

      this.isPosting.set(false);
      this.router.navigate(['/app/feed']);
    } catch (err) {
      console.error('Error creating post:', err);
      this.isPosting.set(false);
    }
  }
}


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
import { SupabaseService } from '../services/supabase.service';
import { ImageUploadService } from '../services/image-upload.service';

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  question: string;
  options: PollOption[];
  duration_hours: number;
}

interface Location {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
}

interface Collaborator {
  uid: string;
  username: string;
  display_name: string;
  avatar: string;
}

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

      <div class="p-4 max-w-2xl mx-auto">
         <div class="flex gap-4 mb-4">
            <!-- Avatar with Upload Progress Ring -->
            <div class="relative flex-shrink-0">
               @if (isUploading()) {
                 <!-- Gradient Progress Ring -->
                 <svg class="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                   <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="3" class="text-slate-200 dark:text-slate-800" />
                   <circle 
                     cx="24" cy="24" r="22" 
                     fill="none" 
                     stroke="url(#gradient)" 
                     stroke-width="3" 
                     stroke-linecap="round"
                     [attr.stroke-dasharray]="138.23"
                     [attr.stroke-dashoffset]="138.23 - (138.23 * uploadProgress() / 100)"
                     class="transition-all duration-300" />
                   <defs>
                     <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                       <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                       <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
                       <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
                     </linearGradient>
                   </defs>
                 </svg>
               }
               <img [src]="socialService.currentUser().avatar" class="w-12 h-12 rounded-full object-cover">
            </div>
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

         <!-- Upload Progress -->
         @if (isUploading()) {
            <div class="mb-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
               <div class="flex items-center gap-3 mb-2">
                  <div class="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                  <span class="text-sm font-medium text-indigo-900 dark:text-indigo-100">Uploading media...</span>
               </div>
               <div class="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" [style.width.%]="uploadProgress()"></div>
               </div>
            </div>
         }

         <!-- Media Preview Grid -->
         @if (mediaItems().length > 0) {
            <div class="mb-6">
               <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-300">
                     Media ({{ mediaItems().length }}/{{ MAX_MEDIA }})
                  </span>
                  <button (click)="mediaItems.set([])" class="text-sm text-red-500 hover:text-red-600 font-medium">
                     Remove all
                  </button>
               </div>
               <div [class]="mediaItems().length === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2'">
                  @for (item of mediaItems(); track item.url; let i = $index) {
                     <div class="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                        @if (item.type === 'IMAGE') {
                           <img [src]="item.url" class="w-full h-full object-cover">
                        } @else {
                           <video [src]="item.url" class="w-full h-full object-cover" controls></video>
                        }
                        <button 
                          (click)="removeMedia(i)" 
                          class="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                           <app-icon name="x" [size]="16"></app-icon>
                        </button>
                        @if (item.type === 'VIDEO') {
                           <div class="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded backdrop-blur-sm">
                              VIDEO
                           </div>
                        }
                        <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded backdrop-blur-sm">
                           {{ i + 1 }}
                        </div>
                     </div>
                  }
               </div>
            </div>
         }

         <!-- Poll Preview -->
         @if (poll()) {
            <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
               <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                     <app-icon name="bar-chart" [size]="20" class="text-indigo-500"></app-icon>
                     <span class="font-bold text-slate-900 dark:text-white">Poll</span>
                  </div>
                  <button (click)="removePoll()" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                     <app-icon name="x" [size]="16" class="text-slate-500"></app-icon>
                  </button>
               </div>
               <p class="font-semibold text-slate-900 dark:text-white mb-3">{{ poll()!.question }}</p>
               <div class="space-y-2">
                  @for (option of poll()!.options; track option.id) {
                     <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/10">
                        {{ option.text }}
                     </div>
                  }
               </div>
               <p class="text-xs text-slate-500 mt-3">Poll duration: {{ poll()!.duration_hours }} hours</p>
            </div>
         }

         <!-- Poll Creator Modal -->
         @if (showPollCreator()) {
            <div class="mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-indigo-500 shadow-lg">
               <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-lg text-slate-900 dark:text-white">Create Poll</h3>
                  <button (click)="togglePollCreator()" class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                     <app-icon name="x" [size]="20"></app-icon>
                  </button>
               </div>

               <div class="space-y-4">
                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Question</label>
                     <input 
                        [(ngModel)]="pollQuestion"
                        type="text" 
                        placeholder="Ask a question..."
                        maxlength="200"
                        class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Options</label>
                     <div class="space-y-2">
                        @for (option of pollOptions(); track $index; let i = $index) {
                           <div class="flex gap-2">
                              <input 
                                 [value]="option"
                                 (input)="updatePollOption(i, $any($event.target).value)"
                                 type="text" 
                                 [placeholder]="'Option ' + (i + 1)"
                                 maxlength="100"
                                 class="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
                              @if (pollOptions().length > 2) {
                                 <button 
                                    (click)="removePollOption(i)"
                                    class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg">
                                    <app-icon name="trash" [size]="18"></app-icon>
                                 </button>
                              }
                           </div>
                        }
                     </div>
                     @if (pollOptions().length < MAX_POLL_OPTIONS) {
                        <button 
                           (click)="addPollOption()"
                           class="mt-2 text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                           <app-icon name="plus" [size]="16"></app-icon>
                           Add option
                        </button>
                     }
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                     <select 
                        [(ngModel)]="pollDuration"
                        class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
                        <option [value]="1">1 hour</option>
                        <option [value]="6">6 hours</option>
                        <option [value]="12">12 hours</option>
                        <option [value]="24">1 day</option>
                        <option [value]="72">3 days</option>
                        <option [value]="168">1 week</option>
                     </select>
                  </div>

                  <button 
                     (click)="createPoll()"
                     class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
                     Create Poll
                  </button>
               </div>
            </div>
         }

         <!-- Collaborators Preview -->
         @if (collaborators().length > 0) {
            <div class="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
               <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Collaborators</span>
                  <button (click)="collaborators.set([])" class="text-xs text-red-500 hover:text-red-600">Remove all</button>
               </div>
               <div class="flex flex-wrap gap-2">
                  @for (collab of collaborators(); track collab.uid) {
                     <div class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/10">
                        <img [src]="collab.avatar" class="w-5 h-5 rounded-full">
                        <span class="text-sm font-medium text-slate-900 dark:text-white">{{ collab.display_name }}</span>
                        <button (click)="removeCollaborator(collab.uid)" class="text-slate-400 hover:text-red-500">
                           <app-icon name="x" [size]="14"></app-icon>
                        </button>
                     </div>
                  }
               </div>
            </div>
         }

         <!-- Location Preview -->
         @if (location()) {
            <div class="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
               <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                     <app-icon name="map-pin" [size]="18" class="text-indigo-500"></app-icon>
                     <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white">{{ location()!.name }}</div>
                        @if (location()!.address) {
                           <div class="text-xs text-slate-500">{{ location()!.address }}</div>
                        }
                     </div>
                  </div>
                  <button (click)="location.set(null)" class="text-slate-400 hover:text-red-500">
                     <app-icon name="x" [size]="18"></app-icon>
                  </button>
               </div>
            </div>
         }

         <!-- Action Buttons -->
         <div class="border-t border-slate-200 dark:border-white/10 pt-4">
            <div class="flex items-center gap-2 flex-wrap">
               <label [class.opacity-50]="poll() || isUploading()" [class.pointer-events-none]="poll() || isUploading()" class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-600 dark:text-slate-400">
                  <input type="file" multiple accept="image/*,video/*" class="hidden" (change)="onFileSelected($event)" [disabled]="poll() || isUploading()">
                  <app-icon name="image" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Photo/Video</span>
                  @if (mediaItems().length > 0) {
                     <span class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-full">
                        {{ mediaItems().length }}
                     </span>
                  }
               </label>
               
               <button 
                  (click)="togglePollCreator()"
                  [disabled]="mediaItems().length > 0 || isUploading()"
                  [class.opacity-50]="mediaItems().length > 0 || isUploading()"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400 disabled:cursor-not-allowed">
                  <app-icon name="bar-chart" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Poll</span>
                  @if (poll()) {
                     <span class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-full">
                        ✓
                     </span>
                  }
               </button>

               <button 
                  (click)="showLocationPicker.set(true)"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400">
                  <app-icon name="map-pin" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Location</span>
                  @if (location()) {
                     <span class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-full">
                        ✓
                     </span>
                  }
               </button>

               <button 
                  (click)="showCollaboratorPicker.set(true)"
                  [disabled]="collaborators().length >= MAX_COLLABORATORS"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed">
                  <app-icon name="users" [size]="20"></app-icon>
                  <span class="text-sm font-medium">Tag People</span>
                  @if (collaborators().length > 0) {
                     <span class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-full">
                        {{ collaborators().length }}
                     </span>
                  }
               </button>

               <button 
                  (click)="showPrivacyPicker.set(true)"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400">
                  @switch (postVisibility()) {
                     @case ('public') {
                        <app-icon name="globe" [size]="20"></app-icon>
                     }
                     @case ('followers') {
                        <app-icon name="users" [size]="20"></app-icon>
                     }
                     @case ('private') {
                        <app-icon name="lock" [size]="20"></app-icon>
                     }
                  }
                  <span class="text-sm font-medium capitalize">{{ postVisibility() }}</span>
               </button>
            </div>
            
            <p class="text-xs text-slate-500 mt-3">
               <span class="font-bold text-indigo-500">💡 Tip:</span> 
               @if (poll()) {
                  Polls cannot include media. Remove the poll to add photos/videos.
               } @else if (mediaItems().length > 0) {
                  You can upload up to {{ MAX_MEDIA }} photos/videos. Max 10MB per image, 50MB per video.
               } @else {
                  Add photos, videos, or create a poll to engage your audience!
               }
            </p>
         </div>
      </div>

      <!-- Location Picker Modal -->
      @if (showLocationPicker()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showLocationPicker.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-white/10">
               <div class="flex items-center justify-between mb-3">
                  <h3 class="font-bold text-lg text-slate-900 dark:text-white">Add Location</h3>
                  <button (click)="showLocationPicker.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                     <app-icon name="x" [size]="24"></app-icon>
                  </button>
               </div>
               <div class="relative">
                  <app-icon name="search" [size]="18" class="absolute left-3 top-3 text-slate-400"></app-icon>
                  <input 
                     [(ngModel)]="locationSearch"
                     (input)="searchLocations()"
                     type="text" 
                     placeholder="Search for a location..."
                     class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
               </div>
            </div>
            <div class="max-h-96 overflow-y-auto p-2">
               @if (locationSearch) {
                 @for (loc of searchResults(); track $index) {
                    <div 
                      (click)="selectLocation(loc)"
                      class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                       <div class="flex items-start gap-3">
                          <app-icon name="map-pin" [size]="20" class="text-indigo-500 mt-0.5"></app-icon>
                          <div class="flex-1 min-w-0">
                             <div class="font-medium text-slate-900 dark:text-white">{{ loc.name }}</div>
                             @if (loc.address) {
                                <div class="text-sm text-slate-500 truncate">{{ loc.address }}</div>
                             }
                          </div>
                       </div>
                    </div>
                 }
               } @else {
                 <div class="p-8 text-center text-slate-500">
                    <app-icon name="map-pin" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                    <p>Search for a location to add to your post</p>
                 </div>
               }
            </div>
          </div>
        </div>
      }

      <!-- Collaborator Picker Modal -->
      @if (showCollaboratorPicker()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showCollaboratorPicker.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-white/10">
               <div class="flex items-center justify-between mb-3">
                  <h3 class="font-bold text-lg text-slate-900 dark:text-white">Tag People</h3>
                  <button (click)="showCollaboratorPicker.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                     <app-icon name="x" [size]="24"></app-icon>
                  </button>
               </div>
               <div class="relative">
                  <app-icon name="search" [size]="18" class="absolute left-3 top-3 text-slate-400"></app-icon>
                  <input 
                     [(ngModel)]="collaboratorSearch"
                     (input)="searchUsers()"
                     type="text" 
                     placeholder="Search users..."
                     class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
               </div>
            </div>
            <div class="max-h-96 overflow-y-auto p-2">
               @if (collaboratorSearch) {
                 @for (user of searchResults(); track user.uid) {
                    <div 
                      (click)="addCollaborator(user)"
                      class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                       <div class="flex items-center gap-3">
                          <img [src]="user.avatar" class="w-10 h-10 rounded-full">
                          <div class="flex-1 min-w-0">
                             <div class="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                                {{ user.display_name }}
                                @if (user.verify) {
                                   <app-icon name="verified" [size]="14" class="text-indigo-500"></app-icon>
                                }
                             </div>
                             <div class="text-sm text-slate-500">@{{ user.username }}</div>
                          </div>
                          @if (isCollaborator(user.uid)) {
                             <app-icon name="check" [size]="20" class="text-green-500"></app-icon>
                          }
                       </div>
                    </div>
                 }
               } @else {
                 <div class="p-8 text-center text-slate-500">
                    <app-icon name="users" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                    <p>Search for people to tag in your post</p>
                 </div>
               }
            </div>
          </div>
        </div>
      }

      <!-- Privacy Picker Modal -->
      @if (showPrivacyPicker()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showPrivacyPicker.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-white/10">
               <h3 class="font-bold text-lg text-slate-900 dark:text-white">Post Visibility</h3>
            </div>
            <div class="p-2">
               <div 
                 (click)="setVisibility('public')"
                 class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                 [class.bg-indigo-50]="postVisibility() === 'public'"
                 [class.dark:bg-indigo-950/30]="postVisibility() === 'public'">
                  <div class="flex items-start gap-3">
                     <app-icon name="globe" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                     <div class="flex-1">
                        <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           Public
                           @if (postVisibility() === 'public') {
                              <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                           }
                        </div>
                        <div class="text-sm text-slate-500 mt-1">Anyone on or off Synapse can see this post</div>
                     </div>
                  </div>
               </div>

               <div 
                 (click)="setVisibility('followers')"
                 class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                 [class.bg-indigo-50]="postVisibility() === 'followers'"
                 [class.dark:bg-indigo-950/30]="postVisibility() === 'followers'">
                  <div class="flex items-start gap-3">
                     <app-icon name="users" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                     <div class="flex-1">
                        <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           Followers
                           @if (postVisibility() === 'followers') {
                              <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                           }
                        </div>
                        <div class="text-sm text-slate-500 mt-1">Only your followers can see this post</div>
                     </div>
                  </div>
               </div>

               <div 
                 (click)="setVisibility('private')"
                 class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                 [class.bg-indigo-50]="postVisibility() === 'private'"
                 [class.dark:bg-indigo-950/30]="postVisibility() === 'private'">
                  <div class="flex items-start gap-3">
                     <app-icon name="lock" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                     <div class="flex-1">
                        <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           Private
                           @if (postVisibility() === 'private') {
                              <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                           }
                        </div>
                        <div class="text-sm text-slate-500 mt-1">Only you can see this post</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      }
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
  private supabase = inject(SupabaseService).client;
  private imageUpload = inject(ImageUploadService);
  
  text = '';
  mediaItems = signal<MediaItem[]>([]);
  isPosting = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);
  mentions = signal<string[]>([]);
  hashtags = signal<string[]>([]);
  
  // Poll state
  showPollCreator = signal(false);
  poll = signal<Poll | null>(null);
  pollQuestion = '';
  pollOptions = signal<string[]>(['', '']);
  pollDuration = 24;
  
  // New features
  postVisibility = signal<'public' | 'followers' | 'private'>('public');
  location = signal<Location | null>(null);
  collaborators = signal<Collaborator[]>([]);
  showLocationPicker = signal(false);
  showCollaboratorPicker = signal(false);
  showPrivacyPicker = signal(false);
  locationSearch = '';
  collaboratorSearch = '';
  searchResults = signal<any[]>([]);
  
  readonly MAX_MEDIA = 10;
  readonly MAX_POLL_OPTIONS = 4;
  readonly MAX_COLLABORATORS = 5;

  cancel() {
    this.router.navigate(['/app/feed']);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    
    // Check total count
    if (this.mediaItems().length + files.length > this.MAX_MEDIA) {
      alert(`You can only upload up to ${this.MAX_MEDIA} files`);
      return;
    }

    // Check file sizes (max 50MB for videos, 10MB for images)
    for (const file of files) {
      const maxSize = file.type.startsWith('video') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Max size: ${file.type.startsWith('video') ? '50MB' : '10MB'}`);
        return;
      }
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
        
        // Upload to Supabase Storage
        const url = await this.uploadMedia(file);
        
        if (url) {
          this.mediaItems.update(items => [...items, { type, url }]);
        }
        
        this.uploadProgress.set(((i + 1) / files.length) * 100);
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      alert('Failed to upload some files. Please try again.');
    } finally {
      this.isUploading.set(false);
      this.uploadProgress.set(0);
      input.value = ''; // Reset input
    }
  }

  private async uploadMedia(file: File): Promise<string | null> {
    try {
      // Use ImgBB for images, Supabase for videos
      if (file.type.startsWith('image')) {
        console.log('Uploading image...');
        const url = await this.imageUpload.uploadImage(file);
        if (url) {
          console.log('✅ Image uploaded:', url);
          return url;
        }
        throw new Error('ImgBB upload failed');
      } else if (file.type.startsWith('video')) {
        console.log('Uploading video to Supabase...');
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `posts/videos/${fileName}`;

        const { error: uploadError } = await this.supabase.storage
          .from('user-media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data } = this.supabase.storage
          .from('user-media')
          .getPublicUrl(filePath);

        console.log('✅ Video uploaded:', data.publicUrl);
        return data.publicUrl;
      }

      return null;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  }

  removeMedia(index: number) {
    this.mediaItems.update(items => items.filter((_, i) => i !== index));
  }

  togglePollCreator() {
    this.showPollCreator.update(v => !v);
    if (!this.showPollCreator()) {
      this.poll.set(null);
      this.pollQuestion = '';
      this.pollOptions.set(['', '']);
      this.pollDuration = 24;
    }
  }

  addPollOption() {
    if (this.pollOptions().length < this.MAX_POLL_OPTIONS) {
      this.pollOptions.update(opts => [...opts, '']);
    }
  }

  removePollOption(index: number) {
    if (this.pollOptions().length > 2) {
      this.pollOptions.update(opts => opts.filter((_, i) => i !== index));
    }
  }

  updatePollOption(index: number, value: string) {
    this.pollOptions.update(opts => {
      const newOpts = [...opts];
      newOpts[index] = value;
      return newOpts;
    });
  }

  createPoll() {
    const validOptions = this.pollOptions().filter(opt => opt.trim());
    
    if (!this.pollQuestion.trim()) {
      alert('Please enter a poll question');
      return;
    }

    if (validOptions.length < 2) {
      alert('Please provide at least 2 poll options');
      return;
    }

    this.poll.set({
      question: this.pollQuestion.trim(),
      options: validOptions.map(text => ({
        id: Math.random().toString(36).substring(7),
        text: text.trim()
      })),
      duration_hours: this.pollDuration
    });

    this.showPollCreator.set(false);
  }

  removePoll() {
    this.poll.set(null);
    this.pollQuestion = '';
    this.pollOptions.set(['', '']);
    this.pollDuration = 24;
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

  async searchLocations() {
    if (!this.locationSearch.trim()) {
      this.searchResults.set([]);
      return;
    }

    // Mock location search - in production, use Google Places API or similar
    const mockLocations = [
      { name: this.locationSearch, address: 'City, Country', latitude: 0, longitude: 0 },
      { name: `${this.locationSearch} Park`, address: 'City, Country', latitude: 0, longitude: 0 },
      { name: `${this.locationSearch} Mall`, address: 'City, Country', latitude: 0, longitude: 0 }
    ];
    this.searchResults.set(mockLocations);
  }

  selectLocation(loc: any) {
    this.location.set(loc);
    this.showLocationPicker.set(false);
    this.locationSearch = '';
    this.searchResults.set([]);
  }

  async searchUsers() {
    if (!this.collaboratorSearch.trim()) {
      this.searchResults.set([]);
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('uid, username, display_name, avatar, verify')
        .ilike('username', `%${this.collaboratorSearch}%`)
        .limit(10);

      if (error) throw error;
      this.searchResults.set(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  }

  addCollaborator(user: any) {
    if (this.collaborators().length >= this.MAX_COLLABORATORS) {
      alert(`You can only tag up to ${this.MAX_COLLABORATORS} people`);
      return;
    }

    if (this.isCollaborator(user.uid)) {
      this.removeCollaborator(user.uid);
      return;
    }

    this.collaborators.update(collabs => [...collabs, {
      uid: user.uid,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar
    }]);
  }

  removeCollaborator(uid: string) {
    this.collaborators.update(collabs => collabs.filter(c => c.uid !== uid));
  }

  isCollaborator(uid: string): boolean {
    return this.collaborators().some(c => c.uid === uid);
  }

  setVisibility(visibility: 'public' | 'followers' | 'private') {
    this.postVisibility.set(visibility);
    this.showPrivacyPicker.set(false);
  }

  async submit() {
    if (!this.text.trim() && this.mediaItems().length === 0 && !this.poll()) {
      alert('Please add some content to your post');
      return;
    }

    this.isPosting.set(true);
    
    try {
      // Determine post type
      let postType: 'TEXT' | 'IMAGE' | 'VIDEO' = 'TEXT';
      if (this.mediaItems().length > 0) {
        postType = this.mediaItems().some(m => m.type === 'VIDEO') ? 'VIDEO' : 'IMAGE';
      }

      const currentUser = this.socialService.currentUser();
      
      // Insert post into database
      const { data: postData, error: postError } = await this.supabase
        .from('posts')
        .insert({
          author_uid: currentUser.uid,
          post_text: this.text,
          post_type: postType,
          post_visibility: this.postVisibility(),
          media_items: this.mediaItems(),
          has_poll: !!this.poll(),
          poll_question: this.poll()?.question,
          poll_options: this.poll()?.options.map(o => ({ text: o.text, votes: 0 })),
          poll_end_time: this.poll() ? new Date(Date.now() + this.poll()!.duration_hours * 60 * 60 * 1000).toISOString() : null,
          has_location: !!this.location(),
          location_name: this.location()?.name,
          location_address: this.location()?.address,
          location_latitude: this.location()?.latitude,
          location_longitude: this.location()?.longitude,
          location_place_id: this.location()?.place_id,
          created_at: new Date().toISOString(),
          timestamp: Date.now()
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create the post object for local state
      const newPost: Post = {
        id: postData.id,
        author_uid: currentUser.uid,
        user: currentUser,
        post_text: this.text,
        media: this.mediaItems(),
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        created_at: postData.created_at,
        post_type: postType
      };

      this.socialService.addPost(newPost);

      // Save mentions and hashtags to database
      if (this.mentions().length > 0) {
        await this.mentionService.createMentions(this.mentions(), newPost.id, 'post');
      }

      if (this.hashtags().length > 0) {
        await this.hashtagService.createHashtags(this.hashtags(), newPost.id, 'post');
      }

      // Save collaborators as mentions
      if (this.collaborators().length > 0) {
        for (const collab of this.collaborators()) {
          await this.supabase
            .from('mentions')
            .insert({
              post_id: newPost.id,
              mentioned_user_id: collab.uid,
              mentioned_by_user_id: currentUser.uid,
              mention_type: 'post'
            });
        }
      }

      this.isPosting.set(false);
      this.router.navigate(['/app/feed']);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
      this.isPosting.set(false);
    }
  }
}

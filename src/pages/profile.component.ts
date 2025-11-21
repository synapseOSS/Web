
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../components/icon.component';
import { SocialService } from '../services/social.service';
import { PostCardComponent } from '../components/post-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IconComponent, PostCardComponent, FormsModule],
  template: `
    <div class="min-h-screen border-x border-slate-200 dark:border-white/10 pb-20 relative">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-4 py-2 flex items-center gap-4 border-b border-slate-200 dark:border-white/10">
         <button class="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full">
           <app-icon name="chevron-left" [size]="20"></app-icon>
         </button>
         <div>
            <h1 class="font-bold text-lg leading-tight text-slate-900 dark:text-white">{{ user().display_name }}</h1>
            <p class="text-xs text-slate-500">{{ socialService.posts().length }} Posts</p>
         </div>
      </div>

      <!-- Hero -->
      <div>
         <!-- Cover -->
         <div class="h-48 bg-slate-200 dark:bg-slate-800 relative group">
            @if (user().cover_image) {
              <img [src]="user().cover_image" class="w-full h-full object-cover">
            }
         </div>
         
         <!-- Avatar & Actions -->
         <div class="px-4 flex justify-between items-end relative -mt-12 mb-4">
            <div class="w-32 h-32 rounded-full border-4 border-white dark:border-slate-950 overflow-hidden bg-white dark:bg-slate-900">
               <img [src]="user().avatar" class="w-full h-full object-cover">
            </div>
            <div class="mb-4 flex gap-2">
               <button class="p-2 border border-slate-300 dark:border-white/20 rounded-full hover:bg-slate-50 dark:hover:bg-white/10">
                  <app-icon name="more-horizontal" [size]="20"></app-icon>
               </button>
               <button class="p-2 border border-slate-300 dark:border-white/20 rounded-full hover:bg-slate-50 dark:hover:bg-white/10">
                  <app-icon name="mail" [size]="20"></app-icon>
               </button>
               <button (click)="startEditing()" class="px-6 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity">
                  Edit Profile
               </button>
            </div>
         </div>

         <!-- Bio & Info -->
         <div class="px-4 mb-6">
            <h2 class="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-1">
              {{ user().display_name }}
              @if (user().verify) { <app-icon name="verified" [size]="20" class="text-indigo-500"></app-icon> }
            </h2>
            <p class="text-slate-500 mb-3">@{{ user().username }}</p>
            
            <p class="text-slate-900 dark:text-slate-100 mb-4 whitespace-pre-wrap leading-relaxed">{{ user().bio }}</p>
            
            <div class="flex gap-4 text-sm text-slate-500 mb-4">
               <div class="flex items-center gap-1">
                  <app-icon name="map-pin" [size]="16"></app-icon>
                  <span>San Francisco, CA</span>
               </div>
               <div class="flex items-center gap-1">
                  <app-icon name="calendar" [size]="16"></app-icon>
                  <span>Joined November 2025</span>
               </div>
            </div>

            <div class="flex gap-6 text-sm">
               <div class="hover:underline cursor-pointer">
                  <span class="font-bold text-slate-900 dark:text-white">{{ user().following_count }}</span>
                  <span class="text-slate-500 ml-1">Following</span>
               </div>
               <div class="hover:underline cursor-pointer">
                  <span class="font-bold text-slate-900 dark:text-white">{{ user().followers_count }}</span>
                  <span class="text-slate-500 ml-1">Followers</span>
               </div>
            </div>
         </div>

         <!-- Tabs -->
         <div class="flex border-b border-slate-200 dark:border-white/10">
            <div class="flex-1 text-center py-4 font-bold border-b-4 border-indigo-500 text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
               Posts
            </div>
            <div class="flex-1 text-center py-4 font-medium text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
               Replies
            </div>
            <div class="flex-1 text-center py-4 font-medium text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
               Media
            </div>
            <div class="flex-1 text-center py-4 font-medium text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
               Likes
            </div>
         </div>
      </div>

      <!-- Content -->
      <div>
         @for (post of socialService.posts(); track post.id) {
            <app-post-card [post]="post"></app-post-card>
         }
      </div>

      <!-- Edit Profile Modal -->
      @if (isEditing()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
               <div class="flex items-center gap-4">
                  <button (click)="cancelEditing()" class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                     <app-icon name="x" [size]="24"></app-icon>
                  </button>
                  <h2 class="font-bold text-xl text-slate-900 dark:text-white">Edit Profile</h2>
               </div>
               <button (click)="requestSave()" class="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-full text-sm hover:opacity-90 transition-opacity">
                  Save
               </button>
            </div>
            
            <!-- Modal Body (Scrollable) -->
            <div class="p-4 space-y-6 overflow-y-auto">
               <!-- Cover Image Input (Mock) -->
               <div class="space-y-2">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wider">Cover Image</label>
                  <div class="relative h-32 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10">
                     <img [src]="editForm.cover_image" class="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity">
                     <div class="absolute inset-0 flex items-center justify-center">
                        <div class="bg-black/50 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <app-icon name="image" [size]="24"></app-icon>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Avatar Input (Mock) -->
               <div class="flex items-center gap-4">
                  <div class="relative w-20 h-20 rounded-full border-2 border-slate-200 dark:border-white/10 overflow-hidden group cursor-pointer">
                     <img [src]="editForm.avatar" class="w-full h-full object-cover opacity-100 group-hover:opacity-60 transition-opacity">
                     <div class="absolute inset-0 flex items-center justify-center">
                        <div class="bg-black/50 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <app-icon name="image" [size]="20"></app-icon>
                        </div>
                     </div>
                  </div>
                  <div class="text-sm text-slate-500">
                     <p>Tap to change profile picture.</p>
                     <p class="text-xs opacity-70">Recommended: 400x400px</p>
                  </div>
               </div>

               <div class="space-y-4">
                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Display Name</label>
                     <input [(ngModel)]="editForm.display_name" type="text" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="Your Name">
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                     <textarea [(ngModel)]="editForm.bio" rows="3" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all" placeholder="Tell the world about yourself..."></textarea>
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                     <input [(ngModel)]="editForm.location" type="text" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="City, Country">
                  </div>
                  
                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Website</label>
                     <input type="text" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="https://">
                  </div>
               </div>
            </div>
          </div>
        </div>
      }

      <!-- Confirmation Dialog -->
      @if (showSaveConfirmation()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
           <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10 transform transition-all">
              <div class="flex flex-col items-center text-center mb-6">
                 <div class="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-4">
                    <app-icon name="shield" [size]="24"></app-icon>
                 </div>
                 <h3 class="text-xl font-bold mb-2 text-slate-900 dark:text-white">Save changes?</h3>
                 <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Are you sure you want to update your public profile? Your changes will be visible to everyone on the network immediately.
                 </p>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                 <button (click)="showSaveConfirmation.set(false)" class="px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                    Cancel
                 </button>
                 <button (click)="saveProfile()" class="px-4 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                    Confirm
                 </button>
              </div>
           </div>
        </div>
      }
    </div>
  `
})
export class ProfileComponent {
  socialService = inject(SocialService);
  user = this.socialService.currentUser;

  isEditing = signal(false);
  showSaveConfirmation = signal(false);

  editForm = {
    display_name: '',
    bio: '',
    avatar: '',
    cover_image: '',
    location: 'San Francisco, CA'
  };

  startEditing() {
    const u = this.user();
    this.editForm = {
      display_name: u.display_name,
      bio: u.bio || '',
      avatar: u.avatar,
      cover_image: u.cover_image || '',
      location: 'San Francisco, CA'
    };
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.showSaveConfirmation.set(false);
  }

  requestSave() {
    this.showSaveConfirmation.set(true);
  }

  saveProfile() {
    this.socialService.currentUser.update(u => ({
      ...u,
      display_name: this.editForm.display_name,
      bio: this.editForm.bio,
      avatar: this.editForm.avatar,
      cover_image: this.editForm.cover_image
    }));
    
    this.isEditing.set(false);
    this.showSaveConfirmation.set(false);
  }
}

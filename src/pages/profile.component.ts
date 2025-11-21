
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { PostCardComponent } from '../components/post-card.component';
import { ProfileService, UserProfile } from '../services/profile.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IconComponent, PostCardComponent, FormsModule],
  template: `
    <div class="min-h-screen border-x border-slate-200 dark:border-white/10 pb-20 relative">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-4 py-2 flex items-center gap-4 border-b border-slate-200 dark:border-white/10">
         <button (click)="goBack()" class="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full">
           <app-icon name="chevron-left" [size]="20"></app-icon>
         </button>
         @if (profile()) {
           <div>
              <h1 class="font-bold text-lg leading-tight text-slate-900 dark:text-white">{{ profile()!.display_name }}</h1>
              <p class="text-xs text-slate-500">{{ profile()!.posts_count }} Posts</p>
           </div>
         }
      </div>

      @if (profile(); as p) {
      <!-- Hero -->
      <div>
         <!-- Cover -->
         <div class="h-48 bg-slate-200 dark:bg-slate-800 relative group">
            @if (p.profile_cover_image) {
              <img [src]="p.profile_cover_image" class="w-full h-full object-cover">
            }
         </div>
         
         <!-- Avatar & Actions -->
         <div class="px-4 flex justify-between items-end relative -mt-12 mb-4">
            <div class="relative">
               <!-- Circular Progress Ring -->
               <div class="absolute inset-0 rounded-full p-1" [style.background]="getProfileAgeGradient()">
                  <div class="w-full h-full rounded-full bg-white dark:bg-slate-950"></div>
               </div>
               
               <!-- Avatar -->
               <div class="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-950 overflow-hidden bg-white dark:bg-slate-900">
                  <img [src]="p.avatar" class="w-full h-full object-cover">
               </div>
               
               <!-- Age Badge -->
               @if (p.join_date) {
                  <div class="absolute -bottom-1 -right-1 px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white dark:border-slate-950">
                     {{ getProfileAgeLabel() }}
                  </div>
               }
            </div>
            <div class="mb-4 flex gap-2">
               @if (!isOwnProfile()) {
                 <button class="p-2 border border-slate-300 dark:border-white/20 rounded-full hover:bg-slate-50 dark:hover:bg-white/10">
                    <app-icon name="more-horizontal" [size]="20"></app-icon>
                 </button>
                 <button class="p-2 border border-slate-300 dark:border-white/20 rounded-full hover:bg-slate-50 dark:hover:bg-white/10">
                    <app-icon name="mail" [size]="20"></app-icon>
                 </button>
                 @if (isFollowing()) {
                   <button (click)="unfollowUser()" class="px-6 py-2 rounded-full border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      Following
                   </button>
                 } @else {
                   <button (click)="followUser()" class="px-6 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity">
                      Follow
                   </button>
                 }
               } @else {
                 <button (click)="navigateToEditProfile()" class="px-6 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity">
                    Edit Profile
                 </button>
               }
            </div>
         </div>

         <!-- Bio & Info -->
         <div class="px-4 mb-6">
            <h2 class="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-1">
              {{ p.display_name }}
              @if (p.verify) { <app-icon name="verified" [size]="20" class="text-indigo-500"></app-icon> }
              @if (p.account_premium) { 
                <span class="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
              }
            </h2>
            <p class="text-slate-500 mb-3">@{{ p.username }}</p>
            
            @if (p.bio || p.biography) {
              <p class="text-slate-900 dark:text-slate-100 mb-4 whitespace-pre-wrap leading-relaxed">{{ p.bio || p.biography }}</p>
            }
            
            <div class="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
               @if (p.region) {
                 <div class="flex items-center gap-1">
                    <app-icon name="map-pin" [size]="16"></app-icon>
                    <span>{{ p.region }}</span>
                 </div>
               }
               @if (p.join_date) {
                 <div class="flex items-center gap-1">
                    <app-icon name="calendar" [size]="16"></app-icon>
                    <span>Joined {{ formatJoinDate(p.join_date) }}</span>
                 </div>
               }
               @if (p.status === 'online') {
                 <div class="flex items-center gap-1 text-green-500">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online</span>
                 </div>
               }
            </div>

            <div class="flex gap-6 text-sm">
               <div (click)="navigateToFollowing()" class="hover:underline cursor-pointer">
                  <span class="font-bold text-slate-900 dark:text-white">{{ p.following_count }}</span>
                  <span class="text-slate-500 ml-1">Following</span>
               </div>
               <div (click)="navigateToFollowers()" class="hover:underline cursor-pointer">
                  <span class="font-bold text-slate-900 dark:text-white">{{ p.followers_count }}</span>
                  <span class="text-slate-500 ml-1">Followers</span>
               </div>
            </div>
         </div>

         <!-- Tabs -->
         <div class="flex border-b border-slate-200 dark:border-white/10">
            <div 
              (click)="activeTab.set('posts')"
              [class.border-indigo-500]="activeTab() === 'posts'"
              [class.text-slate-900]="activeTab() === 'posts'"
              [class.dark:text-white]="activeTab() === 'posts'"
              [class.font-bold]="activeTab() === 'posts'"
              [class.text-slate-500]="activeTab() !== 'posts'"
              [class.font-medium]="activeTab() !== 'posts'"
              class="flex-1 text-center py-4 border-b-4 border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
               Posts
            </div>
            <div 
              (click)="activeTab.set('replies')"
              [class.border-indigo-500]="activeTab() === 'replies'"
              [class.text-slate-900]="activeTab() === 'replies'"
              [class.dark:text-white]="activeTab() === 'replies'"
              [class.font-bold]="activeTab() === 'replies'"
              [class.text-slate-500]="activeTab() !== 'replies'"
              [class.font-medium]="activeTab() !== 'replies'"
              class="flex-1 text-center py-4 border-b-4 border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
               Replies
            </div>
            <div 
              (click)="activeTab.set('media')"
              [class.border-indigo-500]="activeTab() === 'media'"
              [class.text-slate-900]="activeTab() === 'media'"
              [class.dark:text-white]="activeTab() === 'media'"
              [class.font-bold]="activeTab() === 'media'"
              [class.text-slate-500]="activeTab() !== 'media'"
              [class.font-medium]="activeTab() !== 'media'"
              class="flex-1 text-center py-4 border-b-4 border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
               Media
            </div>
            <div 
              (click)="activeTab.set('likes')"
              [class.border-indigo-500]="activeTab() === 'likes'"
              [class.text-slate-900]="activeTab() === 'likes'"
              [class.dark:text-white]="activeTab() === 'likes'"
              [class.font-bold]="activeTab() === 'likes'"
              [class.text-slate-500]="activeTab() !== 'likes'"
              [class.font-medium]="activeTab() !== 'likes'"
              class="flex-1 text-center py-4 border-b-4 border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
               Likes
            </div>
         </div>
      </div>

      <!-- Content -->
      <div>
         @if (isLoadingPosts()) {
           <div class="p-8 text-center text-slate-500">
             <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
             <p class="mt-4">Loading...</p>
           </div>
         } @else {
           @switch (activeTab()) {
             @case ('posts') {
               @if (userPosts().length === 0) {
                 <div class="p-8 text-center text-slate-500">
                   <app-icon name="file-text" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                   <p>No posts yet</p>
                 </div>
               } @else {
                 @for (post of userPosts(); track post.id) {
                    <app-post-card [post]="post"></app-post-card>
                 }
               }
             }
             @case ('replies') {
               @if (userReplies().length === 0) {
                 <div class="p-8 text-center text-slate-500">
                   <app-icon name="message-circle" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                   <p>No replies yet</p>
                 </div>
               } @else {
                 @for (post of userReplies(); track post.id) {
                    <app-post-card [post]="post"></app-post-card>
                 }
               }
             }
             @case ('media') {
               @if (userMediaPosts().length === 0) {
                 <div class="p-8 text-center text-slate-500">
                   <app-icon name="image" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                   <p>No media posts yet</p>
                 </div>
               } @else {
                 <div class="grid grid-cols-3 gap-1 p-1">
                   @for (post of userMediaPosts(); track post.id) {
                     <div (click)="navigateToPost(post.id)" class="aspect-square bg-slate-100 dark:bg-slate-900 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                       @if (post.media_items && post.media_items.length > 0) {
                         @if (post.media_items[0].type === 'IMAGE') {
                           <img [src]="post.media_items[0].url" class="w-full h-full object-cover">
                         } @else {
                           <video [src]="post.media_items[0].url" class="w-full h-full object-cover"></video>
                         }
                       }
                     </div>
                   }
                 </div>
               }
             }
             @case ('likes') {
               <div class="p-8 text-center text-slate-500">
                 <app-icon name="heart" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                 <p>Liked posts coming soon</p>
               </div>
             }
           }
         }
      </div>
      } @else if (profileService.isLoading()) {
        <div class="p-8 text-center">
          <div class="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="mt-4 text-slate-500">Loading profile...</p>
        </div>
      } @else {
        <div class="p-8 text-center text-slate-500">
          <p>Profile not found</p>
        </div>
      }

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
               <!-- Cover Image Input -->
               <div class="space-y-2">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wider">Cover Image</label>
                  <input #coverInput type="file" accept="image/*" (change)="onCoverImageSelected($event)" class="hidden">
                  <div (click)="coverInput.click()" class="relative h-32 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10">
                     @if (editForm.profile_cover_image) {
                       <img [src]="editForm.profile_cover_image" class="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity">
                     }
                     <div class="absolute inset-0 flex items-center justify-center">
                        <div class="bg-black/50 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <app-icon name="image" [size]="24"></app-icon>
                        </div>
                     </div>
                     @if (isUploadingCover()) {
                       <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                         <div class="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                       </div>
                     }
                  </div>
               </div>

               <!-- Avatar Input -->
               <div class="flex items-center gap-4">
                  <input #avatarInput type="file" accept="image/*" (change)="onAvatarSelected($event)" class="hidden">
                  <div (click)="avatarInput.click()" class="relative w-20 h-20 rounded-full border-2 border-slate-200 dark:border-white/10 overflow-hidden group cursor-pointer">
                     <img [src]="editForm.avatar" class="w-full h-full object-cover opacity-100 group-hover:opacity-60 transition-opacity">
                     <div class="absolute inset-0 flex items-center justify-center">
                        <div class="bg-black/50 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <app-icon name="image" [size]="20"></app-icon>
                        </div>
                     </div>
                     @if (isUploadingAvatar()) {
                       <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                         <div class="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full"></div>
                       </div>
                     }
                  </div>
                  <div class="text-sm text-slate-500">
                     <p>Tap to change profile picture.</p>
                     <p class="text-xs opacity-70">Recommended: 400x400px</p>
                  </div>
               </div>

               <div class="space-y-4">
                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                     <input [(ngModel)]="editForm.username" type="text" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="username">
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Display Name</label>
                     <input [(ngModel)]="editForm.display_name" type="text" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="Your Name">
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                     <textarea [(ngModel)]="editForm.bio" rows="3" maxlength="500" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all" placeholder="Tell the world about yourself..."></textarea>
                     <div class="text-xs text-slate-400 mt-1 text-right">{{ editForm.bio.length }}/500</div>
                  </div>

                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Region/Location</label>
                     <input [(ngModel)]="editForm.region" type="text" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="City, Country">
                  </div>
                  
                  <div>
                     <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                     <select [(ngModel)]="editForm.gender" class="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                       <option value="hidden">Prefer not to say</option>
                       <option value="male">Male</option>
                       <option value="female">Female</option>
                       <option value="other">Other</option>
                     </select>
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
export class ProfileComponent implements OnInit {
  profileService = inject(ProfileService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  profile = signal<UserProfile | null>(null);
  userPosts = signal<any[]>([]);
  userReplies = signal<any[]>([]);
  userMediaPosts = signal<any[]>([]);
  isLoadingPosts = signal(false);
  isEditing = signal(false);
  showSaveConfirmation = signal(false);
  isUploadingAvatar = signal(false);
  isUploadingCover = signal(false);
  isFollowing = signal(false);
  activeTab = signal<'posts' | 'replies' | 'media' | 'likes'>('posts');

  isOwnProfile = computed(() => {
    const currentUser = this.authService.currentUser();
    const viewedProfile = this.profile();
    return currentUser && viewedProfile && currentUser.id === viewedProfile.uid;
  });

  editForm = {
    username: '',
    display_name: '',
    bio: '',
    avatar: '',
    profile_cover_image: '',
    region: '',
    gender: 'hidden'
  };

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const username = params.get('username');
      if (username) {
        await this.loadUserProfile(username);
      } else {
        await this.loadCurrentUserProfile();
      }
    });
  }

  async loadCurrentUserProfile() {
    // Wait for profile to load if not already loaded
    let currentProfile = this.profileService.currentProfile();
    
    if (!currentProfile) {
      // Profile not loaded yet, try to load it
      await this.profileService.loadCurrentUserProfile();
      currentProfile = this.profileService.currentProfile();
    }
    
    if (currentProfile) {
      this.profile.set(currentProfile);
      await this.loadUserPosts(currentProfile.uid);
    } else {
      console.error('Failed to load current user profile');
    }
  }

  async loadUserProfile(username: string) {
    const userProfile = await this.profileService.getUserProfileByUsername(username);
    if (userProfile) {
      this.profile.set(userProfile);
      await this.loadUserPosts(userProfile.uid);
      await this.checkFollowStatus(userProfile.uid);
    }
  }

  async loadUserPosts(uid: string) {
    this.isLoadingPosts.set(true);
    const posts = await this.profileService.getUserPosts(uid);
    
    // Separate posts by type
    this.userPosts.set(posts);
    
    // Filter media posts (posts with images or videos)
    const mediaPosts = posts.filter(p => p.media_items && p.media_items.length > 0);
    this.userMediaPosts.set(mediaPosts);
    
    // TODO: Load replies from comments table
    this.userReplies.set([]);
    
    this.isLoadingPosts.set(false);
  }

  async checkFollowStatus(uid: string) {
    const following = await this.profileService.isFollowing(uid);
    this.isFollowing.set(following);
  }

  async followUser() {
    const p = this.profile();
    if (!p) return;
    
    const success = await this.profileService.followUser(p.uid);
    if (success) {
      this.isFollowing.set(true);
      // Update follower count
      this.profile.update(prof => prof ? { ...prof, followers_count: prof.followers_count + 1 } : null);
    }
  }

  async unfollowUser() {
    const p = this.profile();
    if (!p) return;
    
    const success = await this.profileService.unfollowUser(p.uid);
    if (success) {
      this.isFollowing.set(false);
      // Update follower count
      this.profile.update(prof => prof ? { ...prof, followers_count: Math.max(0, prof.followers_count - 1) } : null);
    }
  }

  startEditing() {
    const p = this.profile();
    if (!p) return;

    this.editForm = {
      username: p.username,
      display_name: p.display_name,
      bio: p.bio || p.biography || '',
      avatar: p.avatar,
      profile_cover_image: p.profile_cover_image || '',
      region: p.region || '',
      gender: p.gender || 'hidden'
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

  async saveProfile() {
    const success = await this.profileService.updateProfile({
      username: this.editForm.username,
      display_name: this.editForm.display_name,
      bio: this.editForm.bio,
      avatar: this.editForm.avatar,
      profile_cover_image: this.editForm.profile_cover_image,
      region: this.editForm.region,
      gender: this.editForm.gender
    });

    if (success) {
      this.profile.set(this.profileService.currentProfile());
      this.isEditing.set(false);
      this.showSaveConfirmation.set(false);
    }
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingAvatar.set(true);

    const url = await this.profileService.uploadAvatar(file);
    if (url) {
      this.editForm.avatar = url;
    }

    this.isUploadingAvatar.set(false);
  }

  async onCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingCover.set(true);

    const url = await this.profileService.uploadCoverImage(file);
    if (url) {
      this.editForm.profile_cover_image = url;
    }

    this.isUploadingCover.set(false);
  }

  navigateToEditProfile() {
    this.router.navigate(['/app/edit-profile']);
  }

  goBack() {
    this.router.navigate(['/app/feed']);
  }

  navigateToPost(postId: string) {
    this.router.navigate(['/app/post', postId]);
  }

  navigateToFollowers() {
    const p = this.profile();
    if (!p) return;
    this.router.navigate(['/app/profile', p.username, 'followers']);
  }

  navigateToFollowing() {
    const p = this.profile();
    if (!p) return;
    this.router.navigate(['/app/profile', p.username, 'following']);
  }

  formatJoinDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getProfileAge(): number {
    const p = this.profile();
    if (!p || !p.join_date) return 0;
    
    const joinDate = new Date(p.join_date);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Return percentage (0-100) based on days, capped at 365 days = 100%
    return Math.min((diffDays / 365) * 100, 100);
  }

  getProfileAgeGradient(): string {
    const age = this.getProfileAge();
    
    // Gradient colors based on age
    if (age < 25) {
      // New user: Blue to Cyan
      return 'conic-gradient(from 0deg, #3b82f6, #06b6d4, transparent ' + age + '%)';
    } else if (age < 50) {
      // Growing: Cyan to Green
      return 'conic-gradient(from 0deg, #06b6d4, #10b981, transparent ' + age + '%)';
    } else if (age < 75) {
      // Established: Green to Yellow
      return 'conic-gradient(from 0deg, #10b981, #f59e0b, transparent ' + age + '%)';
    } else {
      // Veteran: Yellow to Purple
      return 'conic-gradient(from 0deg, #f59e0b, #a855f7, transparent ' + age + '%)';
    }
  }

  getProfileAgeLabel(): string {
    const p = this.profile();
    if (!p || !p.join_date) return '';
    
    const joinDate = new Date(p.join_date);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }
}

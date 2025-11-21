import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { ProfileService } from '../services/profile.service';

interface UserListItem {
  uid: string;
  username: string;
  display_name: string;
  avatar: string;
  verify?: boolean;
  bio?: string;
}

@Component({
  selector: 'app-followers',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="min-h-screen border-x border-slate-200 dark:border-white/10 pb-20">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-4 py-3 flex items-center gap-4 border-b border-slate-200 dark:border-white/10">
         <button (click)="goBack()" class="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full">
           <app-icon name="chevron-left" [size]="20"></app-icon>
         </button>
         <div>
            <h1 class="font-bold text-lg leading-tight text-slate-900 dark:text-white">{{ username() }}</h1>
            <p class="text-xs text-slate-500">{{ viewType() === 'followers' ? 'Followers' : 'Following' }}</p>
         </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-200 dark:border-white/10">
         <div 
           (click)="switchToFollowers()"
           [class.border-indigo-500]="viewType() === 'followers'"
           [class.text-slate-900]="viewType() === 'followers'"
           [class.dark:text-white]="viewType() === 'followers'"
           [class.font-bold]="viewType() === 'followers'"
           [class.text-slate-500]="viewType() !== 'followers'"
           [class.font-medium]="viewType() !== 'followers'"
           class="flex-1 text-center py-4 border-b-4 border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Followers
         </div>
         <div 
           (click)="switchToFollowing()"
           [class.border-indigo-500]="viewType() === 'following'"
           [class.text-slate-900]="viewType() === 'following'"
           [class.dark:text-white]="viewType() === 'following'"
           [class.font-bold]="viewType() === 'following'"
           [class.text-slate-500]="viewType() !== 'following'"
           [class.font-medium]="viewType() !== 'following'"
           class="flex-1 text-center py-4 border-b-4 border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Following
         </div>
      </div>

      <!-- User List -->
      <div>
         @if (isLoading()) {
           <div class="p-8 text-center">
             <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
             <p class="mt-4 text-slate-500">Loading...</p>
           </div>
         } @else if (users().length === 0) {
           <div class="p-8 text-center text-slate-500">
             <app-icon name="users" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
             <p>No {{ viewType() === 'followers' ? 'followers' : 'following' }} yet</p>
           </div>
         } @else {
           @for (user of users(); track user.uid) {
             <div class="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/10">
                <div class="flex items-center gap-3">
                   <img 
                     [src]="user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username" 
                     class="w-12 h-12 rounded-full object-cover cursor-pointer"
                     (click)="navigateToProfile(user.username)">
                   
                   <div class="flex-1 min-w-0 cursor-pointer" (click)="navigateToProfile(user.username)">
                      <div class="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {{ user.display_name || user.username }}
                        @if (user.verify) {
                          <app-icon name="verified" [size]="16" class="text-indigo-500"></app-icon>
                        }
                      </div>
                      <div class="text-sm text-slate-500">@{{ user.username }}</div>
                      @if (user.bio) {
                        <div class="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{{ user.bio }}</div>
                      }
                   </div>

                   @if (!isOwnProfile(user.uid)) {
                     @if (isFollowing(user.uid)) {
                       <button 
                         (click)="unfollowUser(user.uid)"
                         class="px-4 py-1.5 rounded-full border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                          Following
                       </button>
                     } @else {
                       <button 
                         (click)="followUser(user.uid)"
                         class="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity">
                          Follow
                       </button>
                     }
                   }
                </div>
             </div>
           }
         }
      </div>
    </div>
  `
})
export class FollowersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ProfileService);

  username = signal<string>('');
  viewType = signal<'followers' | 'following'>('followers');
  users = signal<UserListItem[]>([]);
  isLoading = signal(false);
  followingSet = signal<Set<string>>(new Set());

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const username = params.get('username');
      const type = params.get('type') as 'followers' | 'following';
      
      if (username) {
        this.username.set(username);
        this.viewType.set(type || 'followers');
        await this.loadUsers();
      }
    });
  }

  async loadUsers() {
    this.isLoading.set(true);
    
    const profile = await this.profileService.getUserProfileByUsername(this.username());
    if (!profile) {
      this.isLoading.set(false);
      return;
    }

    if (this.viewType() === 'followers') {
      const followers = await this.profileService.getFollowers(profile.uid);
      this.users.set(followers as any);
    } else {
      const following = await this.profileService.getFollowing(profile.uid);
      this.users.set(following as any);
    }

    // Load following status for each user
    await this.loadFollowingStatus();
    
    this.isLoading.set(false);
  }

  async loadFollowingStatus() {
    const followingIds = new Set<string>();
    
    for (const user of this.users()) {
      const isFollowing = await this.profileService.isFollowing(user.uid);
      if (isFollowing) {
        followingIds.add(user.uid);
      }
    }
    
    this.followingSet.set(followingIds);
  }

  isFollowing(uid: string): boolean {
    return this.followingSet().has(uid);
  }

  isOwnProfile(uid: string): boolean {
    const currentProfile = this.profileService.currentProfile();
    return currentProfile?.uid === uid;
  }

  async followUser(uid: string) {
    const success = await this.profileService.followUser(uid);
    if (success) {
      this.followingSet.update(set => {
        const newSet = new Set(set);
        newSet.add(uid);
        return newSet;
      });
    }
  }

  async unfollowUser(uid: string) {
    const success = await this.profileService.unfollowUser(uid);
    if (success) {
      this.followingSet.update(set => {
        const newSet = new Set(set);
        newSet.delete(uid);
        return newSet;
      });
    }
  }

  switchToFollowers() {
    this.router.navigate(['/app/profile', this.username(), 'followers']);
  }

  switchToFollowing() {
    this.router.navigate(['/app/profile', this.username(), 'following']);
  }

  navigateToProfile(username: string) {
    this.router.navigate(['/app/profile', username]);
  }

  goBack() {
    this.router.navigate(['/app/profile', this.username()]);
  }
}

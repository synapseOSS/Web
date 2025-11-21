import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { ProfileService, UserProfile } from '../services/profile.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  template: `
    <div class="min-h-screen border-x border-slate-200 dark:border-white/10 pb-20">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <app-icon name="x" [size]="24"></app-icon>
          </button>
          <h1 class="font-bold text-xl text-slate-900 dark:text-white">Edit Profile</h1>
        </div>
        <button 
          (click)="saveProfile()" 
          [disabled]="isSaving()"
          class="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-full text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          @if (isSaving()) {
            <span class="flex items-center gap-2">
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </span>
          } @else {
            Save
          }
        </button>
      </div>

      @if (profileService.isLoading()) {
        <div class="p-8 text-center">
          <div class="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="mt-4 text-slate-500">Loading profile...</p>
        </div>
      } @else {
        <!-- Cover Image Section -->
        <div class="relative">
          <input #coverInput type="file" accept="image/*" (change)="onCoverImageSelected($event)" class="hidden">
          
          <div class="relative h-52 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden group">
            @if (editForm.profile_cover_image) {
              <img [src]="editForm.profile_cover_image" class="w-full h-full object-cover">
            }
            
            <!-- Overlay Controls -->
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button 
                (click)="coverInput.click()"
                class="p-3 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110">
                <app-icon name="camera" [size]="24"></app-icon>
              </button>
              @if (editForm.profile_cover_image) {
                <button 
                  (click)="removeCoverImage()"
                  class="p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110">
                  <app-icon name="trash" [size]="24"></app-icon>
                </button>
              }
            </div>

            @if (isUploadingCover()) {
              <div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <div class="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-3"></div>
                <p class="text-white font-medium">Uploading cover...</p>
              </div>
            }
          </div>

          <!-- Avatar Section -->
          <div class="px-4 -mt-16 relative z-10">
            <input #avatarInput type="file" accept="image/*" (change)="onAvatarSelected($event)" class="hidden">
            
            <div class="relative inline-block group">
              <div class="w-32 h-32 rounded-full border-4 border-white dark:border-slate-950 overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
                <img [src]="editForm.avatar" class="w-full h-full object-cover">
              </div>
              
              <!-- Avatar Overlay -->
              <div class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  (click)="avatarInput.click()"
                  class="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110">
                  <app-icon name="camera" [size]="20"></app-icon>
                </button>
              </div>

              @if (isUploadingAvatar()) {
                <div class="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div class="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="px-4 pt-6 space-y-6 max-w-2xl">
          <!-- Upload Tips -->
          <div class="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <div class="flex gap-3">
              <div class="flex-shrink-0">
                <app-icon name="info" [size]="20" class="text-indigo-600 dark:text-indigo-400"></app-icon>
              </div>
              <div class="text-sm text-indigo-900 dark:text-indigo-100">
                <p class="font-semibold mb-1">Photo Guidelines</p>
                <ul class="space-y-1 text-indigo-700 dark:text-indigo-300">
                  <li>• Profile photo: 400x400px recommended</li>
                  <li>• Cover photo: 1500x500px recommended</li>
                  <li>• Supported formats: JPG, PNG, GIF</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Display Name -->
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Display Name
            </label>
            <input 
              [(ngModel)]="editForm.display_name" 
              type="text" 
              maxlength="50"
              class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              placeholder="Your display name">
            <p class="text-xs text-slate-500">{{ editForm.display_name.length }}/50</p>
          </div>

          <!-- Username -->
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Username
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
              <input 
                [(ngModel)]="editForm.username" 
                type="text" 
                maxlength="30"
                class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="username">
            </div>
            <p class="text-xs text-slate-500">{{ editForm.username.length }}/30</p>
          </div>

          <!-- Bio -->
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Bio
            </label>
            <textarea 
              [(ngModel)]="editForm.bio" 
              rows="4" 
              maxlength="500"
              class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
              placeholder="Tell the world about yourself..."></textarea>
            <p class="text-xs text-slate-500">{{ editForm.bio.length }}/500</p>
          </div>

          <!-- Location -->
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Location
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <app-icon name="map-pin" [size]="18"></app-icon>
              </span>
              <input 
                [(ngModel)]="editForm.region" 
                type="text" 
                maxlength="100"
                class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="City, Country">
            </div>
          </div>

          <!-- Gender -->
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Gender
            </label>
            <select 
              [(ngModel)]="editForm.gender"
              class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
              <option value="hidden">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 pb-8">
            <button 
              (click)="goBack()"
              class="flex-1 px-6 py-3 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button 
              (click)="saveProfile()"
              [disabled]="isSaving()"
              class="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
              @if (isSaving()) {
                <span class="flex items-center justify-center gap-2">
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </span>
              } @else {
                Save Changes
              }
            </button>
          </div>
        </div>
      }

      <!-- Success Toast -->
      @if (showSuccessToast()) {
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div class="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <app-icon name="check-circle" [size]="20"></app-icon>
            <span class="font-semibold">Profile updated successfully!</span>
          </div>
        </div>
      }

      <!-- Error Toast -->
      @if (errorMessage()) {
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div class="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <app-icon name="alert-circle" [size]="20"></app-icon>
            <span class="font-semibold">{{ errorMessage() }}</span>
          </div>
        </div>
      }
    </div>
  `
})
export class EditProfileComponent implements OnInit {
  profileService = inject(ProfileService);
  private router = inject(Router);

  isSaving = signal(false);
  isUploadingAvatar = signal(false);
  isUploadingCover = signal(false);
  showSuccessToast = signal(false);
  errorMessage = signal<string | null>(null);

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
    const profile = this.profileService.currentProfile();
    if (profile) {
      this.editForm = {
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio || profile.biography || '',
        avatar: profile.avatar,
        profile_cover_image: profile.profile_cover_image || '',
        region: profile.region || '',
        gender: profile.gender || 'hidden'
      };
    }
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showError('Please select an image file');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      this.editForm.avatar = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    this.isUploadingAvatar.set(true);
    this.errorMessage.set(null);

    try {
      const url = await this.profileService.uploadAvatar(file);
      if (url) {
        this.editForm.avatar = url;
      } else {
        this.showError('Failed to upload avatar');
      }
    } catch (err) {
      this.showError('Error uploading avatar');
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  async onCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showError('Please select an image file');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      this.editForm.profile_cover_image = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    this.isUploadingCover.set(true);
    this.errorMessage.set(null);

    try {
      const url = await this.profileService.uploadCoverImage(file);
      if (url) {
        this.editForm.profile_cover_image = url;
      } else {
        this.showError('Failed to upload cover image');
      }
    } catch (err) {
      this.showError('Error uploading cover image');
    } finally {
      this.isUploadingCover.set(false);
    }
  }

  removeCoverImage() {
    this.editForm.profile_cover_image = '';
  }

  async saveProfile() {
    // Validate required fields
    if (!this.editForm.username.trim()) {
      this.showError('Username is required');
      return;
    }

    if (!this.editForm.display_name.trim()) {
      this.showError('Display name is required');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const success = await this.profileService.updateProfile({
        username: this.editForm.username.trim(),
        display_name: this.editForm.display_name.trim(),
        bio: this.editForm.bio.trim(),
        avatar: this.editForm.avatar,
        profile_cover_image: this.editForm.profile_cover_image,
        region: this.editForm.region.trim(),
        gender: this.editForm.gender
      });

      if (success) {
        this.showSuccessToast.set(true);
        setTimeout(() => {
          this.showSuccessToast.set(false);
          this.router.navigate(['/app/profile']);
        }, 1500);
      } else {
        this.showError('Failed to update profile');
      }
    } catch (err) {
      this.showError('An error occurred while saving');
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/app/profile']);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => {
      this.errorMessage.set(null);
    }, 3000);
  }
}

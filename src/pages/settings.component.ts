import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { ImageUploadService, ImageProvider, ProviderConfig } from '../services/image-upload.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  template: `
    <div class="min-h-screen border-x border-slate-200 dark:border-white/10 pb-20">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-4 py-3 flex items-center gap-4 border-b border-slate-200 dark:border-white/10">
        <button (click)="goBack()" class="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
          <app-icon name="arrow-left" [size]="24"></app-icon>
        </button>
        <h1 class="font-bold text-xl text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div class="px-4 py-6 space-y-6 max-w-2xl">
        <!-- Provider Selection -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <app-icon name="cloud" [size]="24" class="text-purple-600 dark:text-purple-400"></app-icon>
            </div>
            <div class="flex-1">
              <h2 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Image Upload Provider</h2>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Choose your preferred image hosting service
              </p>
            </div>
          </div>

          <div class="space-y-3">
            @for (provider of providers; track provider.id) {
              <div 
                (click)="selectProvider(provider.id)"
                [class.border-indigo-500]="selectedProvider() === provider.id"
                [class.bg-indigo-50]="selectedProvider() === provider.id"
                [class.dark:bg-indigo-950/30]="selectedProvider() === provider.id"
                class="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-0.5">
                    @if (selectedProvider() === provider.id) {
                      <div class="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                        <app-icon name="check" [size]="14" class="text-white"></app-icon>
                      </div>
                    } @else {
                      <div class="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                    }
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold text-slate-900 dark:text-white">{{ provider.name }}</h3>
                      @if (isProviderConfigured(provider.id)) {
                        <span class="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                          Configured
                        </span>
                      } @else if (provider.id !== 'imgbb') {
                        <span class="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                          Setup Required
                        </span>
                      }
                    </div>
                    <p class="text-sm text-slate-600 dark:text-slate-400">{{ provider.description }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Provider Configuration -->
        @switch (selectedProvider()) {
          @case ('imgbb') {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div class="flex items-start gap-3">
                <div class="p-2 bg-indigo-100 dark:bg-indigo-950 rounded-lg">
                  <app-icon name="image" [size]="24" class="text-indigo-600 dark:text-indigo-400"></app-icon>
                </div>
                <div class="flex-1">
                  <h2 class="font-bold text-lg text-slate-900 dark:text-white mb-1">ImgBB Configuration</h2>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    Get your free API key from 
                    <a href="https://api.imgbb.com/" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                      api.imgbb.com
                    </a>
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  API Key
                </label>
                <div class="relative">
                  <input 
                    [(ngModel)]="imgbbConfig.apiKey" 
                    [type]="showSecrets.imgbb() ? 'text' : 'password'"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 pr-12 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-sm"
                    placeholder="Enter your ImgBB API key">
                  <button 
                    (click)="toggleSecret('imgbb')"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors">
                    <app-icon [name]="showSecrets.imgbb() ? 'eye-off' : 'eye'" [size]="18" class="text-slate-500"></app-icon>
                  </button>
                </div>
              </div>

              <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <app-icon name="info" [size]="18" class="text-blue-600 dark:text-blue-400"></app-icon>
                  </div>
                  <div class="text-sm text-blue-900 dark:text-blue-100">
                    <ul class="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Free tier: Unlimited uploads</li>
                      <li>• Max file size: 32MB</li>
                      <li>• Supported formats: JPG, PNG, GIF, BMP, WEBP</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          }
          
          @case ('cloudinary') {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div class="flex items-start gap-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <app-icon name="cloud" [size]="24" class="text-blue-600 dark:text-blue-400"></app-icon>
                </div>
                <div class="flex-1">
                  <h2 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Cloudinary Configuration</h2>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    Get your credentials from 
                    <a href="https://cloudinary.com/console" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                      Cloudinary Console
                    </a>
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cloud Name
                  </label>
                  <input 
                    [(ngModel)]="cloudinaryConfig.cloudName" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="your-cloud-name">
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Upload Preset
                  </label>
                  <input 
                    [(ngModel)]="cloudinaryConfig.uploadPreset" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="your-upload-preset">
                </div>
              </div>

              <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <app-icon name="info" [size]="18" class="text-blue-600 dark:text-blue-400"></app-icon>
                  </div>
                  <div class="text-sm text-blue-900 dark:text-blue-100">
                    <ul class="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Free tier: 25 GB storage, 25 GB bandwidth/month</li>
                      <li>• Create an unsigned upload preset in settings</li>
                      <li>• Automatic image optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          }

          @case ('cloudflare-r2') {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div class="flex items-start gap-3">
                <div class="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                  <app-icon name="server" [size]="24" class="text-orange-600 dark:text-orange-400"></app-icon>
                </div>
                <div class="flex-1">
                  <h2 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Cloudflare R2 Configuration</h2>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    Get your credentials from 
                    <a href="https://dash.cloudflare.com/" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                      Cloudflare Dashboard
                    </a>
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Account ID
                  </label>
                  <input 
                    [(ngModel)]="cloudflareConfig.accountId" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-sm"
                    placeholder="your-account-id">
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Access Key ID
                  </label>
                  <div class="relative">
                    <input 
                      [(ngModel)]="cloudflareConfig.accessKeyId" 
                      [type]="showSecrets.cloudflare() ? 'text' : 'password'"
                      class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 pr-12 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-sm"
                      placeholder="your-access-key-id">
                    <button 
                      (click)="toggleSecret('cloudflare')"
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors">
                      <app-icon [name]="showSecrets.cloudflare() ? 'eye-off' : 'eye'" [size]="18" class="text-slate-500"></app-icon>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Secret Access Key
                  </label>
                  <div class="relative">
                    <input 
                      [(ngModel)]="cloudflareConfig.secretAccessKey" 
                      [type]="showSecrets.cloudflare() ? 'text' : 'password'"
                      class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 pr-12 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-sm"
                      placeholder="your-secret-access-key">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Bucket Name
                  </label>
                  <input 
                    [(ngModel)]="cloudflareConfig.bucketName" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="my-bucket">
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Public URL
                  </label>
                  <input 
                    [(ngModel)]="cloudflareConfig.publicUrl" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="https://pub-xxxxx.r2.dev">
                </div>
              </div>

              <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <app-icon name="alert-triangle" [size]="18" class="text-amber-600 dark:text-amber-400"></app-icon>
                  </div>
                  <div class="text-sm text-amber-900 dark:text-amber-100">
                    <p class="font-semibold mb-1">Backend Required</p>
                    <p class="text-amber-700 dark:text-amber-300">
                      Direct browser uploads to R2 require backend implementation for presigned URLs. This feature is currently in development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        }

        <!-- Save Button -->
        <div class="flex gap-3">
          <button 
            (click)="saveConfiguration()"
            [disabled]="isSaving()"
            class="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
            @if (isSaving()) {
              <span class="flex items-center justify-center gap-2">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </span>
            } @else {
              Save Configuration
            }
          </button>
        </div>

        <!-- Other Settings Sections (Future) -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div class="flex items-center gap-3 text-slate-400">
            <app-icon name="settings" [size]="24"></app-icon>
            <p class="text-sm">More settings coming soon...</p>
          </div>
        </div>
      </div>

      <!-- Success Toast -->
      @if (showSuccessToast()) {
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div class="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <app-icon name="check-circle" [size]="20"></app-icon>
            <span class="font-semibold">{{ successMessage() }}</span>
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
export class SettingsComponent implements OnInit {
  private router = inject(Router);
  private imageUploadService = inject(ImageUploadService);
  
  selectedProvider = signal<ImageProvider>('imgbb');
  showSecrets = {
    imgbb: signal(false),
    cloudflare: signal(false)
  };
  isSaving = signal(false);
  showSuccessToast = signal(false);
  successMessage = signal('');
  errorMessage = signal<string | null>(null);

  providers = [
    {
      id: 'imgbb' as ImageProvider,
      name: 'ImgBB',
      description: 'Free unlimited image hosting with 32MB file size limit'
    },
    {
      id: 'cloudinary' as ImageProvider,
      name: 'Cloudinary',
      description: 'Professional image hosting with optimization and transformations'
    },
    {
      id: 'cloudflare-r2' as ImageProvider,
      name: 'Cloudflare R2',
      description: 'S3-compatible object storage with zero egress fees'
    }
  ];

  imgbbConfig = {
    apiKey: ''
  };

  cloudinaryConfig = {
    cloudName: '',
    uploadPreset: ''
  };

  cloudflareConfig = {
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: ''
  };

  ngOnInit() {
    this.loadConfiguration();
  }

  loadConfiguration() {
    this.selectedProvider.set(this.imageUploadService.getProvider());
    const config = this.imageUploadService.getConfig();

    if (config.imgbb) {
      this.imgbbConfig.apiKey = config.imgbb.apiKey;
    }

    if (config.cloudinary) {
      this.cloudinaryConfig.cloudName = config.cloudinary.cloudName;
      this.cloudinaryConfig.uploadPreset = config.cloudinary.uploadPreset;
    }

    if (config.cloudflareR2) {
      this.cloudflareConfig.accountId = config.cloudflareR2.accountId;
      this.cloudflareConfig.accessKeyId = config.cloudflareR2.accessKeyId;
      this.cloudflareConfig.secretAccessKey = config.cloudflareR2.secretAccessKey;
      this.cloudflareConfig.bucketName = config.cloudflareR2.bucketName;
      this.cloudflareConfig.publicUrl = config.cloudflareR2.publicUrl;
    }
  }

  selectProvider(provider: ImageProvider) {
    this.selectedProvider.set(provider);
  }

  toggleSecret(provider: 'imgbb' | 'cloudflare') {
    this.showSecrets[provider].update(v => !v);
  }

  isProviderConfigured(provider: ImageProvider): boolean {
    return this.imageUploadService.isProviderConfigured(provider);
  }

  saveConfiguration() {
    const provider = this.selectedProvider();

    // Validate configuration
    if (provider === 'cloudinary') {
      if (!this.cloudinaryConfig.cloudName.trim() || !this.cloudinaryConfig.uploadPreset.trim()) {
        this.showError('Please fill in all Cloudinary fields');
        return;
      }
    } else if (provider === 'cloudflare-r2') {
      if (!this.cloudflareConfig.accountId.trim() || !this.cloudflareConfig.accessKeyId.trim() || 
          !this.cloudflareConfig.secretAccessKey.trim() || !this.cloudflareConfig.bucketName.trim()) {
        this.showError('Please fill in all Cloudflare R2 fields');
        return;
      }
    }

    this.isSaving.set(true);

    try {
      // Build config object
      const config: ProviderConfig = {};

      if (this.imgbbConfig.apiKey.trim()) {
        config.imgbb = { apiKey: this.imgbbConfig.apiKey.trim() };
      }

      if (this.cloudinaryConfig.cloudName.trim() && this.cloudinaryConfig.uploadPreset.trim()) {
        config.cloudinary = {
          cloudName: this.cloudinaryConfig.cloudName.trim(),
          uploadPreset: this.cloudinaryConfig.uploadPreset.trim()
        };
      }

      if (this.cloudflareConfig.accountId.trim()) {
        config.cloudflareR2 = {
          accountId: this.cloudflareConfig.accountId.trim(),
          accessKeyId: this.cloudflareConfig.accessKeyId.trim(),
          secretAccessKey: this.cloudflareConfig.secretAccessKey.trim(),
          bucketName: this.cloudflareConfig.bucketName.trim(),
          publicUrl: this.cloudflareConfig.publicUrl.trim()
        };
      }

      // Save configuration
      this.imageUploadService.saveConfig(config);
      this.imageUploadService.setProvider(provider);

      this.showSuccess('Configuration saved successfully!');
    } catch (err) {
      this.showError('Failed to save configuration');
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/app/profile']);
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.showSuccessToast.set(true);
    setTimeout(() => {
      this.showSuccessToast.set(false);
    }, 2000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => {
      this.errorMessage.set(null);
    }, 3000);
  }
}

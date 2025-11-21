import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { ImageUploadService, ImageProvider, ProviderConfig, FileType } from '../services/image-upload.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <!-- Header -->
      <div class="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center gap-4">
            <button (click)="goBack()" class="p-2.5 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95">
              <app-icon name="arrow-left" [size]="22" class="text-slate-700 dark:text-slate-300"></app-icon>
            </button>
            <div class="flex-1">
              <h1 class="font-bold text-2xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Settings
              </h1>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Customize your experience</p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div class="grid lg:grid-cols-[280px_1fr] gap-6">
          <!-- Settings Navigation Sidebar -->
          <div class="lg:sticky lg:top-24 h-fit">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div class="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 class="font-semibold text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wider">Categories</h2>
              </div>
              <nav class="p-2">
                @for (section of settingsSections; track section.id) {
                  <button
                    (click)="activeSection.set(section.id)"
                    [class.bg-gradient-to-r]="activeSection() === section.id"
                    [class.from-indigo-500]="activeSection() === section.id"
                    [class.to-purple-500]="activeSection() === section.id"
                    [class.text-white]="activeSection() === section.id"
                    [class.shadow-lg]="activeSection() === section.id"
                    [class.shadow-indigo-500/30]="activeSection() === section.id"
                    class="w-full px-4 py-3 mb-1 flex items-center gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative overflow-hidden">
                    @if (activeSection() === section.id) {
                      <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse"></div>
                    }
                    <div class="relative z-10 flex items-center gap-3 flex-1">
                      <app-icon 
                        [name]="section.icon" 
                        [size]="20" 
                        [class.text-white]="activeSection() === section.id"
                        [class.text-slate-600]="activeSection() !== section.id"
                        [class.dark:text-slate-400]="activeSection() !== section.id"
                        class="transition-transform group-hover:scale-110"></app-icon>
                      <span 
                        [class.font-semibold]="activeSection() === section.id"
                        class="text-sm transition-all">
                        {{ section.title }}
                      </span>
                    </div>
                    @if (activeSection() === section.id) {
                      <div class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    }
                  </button>
                }
              </nav>
            </div>
          </div>

          <!-- Active Section Content -->
          <div class="min-h-[600px]">
            @switch (activeSection()) {
              @case ('upload') {
                <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <!-- Section Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Providers</h2>
          <p class="text-slate-600 dark:text-slate-400">Configure file upload services for different media types</p>
        </div>

        <!-- Provider Selection by File Type -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div class="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/30">
                <app-icon name="cloud" [size]="22" class="text-white"></app-icon>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg text-slate-900 dark:text-white">Provider Selection</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  Choose different providers for each file type
                </p>
              </div>
            </div>
          </div>
          
          <div class="p-6 space-y-5">

            <!-- Photo Provider -->
            <div class="space-y-2.5">
              <div class="flex items-center gap-2">
                <span class="text-2xl">📷</span>
                <label class="block text-sm font-bold text-slate-900 dark:text-white">
                  Photo Provider
                </label>
              </div>
              <select 
                [(ngModel)]="photoProvider"
                (change)="onProviderChange()"
                class="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer font-medium">
                @for (provider of photoProviders; track provider.id) {
                  <option [value]="provider.id">{{ provider.name }}</option>
                }
              </select>
              <div class="flex items-start gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <app-icon name="info" [size]="14" class="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"></app-icon>
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  ImgBB (images only), Cloudinary (images), Cloudflare R2 (all types)
                </p>
              </div>
            </div>

            <!-- Video Provider -->
            <div class="space-y-2.5">
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎥</span>
                <label class="block text-sm font-bold text-slate-900 dark:text-white">
                  Video Provider
                </label>
              </div>
              <select 
                [(ngModel)]="videoProvider"
                (change)="onProviderChange()"
                class="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer font-medium">
                @for (provider of videoProviders; track provider.id) {
                  <option [value]="provider.id">{{ provider.name }}</option>
                }
              </select>
              <div class="flex items-start gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <app-icon name="info" [size]="14" class="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"></app-icon>
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  Cloudinary (videos), Cloudflare R2 (all types)
                </p>
              </div>
            </div>

            <!-- Other Files Provider -->
            <div class="space-y-2.5">
              <div class="flex items-center gap-2">
                <span class="text-2xl">📄</span>
                <label class="block text-sm font-bold text-slate-900 dark:text-white">
                  Other Files Provider
                </label>
              </div>
              <select 
                [(ngModel)]="otherProvider"
                (change)="onProviderChange()"
                class="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer font-medium">
                @for (provider of otherProviders; track provider.id) {
                  <option [value]="provider.id">{{ provider.name }}</option>
                }
              </select>
              <div class="flex items-start gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <app-icon name="info" [size]="14" class="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"></app-icon>
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  Cloudflare R2 only (all file types)
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Provider Configuration -->
        @if (needsConfiguration()) {
          @if (photoProvider === 'imgbb' || videoProvider === 'imgbb' || otherProvider === 'imgbb') {
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
          
          @if (photoProvider === 'cloudinary' || videoProvider === 'cloudinary' || otherProvider === 'cloudinary') {
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

              <div class="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <app-icon name="check-circle" [size]="18" class="text-green-600 dark:text-green-400"></app-icon>
                  </div>
                  <div class="text-sm text-green-900 dark:text-green-100">
                    <p class="font-semibold mb-1">Default Configuration Active</p>
                    <p class="text-green-700 dark:text-green-300">
                      Cloudinary is ready to use with default credentials. You can optionally configure your own account below.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cloud Name (Optional)
                  </label>
                  <input 
                    [(ngModel)]="cloudinaryConfig.cloudName" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="your-cloud-name">
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Upload Preset (Optional)
                  </label>
                  <input 
                    [(ngModel)]="cloudinaryConfig.uploadPreset" 
                    type="text"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="your-upload-preset">
                </div>

                @if (hasCustomConfig('cloudinary')) {
                  <button 
                    (click)="clearCloudinaryConfig()"
                    class="w-full px-4 py-2.5 rounded-lg font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Reset to Default
                  </button>
                }
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
                      <li>• Automatic image optimization and transformations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          }

          @if (photoProvider === 'cloudflare-r2' || videoProvider === 'cloudflare-r2' || otherProvider === 'cloudflare-r2') {
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
        <div class="sticky bottom-6 z-20">
          <button 
            (click)="saveConfiguration()"
            [disabled]="isSaving()"
            class="w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-2xl shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:shadow-indigo-500/40 hover:-translate-y-0.5">
            @if (isSaving()) {
              <span class="flex items-center justify-center gap-3">
                <div class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span class="text-lg">Saving Changes...</span>
              </span>
            } @else {
              <span class="flex items-center justify-center gap-2">
                <app-icon name="check" [size]="20"></app-icon>
                <span class="text-lg">Save Configuration</span>
              </span>
            }
          </button>
        </div>

                </div>
              }
              
              @case ('appearance') {
                <div class="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Appearance</h2>
                    <p class="text-slate-600 dark:text-slate-400">Customize the look and feel of your app</p>
                  </div>
                  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                    <div class="inline-flex p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl mb-4">
                      <app-icon name="palette" [size]="48" class="text-pink-500"></app-icon>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                    <p class="text-slate-600 dark:text-slate-400">Theme customization and appearance settings</p>
                  </div>
                </div>
              }
              
              @case ('notifications') {
                <div class="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Notifications</h2>
                    <p class="text-slate-600 dark:text-slate-400">Manage how you receive notifications</p>
                  </div>
                  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                    <div class="inline-flex p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl mb-4">
                      <app-icon name="bell" [size]="48" class="text-blue-500"></app-icon>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                    <p class="text-slate-600 dark:text-slate-400">Notification preferences and controls</p>
                  </div>
                </div>
              }
              
              @case ('privacy') {
                <div class="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Privacy & Security</h2>
                    <p class="text-slate-600 dark:text-slate-400">Control your privacy and security settings</p>
                  </div>
                  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                    <div class="inline-flex p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl mb-4">
                      <app-icon name="shield" [size]="48" class="text-green-500"></app-icon>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                    <p class="text-slate-600 dark:text-slate-400">Privacy controls and security options</p>
                  </div>
                </div>
              }
              
              @case ('account') {
                <div class="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account</h2>
                    <p class="text-slate-600 dark:text-slate-400">Manage your account information</p>
                  </div>
                  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                    <div class="inline-flex p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl mb-4">
                      <app-icon name="user" [size]="48" class="text-orange-500"></app-icon>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                    <p class="text-slate-600 dark:text-slate-400">Account settings and preferences</p>
                  </div>
                </div>
              }
            }
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
  
  activeSection = signal<string>('upload');
  
  settingsSections = [
    {
      id: 'upload',
      icon: 'cloud-upload',
      title: 'Upload Providers',
      description: 'Configure file upload services'
    },
    {
      id: 'appearance',
      icon: 'palette',
      title: 'Appearance',
      description: 'Theme and display preferences'
    },
    {
      id: 'notifications',
      icon: 'bell',
      title: 'Notifications',
      description: 'Manage notification settings'
    },
    {
      id: 'privacy',
      icon: 'shield',
      title: 'Privacy & Security',
      description: 'Control your privacy settings'
    },
    {
      id: 'account',
      icon: 'user',
      title: 'Account',
      description: 'Manage your account settings'
    }
  ];
  
  photoProvider: ImageProvider = 'imgbb';
  videoProvider: ImageProvider = 'imgbb';
  otherProvider: ImageProvider = 'imgbb';
  
  showSecrets = {
    imgbb: signal(false),
    cloudflare: signal(false)
  };
  isSaving = signal(false);
  showSuccessToast = signal(false);
  successMessage = signal('');
  errorMessage = signal<string | null>(null);

  // All providers with their capabilities
  allProviders = [
    {
      id: 'imgbb' as ImageProvider,
      name: 'ImgBB',
      description: 'Free unlimited image hosting (Default)',
      supports: ['photo'] as FileType[]
    },
    {
      id: 'cloudinary' as ImageProvider,
      name: 'Cloudinary',
      description: 'Professional media hosting with optimization',
      supports: ['photo', 'video'] as FileType[]
    },
    {
      id: 'cloudflare-r2' as ImageProvider,
      name: 'Cloudflare R2',
      description: 'S3-compatible object storage (all file types)',
      supports: ['photo', 'video', 'other'] as FileType[]
    }
  ];

  // Filtered providers for each file type
  get photoProviders() {
    return this.allProviders.filter(p => p.supports.includes('photo'));
  }

  get videoProviders() {
    return this.allProviders.filter(p => p.supports.includes('video'));
  }

  get otherProviders() {
    return this.allProviders.filter(p => p.supports.includes('other'));
  }

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
    const providers = this.imageUploadService.getProviders();
    
    // Validate and set providers based on capabilities
    this.photoProvider = this.isValidProvider(providers.photo, 'photo') ? providers.photo : 'imgbb';
    this.videoProvider = this.isValidProvider(providers.video, 'video') ? providers.video : 'cloudinary';
    this.otherProvider = this.isValidProvider(providers.other, 'other') ? providers.other : 'cloudflare-r2';
    
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

  isValidProvider(provider: ImageProvider, fileType: FileType): boolean {
    const providerInfo = this.allProviders.find(p => p.id === provider);
    return providerInfo ? providerInfo.supports.includes(fileType) : false;
  }

  onProviderChange() {
    // Trigger UI update when provider selection changes
  }

  needsConfiguration(): boolean {
    return true; // Always show configuration sections
  }

  toggleSecret(provider: 'imgbb' | 'cloudflare') {
    this.showSecrets[provider].update(v => !v);
  }

  isProviderConfigured(provider: ImageProvider): boolean {
    return this.imageUploadService.isProviderConfigured(provider);
  }

  hasCustomConfig(provider: ImageProvider): boolean {
    return this.imageUploadService.hasCustomConfig(provider);
  }

  clearCloudinaryConfig() {
    this.cloudinaryConfig.cloudName = '';
    this.cloudinaryConfig.uploadPreset = '';
    this.showSuccess('Cloudinary reset to default configuration');
  }

  saveConfiguration() {
    // Validate Cloudinary if used
    const usesCloudinary = this.photoProvider === 'cloudinary' || this.videoProvider === 'cloudinary' || this.otherProvider === 'cloudinary';
    if (usesCloudinary) {
      if (this.cloudinaryConfig.cloudName.trim() && !this.cloudinaryConfig.uploadPreset.trim()) {
        this.showError('Upload preset is required when using custom cloud name');
        return;
      }
      if (!this.cloudinaryConfig.cloudName.trim() && this.cloudinaryConfig.uploadPreset.trim()) {
        this.showError('Cloud name is required when using custom upload preset');
        return;
      }
    }

    // Validate R2 if used
    const usesR2 = this.photoProvider === 'cloudflare-r2' || this.videoProvider === 'cloudflare-r2' || this.otherProvider === 'cloudflare-r2';
    if (usesR2) {
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
      
      // Save provider selections for each file type
      this.imageUploadService.setProviderForType('photo', this.photoProvider);
      this.imageUploadService.setProviderForType('video', this.videoProvider);
      this.imageUploadService.setProviderForType('other', this.otherProvider);

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

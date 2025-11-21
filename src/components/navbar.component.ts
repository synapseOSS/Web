
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from './icon.component';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
         [class]="isScrolled() 
           ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 py-3' 
           : 'py-4'">
      
      <!-- Scroll Progress Bar -->
      <div class="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-150 ease-out z-50"
           [style.width.%]="scrollPercent()"
           [style.opacity]="scrollPercent() > 1 ? 1 : 0"></div>

      <div class="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-2 md:gap-3 group cursor-pointer" routerLink="/">
            <div class="relative w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <div class="absolute inset-0 bg-indigo-500 blur-lg opacity-50"></div>
              <app-icon name="zap" [size]="20" class="text-white relative z-10"></app-icon>
            </div>
            <span class="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Synapse</span>
          </div>

          <!-- Desktop Links - Centered -->
          <div class="hidden lg:flex items-center gap-10 xl:gap-12 absolute left-1/2 -translate-x-1/2">
            <a routerLink="/pricing" routerLinkActive="text-indigo-600 dark:text-indigo-400 font-bold" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-base font-medium cursor-pointer">Pricing</a>
            <a routerLink="/downloads" routerLinkActive="text-indigo-600 dark:text-indigo-400 font-bold" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-base font-medium cursor-pointer">Downloads</a>
            <a routerLink="/docs" routerLinkActive="text-indigo-600 dark:text-indigo-400 font-bold" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-base font-medium cursor-pointer">Docs</a>
            <a routerLink="/changelog" routerLinkActive="text-indigo-600 dark:text-indigo-400 font-bold" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-base font-medium">Changelog</a>
          </div>

          <!-- CTA & Mobile Menu -->
          <div class="flex items-center gap-3 md:gap-4 lg:gap-5">
            <!-- Theme Toggle -->
            <button (click)="themeService.toggle()" class="p-2 md:p-2.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" [attr.aria-label]="themeService.darkMode() ? 'Switch to light mode' : 'Switch to dark mode'">
              <app-icon [name]="themeService.darkMode() ? 'sun' : 'moon'" [size]="20"></app-icon>
            </button>

            @if (authService.currentUser()) {
              <a routerLink="/admin" class="hidden lg:flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white font-medium text-base transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <app-icon name="users" [size]="18"></app-icon>
                Admin
              </a>
            } @else {
              <a routerLink="/login" class="hidden lg:flex text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white font-medium text-base transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Log In</a>
            }

            <button class="hidden lg:flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-2.5 rounded-full font-semibold text-base hover:bg-slate-800 dark:hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
              Launch Web
              <app-icon name="chevron-right" [size]="18"></app-icon>
            </button>
            
            <button class="lg:hidden text-slate-900 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white p-2" (click)="toggleMenu()">
              <app-icon [name]="mobileMenuOpen() ? 'x' : 'menu'" [size]="24"></app-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 shadow-2xl">
          <a routerLink="/pricing" (click)="toggleMenu()" class="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">Pricing</a>
          <a routerLink="/downloads" (click)="toggleMenu()" class="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">Downloads</a>
          <a routerLink="/docs" (click)="toggleMenu()" class="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">Documentation</a>
          <a routerLink="/" fragment="features" (click)="toggleMenu()" class="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">Features</a>
          <a routerLink="/changelog" (click)="toggleMenu()" class="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">Changelog</a>
          @if (authService.currentUser()) {
             <a routerLink="/admin" (click)="toggleMenu()" class="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">Admin Dashboard</a>
          } @else {
             <a routerLink="/login" (click)="toggleMenu()" class="text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors">Log In</a>
          }
          <button class="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors">
            Get Started
          </button>
        </div>
      }
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  isScrolled = signal(false);
  mobileMenuOpen = signal(false);
  scrollPercent = signal(0);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        this.isScrolled.set(y > 20);
        
        // Calculate scroll percentage for progress bar
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const trackLength = docHeight - winHeight;
        const percent = Math.floor((scrollTop / trackLength) * 100);
        this.scrollPercent.set(percent);
      }, { passive: true });
    }
  }

  toggleMenu() {
    this.mobileMenuOpen.update(v => !v);
  }
}

import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../components/icon.component';
import { AuthService } from '../services/auth.service';
import { SocialService } from '../services/social.service';
import { SearchService, SearchResult } from '../services/search.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, FormsModule],
  template: `
    @if (isLaunching()) {
      <!-- Launcher Splash Screen -->
      <div class="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col items-center justify-center overflow-hidden select-none cursor-wait">
        
        <!-- Background Grid Effect -->
        <div class="absolute inset-0 bg-grid opacity-10"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950"></div>

        <!-- Central Logo Animation -->
        <div class="relative mb-12">
          <div class="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 animate-pulse"></div>
          <div class="relative w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-float">
             <app-icon name="zap" [size]="48" class="text-white"></app-icon>
          </div>
          
          <!-- Orbiting Particles -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full animate-spin-slow"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-500/20 rounded-full animate-spin-reverse"></div>
        </div>

        <!-- Status Text -->
        <h2 class="text-2xl font-bold mb-2 tracking-tight">Synapse<span class="text-indigo-500">Launcher</span></h2>
        
        <div class="h-8 flex items-center justify-center mb-8">
          <span class="text-slate-400 font-mono text-sm animate-pulse">{{ statusText() }}</span>
        </div>

        <!-- Progress Bar -->
        <div class="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
          <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-300 ease-out"
               [style.width.%]="progress()"></div>
        </div>
        
        <div class="mt-12 text-xs text-slate-600 font-mono">
          v2.4.0-rc1 // ENCRYPTED_UPLINK_ESTABLISHED
        </div>
      </div>
    } @else {
      <!-- Main App Layout -->
      <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex justify-center animate-in fade-in duration-500">
        
        <!-- Left Sidebar (Navigation) -->
        <nav class="hidden md:flex flex-col w-20 xl:w-64 sticky top-0 h-screen px-2 py-4 xl:px-4 border-r border-slate-200 dark:border-white/5 justify-between z-30">
          <div class="space-y-1">
            <!-- Logo -->
            <a routerLink="/app/feed" class="block w-12 h-12 xl:w-auto p-2 mb-4 rounded-full hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors w-max">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                 <app-icon name="zap" [size]="18" class="text-white"></app-icon>
              </div>
            </a>

            <!-- Nav Items -->
            <a routerLink="/app/feed" routerLinkActive="font-bold text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/10" class="flex items-center gap-4 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xl xl:pr-6 w-max xl:w-auto text-slate-700 dark:text-slate-300">
              <app-icon [name]="'globe'" [size]="26"></app-icon>
              <span class="hidden xl:block">Home</span>
            </a>
            <a routerLink="/app/explore" routerLinkActive="font-bold text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/10" class="flex items-center gap-4 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xl xl:pr-6 w-max xl:w-auto text-slate-700 dark:text-slate-300">
              <app-icon [name]="'hash'" [size]="26"></app-icon>
              <span class="hidden xl:block">Explore</span>
            </a>
            <a routerLink="/app/notifications" routerLinkActive="font-bold text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/10" class="flex items-center gap-4 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xl xl:pr-6 w-max xl:w-auto text-slate-700 dark:text-slate-300">
              <app-icon [name]="'bell'" [size]="26"></app-icon>
              <span class="hidden xl:block">Notifications</span>
            </a>
            <a routerLink="/app/messages" routerLinkActive="font-bold text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/10" class="flex items-center gap-4 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xl xl:pr-6 w-max xl:w-auto text-slate-700 dark:text-slate-300">
              <app-icon [name]="'mail'" [size]="26"></app-icon>
              <span class="hidden xl:block">Messages</span>
            </a>
            <a routerLink="/app/bookmarks" routerLinkActive="font-bold text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/10" class="flex items-center gap-4 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xl xl:pr-6 w-max xl:w-auto text-slate-700 dark:text-slate-300">
              <app-icon [name]="'bookmark'" [size]="26"></app-icon>
              <span class="hidden xl:block">Bookmarks</span>
            </a>
            <a routerLink="/app/profile" routerLinkActive="font-bold text-indigo-600 dark:text-white bg-slate-100 dark:bg-white/10" class="flex items-center gap-4 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xl xl:pr-6 w-max xl:w-auto text-slate-700 dark:text-slate-300">
              <app-icon [name]="'users'" [size]="26"></app-icon>
              <span class="hidden xl:block">Profile</span>
            </a>
            
            <button class="hidden xl:block w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full py-3.5 font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Post
            </button>
            <button class="xl:hidden mt-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all hover:scale-110">
              <app-icon name="send" [size]="24"></app-icon>
            </button>
          </div>

          <!-- User Menu -->
          <div class="cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 rounded-full p-3 xl:pr-6 flex items-center gap-3 transition-colors group" (click)="logout()">
             <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
               <img [src]="socialService.currentUser().avatar" alt="Me" class="w-full h-full object-cover">
             </div>
             <div class="hidden xl:block flex-1 min-w-0">
               <div class="font-bold truncate text-sm">{{ socialService.currentUser().display_name }}</div>
               <div class="text-slate-500 text-sm truncate">@{{ socialService.currentUser().username }}</div>
             </div>
             <app-icon name="more-horizontal" [size]="16" class="hidden xl:block text-slate-400 group-hover:text-indigo-500"></app-icon>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="w-full max-w-[600px] flex-shrink-0 min-h-screen pb-20 md:pb-0">
          <router-outlet></router-outlet>
        </main>

        <!-- Right Sidebar (Trending) -->
        <aside class="hidden lg:block w-80 xl:w-96 pl-8 py-4 sticky top-0 h-screen overflow-y-auto">
          <!-- Search -->
          <div class="relative mb-6 group">
            <div class="absolute left-4 top-3 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
              <app-icon name="filter" [size]="20"></app-icon>
            </div>
            <input type="text" placeholder="Search Synapse" class="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black rounded-full py-3 pl-12 pr-4 outline-none transition-all placeholder-slate-500 dark:text-white">
          </div>

          <!-- Trending Box (News Card) -->
          <div class="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden mb-6">
            <h2 class="font-bold text-xl p-4 pb-2 text-slate-900 dark:text-white border-b border-slate-200/50 dark:border-white/5">Trending Now</h2>
            
            <!-- Item 1 with Image -->
            <div class="p-4 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-200/50 dark:border-white/5 relative group">
               <div class="flex gap-3">
                 <div class="flex-1">
                    <div class="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <span class="text-indigo-500 font-bold">LIVE</span>
                      <span>·</span>
                      <span>Technology</span>
                    </div>
                    <div class="font-bold text-sm text-slate-900 dark:text-white mb-1 leading-tight group-hover:text-indigo-500 transition-colors">
                       The Future of Decentralized Social Protocols
                    </div>
                    <div class="text-xs text-slate-500">12.5K watching</div>
                 </div>
                 <div class="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <img src="https://picsum.photos/seed/tech/200/200" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                 </div>
               </div>
            </div>

            <!-- Item 2 -->
            <div class="p-4 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-200/50 dark:border-white/5 group">
               <div class="text-xs text-slate-500 mb-1 flex justify-between">
                 <span>Open Source · Trending</span>
                 <app-icon name="more-horizontal" [size]="14" class="opacity-0 group-hover:opacity-100 transition-opacity"></app-icon>
               </div>
               <div class="font-bold text-sm text-slate-900 dark:text-white mb-0.5 group-hover:text-indigo-500 transition-colors">#SynapseV2</div>
               <div class="text-xs text-slate-500">54.2K posts</div>
            </div>

            <!-- Item 3 -->
             <div class="p-4 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-200/50 dark:border-white/5 group">
               <div class="text-xs text-slate-500 mb-1">Politics · Trending</div>
               <div class="font-bold text-sm text-slate-900 dark:text-white mb-0.5 group-hover:text-indigo-500 transition-colors">Digital Rights Act</div>
               <div class="text-xs text-slate-500">89K posts</div>
            </div>

             <button class="w-full p-3 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left font-medium pl-4">
                Show more
             </button>
          </div>

          <!-- Suggested Users -->
          <div class="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden mb-6">
            <h2 class="font-bold text-xl p-4 pb-2 text-slate-900 dark:text-white">Who to follow</h2>
            @for (user of socialService.getSuggestedUsers(); track user.id) {
               <div class="p-4 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-200/50 dark:border-white/5 last:border-0 flex items-center gap-3">
                 <img [src]="user.avatar" class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 object-cover">
                 <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm truncate text-slate-900 dark:text-white flex items-center gap-1">
                      {{ user.display_name }}
                      @if (user.verify) { <app-icon name="verified" [size]="14" class="text-indigo-500"></app-icon> }
                    </div>
                    <div class="text-xs text-slate-500 truncate">@{{ user.username }}</div>
                 </div>
                 <button class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">Follow</button>
               </div>
            }
          </div>

          <!-- Footer Links -->
          <nav class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 px-4 leading-relaxed">
            <a href="#" class="hover:underline hover:text-indigo-500">Terms</a>
            <a href="#" class="hover:underline hover:text-indigo-500">Privacy Policy</a>
            <a href="#" class="hover:underline hover:text-indigo-500">Accessibility</a>
            <a href="#" class="hover:underline hover:text-indigo-500">More</a>
            <span>© 2025 Synapse OSS</span>
          </nav>
        </aside>

        <!-- Mobile Bottom Nav -->
        <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 px-4 py-3 flex justify-between items-center z-50">
          <a routerLink="/app/feed" routerLinkActive="text-indigo-600 dark:text-indigo-400" class="p-2 text-slate-500 dark:text-slate-400"><app-icon name="globe" [size]="24"></app-icon></a>
          <button (click)="toggleMobileSearch()" [class.text-indigo-600]="showMobileSearch()" [class.dark:text-indigo-400]="showMobileSearch()" class="p-2 text-slate-500 dark:text-slate-400 transition-colors"><app-icon name="search" [size]="24"></app-icon></button>
          <a routerLink="/app/explore" routerLinkActive="text-indigo-600 dark:text-indigo-400" class="p-2 text-slate-500 dark:text-slate-400"><app-icon name="hash" [size]="24"></app-icon></a>
          <a routerLink="/app/messages" routerLinkActive="text-indigo-600 dark:text-indigo-400" class="p-2 text-slate-500 dark:text-slate-400"><app-icon name="mail" [size]="24"></app-icon></a>
          <a routerLink="/app/profile" routerLinkActive="text-indigo-600 dark:text-indigo-400" class="p-2 text-slate-500 dark:text-slate-400"><app-icon name="users" [size]="24"></app-icon></a>
        </div>

        <!-- Mobile Search Overlay -->
        @if (showMobileSearch()) {
          <div class="md:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-950 animate-in slide-in-from-bottom duration-300">
            <!-- Header -->
            <div class="sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
              <button (click)="toggleMobileSearch()" class="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <app-icon name="arrow-left" [size]="24" class="text-slate-700 dark:text-slate-300"></app-icon>
              </button>
              <div class="flex-1 relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <app-icon name="search" [size]="20"></app-icon>
                </div>
                <input 
                  #mobileSearchInput
                  type="text" 
                  [(ngModel)]="mobileSearchQuery"
                  (input)="onMobileSearch()"
                  placeholder="Search Synapse" 
                  class="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500 rounded-full py-2.5 pl-10 pr-10 outline-none transition-all placeholder-slate-500 dark:text-white">
                @if (mobileSearchQuery()) {
                  <button 
                    (click)="clearMobileSearch()" 
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <app-icon name="x" [size]="16" class="text-slate-500"></app-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Search Results -->
            <div class="overflow-y-auto h-[calc(100vh-64px)] px-4 py-4">
              @if (isSearching()) {
                <div class="flex items-center justify-center py-12">
                  <div class="w-8 h-8 border-3 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              } @else if (mobileSearchQuery() && searchResults().length === 0) {
                <div class="text-center py-12">
                  <div class="inline-flex p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-4">
                    <app-icon name="search" [size]="48" class="text-slate-400"></app-icon>
                  </div>
                  <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">No results found</h3>
                  <p class="text-slate-600 dark:text-slate-400">Try searching for something else</p>
                </div>
              } @else if (searchResults().length > 0) {
                <div class="space-y-1">
                  @for (result of searchResults(); track result.data.id) {
                    <div class="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer">
                      @if (result.type === 'user') {
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                            <img [src]="result.data.avatar" [alt]="result.data.display_name" class="w-full h-full object-cover">
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="font-bold text-slate-900 dark:text-white truncate">{{ result.data.display_name }}</div>
                            <div class="text-sm text-slate-500 truncate">@{{ result.data.username }}</div>
                          </div>
                        </div>
                      } @else if (result.type === 'hashtag') {
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                            <app-icon name="hash" [size]="24" class="text-indigo-600 dark:text-indigo-400"></app-icon>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="font-bold text-slate-900 dark:text-white">#{{ result.data.name }}</div>
                            <div class="text-sm text-slate-500">{{ result.data.post_count || 0 }} posts</div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="space-y-6">
                  <!-- Recent Searches -->
                  @if (recentSearches().length > 0) {
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="font-bold text-slate-900 dark:text-white">Recent</h3>
                        <button (click)="clearRecentSearches()" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Clear all</button>
                      </div>
                      <div class="space-y-1">
                        @for (query of recentSearches(); track query) {
                          <button 
                            (click)="searchRecent(query)"
                            class="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors text-left">
                            <app-icon name="clock" [size]="20" class="text-slate-400"></app-icon>
                            <span class="flex-1 text-slate-900 dark:text-white">{{ query }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  <!-- Trending -->
                  <div>
                    <h3 class="font-bold text-slate-900 dark:text-white mb-3">Trending</h3>
                    <div class="space-y-1">
                      <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer">
                        <div class="text-xs text-slate-500 mb-1">Technology · Trending</div>
                        <div class="font-bold text-slate-900 dark:text-white">#WebDevelopment</div>
                        <div class="text-xs text-slate-500">12.5K posts</div>
                      </div>
                      <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer">
                        <div class="text-xs text-slate-500 mb-1">Design · Trending</div>
                        <div class="font-bold text-slate-900 dark:text-white">#UIDesign</div>
                        <div class="text-xs text-slate-500">8.2K posts</div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    @keyframes spin-slow {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes spin-reverse {
      from { transform: translate(-50%, -50%) rotate(360deg); }
      to { transform: translate(-50%, -50%) rotate(0deg); }
    }
    .animate-spin-slow { animation: spin-slow 8s linear infinite; }
    .animate-spin-reverse { animation: spin-reverse 6s linear infinite; }
  `]
})
export class AppLayoutComponent implements OnInit {
  authService = inject(AuthService);
  socialService = inject(SocialService);
  searchService = inject(SearchService);
  
  isLaunching = signal(true);
  progress = signal(0);
  statusText = signal('Initializing...');

  // Mobile search
  showMobileSearch = signal(false);
  mobileSearchQuery = signal('');
  isSearching = signal(false);
  searchResults = signal<SearchResult[]>([]);
  recentSearches = signal<string[]>([]);

  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  ngOnInit() {
    // Simulate launcher sequence
    this.runLauncherSequence();
    // Load recent searches
    this.recentSearches.set(this.searchService.recentSearches());
  }

  toggleMobileSearch() {
    this.showMobileSearch.update(v => !v);
    if (this.showMobileSearch()) {
      // Focus input after animation
      setTimeout(() => {
        this.mobileSearchInput?.nativeElement.focus();
      }, 100);
    } else {
      // Clear search when closing
      this.clearMobileSearch();
    }
  }

  async onMobileSearch() {
    const query = this.mobileSearchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    await this.searchService.search(query);
    this.searchResults.set(this.searchService.searchResults());
    this.recentSearches.set(this.searchService.recentSearches());
    this.isSearching.set(false);
  }

  clearMobileSearch() {
    this.mobileSearchQuery.set('');
    this.searchResults.set([]);
  }

  searchRecent(query: string) {
    this.mobileSearchQuery.set(query);
    this.onMobileSearch();
  }

  clearRecentSearches() {
    this.searchService.clearRecentSearches();
    this.recentSearches.set([]);
  }

  logout() {
    this.authService.logout();
  }

  private runLauncherSequence() {
    const steps = [
      { time: 500, text: 'Connecting to Network...', progress: 20 },
      { time: 1200, text: 'Verifying Identity Keys...', progress: 45 },
      { time: 2000, text: 'Syncing Social Graph...', progress: 70 },
      { time: 2800, text: 'Decryption Complete.', progress: 90 },
      { time: 3200, text: 'Launching...', progress: 100 }
    ];

    let stepIndex = 0;

    const nextStep = () => {
      if (stepIndex >= steps.length) {
        setTimeout(() => {
          this.isLaunching.set(false);
        }, 400);
        return;
      }

      const step = steps[stepIndex];
      
      // Interpolate random delays for realism
      const delay = stepIndex === 0 ? step.time : step.time - steps[stepIndex - 1].time;
      
      setTimeout(() => {
        this.statusText.set(step.text);
        this.progress.set(step.progress);
        stepIndex++;
        nextStep();
      }, delay);
    };

    nextStep();
  }
}

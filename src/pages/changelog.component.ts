
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../components/icon.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { DataService, ChangelogEntry, Platform } from '../services/data.service';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-changelog',
  standalone: true,
  imports: [CommonModule, IconComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-32 pb-20 relative overflow-hidden">
       <!-- Background Elements -->
       <div class="absolute inset-0 -z-10">
          <app-particles class="opacity-50 dark:opacity-40"></app-particles>
          <div class="absolute top-20 left-10 w-96 h-96 blur-[100px] rounded-full
                      bg-indigo-300/30 dark:bg-indigo-900/20"></div>
          <div class="absolute bottom-20 right-10 w-96 h-96 blur-[100px] rounded-full
                      bg-purple-300/30 dark:bg-purple-900/20"></div>
          <div class="absolute inset-0 bg-grid opacity-20"></div>
        </div>

      <div class="container mx-auto px-6 max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-12" appAnimateOnScroll>
           <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 border
                       bg-indigo-50 text-indigo-600 border-indigo-100
                       dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
             <app-icon name="sparkles" [size]="32"></app-icon>
           </div>
           <h1 class="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">Product Updates</h1>
           <p class="text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
             Stay up to date with the latest improvements, fixes, and features across all Synapse platforms.
           </p>
        </div>

        <!-- Filter -->
        <div class="flex flex-wrap justify-center gap-2 mb-12" appAnimateOnScroll>
          @for (platform of platforms; track platform) {
            <button 
              (click)="setFilter(platform)"
              class="px-4 py-2 rounded-full text-sm font-medium transition-all border"
              [class]="selectedPlatform() === platform 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25' 
                : 'bg-white/50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900 dark:bg-slate-900/50 dark:text-slate-400 dark:border-white/10 dark:hover:bg-slate-800 dark:hover:text-white'"
            >
              {{ platform }}
            </button>
          }
        </div>

        <!-- Content Area -->
        <div class="flex flex-col gap-4 relative min-h-[300px]">
          
          @if (loading()) {
             <div class="flex flex-col items-center justify-center py-20">
               <div class="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
               <div class="text-slate-500">Syncing with neural network...</div>
             </div>
          } @else if (error()) {
             <div class="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 text-center">
                <div class="flex items-center justify-center gap-3 mb-2 font-bold">
                  <app-icon name="bug" [size]="20"></app-icon>
                  Connection Error
                </div>
                <p class="text-sm opacity-80">{{ error() }}</p>
                <p class="text-xs mt-4 opacity-60">If you are the admin, please check your Firebase Console to ensure the Firestore Database is created.</p>
             </div>
          } @else if (filteredEntries().length === 0) {
             <div class="text-center py-20 text-slate-500">No updates found for this platform yet.</div>
          }

          @for (entry of filteredEntries(); track entry.id) {
            <div class="group" appAnimateOnScroll>
              <!-- Card -->
              <div class="rounded-xl p-6 transition-all border duration-300
                          bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md
                          dark:bg-slate-900/40 dark:border-white/5 dark:hover:bg-slate-900/60 dark:hover:border-indigo-500/30">
                
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                     <span class="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono text-xs font-bold">
                        v{{ entry.version }}
                     </span>
                     <span class="text-slate-500 text-xs font-medium">{{ entry.date }}</span>
                  </div>
                  
                  <!-- Platform Badge -->
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    [class]="getBadgeClass(entry.platform)">
                     @switch (entry.platform) {
                       @case ('Android') { <app-icon name="android" [size]="12"></app-icon> }
                       @case ('Web') { <app-icon name="globe" [size]="12"></app-icon> }
                       @case ('iOS') { <app-icon name="apple" [size]="12"></app-icon> }
                       @case ('Windows') { <app-icon name="windows" [size]="12"></app-icon> }
                     }
                     {{ entry.platform }}
                  </span>
                </div>

                <ul class="space-y-3">
                  @for (change of entry.changes; track change.text) {
                    <li class="flex items-start gap-3">
                      <span class="mt-1 shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full border
                                   bg-slate-50 border-slate-200
                                   dark:bg-slate-950 dark:border-white/10">
                        @switch (change.type) {
                          @case ('new') { <app-icon name="sparkles" [size]="8" class="text-yellow-500 dark:text-yellow-400"></app-icon> }
                          @case ('fix') { <app-icon name="bug" [size]="8" class="text-red-500 dark:text-red-400"></app-icon> }
                          @case ('improved') { <app-icon name="check" [size]="8" class="text-green-500 dark:text-green-400"></app-icon> }
                        }
                      </span>
                      <span class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        <span class="font-bold mr-1 text-[10px] uppercase tracking-wider opacity-70" 
                              [class.text-yellow-600]="change.type === 'new'"
                              [class.dark:text-yellow-400]="change.type === 'new'"
                              [class.text-red-600]="change.type === 'fix'"
                              [class.dark:text-red-400]="change.type === 'fix'"
                              [class.text-green-600]="change.type === 'improved'"
                              [class.dark:text-green-400]="change.type === 'improved'">
                          {{ change.type }}
                        </span>
                        {{ change.text }}
                      </span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ChangelogComponent implements OnInit {
  private dataService = inject(DataService);
  
  platforms: Platform[] = ['All', 'Android', 'Web', 'iOS', 'Windows', 'Linux'];
  selectedPlatform = signal<Platform>('All');
  entries = signal<ChangelogEntry[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    try {
      const data = await this.dataService.getChangelogs();
      this.entries.set(data);
    } catch (e: any) {
      console.error('Failed to load changelogs', e);
      this.error.set(e.message || 'Failed to load data from Firestore.');
    } finally {
      this.loading.set(false);
    }
  }

  filteredEntries = computed(() => {
    const platform = this.selectedPlatform();
    if (platform === 'All') {
      return this.entries();
    }
    return this.entries().filter(entry => entry.platform === platform);
  });

  setFilter(platform: Platform) {
    this.selectedPlatform.set(platform);
  }

  getBadgeClass(platform: Platform): string {
    switch (platform) {
      case 'Android': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'iOS': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-200/10 dark:text-slate-300 dark:border-slate-200/20';
      case 'Web': return 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'Windows': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Linux': return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/5';
    }
  }
}

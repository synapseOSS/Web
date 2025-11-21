
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { PlatformCardComponent } from '../components/platform-card.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { PlatformService, PlatformInfo } from '../services/platform.service';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, PlatformCardComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-32 pb-20 relative overflow-hidden">
       <!-- Background Elements -->
       <div class="absolute inset-0 -z-10">
          <app-particles class="opacity-50 dark:opacity-40"></app-particles>
          <div class="absolute top-20 right-10 w-[500px] h-[500px] blur-[120px] rounded-full
                      bg-blue-300/20 dark:bg-blue-900/20"></div>
          <div class="absolute bottom-20 left-10 w-[500px] h-[500px] blur-[120px] rounded-full
                      bg-indigo-300/20 dark:bg-indigo-900/20"></div>
          <div class="absolute inset-0 bg-grid opacity-20"></div>
        </div>

      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-16" appAnimateOnScroll>
           <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 border shadow-lg
                       bg-white text-indigo-600 border-slate-200
                       dark:bg-slate-900/50 dark:text-indigo-400 dark:border-white/10">
             <app-icon name="download" [size]="32"></app-icon>
           </div>
           <h1 class="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">Get Synapse</h1>
           <p class="text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
             Experience the social network of the future on any device. Native performance, offline capabilities, and total data ownership.
           </p>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          @for (platform of platforms; track platform.title) {
            <div class="h-full">
              <app-platform-card
                [title]="platform.title"
                [description]="platform.desc"
                [iconName]="platform.icon"
                [status]="platform.status"
                [actionLabel]="platform.action">
              </app-platform-card>
            </div>
          }
        </div>

        <!-- CLI Section -->
        <div class="mt-24 max-w-4xl mx-auto" appAnimateOnScroll>
          <div class="rounded-3xl p-8 md:p-12 border overflow-hidden relative group
                      bg-slate-900 border-slate-800 text-white
                      dark:bg-black dark:border-white/10">
            
            <div class="absolute top-0 right-0 p-12 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
              <app-icon name="terminal" [size]="200"></app-icon>
            </div>

            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                 <div class="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold uppercase">
                   Developers
                 </div>
              </div>
              <h2 class="text-3xl font-bold mb-4">Synapse CLI</h2>
              <p class="text-slate-400 mb-8 max-w-xl">
                Manage your social graph, automate posts, and interact with the protocol directly from your terminal.
              </p>
              
              <div class="flex items-center gap-4">
                <div class="flex-grow md:flex-grow-0 bg-slate-800/50 rounded-lg px-4 py-3 font-mono text-sm text-slate-300 border border-white/10 flex items-center gap-4">
                  <span>npm install -g @synapse/cli</span>
                  <button class="text-slate-500 hover:text-white transition-colors" title="Copy">
                    <app-icon name="check" [size]="16"></app-icon>
                  </button>
                </div>
                <a href="https://github.com/SynapseOSS" target="_blank" class="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                  View Docs
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class DownloadsComponent {
  platformService = inject(PlatformService);
  platforms: PlatformInfo[] = this.platformService.getAllPlatforms();
}

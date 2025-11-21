
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';

@Component({
  selector: 'app-platform-card',
  standalone: true,
  imports: [CommonModule, IconComponent, AnimateOnScrollDirective],
  host: {
    class: 'block h-full'
  },
  template: `
    <div appAnimateOnScroll
         [delay]="delay()"
         animation="fade-up"
         class="relative group p-6 rounded-2xl border transition-all duration-500 ease-out overflow-hidden h-full flex flex-col
                bg-white border-slate-200 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10
                dark:bg-slate-900/50 dark:border-white/5 dark:hover:bg-slate-900/80 dark:hover:shadow-indigo-500/20
                hover:-translate-y-2 hover:scale-[1.02]">
      
      <!-- Glow Effect -->
      <div class="absolute -right-12 -top-12 w-48 h-48 blur-[80px] rounded-full transition-all duration-700 ease-in-out
                  bg-indigo-600/5 group-hover:bg-indigo-500/10
                  dark:bg-indigo-600/10 dark:group-hover:bg-indigo-500/30 
                  group-hover:scale-150 group-hover:translate-x-4 group-hover:translate-y-4"></div>

      <div class="relative z-10 flex flex-col h-full">
        <div class="flex items-center justify-between mb-6">
          <!-- Icon Container -->
          <div class="p-3.5 rounded-xl border transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) origin-center
                      bg-slate-50 border-slate-200 text-indigo-600
                      group-hover:bg-indigo-50 group-hover:border-indigo-200
                      dark:bg-slate-950 dark:border-white/10 dark:text-indigo-400 
                      dark:group-hover:text-indigo-300 dark:group-hover:border-indigo-500/50 dark:group-hover:bg-indigo-950/30 
                      group-hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4)]
                      group-hover:scale-110 group-hover:-rotate-6">
            <app-icon [name]="iconName()" [size]="32"></app-icon>
          </div>
          @if (status() === 'active') {
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                         bg-green-50 text-green-600 border-green-200
                         dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></span>
              Live
            </span>
          } @else {
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors
                         bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200
                         dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600/20 dark:group-hover:bg-slate-700/50 dark:group-hover:text-slate-300">
              Soon
            </span>
          }
        </div>

        <h3 class="text-xl font-bold mb-2 transition-colors
                   text-slate-900 group-hover:text-indigo-600
                   dark:text-white dark:group-hover:text-indigo-100">{{ title() }}</h3>
        <p class="text-sm mb-6 flex-grow transition-colors
                  text-slate-500 group-hover:text-slate-700
                  dark:text-slate-400 dark:group-hover:text-slate-300">{{ description() }}</p>

        <div class="mt-auto">
          @if (status() === 'active') {
            <button class="w-full py-2.5 px-4 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group/btn shadow-lg 
                           bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-900/10 hover:shadow-indigo-500/25
                           dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50 dark:shadow-transparent active:scale-95">
              {{ actionLabel() }}
              <app-icon name="chevron-right" [size]="16" class="group-hover/btn:translate-x-1 transition-transform"></app-icon>
            </button>
          } @else {
            <button class="w-full py-2.5 px-4 font-medium rounded-lg border transition-all flex items-center justify-center gap-2 group/learn
                           bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600
                           dark:bg-slate-800/50 dark:text-slate-300 dark:border-white/10 dark:hover:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:text-white dark:hover:shadow-lg dark:hover:shadow-indigo-500/10">
              Learn More
              <app-icon name="chevron-right" [size]="16" class="opacity-0 -translate-x-2 group-hover/learn:opacity-100 group-hover/learn:translate-x-0 transition-all duration-300"></app-icon>
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class PlatformCardComponent {
  title = input.required<string>();
  description = input.required<string>();
  iconName = input.required<string>();
  status = input<'active' | 'coming-soon'>('coming-soon');
  actionLabel = input<string>('Download');
  delay = input<number>(0);
}

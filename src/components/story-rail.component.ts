
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialService } from '../services/social.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-story-rail',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="w-full overflow-x-auto py-4 px-4 no-scrollbar">
      <div class="flex gap-4 min-w-min">
        <!-- Create Story -->
        <div class="flex flex-col items-center gap-2 cursor-pointer group">
          <div class="relative w-16 h-16 rounded-full border-2 border-slate-200 dark:border-white/10 p-0.5 group-hover:border-indigo-500 transition-colors">
             <div class="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
               <img [src]="currentUser().avatar" class="w-full h-full object-cover opacity-50">
               <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                  <app-icon name="check" [size]="24" class="text-white"></app-icon>
               </div>
             </div>
             <div class="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 border-2 border-white dark:border-slate-950">
               <app-icon name="check" [size]="10" class="text-white"></app-icon>
             </div>
          </div>
          <span class="text-xs font-medium text-slate-600 dark:text-slate-400">Your Story</span>
        </div>

        <!-- User Stories -->
        @for (story of stories(); track story.id) {
          <div class="flex flex-col items-center gap-2 cursor-pointer group">
             <div class="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-orange-500 group-hover:scale-105 transition-transform">
                <div class="w-full h-full rounded-full border-2 border-white dark:border-slate-950 overflow-hidden">
                  <img [src]="story.user.avatar" class="w-full h-full object-cover" [alt]="story.user.username">
                </div>
             </div>
             <span class="text-xs font-medium text-slate-900 dark:text-slate-300 truncate w-16 text-center">
               {{ story.user.username }}
             </span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class StoryRailComponent {
  socialService = inject(SocialService);
  stories = this.socialService.stories;
  currentUser = this.socialService.currentUser;
}

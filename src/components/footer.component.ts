
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IconComponent, RouterModule],
  template: `
    <footer class="relative z-10 transition-colors border-t 
                   bg-slate-50 border-slate-200
                   dark:bg-slate-950 dark:border-white/5">
      
      <!-- Main Footer Content -->
      <div class="container mx-auto px-6 py-16">
        <!-- Compact Grid for Better Mobile/Tablet Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          <!-- Column 1: Brand & Description (Takes full width on mobile, 4 cols on desktop) -->
          <div class="lg:col-span-4">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <app-icon name="zap" [size]="18" class="text-white"></app-icon>
              </div>
              <span class="text-2xl font-bold text-slate-900 dark:text-white">Synapse</span>
            </div>
            <p class="text-slate-600 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
              Reclaiming the social internet, one node at a time. Open source, decentralized, and built for people, not advertisers.
            </p>
            
            <!-- Social Links -->
            <div class="flex items-center gap-4">
              <a href="https://twitter.com" target="_blank" aria-label="Twitter" class="p-2.5 rounded-full transition-all hover:-translate-y-1
                                bg-slate-200 text-slate-600 hover:bg-[#1DA1F2] hover:text-white
                                dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-white dark:hover:text-black">
                <app-icon name="twitter" [size]="18"></app-icon>
              </a>
              <a href="https://discord.gg" target="_blank" aria-label="Discord" class="p-2.5 rounded-full transition-all hover:-translate-y-1
                                bg-slate-200 text-slate-600 hover:bg-[#5865F2] hover:text-white
                                dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-[#5865F2] dark:hover:text-white">
                <app-icon name="discord" [size]="18"></app-icon>
              </a>
              <a href="https://github.com/SynapseOSS" target="_blank" aria-label="GitHub" class="p-2.5 rounded-full transition-all hover:-translate-y-1
                                bg-slate-200 text-slate-600 hover:bg-[#333] hover:text-white
                                dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-white dark:hover:text-black">
                <app-icon name="github" [size]="18"></app-icon>
              </a>
              <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn" class="p-2.5 rounded-full transition-all hover:-translate-y-1
                                bg-slate-200 text-slate-600 hover:bg-[#0A66C2] hover:text-white
                                dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-[#0A66C2] dark:hover:text-white">
                <app-icon name="linkedin" [size]="18"></app-icon>
              </a>
            </div>
          </div>

          <!-- Links Wrapper (Nested Grid: 2 cols on mobile, 3 cols on tablet/desktop) -->
          <div class="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
              <!-- Product -->
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-6">Product</h3>
                <ul class="space-y-4">
                  <li><a routerLink="/pricing" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a></li>
                  <li><a routerLink="/downloads" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Download</a></li>
                  <li><a routerLink="/" fragment="features" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a></li>
                  <li><a routerLink="/changelog" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Changelog</a></li>
                  <li><a routerLink="/roadmap" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Roadmap</a></li>
                </ul>
              </div>

              <!-- Resources -->
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-6">Resources</h3>
                <ul class="space-y-4">
                  <li><a routerLink="/docs" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Documentation</a></li>
                  <li><a routerLink="/docs/api" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">API Reference</a></li>
                  <li><a href="#" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Community Forum</a></li>
                  <li><a href="#" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Node Operators</a></li>
                  <li><a routerLink="/support" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Help Center</a></li>
                </ul>
              </div>

              <!-- Company & Legal -->
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-6">Company</h3>
                <ul class="space-y-4">
                  <li><a routerLink="/about" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</a></li>
                  <li><a href="#" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Careers</a></li>
                  <li><a href="mailto:hello@synapse.social" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a></li>
                  <li><a routerLink="/docs/privacy" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                  <li><a routerLink="/docs/terms" class="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/20">
        <div class="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-slate-500 text-sm font-medium">
            &copy; {{ year }} Synapse Foundation. All rights reserved.
          </div>
          
          <div class="flex items-center gap-6">
             <!-- Status Indicator -->
             <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30">
               <span class="relative flex h-2 w-2">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               All Systems Operational
             </div>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}

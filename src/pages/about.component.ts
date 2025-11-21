
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../components/icon.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, IconComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-32 pb-20 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0 -z-10">
         <app-particles class="opacity-50 dark:opacity-40"></app-particles>
         <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-300/10 dark:bg-indigo-900/10 blur-[100px] rounded-full"></div>
         <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-300/10 dark:bg-cyan-900/10 blur-[100px] rounded-full"></div>
         <div class="absolute inset-0 bg-grid opacity-20"></div>
      </div>

      <div class="container mx-auto px-6">
        
        <!-- Hero Section -->
        <div class="max-w-4xl mx-auto text-center mb-24" appAnimateOnScroll>
           <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300 text-sm font-bold mb-8">
              <app-icon name="rocket" [size]="16"></app-icon>
              Established 2024
           </div>
           <h1 class="text-4xl md:text-7xl font-bold mb-8 text-slate-900 dark:text-white tracking-tight">
             Building Digital Bridges, <br/>
             <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Not Walled Gardens.</span>
           </h1>
           <p class="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
             StudioAs Inc. is a collective of engineers, designers, and privacy advocates working to decentralize the internet, one protocol at a time.
           </p>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-slate-200 dark:border-white/10 py-12 mb-24 max-w-5xl mx-auto" appAnimateOnScroll [delay]="100">
           <div class="text-center">
              <div class="text-4xl font-bold text-slate-900 dark:text-white mb-2">12+</div>
              <div class="text-sm text-slate-500 uppercase tracking-wider font-medium">Open Source Repos</div>
           </div>
           <div class="text-center">
              <div class="text-4xl font-bold text-slate-900 dark:text-white mb-2">100%</div>
              <div class="text-sm text-slate-500 uppercase tracking-wider font-medium">Remote Team</div>
           </div>
           <div class="text-center">
              <div class="text-4xl font-bold text-slate-900 dark:text-white mb-2">85k</div>
              <div class="text-sm text-slate-500 uppercase tracking-wider font-medium">Active Nodes</div>
           </div>
           <div class="text-center">
              <div class="text-4xl font-bold text-slate-900 dark:text-white mb-2">24/7</div>
              <div class="text-sm text-slate-500 uppercase tracking-wider font-medium">Uptime</div>
           </div>
        </div>

        <!-- Our Story / Mission -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 max-w-6xl mx-auto">
           <div appAnimateOnScroll animation="fade-right">
              <h2 class="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">The StudioAs Story</h2>
              <div class="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                 <p>
                    We started StudioAs Inc. with a simple frustration: the internet we grew up with—open, chaotic, and free—was being replaced by algorithmic feeds and data silos.
                 </p>
                 <p>
                    Synapse is our flagship product, but our mission goes beyond social media. We are building the infrastructure for a user-owned web. We believe that code is law, and that law should protect the individual, not the corporation.
                 </p>
                 <p>
                    Headquartered in the cloud but rooted in principles, we operate as a fully transparent organization. Our roadmap is public, our code is open, and our business model is straightforward.
                 </p>
              </div>
           </div>
           
           <div class="relative" appAnimateOnScroll animation="fade-left" [delay]="200">
              <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-2xl blur-2xl opacity-20"></div>
              <div class="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
                 <!-- Placeholder for Office/Team Image -->
                 <div class="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center group">
                    <div class="absolute inset-0 bg-grid opacity-20"></div>
                    <!-- Abstract Visualization of Global Team -->
                    <div class="relative z-10 w-full h-full p-8 flex items-center justify-center">
                       <div class="w-32 h-32 rounded-full bg-indigo-600/20 animate-pulse absolute top-1/4 left-1/4"></div>
                       <div class="w-24 h-24 rounded-full bg-cyan-600/20 animate-pulse-slow absolute bottom-1/3 right-1/4"></div>
                       <div class="w-full h-full border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl flex items-center justify-center">
                          <span class="font-mono text-slate-400">StudioAs_HQ_Virtual.glb</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- Core Values -->
        <div class="mb-24">
           <div class="text-center mb-12" appAnimateOnScroll>
              <h2 class="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Our Principles</h2>
              <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">The code we write is a reflection of the values we hold.</p>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div class="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-colors" appAnimateOnScroll [delay]="0">
                 <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center mb-6">
                    <app-icon name="code" [size]="24"></app-icon>
                 </div>
                 <h3 class="text-xl font-bold mb-3 text-slate-900 dark:text-white">Open Source Forever</h3>
                 <p class="text-slate-600 dark:text-slate-400">We believe transparency builds trust. Anyone can audit our code, verify our security, and contribute to our future.</p>
              </div>

              <div class="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-colors" appAnimateOnScroll [delay]="100">
                 <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 flex items-center justify-center mb-6">
                    <app-icon name="shield" [size]="24"></app-icon>
                 </div>
                 <h3 class="text-xl font-bold mb-3 text-slate-900 dark:text-white">Privacy by Default</h3>
                 <p class="text-slate-600 dark:text-slate-400">We don't track pixels, sell data, or spy on DMs. Security isn't a feature; it's the foundation.</p>
              </div>

              <div class="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-colors" appAnimateOnScroll [delay]="200">
                 <div class="w-12 h-12 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center justify-center mb-6">
                    <app-icon name="users" [size]="24"></app-icon>
                 </div>
                 <h3 class="text-xl font-bold mb-3 text-slate-900 dark:text-white">User Sovereignty</h3>
                 <p class="text-slate-600 dark:text-slate-400">You own your identity and your social graph. If you leave our platform, you take your network with you.</p>
              </div>
           </div>
        </div>

        <!-- Team Section -->
        <div class="max-w-6xl mx-auto mb-24" appAnimateOnScroll>
           <h2 class="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">The Core Team</h2>
           
           <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              @for (member of team; track member.name) {
                 <div class="group text-center">
                    <div class="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-300">
                       <img [src]="member.img" class="w-full h-full object-cover">
                       <div class="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 transition-colors"></div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ member.name }}</h3>
                    <div class="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-2">{{ member.role }}</div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">{{ member.bio }}</p>
                 </div>
              }
           </div>
        </div>

        <!-- CTA -->
        <div class="text-center py-16 border-t border-slate-200 dark:border-white/10" appAnimateOnScroll>
           <h2 class="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Join the movement</h2>
           <p class="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              We are always looking for talented engineers, designers, and dreamers. Help us build the next generation of social web.
           </p>
           <div class="flex gap-4 justify-center">
              <a href="https://github.com/SynapseOSS" target="_blank" class="px-8 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity">
                 View Careers
              </a>
              <a routerLink="/support" class="px-8 py-3 rounded-full border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                 Contact Us
              </a>
           </div>
        </div>

      </div>
    </div>
  `
})
export class AboutComponent {
   team = [
      { name: 'Alex Chen', role: 'Founder & CEO', bio: 'Former cryptographic engineer. Believes in code, coffee, and consensus.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
      { name: 'Sarah Connor', role: 'CTO', bio: 'Distributed systems architect. Scaling nodes since 2015.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
      { name: 'Marcus Wright', role: 'Head of Product', bio: 'Design systems enthusiast. Making Web3 feel like Web2.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus' },
      { name: 'Elena Rostova', role: 'Lead Developer', bio: 'Rust evangelist and open source maintainer.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena' },
   ];
}

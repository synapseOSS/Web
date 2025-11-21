
import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { PlatformCardComponent } from '../components/platform-card.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { PlatformService, PlatformInfo } from '../services/platform.service';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, PlatformCardComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="relative min-h-screen overflow-x-hidden">
      <!-- Hero Section -->
      <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <!-- Background Elements (Parallax + Animation) -->
        <div class="absolute inset-0 -z-10 overflow-hidden">
          
          <!-- Interactive Particles (New) -->
          <app-particles class="z-0 opacity-60 dark:opacity-80"></app-particles>

          <!-- Blob 1 (Top Center - Indigo) -->
          <div [style.transform]="bgBlob1Transform()" 
               class="absolute top-0 left-1/2 w-[1000px] h-[500px] transition-transform duration-75 ease-out will-change-transform pointer-events-none">
             <div class="w-full h-full blur-[120px] rounded-full mix-blend-screen 
                        bg-indigo-300/30 dark:bg-indigo-600/20 animate-pulse-slow"></div>
          </div>

          <!-- Blob 2 (Bottom Right - Cyan) -->
          <div [style.transform]="bgBlob2Transform()"
               class="absolute bottom-0 right-0 w-[800px] h-[600px] transition-transform duration-75 ease-out will-change-transform pointer-events-none">
             <div class="w-full h-full blur-[100px] rounded-full mix-blend-screen 
                        bg-cyan-200/40 dark:bg-cyan-500/10 animate-pulse-slow" style="animation-delay: 1s;"></div>
          </div>

          <!-- Blob 3 (Top Left - Purple - New) -->
          <div [style.transform]="bgBlob3Transform()"
               class="absolute top-20 -left-20 w-[600px] h-[600px] transition-transform duration-75 ease-out will-change-transform pointer-events-none">
             <div class="w-full h-full blur-[100px] rounded-full mix-blend-screen 
                        bg-purple-300/30 dark:bg-purple-600/20 animate-pulse-slow" style="animation-delay: 2.5s;"></div>
          </div>

          <div class="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
        </div>

        <div class="container mx-auto px-6 text-center relative z-10">
          
          <!-- Status Badge with Dynamic Island Expansion (iOS Style) -->
          <div appAnimateOnScroll animation="fade-down" class="flex justify-center mb-8 relative z-50">
            <div (click)="togglePill()"
                 [class]="isPillExpanded() 
                    ? 'w-[340px] h-[200px] cursor-default bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-2xl shadow-indigo-500/20 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl' 
                    : 'w-[240px] h-10 cursor-pointer bg-white/50 dark:bg-white/5 rounded-3xl hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 animate-float backdrop-blur-md'"
                 class="relative transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] overflow-hidden flex flex-col justify-center items-center will-change-[width,height]">
              
              <!-- Collapsed Content -->
              <div class="absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-300 pointer-events-none"
                   [class.opacity-0]="isPillExpanded()"
                   [class.delay-0]="isPillExpanded()"
                   [class.delay-300]="!isPillExpanded()">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span class="text-sm font-medium text-indigo-600 dark:text-indigo-300 whitespace-nowrap">Synapse Web v1.0 is Live</span>
              </div>

              <!-- Expanded Content -->
              <div class="w-full h-full p-6 flex flex-col transition-all duration-500"
                   [class.opacity-0]="!isPillExpanded()"
                   [class.scale-90]="!isPillExpanded()"
                   [class.opacity-100]="isPillExpanded()"
                   [class.scale-100]="isPillExpanded()">
                
                <div class="flex items-start justify-between mb-4">
                   <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <app-icon name="zap" [size]="20"></app-icon>
                      </div>
                      <div class="text-left">
                        <h3 class="font-bold text-slate-900 dark:text-white leading-tight">Synapse v1.0</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Stable Release · Public Mesh</p>
                      </div>
                   </div>
                   <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10" 
                           (click)="$event.stopPropagation(); togglePill()">
                      <app-icon name="x" [size]="18"></app-icon>
                   </button>
                </div>
                
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-auto text-left leading-relaxed">
                  Experience the first fully decentralized social web app with zero latency neural syncing.
                </p>

                <div class="flex gap-2 mt-2">
                   <a routerLink="/changelog" (click)="$event.stopPropagation()" class="flex-1 py-2.5 text-center text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                     View Updates
                   </a>
                </div>
              </div>
              
            </div>
          </div>

          <h1 appAnimateOnScroll animation="zoom-in" [delay]="200" class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-tight text-slate-900 dark:text-white transition-all duration-500 relative pointer-events-none">
            The Open Source <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r animate-gradient bg-300%
                         from-indigo-600 via-cyan-500 to-indigo-600
                         dark:from-indigo-400 dark:via-cyan-400 dark:to-indigo-400">Social Operating System</span>
          </h1>

          <p appAnimateOnScroll animation="fade-up" [delay]="400" class="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-slate-600 dark:text-slate-400 relative pointer-events-none">
            Connect, share, and discover without the algorithms. Synapse is the all-in-one alternative to Facebook, Instagram, and X — built by the community, for the community.
          </p>

          <div appAnimateOnScroll animation="fade-up" [delay]="600" class="flex flex-col sm:flex-row items-center justify-center gap-8 relative z-20">
            <a href="https://github.com/SynapseOSS" target="_blank" class="w-full sm:w-auto px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg 
               bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20
               dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50 dark:shadow-indigo-500/20">
              <app-icon name="github" [size]="20"></app-icon>
              Star on GitHub
            </a>

            <!-- Liquid Glass Multicolor Glow Button (RTX Style) -->
            <div class="relative inline-flex justify-center items-center group w-full sm:w-auto">
                <!-- Outer Glow Layer (Synchronized Spin) -->
                <div class="absolute inset-[-4px] rounded-full overflow-hidden blur-lg opacity-30 group-hover:opacity-80 transition-opacity duration-500">
                   <span class="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF0000_0%,#00FF00_25%,#0099FF_50%,#FF00FF_75%,#FF0000_100%)]"></span>
                </div>

                <!-- Main Button Layer -->
                <a routerLink="/app" class="relative inline-flex h-14 w-full sm:w-auto overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-transform hover:scale-105 active:scale-95 z-10 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                    <!-- Inner Border (Synchronized Spin) -->
                    <span class="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF0000_0%,#00FF00_25%,#0099FF_50%,#FF00FF_75%,#FF0000_100%)]"></span>
                    
                    <!-- Liquid Glass Surface -->
                    <span class="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-3xl px-8 py-1 text-base font-bold text-slate-900 dark:text-white shadow-[inset_0_-2px_6px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)] dark:shadow-[inset_0_-2px_6px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)] relative z-10">
                        <!-- Surface Reflection Highlight -->
                        <div class="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none opacity-80"></div>
                        
                        <app-icon name="zap" [size]="20" class="mr-2 text-indigo-600 dark:text-indigo-400 animate-pulse"></app-icon>
                        Launch Web App
                    </span>
                </a>
            </div>
          </div>
          
          <!-- Hero Image / Mockup Area -->
          <div appAnimateOnScroll animation="blur-in" [delay]="300" class="mt-20 relative mx-auto max-w-5xl perspective-1000 z-10">
            
            <!-- Animated Backdrop Glow -->
            <div class="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2rem] blur-3xl opacity-20 dark:opacity-30 animate-pulse-slow -z-10"></div>

            <!-- Main App Mockup -->
            <div [style.transform]="mockupTransform()" 
                 class="relative rounded-2xl border shadow-2xl overflow-hidden aspect-[16/9] group
                        border-slate-200 bg-white
                        dark:border-white/10 dark:bg-slate-900/80 dark:backdrop-blur-xl
                        transition-transform duration-100 ease-out will-change-transform">
               
               <!-- Simulated UI Header -->
               <div class="absolute top-0 left-0 right-0 h-10 border-b flex items-center px-4 gap-2 z-20
                           bg-white/90 backdrop-blur border-slate-200
                           dark:bg-slate-950/90 dark:border-white/10">
                 <div class="flex gap-1.5">
                   <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                   <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                   <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                 </div>
                 <div class="flex-1 text-center text-xs text-slate-400 font-mono">synapse.social</div>
               </div>

               <!-- Simulated UI Content -->
               <div class="absolute inset-0 pt-10 flex items-center justify-center bg-white dark:bg-slate-950/50">
                 <div class="text-center w-full px-4">
                    <!-- Feed items (abstract) -->
                    <div class="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8 opacity-40">
                       <div class="h-24 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm animate-pulse border border-slate-200 dark:border-white/5"></div>
                       <div class="h-24 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm animate-pulse delay-75 border border-slate-200 dark:border-white/5"></div>
                       <div class="h-24 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm animate-pulse delay-150 border border-slate-200 dark:border-white/5"></div>
                       
                       <div class="col-span-2 h-32 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-white/5 p-4 flex gap-3">
                          <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                          <div class="flex-1 space-y-2 py-1">
                            <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                          </div>
                       </div>
                       <div class="h-32 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-center justify-center">
                          <app-icon name="sparkles" class="text-indigo-500" [size]="24"></app-icon>
                       </div>
                    </div>

                    <div class="mb-4 relative z-10 inline-block">
                      <div class="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                      <div class="w-16 h-16 relative rounded-2xl flex items-center justify-center border shadow-lg
                                  bg-white border-indigo-100
                                  dark:bg-slate-900 dark:border-indigo-500/30">
                        <app-icon name="zap" [size]="32" class="text-indigo-600 dark:text-indigo-400"></app-icon>
                      </div>
                    </div>
                    <p class="font-mono text-xs uppercase tracking-widest text-slate-500 relative z-10">Decentralized Mesh Active</p>
                 </div>
               </div>
               
               <!-- Decorative bottom fade -->
               <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t z-10
                           from-white via-white/80 to-transparent
                           dark:from-slate-900 via-slate-900/80 to-transparent"></div>
            </div>

            <!-- Floating Elements (Parallax) -->
            <!-- Card 1: Active Nodes -->
            <div [style.transform]="floatingCard1Transform()" 
                 class="absolute left-0 top-12 md:-left-12 md:top-1/4 p-3 md:p-4 backdrop-blur-md border rounded-xl shadow-2xl animate-float z-20
                        bg-white/90 border-slate-200
                        dark:bg-slate-800/80 dark:border-white/10 will-change-transform
                        scale-90 md:scale-100 origin-left">
                <div class="flex items-center gap-3">
                   <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <app-icon name="users" [size]="20"></app-icon>
                   </div>
                   <div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Nodes</div>
                      <div class="text-lg font-bold text-slate-900 dark:text-white">84,209</div>
                   </div>
                </div>
            </div>

            <!-- Card 2: Privacy Score -->
            <div [style.transform]="floatingCard2Transform()"
                 class="absolute right-0 bottom-20 md:-right-8 md:bottom-1/3 p-3 md:p-4 backdrop-blur-md border rounded-xl shadow-2xl animate-float-delayed z-20
                        bg-white/90 border-slate-200
                        dark:bg-slate-800/80 dark:border-white/10 will-change-transform
                        scale-90 md:scale-100 origin-right">
                <div class="flex items-center gap-3">
                   <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <app-icon name="shield" [size]="20"></app-icon>
                   </div>
                   <div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">Privacy Score</div>
                      <div class="text-lg font-bold text-slate-900 dark:text-white">100/100</div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recommended Platforms Section -->
      <section id="platforms" class="py-24 relative z-10">
        <div class="container mx-auto px-6">
          <div class="text-center mb-12" appAnimateOnScroll animation="fade-up">
            <h2 class="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">Recommended for You</h2>
            <p class="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
              We've detected your device. Here are the best ways to access Synapse.
            </p>
          </div>

          <div class="flex flex-col md:flex-row justify-center items-stretch gap-6 max-w-4xl mx-auto mb-12">
            @for (platform of recommendedPlatforms(); track platform.title; let i = $index) {
              <div class="w-full md:w-1/2">
                <app-platform-card
                  [title]="platform.title"
                  [description]="platform.desc"
                  [iconName]="platform.icon"
                  [status]="platform.status"
                  [actionLabel]="platform.action"
                  [delay]="i * 150"> <!-- Staggered animation -->
                </app-platform-card>
              </div>
            }
          </div>

          <div class="text-center" appAnimateOnScroll animation="fade-up" [delay]="300">
            <a routerLink="/downloads" class="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-lg">
              View all available platforms
              <app-icon name="chevron-right" [size]="18"></app-icon>
            </a>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div appAnimateOnScroll animation="fade-right">
              <h2 class="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Why Choose Synapse?</h2>
              <div class="space-y-8">
                <div class="flex gap-4 group" appAnimateOnScroll animation="fade-right" [delay]="100">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110
                              bg-indigo-50 text-indigo-600 border-indigo-200
                              dark:bg-indigo-900/50 dark:text-indigo-400 dark:border-indigo-500/20">
                    <app-icon name="shield" [size]="24"></app-icon>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Total Data Ownership</h3>
                    <p class="leading-relaxed text-slate-600 dark:text-slate-400">Your photos, your posts, your graph. You own your data. No hidden trackers or shadow profiles.</p>
                  </div>
                </div>
                
                <div class="flex gap-4 group" appAnimateOnScroll animation="fade-right" [delay]="200">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110
                              bg-cyan-50 text-cyan-600 border-cyan-200
                              dark:bg-cyan-900/50 dark:text-cyan-400 dark:border-cyan-500/20">
                    <app-icon name="zap" [size]="24"></app-icon>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Ad-Free Experience</h3>
                    <p class="leading-relaxed text-slate-600 dark:text-slate-400">Enjoy a clean feed without interruptions. Support creators directly, not the platform's bottom line.</p>
                  </div>
                </div>

                <div class="flex gap-4 group" appAnimateOnScroll animation="fade-right" [delay]="300">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110
                              bg-purple-50 text-purple-600 border-purple-200
                              dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-500/20">
                    <app-icon name="rocket" [size]="24"></app-icon>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Community Governed</h3>
                    <p class="leading-relaxed text-slate-600 dark:text-slate-400">Open source means you have a say. Contribute code, propose features, and shape the future of social.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="relative" appAnimateOnScroll animation="fade-left" [delay]="200">
                <div class="absolute inset-0 blur-[100px] opacity-20 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div class="relative border rounded-2xl p-8 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500
                            bg-slate-900 border-slate-800
                            dark:bg-slate-950 dark:border-white/10">
                   <div class="flex items-center justify-between border-b pb-4 mb-4 border-slate-800 dark:border-white/10">
                     <div class="flex gap-2">
                       <div class="w-3 h-3 rounded-full bg-red-500"></div>
                       <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                       <div class="w-3 h-3 rounded-full bg-green-500"></div>
                     </div>
                     <div class="text-xs text-slate-500 font-mono">synapse-cli --status</div>
                   </div>
                   <div class="space-y-3 font-mono text-sm">
                     <div class="flex gap-2">
                       <span class="text-pink-500">></span>
                       <span class="text-white">git clone https://github.com/SynapseOSS/core</span>
                     </div>
                     <div class="flex gap-2">
                       <span class="text-pink-500">></span>
                       <span class="text-indigo-400">compiling social_graph... done</span>
                     </div>
                     <div class="flex gap-2">
                       <span class="text-pink-500">></span>
                       <span class="text-green-400">launching server on localhost:3000</span>
                     </div>
                     <div class="flex gap-2">
                       <span class="text-pink-500">></span>
                       <span class="text-slate-400">Welcome to the future of social media<span class="animate-pulse">_</span></span>
                     </div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Community / Newsletter / News Card -->
      <section id="community" class="py-24 relative z-10">
        <div class="container mx-auto px-6">
          <!-- Main Glass Card -->
          <div class="rounded-[2.5rem] overflow-hidden border relative shadow-2xl transition-all duration-700 ease-bounce-sm
                      bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-white/10 backdrop-blur-xl"
               [class.max-w-3xl]="!showNews()"
               [class.mx-auto]="!showNews()"
               appAnimateOnScroll animation="fade-up">
            
            <!-- Background Gradients -->
            <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div class="grid transition-all duration-700 ease-bounce-sm"
                 [class.lg:grid-cols-2]="showNews()"
                 [class.grid-cols-1]="!showNews()">
              
              <!-- Left: Newsletter CTA -->
              <div class="p-8 md:p-16 flex flex-col justify-center relative z-10 border-b lg:border-b-0 transition-all duration-500"
                   [class.lg:border-r]="showNews()" 
                   [class.border-slate-200-50]="showNews()" 
                   [class.dark:border-white-5]="showNews()"
                   [class.border-transparent]="!showNews()">
                <div class="inline-flex items-center gap-2 mb-6">
                   <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                   <span class="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Live Updates</span>
                </div>
                
                <h2 class="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                  The signal, <br/>
                  <span class="text-indigo-600 dark:text-indigo-400">minus the noise.</span>
                </h2>
                
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                  Get the weekly digest of decentralized tech news, protocol updates, and community highlights. No spam, just signal.
                </p>

                <div class="flex flex-col sm:flex-row gap-3 mb-8">
                   <input type="email" placeholder="developer@example.com" 
                          class="flex-1 px-6 py-4 rounded-xl border outline-none transition-all
                                 bg-white dark:bg-slate-950/50 border-slate-200 dark:border-white/10
                                 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                                 text-slate-900 dark:text-white placeholder-slate-400">
                   <button class="px-8 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95">
                      Subscribe
                   </button>
                </div>

                <div class="flex items-center justify-between">
                    <p class="text-xs text-slate-500">
                      Join 45,000+ developers.
                    </p>
                    
                    <!-- Toggle Button -->
                    <button (click)="toggleNews()" class="group flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <span>{{ showNews() ? 'Hide Transmission' : 'Show Latest Transmission' }}</span>
                      <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center transition-all group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                        <app-icon [name]="showNews() ? 'x' : 'repeat'" [size]="16" class="transition-transform duration-300" [class.group-hover:animate-ziggle]="!showNews()"></app-icon>
                      </div>
                    </button>
                </div>
              </div>

              <!-- Right: Latest News Feed (Collapsible) -->
              @if (showNews()) {
                <div class="p-8 md:p-16 bg-slate-50/50 dark:bg-black/20 backdrop-blur-sm animate-in slide-in-from-right-10 fade-in duration-500">
                   <h3 class="text-lg font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-2">
                      <app-icon name="repeat" [size]="20"></app-icon>
                      Latest Transmission
                   </h3>
  
                   <div class="space-y-6">
                      <!-- Item 1 -->
                      <div class="group cursor-pointer">
                         <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold px-2 py-1 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">Engineering</span>
                            <span class="text-xs text-slate-500">2h ago</span>
                         </div>
                         <h4 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                            Synapse Protocol v2.1 Release Candidate
                         </h4>
                         <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            Introducing "Neural Sync" with 50% faster propagation speeds.
                         </p>
                      </div>
  
                      <div class="h-px bg-slate-200 dark:bg-white/5 w-full"></div>
  
                      <!-- Item 2 -->
                      <div class="group cursor-pointer">
                         <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold px-2 py-1 rounded-md bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">Community</span>
                            <span class="text-xs text-slate-500">1d ago</span>
                         </div>
                         <h4 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                            Global Hackathon 2025 Winners
                         </h4>
                         <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            See what the community built this weekend.
                         </p>
                      </div>
  
                      <div class="h-px bg-slate-200 dark:bg-white/5 w-full"></div>
  
                      <!-- Item 3 -->
                      <div class="group cursor-pointer">
                         <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold px-2 py-1 rounded-md bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-300">Ecosystem</span>
                            <span class="text-xs text-slate-500">3d ago</span>
                         </div>
                         <h4 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                            New Partnership with Arweave
                         </h4>
                         <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            Ensuring permanent, decentralized storage for all public Synapse posts.
                         </p>
                      </div>
                   </div>
  
                   <a routerLink="/changelog" class="inline-flex items-center gap-2 mt-8 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      View all updates <app-icon name="chevron-right" [size]="16"></app-icon>
                   </a>
                </div>
              }

            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  platformService = inject(PlatformService);
  recommendedPlatforms = signal<PlatformInfo[]>([]);
  isPillExpanded = signal(false);
  showNews = signal(false); // Hidden by default
  
  // Track scroll position for parallax
  scrollY = signal(0);

  ngOnInit() {
    this.recommendedPlatforms.set(this.platformService.getRecommendedPlatforms());
    
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  togglePill() {
    this.isPillExpanded.update(v => !v);
  }

  toggleNews() {
    this.showNews.update(v => !v);
  }

  private onScroll = () => {
    this.scrollY.set(window.scrollY);
  };

  // Parallax transforms
  mockupTransform = computed(() => {
    const y = this.scrollY();
    const rotateX = Math.min(Math.max((y - 100) * 0.02, -5), 5); 
    return `perspective(1000px) rotateX(${rotateX}deg) translateY(${y * 0.05}px)`;
  });

  floatingCard1Transform = computed(() => {
    const y = this.scrollY();
    return `translateY(${y * -0.06}px)`;
  });

  floatingCard2Transform = computed(() => {
    const y = this.scrollY();
    return `translateY(${y * -0.1}px)`;
  });

  // Background Parallax
  bgBlob1Transform = computed(() => {
    const y = this.scrollY();
    // Moves down slightly slower than scroll (0.5) creating depth, plus -50% centering for x
    return `translate3d(-50%, ${y * 0.3}px, 0)`;
  });

  bgBlob2Transform = computed(() => {
    const y = this.scrollY();
    // Moves up relative to content flow
    return `translate3d(0, ${y * -0.2}px, 0)`;
  });

  bgBlob3Transform = computed(() => {
    const y = this.scrollY();
    // Moves diagonally
    return `translate3d(-20%, ${y * 0.15}px, 0)`;
  });
}

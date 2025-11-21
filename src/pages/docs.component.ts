
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

interface DocRoute {
  id: string;
  title: string;
  category: string;
}

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, FormsModule],
  template: `
    <div class="min-h-screen pt-20 relative flex">
      
      <!-- Mobile Menu Toggle -->
      <div class="lg:hidden fixed bottom-6 right-6 z-50">
        <button (click)="toggleSidebar()" class="p-4 rounded-full shadow-xl bg-indigo-600 text-white hover:bg-indigo-700">
          <app-icon name="book" [size]="24"></app-icon>
        </button>
      </div>

      <!-- Sidebar -->
      <aside class="fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block
                    bg-slate-50 border-r border-slate-200
                    dark:bg-slate-950 dark:border-white/5"
             [class.-translate-x-full]="!sidebarOpen()"
             [class.translate-x-0]="sidebarOpen()">
        
        <div class="h-full overflow-y-auto p-6 pt-24 flex flex-col">
          
          <!-- Search Box -->
          <div class="relative mb-8 group">
             <div class="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <app-icon name="search" [size]="18"></app-icon>
             </div>
             <input 
               type="text" 
               [(ngModel)]="searchQuery"
               placeholder="Search docs..." 
               class="w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-all outline-none
                      bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                      dark:bg-slate-900 dark:border-white/10 dark:text-white dark:focus:border-indigo-500"
             >
             @if (searchQuery()) {
               <button (click)="searchQuery.set('')" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                 <app-icon name="x" [size]="14"></app-icon>
               </button>
             }
          </div>

          <!-- Navigation Groups -->
          <div class="space-y-8">
            @for (group of filteredDocs(); track group.category) {
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 pl-3">{{ group.category }}</h2>
                <div class="space-y-1">
                  @for (doc of group.items; track doc.id) {
                    <a [routerLink]="['/docs', doc.id]" 
                       (click)="closeSidebar()"
                       class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                              {{ isActive(doc.id) 
                                 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                                 : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900' }}">
                      {{ doc.title }}
                    </a>
                  }
                </div>
              </div>
            } @empty {
               <div class="text-center text-slate-500 dark:text-slate-400 py-4 text-sm">
                  No results found for "{{ searchQuery() }}"
               </div>
            }
          </div>
          
        </div>
      </aside>

      <!-- Overlay for Mobile -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" (click)="closeSidebar()"></div>
      }

      <!-- Main Content -->
      <main class="flex-1 min-w-0 overflow-y-auto">
        <div class="max-w-4xl mx-auto px-6 py-12 lg:px-12 lg:py-16">
          
          <!-- Breadcrumbs -->
          <div class="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <span>Docs</span>
            <app-icon name="chevron-right" [size]="14"></app-icon>
            <span class="capitalize font-medium text-slate-900 dark:text-white">{{ currentTopicTitle() }}</span>
          </div>

          <!-- Content Switcher -->
          @switch (currentTopic()) {
            
            @case ('intro') {
              <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Introduction to Synapse</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Synapse is an open-source social operating system designed to return data ownership to the user. Unlike traditional social networks that silo your data in walled gardens, Synapse uses a decentralized architecture that allows you to host your own "neural node" or join a community node of your choice.
                </p>
                
                <div class="grid md:grid-cols-2 gap-6 mb-12">
                   <div class="p-6 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-white/10">
                      <div class="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-4">
                        <app-icon name="shield" [size]="24"></app-icon>
                      </div>
                      <h3 class="text-lg font-bold mb-2 text-slate-900 dark:text-white">Privacy First</h3>
                      <p class="text-sm text-slate-600 dark:text-slate-400">End-to-end encryption for all private messages and opt-in visibility for public posts.</p>
                   </div>
                   <div class="p-6 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-white/10">
                      <div class="w-10 h-10 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center mb-4">
                        <app-icon name="zap" [size]="24"></app-icon>
                      </div>
                      <h3 class="text-lg font-bold mb-2 text-slate-900 dark:text-white">Zero Latency</h3>
                      <p class="text-sm text-slate-600 dark:text-slate-400">Our proprietary "Neural Sync" protocol ensures updates propagate instantly across the mesh.</p>
                   </div>
                </div>

                <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Getting Started</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-4">
                  Ready to dive in? You can either download one of our native clients or host your own instance.
                </p>
                <div class="flex gap-4">
                   <a routerLink="/downloads" class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors">
                     Download Clients
                   </a>
                   <a routerLink="/docs/installation" class="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                     Read Installation Guide
                   </a>
                </div>
              </article>
            }

            @case ('installation') {
               <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Installation</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
                   You can run a Synapse Node on almost any hardware, from a Raspberry Pi to a cloud VPS.
                </p>
                
                <h3 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">Prerequisites</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mb-8">
                  <li>Node.js v18.0.0 or higher</li>
                  <li>Docker (optional, but recommended)</li>
                  <li>Git</li>
                </ul>

                <h3 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">Quick Start (Docker)</h3>
                <div class="relative group mb-8">
                   <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 blur-lg group-hover:opacity-30 transition-opacity"></div>
                   <div class="relative rounded-xl bg-slate-900 p-6 overflow-x-auto">
                      <pre class="text-sm font-mono text-slate-300"><code>docker run -d \
  --name synapse-node \
  -p 3000:3000 \
  -v synapse_data:/app/data \
  synapseoss/core:latest</code></pre>
                   </div>
                </div>

                <h3 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">Manual Installation</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-4">
                   Clone the repository and build the source:
                </p>
                 <div class="rounded-xl bg-slate-100 dark:bg-slate-900 p-6 border border-slate-200 dark:border-white/5">
                      <div class="space-y-2 font-mono text-sm text-slate-800 dark:text-slate-300">
                        <div class="flex gap-2"><span class="text-slate-400 select-none">$</span> git clone https://github.com/SynapseOSS/core.git</div>
                        <div class="flex gap-2"><span class="text-slate-400 select-none">$</span> cd synapse-core</div>
                        <div class="flex gap-2"><span class="text-slate-400 select-none">$</span> npm install</div>
                        <div class="flex gap-2"><span class="text-slate-400 select-none">$</span> npm run build</div>
                        <div class="flex gap-2"><span class="text-slate-400 select-none">$</span> npm start</div>
                      </div>
                   </div>
              </article>
            }

            @case ('cli') {
              <article class="prose dark:prose-invert max-w-none">
                <div class="flex items-center gap-3 mb-6">
                   <div class="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <app-icon name="terminal" [size]="32"></app-icon>
                   </div>
                   <h1 class="text-4xl font-bold text-slate-900 dark:text-white m-0">CLI Reference</h1>
                </div>
                
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
                   The Synapse CLI allows you to interact with the protocol directly from your terminal. It is useful for automation, bot creation, and server administration.
                </p>

                <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Global Commands</h2>
                
                <div class="space-y-6 mb-12">
                   <div class="border rounded-lg overflow-hidden border-slate-200 dark:border-white/10">
                      <div class="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-white/10 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                         synapse login
                      </div>
                      <div class="p-4 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm">
                         Authenticates your session. Opens a browser window to authorize the CLI token.
                      </div>
                   </div>

                   <div class="border rounded-lg overflow-hidden border-slate-200 dark:border-white/10">
                      <div class="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-white/10 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                         synapse post create --message "Hello World"
                      </div>
                      <div class="p-4 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm">
                         Creates a new text post on your timeline. Supports markdown flags.
                      </div>
                   </div>

                   <div class="border rounded-lg overflow-hidden border-slate-200 dark:border-white/10">
                      <div class="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-white/10 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                         synapse graph sync
                      </div>
                      <div class="p-4 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm">
                         Manually forces a synchronization of your social graph with the mesh network.
                      </div>
                   </div>
                </div>

                <div class="p-6 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-200">
                   <strong>Note:</strong> The CLI is currently in Beta. Use version <code>0.9.x</code> for stable environments.
                </div>
              </article>
            }

            @case ('architecture') {
               <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">System Architecture</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
                   Understanding how Synapse handles data distribution and consensus.
                </p>
                
                <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 mb-8 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                   <div class="text-center">
                      <div class="flex justify-center gap-8 mb-8">
                        <div class="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/50 animate-pulse">Node A</div>
                        <div class="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/50">Node B</div>
                        <div class="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/50">Node C</div>
                      </div>
                      <p class="text-sm font-mono text-slate-500">Federated Mesh Protocol Visualization</p>
                   </div>
                </div>

                <h3 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">The Core Layers</h3>
                <ol class="space-y-4 text-slate-600 dark:text-slate-400 list-decimal list-inside">
                   <li class="pl-2"><strong>Identity Layer:</strong> Uses DID (Decentralized Identifiers) to decouple username from server location.</li>
                   <li class="pl-2"><strong>Storage Layer:</strong> A content-addressable storage system (similar to IPFS) ensuring data integrity.</li>
                   <li class="pl-2"><strong>Transport Layer:</strong> WebRTC and WebSocket hybrid for real-time updates and offline syncing.</li>
                </ol>
              </article>
            }

            @case ('tech-stack') {
              <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Tech Stack</h1>
                
                <div class="grid md:grid-cols-2 gap-8 mb-12">
                    <!-- Android App -->
                    <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                        <h3 class="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <app-icon name="android" [size]="24"></app-icon> Android App
                        </h3>
                        <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <li><strong>Language:</strong> Kotlin 2.2.0 with Android KTX</li>
                            <li><strong>Architecture:</strong> MVVM + Repository pattern</li>
                            <li><strong>UI:</strong> ViewBinding, Material Design 3, Navigation Component</li>
                            <li><strong>Async:</strong> Kotlin Coroutines + Flow</li>
                            <li><strong>Image Loading:</strong> Glide 5.0.0-rc01</li>
                            <li><strong>Markdown:</strong> Markwon 4.6.2</li>
                            <li><strong>Media:</strong> Media3 1.3.1</li>
                        </ul>
                    </div>

                    <!-- Backend -->
                    <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                        <h3 class="text-xl font-bold mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                            <app-icon name="zap" [size]="24"></app-icon> Backend (Supabase)
                        </h3>
                        <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <li><strong>Database:</strong> PostgreSQL via Postgrest</li>
                            <li><strong>Authentication:</strong> GoTrue (email, OAuth)</li>
                            <li><strong>Storage:</strong> Supabase Storage for media</li>
                            <li><strong>Real-time:</strong> Supabase Realtime for live updates</li>
                        </ul>
                    </div>
                </div>
                
                <p class="text-sm text-slate-500">Full technical details available in our GitHub repository.</p>
              </article>
            }

            @case ('contributing') {
              <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Contributing to Synapse</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.
                </p>

                <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">Code Style Requirements</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-4">To maintain code quality and consistency, please follow these guidelines:</p>
                
                <h3 class="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white">Kotlin Style Guide</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mb-4">
                  <li>Follow the official <a href="https://kotlinlang.org/docs/coding-conventions.html" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline">Kotlin coding conventions</a></li>
                  <li>Use meaningful variable and function names</li>
                  <li>Prefer <code>val</code> over <code>var</code> when possible</li>
                  <li>Use data classes for models</li>
                  <li>Leverage Kotlin extensions and Android KTX</li>
                </ul>

                <div class="p-6 mt-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 dark:bg-indigo-900/20 dark:border-indigo-500/20 dark:text-indigo-200 text-center font-medium">
                  Thank you for contributing to Synapse! 🎉
                </div>
              </article>
            }

            @case ('faq') {
               <article class="prose dark:prose-invert max-w-none">
                  <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Community & Support</h1>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                     <a href="https://github.com/StudioAsInc/android-synapse/issues" target="_blank" class="p-6 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-indigo-500 transition-colors group">
                        <div class="text-indigo-600 mb-3"><app-icon name="bug" [size]="24"></app-icon></div>
                        <h3 class="font-bold mb-1 text-slate-900 dark:text-white">GitHub Issues</h3>
                        <p class="text-sm text-slate-500">Report bugs & request features</p>
                     </a>
                     <a href="https://github.com/StudioAsInc/android-synapse/discussions" target="_blank" class="p-6 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-green-500 transition-colors group">
                        <div class="text-green-600 mb-3"><app-icon name="message-circle" [size]="24"></app-icon></div>
                        <h3 class="font-bold mb-1 text-slate-900 dark:text-white">Discussions</h3>
                        <p class="text-sm text-slate-500">Q&A and community talks</p>
                     </a>
                     <a href="https://github.com/StudioAsInc/android-synapse/wiki" target="_blank" class="p-6 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-purple-500 transition-colors group">
                        <div class="text-purple-600 mb-3"><app-icon name="book" [size]="24"></app-icon></div>
                        <h3 class="font-bold mb-1 text-slate-900 dark:text-white">Wiki</h3>
                        <p class="text-sm text-slate-500">Setup guides & documentation</p>
                     </a>
                  </div>

                  <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                  
                  <div class="space-y-4">
                     <details class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 open:bg-white dark:open:bg-slate-900 open:shadow-lg transition-all">
                        <summary class="flex justify-between items-center font-bold cursor-pointer list-none text-slate-900 dark:text-white select-none">
                           <span>Is Synapse completely free to use?</span>
                           <span class="transition-transform duration-300 group-open:rotate-180">
                              <app-icon name="chevron-right" [size]="20" class="rotate-90"></app-icon>
                           </span>
                        </summary>
                        <div class="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
                           Yes, Synapse is free and operates on a non-profit model. We do not have ads or premium features that require payment.
                        </div>
                     </details>

                     <details class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 open:bg-white dark:open:bg-slate-900 open:shadow-lg transition-all">
                        <summary class="flex justify-between items-center font-bold cursor-pointer list-none text-slate-900 dark:text-white select-none">
                           <span>What makes Synapse different from other social platforms?</span>
                           <span class="transition-transform duration-300 group-open:rotate-180">
                              <app-icon name="chevron-right" [size]="20" class="rotate-90"></app-icon>
                           </span>
                        </summary>
                        <div class="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
                           Synapse prioritizes user privacy and experience. We offer an ad-free environment, end-to-end encrypted chats, generous free storage (35GB+), and our platform is fully open-source.
                        </div>
                     </details>

                     <details class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 open:bg-white dark:open:bg-slate-900 open:shadow-lg transition-all">
                        <summary class="flex justify-between items-center font-bold cursor-pointer list-none text-slate-900 dark:text-white select-none">
                           <span>What platforms is Synapse currently available on?</span>
                           <span class="transition-transform duration-300 group-open:rotate-180">
                              <app-icon name="chevron-right" [size]="20" class="rotate-90"></app-icon>
                           </span>
                        </summary>
                        <div class="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
                           Synapse is available for Android and has a web version. You can find links to both on our official <a routerLink="/downloads" class="text-indigo-600 hover:underline">downloads page</a>.
                        </div>
                     </details>

                     <details class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 open:bg-white dark:open:bg-slate-900 open:shadow-lg transition-all">
                        <summary class="flex justify-between items-center font-bold cursor-pointer list-none text-slate-900 dark:text-white select-none">
                           <span>How is my privacy protected on Synapse?</span>
                           <span class="transition-transform duration-300 group-open:rotate-180">
                              <app-icon name="chevron-right" [size]="20" class="rotate-90"></app-icon>
                           </span>
                        </summary>
                        <div class="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
                           We use end-to-end encryption for all private chats, meaning only you and the recipient can read the messages. We are committed to minimizing data collection.
                        </div>
                     </details>
                     
                     <details class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 open:bg-white dark:open:bg-slate-900 open:shadow-lg transition-all">
                        <summary class="flex justify-between items-center font-bold cursor-pointer list-none text-slate-900 dark:text-white select-none">
                           <span>Is the project stable?</span>
                           <span class="transition-transform duration-300 group-open:rotate-180">
                              <app-icon name="chevron-right" [size]="20" class="rotate-90"></app-icon>
                           </span>
                        </summary>
                        <div class="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
                           Yes! The project has successfully completed major modernization efforts, including Firebase to Supabase backend migration and Java to Kotlin migration. Core features like authentication, chat, posts, and profiles are stable. Real-time features are in active development.
                        </div>
                     </details>
                     
                     <details class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 open:bg-white dark:open:bg-slate-900 open:shadow-lg transition-all">
                        <summary class="flex justify-between items-center font-bold cursor-pointer list-none text-slate-900 dark:text-white select-none">
                           <span>Can I host my own instance of Synapse?</span>
                           <span class="transition-transform duration-300 group-open:rotate-180">
                              <app-icon name="chevron-right" [size]="20" class="rotate-90"></app-icon>
                           </span>
                        </summary>
                        <div class="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
                           While self-hosting is a goal for the future, it is not officially supported at this time. The project's open-source nature, however, allows for community experimentation.
                        </div>
                     </details>
                  </div>

                  <h2 class="text-2xl font-bold mt-12 mb-4 text-slate-900 dark:text-white">Acknowledgments</h2>
                  <ul class="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                     <li>Our <strong>core team</strong> at StudioAs Inc.</li>
                     <li><strong>Open-source contributors</strong> worldwide</li>
                     <li><strong>Early testers</strong> shaping Synapse's future</li>
                  </ul>
               </article>
            }

            @case ('privacy') {
               <article class="prose dark:prose-invert max-w-none">
                 <h1 class="text-4xl font-bold mb-2 text-slate-900 dark:text-white">Privacy Policy</h1>
                 <p class="text-sm text-slate-500 dark:text-slate-400 mb-8">Last Updated: November 15, 2025</p>

                 <!-- Summary Box -->
                 <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl p-6 mb-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-500/50 group">
                    <div class="flex items-center gap-2 mb-4">
                      <app-icon name="shield" class="text-indigo-600 dark:text-indigo-400" [size]="24"></app-icon>
                      <h3 class="text-lg font-bold text-indigo-900 dark:text-indigo-300 m-0">At a Glance (TL;DR)</h3>
                    </div>
                    <ul class="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                       <li><strong>You own your data.</strong> We do not claim ownership of your content.</li>
                       <li><strong>We do not sell your data.</strong> Synapse is funded by community grants and optional premium subscriptions, not ads.</li>
                       <li><strong>End-to-end encryption.</strong> Direct messages are encrypted on your device before they ever touch our relays.</li>
                       <li><strong>Public is Public.</strong> Content you post to the public timeline is visible to the entire network.</li>
                    </ul>
                 </div>

                 <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">1. Data Collection</h2>
                 <p class="text-slate-600 dark:text-slate-400">
                    We collect the minimum amount of data necessary to operate the service:
                 </p>
                 <ul class="list-disc list-inside text-slate-600 dark:text-slate-400">
                    <li><strong>Account Information:</strong> Username, email address (for recovery), and password hash.</li>
                    <li><strong>Profile Information:</strong> Display name, bio, avatar, and cover image (all optional).</li>
                    <li><strong>Content:</strong> Posts, media, and comments you explicitly publish.</li>
                    <li><strong>Usage Data:</strong> Basic telemetry (node version, uptime) if you choose to run a node.</li>
                 </ul>

                 <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">2. How We Use Your Data</h2>
                 <p class="text-slate-600 dark:text-slate-400">
                    Your data is used exclusively to:
                 </p>
                 <ul class="list-disc list-inside text-slate-600 dark:text-slate-400">
                    <li>Propagate your public posts to your followers across the mesh network.</li>
                    <li>Authenticate your identity when you log in.</li>
                    <li>Deliver encrypted notifications to your devices.</li>
                 </ul>

                 <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">3. Data Retention</h2>
                 <p class="text-slate-600 dark:text-slate-400">
                    Due to the decentralized nature of Synapse, once data is broadcast to the public network, it may be replicated by other nodes. While you can send a "tombstone" (delete request) to hide content, we cannot guarantee complete erasure from every node in the federated network immediately.
                 </p>

                 <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">4. Contact Us</h2>
                 <p class="text-slate-600 dark:text-slate-400">
                    If you have questions about this policy or our privacy practices, please contact our Data Protection Officer at <a href="mailto:privacy@synapse.social" class="text-indigo-600 dark:text-indigo-400 hover:underline">privacy@synapse.social</a>.
                 </p>
               </article>
            }

            @case ('terms') {
               <article class="prose dark:prose-invert max-w-none">
                  <h1 class="text-4xl font-bold mb-2 text-slate-900 dark:text-white">Terms of Service</h1>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mb-8">Effective Date: November 15, 2025</p>

                  <p class="text-slate-600 dark:text-slate-400 lead">
                     Welcome to Synapse. By accessing or using our web application, mobile apps, or API, you agree to be bound by these Terms.
                  </p>

                  <h3 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">1. Use of the Protocol</h3>
                  <p class="text-slate-600 dark:text-slate-400">
                     Synapse is an open protocol. You are free to build clients, bots, or alternative front-ends. However, when using the official Synapse Web Client (synapse.social), you agree not to misuse the service by interfering with its normal operation or attempting to access it using a method other than the interface and instructions that we provide.
                  </p>

                  <h3 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">2. User Responsibilities</h3>
                  <p class="text-slate-600 dark:text-slate-400">
                     You are responsible for your use of the Services and for any content you provide, including compliance with applicable laws, rules, and regulations. You should only provide Content that you are comfortable sharing with others.
                  </p>

                  <h3 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">3. Content Moderation</h3>
                  <p class="text-slate-600 dark:text-slate-400">
                     Synapse uses a "Community Consensus" moderation model. Individual node operators have the right to ban users or hide content on their specific instance. There is no central authority that can ban you from the entire protocol, but bad behavior may lead to you being de-federated by the majority of reputable nodes.
                  </p>

                  <h3 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">4. Disclaimers</h3>
                  <p class="text-slate-600 dark:text-slate-400">
                     The Services are available "AS-IS". Your access to and use of the Services or any Content are at your own risk. You understand and agree that the Services are provided to you on an "AS IS" and "AS AVAILABLE" basis.
                  </p>
               </article>
            }

            @case ('eula') {
               <article class="prose dark:prose-invert max-w-none">
                  <h1 class="text-4xl font-bold mb-2 text-slate-900 dark:text-white">End User License Agreement</h1>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mb-8">Applies to: Synapse Mobile & Desktop Clients</p>

                  <!-- EULA Summary Box (Styled like Privacy TL;DR) -->
                  <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl p-6 mb-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-500/50 group">
                     <div class="flex items-center gap-2 mb-4">
                       <app-icon name="book" class="text-indigo-600 dark:text-indigo-400" [size]="24"></app-icon>
                       <h3 class="text-lg font-bold text-indigo-900 dark:text-indigo-300 m-0">License Summary (TL;DR)</h3>
                     </div>
                     <ul class="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        <li><strong>Revocable License.</strong> We grant you permission to use the app, but this permission can be withdrawn if you violate terms.</li>
                        <li><strong>MIT License Core.</strong> The underlying core code is Open Source (MIT), but the official binary builds are subject to this EULA.</li>
                        <li><strong>No Illegal Activity.</strong> You must not use this software for illegal purposes.</li>
                        <li><strong>Provided "As Is".</strong> We are not liable for data loss or damages arising from use.</li>
                     </ul>
                  </div>

                  <p class="text-slate-600 dark:text-slate-400 mb-8">
                     This End User License Agreement ("EULA") is a legal agreement between you and Synapse Foundation governing your use of the Synapse Software. By downloading or using the app, you accept these terms.
                  </p>

                  <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">1. Grant of License</h2>
                  <p class="text-slate-600 dark:text-slate-400">
                     Synapse grants you a revocable, non-exclusive, non-transferable, limited license to download, install, and use the Application strictly in accordance with the terms of this Agreement. This license is for personal, non-commercial use unless otherwise authorized.
                  </p>

                  <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">2. Open Source Components</h2>
                  <p class="text-slate-600 dark:text-slate-400">
                     The Application contains open source software components. These components are licensed under the MIT License. Nothing in this EULA limits your rights under, or grants you rights that supersede, the terms and conditions of the MIT License for the underlying source code.
                  </p>

                  <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">3. Restrictions</h2>
                  <p class="text-slate-600 dark:text-slate-400">
                     You agree not to, and you will not permit others to:
                  </p>
                  <ul class="list-disc list-inside text-slate-600 dark:text-slate-400 ml-4">
                     <li>Use the Application for any illegal purpose or in violation of any local, state, national, or international law.</li>
                     <li>Exploit software vulnerabilities or interfere with the security-related features of the Application.</li>
                     <li>Rent, lease, lend, sell, redistribute, or sublicense the official binary Application.</li>
                  </ul>

                  <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">4. Termination</h2>
                  <p class="text-slate-600 dark:text-slate-400">
                     This Agreement is effective until terminated. Your rights under this Agreement will terminate automatically without notice from Synapse if you fail to comply with any term(s) of this Agreement. Upon termination, you must cease all use of the Application and delete all copies.
                  </p>
                  
                  <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">5. Disclaimer of Warranty</h2>
                   <p class="text-slate-600 dark:text-slate-400">
                     The application is provided "AS IS", without warranty of any kind. We do not warrant that the application will be error-free or uninterrupted.
                  </p>
               </article>
            }
            
            @case ('about') {
              <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">About StudioAs & Synapse</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  We are a distributed collective of engineers, designers, and privacy advocates working to decentralize the internet, one protocol at a time.
                </p>
                
                <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Our Mission</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-6">
                  The internet was built to be open, but today it is comprised of walled gardens. Our mission is to dismantle these walls by building protocols that prioritize <strong>user sovereignty</strong>, <strong>data portability</strong>, and <strong>privacy by default</strong>.
                </p>

                <div class="grid md:grid-cols-3 gap-6 mb-12">
                   <div class="p-6 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-white/10">
                      <h3 class="font-bold text-slate-900 dark:text-white mb-2">Transparency</h3>
                      <p class="text-sm text-slate-600 dark:text-slate-400">Code is law. All our work is open source and audit-ready.</p>
                   </div>
                   <div class="p-6 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-white/10">
                      <h3 class="font-bold text-slate-900 dark:text-white mb-2">Privacy</h3>
                      <p class="text-sm text-slate-600 dark:text-slate-400">We collect zero behavioral data. You are not the product.</p>
                   </div>
                   <div class="p-6 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-white/10">
                      <h3 class="font-bold text-slate-900 dark:text-white mb-2">Community</h3>
                      <p class="text-sm text-slate-600 dark:text-slate-400">Built by the people, for the people. Funded by grants, not ads.</p>
                   </div>
                </div>

                <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">The Team</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-6">
                   Synapse is maintained by <strong>StudioAs Inc.</strong>, a remote-first non-profit organization, alongside hundreds of open-source contributors.
                </p>

                <ul class="space-y-4 mb-8">
                  <li class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex" class="w-full h-full">
                     </div>
                     <div>
                        <div class="font-bold text-slate-900 dark:text-white">Alex Chen</div>
                        <div class="text-sm text-slate-500">Founder & Lead Protocol Engineer</div>
                     </div>
                  </li>
                   <li class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sarah" class="w-full h-full">
                     </div>
                     <div>
                        <div class="font-bold text-slate-900 dark:text-white">Sarah Connor</div>
                        <div class="text-sm text-slate-500">CTO & Distributed Systems Architect</div>
                     </div>
                  </li>
                </ul>

                <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Contact Us</h2>
                <p class="text-slate-600 dark:text-slate-400">
                   For partnerships, press inquiries, or just to say hello:
                   <a href="mailto:hello@synapse.social" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1">hello@synapse.social</a>
                </p>
              </article>
            }

            @default {
               <article class="prose dark:prose-invert max-w-none">
                <h1 class="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Documentation</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400">
                   Select a topic from the sidebar to begin learning about Synapse.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                   <a routerLink="/docs/intro" class="p-6 rounded-2xl border transition-all hover:shadow-lg group
                              bg-white border-slate-200 hover:border-indigo-500/50
                              dark:bg-slate-900 dark:border-white/10 dark:hover:border-indigo-500/50">
                      <div class="text-indigo-600 dark:text-indigo-400 mb-4">
                         <app-icon name="zap" [size]="32"></app-icon>
                      </div>
                      <h3 class="text-xl font-bold mb-2 text-slate-900 dark:text-white">Introduction</h3>
                      <p class="text-slate-500 dark:text-slate-400 text-sm">Learn the basics of the platform and why we built it.</p>
                   </a>

                   <a routerLink="/docs/faq" class="p-6 rounded-2xl border transition-all hover:shadow-lg group
                              bg-white border-slate-200 hover:border-green-500/50
                              dark:bg-slate-900 dark:border-white/10 dark:hover:border-green-500/50">
                      <div class="text-green-600 dark:text-green-400 mb-4">
                         <app-icon name="message-circle" [size]="32"></app-icon>
                      </div>
                      <h3 class="text-xl font-bold mb-2 text-slate-900 dark:text-white">FAQ & Support</h3>
                      <p class="text-slate-500 dark:text-slate-400 text-sm">Common questions and community channels.</p>
                   </a>
                </div>
               </article>
            }
          }
          
          <!-- Footer Navigation (Next/Prev) Placeholder -->
          <div class="mt-20 pt-8 border-t border-slate-200 dark:border-white/10 flex justify-between">
             <div class="text-sm text-slate-400">Last updated: Today</div>
             <a href="https://github.com/SynapseOSS/docs" target="_blank" class="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Edit this page on GitHub</a>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DocsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  sidebarOpen = signal(false);
  searchQuery = signal('');
  
  // Get the topic from the URL route params
  topicParam = toSignal(this.route.paramMap);
  
  // All documentation routes
  allDocs: DocRoute[] = [
    { id: 'intro', title: 'Introduction', category: 'Getting Started' },
    { id: 'installation', title: 'Installation', category: 'Getting Started' },
    { id: 'architecture', title: 'Architecture', category: 'Core Concepts' },
    { id: 'tech-stack', title: 'Tech Stack', category: 'Core Concepts' },
    { id: 'social-graph', title: 'Social Graph', category: 'Core Concepts' },
    { id: 'cli', title: 'CLI Reference', category: 'Developers' },
    { id: 'api', title: 'API Documentation', category: 'Developers' },
    { id: 'contributing', title: 'Contributing', category: 'Developers' },
    { id: 'about', title: 'About the Team', category: 'Project Info' },
    { id: 'faq', title: 'FAQ & Support', category: 'Support' },
    { id: 'privacy', title: 'Privacy Policy', category: 'Legal & Compliance' },
    { id: 'terms', title: 'Terms of Service', category: 'Legal & Compliance' },
    { id: 'eula', title: 'EULA', category: 'Legal & Compliance' },
  ];

  // Filter docs based on search query
  filteredDocs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    
    // Get all matching docs
    const matches = this.allDocs.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      doc.category.toLowerCase().includes(query)
    );

    // Group by category
    const groups: { category: string, items: DocRoute[] }[] = [];
    const categories = [...new Set(matches.map(d => d.category))]; // Unique categories present in matches

    // Preserve original category order
    const order = ['Getting Started', 'Core Concepts', 'Developers', 'Support', 'Project Info', 'Legal & Compliance'];
    categories.sort((a, b) => {
       const ia = order.indexOf(a);
       const ib = order.indexOf(b);
       // Handle cases where category might not be in order list (fallback to alphabetical or end)
       if (ia === -1 && ib === -1) return a.localeCompare(b);
       if (ia === -1) return 1;
       if (ib === -1) return -1;
       return ia - ib;
    });

    categories.forEach(cat => {
      groups.push({
        category: cat,
        items: matches.filter(d => d.category === cat)
      });
    });

    return groups;
  });
  
  currentTopic = computed(() => {
    const params = this.topicParam();
    const topic = params?.get('topic');
    return topic || (this.router.url.includes('/docs') && !topic ? 'intro' : null);
  });

  currentTopicTitle = computed(() => {
    const topic = this.currentTopic();
    const doc = this.allDocs.find(d => d.id === topic);
    return doc ? doc.title : 'Documentation';
  });

  ngOnInit() {
    // If visiting /docs with no param, default content handles it
    if (this.router.url === '/docs') {
       this.router.navigate(['/docs/intro'], { replaceUrl: true });
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  isActive(id: string): boolean {
    return this.currentTopic() === id;
  }
}

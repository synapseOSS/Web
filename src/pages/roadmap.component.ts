
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../components/icon.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { ParticlesComponent } from '../components/particles.component';

interface RoadmapItem {
  quarter: string;
  title: string;
  desc: string;
  status: 'completed' | 'in-progress' | 'planned';
  features: string[];
  icon: string;
}

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, IconComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-32 pb-20 relative overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 -z-10">
         <app-particles class="opacity-50 dark:opacity-40"></app-particles>
         <div class="absolute top-40 left-0 w-[500px] h-[500px] bg-indigo-300/10 dark:bg-indigo-900/10 blur-[100px] rounded-full"></div>
         <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-300/10 dark:bg-cyan-900/10 blur-[100px] rounded-full"></div>
         <div class="absolute inset-0 bg-grid opacity-10"></div>
      </div>

      <div class="container mx-auto px-6 max-w-6xl">
        <!-- Header -->
        <div class="text-center mb-16" appAnimateOnScroll>
           <div class="inline-flex items-center justify-center p-3 rounded-2xl mb-6 border shadow-lg
                       bg-white border-slate-200 text-indigo-600
                       dark:bg-slate-900 dark:border-white/10 dark:text-indigo-400">
             <app-icon name="map-pin" [size]="32"></app-icon>
           </div>
           <h1 class="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">Product Roadmap</h1>
           <p class="text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
             Our vision for the future of decentralized social media. Follow our journey from genesis to mass adoption.
           </p>
        </div>

        <!-- Roadmap Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           @for (item of roadmap; track item.title; let i = $index) {
              <div appAnimateOnScroll animation="scale-up" [delay]="i * 50" class="h-full">
                 <div class="h-full p-6 rounded-2xl border relative group hover:-translate-y-1 transition-transform duration-300
                             bg-white border-slate-200 shadow-sm
                             dark:bg-slate-900/60 dark:border-white/10 dark:hover:border-indigo-500/30 flex flex-col">
                    
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm
                                    bg-slate-50 border-slate-100 text-slate-500
                                    dark:bg-slate-800 dark:border-white/5 dark:text-slate-400 transition-colors"
                                [class.bg-green-50]="item.status === 'completed'"
                                [class.text-green-600]="item.status === 'completed'"
                                [class.dark:bg-green-900/20]="item.status === 'completed'"
                                [class.dark:text-green-400]="item.status === 'completed'"
                                [class.bg-indigo-50]="item.status === 'in-progress'"
                                [class.text-indigo-600]="item.status === 'in-progress'"
                                [class.dark:bg-indigo-900/20]="item.status === 'in-progress'"
                                [class.dark:text-indigo-400]="item.status === 'in-progress'">
                            <app-icon [name]="item.icon" [size]="20"></app-icon>
                        </div>
                        <span class="text-xs font-bold px-2 py-1 rounded-full border uppercase tracking-wider"
                              [class.bg-green-100]="item.status === 'completed'"
                              [class.text-green-700]="item.status === 'completed'"
                              [class.border-green-200]="item.status === 'completed'"
                              [class.dark:bg-green-900/30]="item.status === 'completed'"
                              [class.dark:text-green-400]="item.status === 'completed'"
                              [class.dark:border-green-500/20]="item.status === 'completed'"
                              
                              [class.bg-indigo-100]="item.status === 'in-progress'"
                              [class.text-indigo-700]="item.status === 'in-progress'"
                              [class.border-indigo-200]="item.status === 'in-progress'"
                              [class.dark:bg-indigo-900/30]="item.status === 'in-progress'"
                              [class.dark:text-indigo-300]="item.status === 'in-progress'"
                              [class.dark:border-indigo-500/20]="item.status === 'in-progress'"
                              
                              [class.bg-slate-100]="item.status === 'planned'"
                              [class.text-slate-600]="item.status === 'planned'"
                              [class.border-slate-200]="item.status === 'planned'"
                              [class.dark:bg-slate-800]="item.status === 'planned'"
                              [class.dark:text-slate-400]="item.status === 'planned'"
                              [class.dark:border-slate-700]="item.status === 'planned'">
                            {{ item.quarter }}
                        </span>
                    </div>

                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">{{ item.title }}</h3>
                    <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
                        {{ item.desc }}
                    </p>

                    <div class="space-y-2 mt-auto">
                        @for (feat of item.features; track feat) {
                            <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-colors">
                                @if (item.status === 'completed') {
                                    <app-icon name="check" [size]="12" class="text-green-500 shrink-0"></app-icon>
                                } @else if (item.status === 'in-progress') {
                                    <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                } @else {
                                    <div class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></div>
                                }
                                <span [class.line-through]="item.status === 'completed'" [class.opacity-80]="item.status === 'completed'">{{ feat }}</span>
                            </div>
                        }
                    </div>
                 </div>
              </div>
           }
        </div>
        
        <!-- Call to Action -->
        <div class="mt-16 text-center bg-indigo-600 rounded-2xl p-10 relative overflow-hidden shadow-2xl shadow-indigo-500/30" appAnimateOnScroll>
           <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div class="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
           
           <div class="relative z-10">
              <h2 class="text-2xl font-bold text-white mb-4">Have a feature request?</h2>
              <p class="text-indigo-100 mb-6 max-w-xl mx-auto text-sm">
                 Synapse is community-driven. Join our GitHub discussions to propose new features and vote on the next big thing.
              </p>
              <a href="https://github.com/SynapseOSS" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-lg text-sm">
                 <app-icon name="github" [size]="18"></app-icon>
                 View Discussions
              </a>
           </div>
        </div>

      </div>
    </div>
  `
})
export class RoadmapComponent {
  roadmap: RoadmapItem[] = [
    {
      quarter: 'Q4 2024',
      title: 'Genesis Protocol',
      desc: 'The foundation of the Synapse network. Establishing the core protocol, identity layer, and initial web client beta.',
      status: 'completed',
      icon: 'check',
      features: [
        'Protocol Whitepaper Release',
        'DID (Decentralized Identity) Implementation',
        'Web Client Alpha Launch',
        'Basic Social Graph (Follow/Unfollow)'
      ]
    },
    {
      quarter: 'Q1 2025',
      title: 'Media & Mobility',
      desc: 'Expanding content types and platform availability. Focusing on rich media support and mobile accessibility.',
      status: 'completed',
      icon: 'check',
      features: [
        'Image & Video Hosting Support',
        'Android App Beta Release',
        'Push Notification Server',
        'Algorithm-Free Feed Logic'
      ]
    },
    {
      quarter: 'Q2 2025',
      title: 'Encryption & Privacy',
      desc: 'Enhancing user privacy with end-to-end encryption for direct messages and advanced privacy controls.',
      status: 'in-progress',
      icon: 'zap',
      features: [
        'E2EE Direct Messages (Signal Protocol)',
        'iOS Beta App Launch',
        'Private Groups',
        'Content Warning System'
      ]
    },
    {
      quarter: 'Q3 2025',
      title: 'Community & Voice',
      desc: 'Bringing real-time communication and deeper community management tools to the platform.',
      status: 'planned',
      icon: 'calendar',
      features: [
        'Voice & Video Calls (WebRTC)',
        'Community Moderation Tools',
        'Audio Spaces (Live Voice Rooms)',
        'Creator Monetization (Tips)'
      ]
    },
    {
      quarter: 'Q4 2025',
      title: 'The DAO Era',
      desc: 'Fully decentralizing governance. Handing over protocol decision making to the community token holders.',
      status: 'planned',
      icon: 'calendar',
      features: [
        'Governance Token Launch',
        'DAO Voting Dashboard',
        'Federation API v2.0',
        'AR/VR Experience Beta'
      ]
    }
  ];
}

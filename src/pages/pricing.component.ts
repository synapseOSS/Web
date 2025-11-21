
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-32 pb-20 relative overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 -z-10">
         <app-particles class="opacity-50 dark:opacity-30"></app-particles>
         <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent"></div>
         <div class="absolute inset-0 bg-grid opacity-20"></div>
      </div>

      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="text-center max-w-3xl mx-auto mb-16" appAnimateOnScroll>
           <h1 class="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
             Invest in the Future of <span class="text-indigo-600 dark:text-indigo-400">Social</span>
           </h1>
           <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
             Synapse is open source and free to use. Our premium plans support development and offer managed convenience for power users.
           </p>

           <!-- Billing Toggle -->
           <div class="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full relative">
              <div class="w-1/2 h-full absolute top-0 left-0 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-transform duration-300"
                   [class.translate-x-full]="billingPeriod() === 'yearly'"
                   [class.translate-x-0]="billingPeriod() === 'monthly'"></div>
              <button (click)="setBilling('monthly')" class="relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors"
                      [class.text-indigo-600]="billingPeriod() === 'monthly'"
                      [class.dark:text-indigo-400]="billingPeriod() === 'monthly'">
                 Monthly
              </button>
              <button (click)="setBilling('yearly')" class="relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
                      [class.text-indigo-600]="billingPeriod() === 'yearly'"
                      [class.dark:text-indigo-400]="billingPeriod() === 'yearly'">
                 Yearly <span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
           </div>
        </div>

        <!-- Pricing Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
           <!-- Free -->
           <div class="rounded-3xl p-8 border bg-white border-slate-200 dark:bg-slate-900/50 dark:border-white/10 flex flex-col" appAnimateOnScroll [delay]="100">
              <div class="mb-6">
                 <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Community</h3>
                 <div class="text-4xl font-bold text-slate-900 dark:text-white mb-2">$0</div>
                 <p class="text-slate-500 text-sm">Forever free. Join any public node.</p>
              </div>
              <a routerLink="/downloads" class="w-full py-3 rounded-xl font-bold text-center border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-900 dark:text-white mb-8">
                 Get Started
              </a>
              <ul class="space-y-4 flex-1">
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    Access the full mesh network
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    End-to-end encrypted DMs
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    1GB Cloud Storage
                 </li>
              </ul>
           </div>

           <!-- Pro (Featured) -->
           <div class="rounded-3xl p-8 border-2 border-indigo-500 bg-slate-50 dark:bg-slate-900 relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-indigo-500/20" appAnimateOnScroll [delay]="200">
              <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                 Most Popular
              </div>
              <div class="mb-6">
                 <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Supporter</h3>
                 <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-4xl font-bold text-slate-900 dark:text-white">\${{ billingPeriod() === 'monthly' ? '5' : '4' }}</span>
                    <span class="text-slate-500">/mo</span>
                 </div>
                 <p class="text-slate-500 text-sm">For power users and creators.</p>
              </div>
              <button class="w-full py-3 rounded-xl font-bold text-center bg-indigo-600 text-white hover:bg-indigo-500 transition-colors mb-8 shadow-lg shadow-indigo-500/25">
                 Subscribe Now
              </button>
              <ul class="space-y-4 flex-1">
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-indigo-500 shrink-0"></app-icon>
                    Everything in Community
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="verified" [size]="18" class="text-indigo-500 shrink-0"></app-icon>
                    <strong>Verified Supporter Badge</strong>
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-indigo-500 shrink-0"></app-icon>
                    50GB Cloud Storage
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-indigo-500 shrink-0"></app-icon>
                    4K Video Uploads
                 </li>
              </ul>
           </div>

           <!-- Enterprise -->
           <div class="rounded-3xl p-8 border bg-white border-slate-200 dark:bg-slate-900/50 dark:border-white/10 flex flex-col" appAnimateOnScroll [delay]="300">
              <div class="mb-6">
                 <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Node Operator</h3>
                 <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-4xl font-bold text-slate-900 dark:text-white">\${{ billingPeriod() === 'monthly' ? '20' : '16' }}</span>
                    <span class="text-slate-500">/mo</span>
                 </div>
                 <p class="text-slate-500 text-sm">Managed instance for communities.</p>
              </div>
              <button class="w-full py-3 rounded-xl font-bold text-center border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-900 dark:text-white mb-8">
                 Deploy Node
              </button>
              <ul class="space-y-4 flex-1">
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    Fully Managed VPS Node
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    Custom Domain Support
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    1TB Storage & DDoS Protection
                 </li>
                 <li class="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <app-icon name="check" [size]="18" class="text-green-500 shrink-0"></app-icon>
                    Priority Support
                 </li>
              </ul>
           </div>
        </div>
        
        <!-- Comparison Table Link -->
        <div class="text-center mt-16" appAnimateOnScroll [delay]="400">
            <p class="text-slate-500 mb-4">Not sure which plan is right for you?</p>
            <a routerLink="/docs/features" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View full feature comparison</a>
        </div>
      </div>
    </div>
  `
})
export class PricingComponent {
  billingPeriod = signal<'monthly' | 'yearly'>('monthly');

  setBilling(period: 'monthly' | 'yearly') {
    this.billingPeriod.set(period);
  }
}

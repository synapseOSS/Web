
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IconComponent } from '../components/icon.component';
import { AnimateOnScrollDirective } from '../directives/animate-on-scroll.directive';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, AnimateOnScrollDirective, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-32 pb-20 relative">
       <!-- Background -->
       <div class="absolute inset-0 -z-10 overflow-hidden">
          <app-particles class="opacity-50 dark:opacity-40"></app-particles>
          <div class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[100px]"></div>
          <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-300/20 dark:bg-cyan-900/10 blur-[100px]"></div>
          <div class="absolute inset-0 bg-grid opacity-10"></div>
       </div>

       <div class="container mx-auto px-6 max-w-5xl">
          <!-- Header -->
          <div class="text-center mb-16" appAnimateOnScroll>
             <h1 class="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">How can we help you?</h1>
             <div class="relative max-w-xl mx-auto mt-8 group">
                <div class="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                   <app-icon name="search" [size]="20"></app-icon>
                </div>
                <input type="text" placeholder="Search for help articles..." 
                       class="w-full pl-12 pr-4 py-3 rounded-full border shadow-lg shadow-slate-200/50 dark:shadow-none outline-none transition-all
                              bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
                              dark:bg-slate-900 dark:border-white/10 dark:text-white dark:focus:border-indigo-500">
             </div>
          </div>

          <!-- Support Categories -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
             @for (cat of categories; track cat.title; let i = $index) {
                <div class="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer
                            bg-white border-slate-200 hover:border-indigo-200
                            dark:bg-slate-900/50 dark:border-white/10 dark:hover:border-indigo-500/30"
                     appAnimateOnScroll [delay]="i * 100">
                   <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        [class]="cat.colorClass">
                      <app-icon [name]="cat.icon" [size]="24"></app-icon>
                   </div>
                   <h3 class="font-bold text-slate-900 dark:text-white mb-2">{{ cat.title }}</h3>
                   <p class="text-sm text-slate-500">{{ cat.desc }}</p>
                </div>
             }
          </div>

          <!-- Contact Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" appAnimateOnScroll>
             <!-- Info -->
             <div>
                <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Still need help?</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-8">
                   Our team is available Monday through Friday, 9am to 5pm UTC. For urgent security matters, please check our Security Policy.
                </p>
                
                <div class="space-y-6">
                   <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                         <app-icon name="message-circle" [size]="20"></app-icon>
                      </div>
                      <div>
                         <h4 class="font-bold text-slate-900 dark:text-white">Community Forum</h4>
                         <p class="text-sm text-slate-500 mb-1">Get help from other users and developers.</p>
                         <a href="#" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Visit Forum &rarr;</a>
                      </div>
                   </div>

                   <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                         <app-icon name="discord" [size]="20"></app-icon>
                      </div>
                      <div>
                         <h4 class="font-bold text-slate-900 dark:text-white">Discord Server</h4>
                         <p class="text-sm text-slate-500 mb-1">Real-time chat with the community.</p>
                         <a href="#" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Join Server &rarr;</a>
                      </div>
                   </div>

                   <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                         <app-icon name="check" [size]="20"></app-icon>
                      </div>
                      <div>
                         <h4 class="font-bold text-slate-900 dark:text-white">System Status</h4>
                         <p class="text-sm text-slate-500 mb-1">Check if systems are operational.</p>
                         <a href="#" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View Status &rarr;</a>
                      </div>
                   </div>
                </div>
             </div>

             <!-- Contact Form -->
             <div class="p-8 rounded-3xl border shadow-xl
                         bg-white border-slate-200
                         dark:bg-slate-900 dark:border-white/10">
                <h3 class="text-xl font-bold mb-6 text-slate-900 dark:text-white">Send us a message</h3>
                <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
                   <div>
                      <label class="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email</label>
                      <input type="email" formControlName="email" class="w-full px-4 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors">
                   </div>
                   <div>
                      <label class="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Subject</label>
                      <select formControlName="subject" class="w-full px-4 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors">
                         <option value="">Select a topic...</option>
                         <option value="account">Account Issue</option>
                         <option value="billing">Billing & Payments</option>
                         <option value="bug">Report a Bug</option>
                         <option value="other">Other</option>
                      </select>
                   </div>
                   <div>
                      <label class="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Message</label>
                      <textarea formControlName="message" rows="4" class="w-full px-4 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors resize-none"></textarea>
                   </div>
                   
                   @if (success()) {
                      <div class="p-3 rounded bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                         <app-icon name="check" [size]="16"></app-icon>
                         Message sent successfully!
                      </div>
                   }

                   <button type="submit" [disabled]="form.invalid || loading()" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                      {{ loading() ? 'Sending...' : 'Submit Request' }}
                   </button>
                </form>
             </div>
          </div>
       </div>
    </div>
  `
})
export class SupportComponent {
  fb = inject(FormBuilder);
  loading = signal(false);
  success = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  categories = [
    { title: 'Getting Started', desc: 'Installation guides and account setup.', icon: 'rocket', colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { title: 'Account & Security', desc: '2FA, Password reset, and privacy settings.', icon: 'shield', colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { title: 'Billing', desc: 'Manage subscriptions and payments.', icon: 'tag', colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
    { title: 'Node Operators', desc: 'Technical docs for running a Synapse node.', icon: 'terminal', colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
  ];

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    
    // Simulate API call
    setTimeout(() => {
       this.loading.set(false);
       this.success.set(true);
       this.form.reset();
       setTimeout(() => this.success.set(false), 5000);
    }, 1500);
  }
}

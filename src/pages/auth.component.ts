
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { IconComponent } from '../components/icon.component';
import { ParticlesComponent } from '../components/particles.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, ParticlesComponent],
  template: `
    <div class="min-h-screen pt-24 pb-12 flex items-center justify-center relative overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 -z-10">
        <app-particles class="opacity-40 dark:opacity-30"></app-particles>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[100px] rounded-full
                    bg-indigo-300/20 dark:bg-indigo-600/20"></div>
        <div class="absolute inset-0 bg-grid opacity-20"></div>
      </div>

      <div class="w-full max-w-md p-8 rounded-2xl border shadow-2xl relative z-10 mx-4 backdrop-blur-xl
                  bg-white/60 border-slate-200
                  dark:bg-slate-900/60 dark:border-white/10">
        
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
            <app-icon name="zap" [size]="24"></app-icon>
          </div>
          
          <h1 class="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{{ isLogin() ? 'Welcome Back' : 'Join Synapse' }}</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {{ isLogin() ? 'Enter your credentials to access your account.' : 'Create your decentralized identity.' }}
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email Address</label>
              <div class="relative">
                <input 
                  type="email" 
                  formControlName="email"
                  class="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors
                         bg-white border-slate-200 text-slate-900 placeholder-slate-400
                         dark:bg-slate-950/50 dark:border-white/10 dark:text-white dark:placeholder-slate-600"
                  placeholder="name@example.com"
                >
                <div class="absolute left-3 top-3.5 text-slate-500">
                   <app-icon name="mail" [size]="18"></app-icon>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Password</label>
              <div class="relative">
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  formControlName="password"
                  class="w-full pl-10 pr-12 py-3 border rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors
                         bg-white border-slate-200 text-slate-900 placeholder-slate-400
                         dark:bg-slate-950/50 dark:border-white/10 dark:text-white dark:placeholder-slate-600"
                  placeholder="••••••••"
                >
                <div class="absolute left-3 top-3.5 text-slate-500">
                  <app-icon name="shield" [size]="18"></app-icon>
                </div>
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                >
                  <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18"></app-icon>
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="p-4 rounded text-sm flex items-center gap-2 border
                          bg-red-50 border-red-100 text-red-600
                          dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200">
                <app-icon name="bug" [size]="16"></app-icon>
                {{ error() }}
              </div>
            }

            @if (successMessage()) {
              <div class="p-4 rounded text-sm flex items-center gap-2 border
                          bg-green-50 border-green-100 text-green-600
                          dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-200">
                <app-icon name="check" [size]="16"></app-icon>
                {{ successMessage() }}
              </div>
            }

            <button 
              type="submit" 
              [disabled]="form.invalid || loading()"
              class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 mt-2">
              @if (loading()) {
                <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                Processing...
              } @else {
                {{ isLogin() ? 'Sign In' : 'Create Account' }}
              }
            </button>
        </form>

        <div class="mt-6 text-center">
          <button 
            type="button"
            (click)="toggleMode()"
            class="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            {{ isLogin() ? "Don't have an account? Sign Up" : 'Already have an account? Sign In' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLogin = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set(null);
    this.successMessage.set(null);
  }

  async submit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const { email, password } = this.form.value;

    try {
      if (this.isLogin()) {
        await this.authService.login(email!, password!);
        this.router.navigate(['/app']);
      } else {
        await this.authService.signUp(email!, password!);
        this.successMessage.set('Account created! Please verify your email if required, or log in.');
        this.isLogin.set(true);
      }
    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'Authentication failed.');
    } finally {
      this.loading.set(false);
    }
  }
}

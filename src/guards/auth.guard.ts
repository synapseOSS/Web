import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Basic check. Since Supabase init is async but fast, signal usually catches up.
  // In a production app, we might want a proper 'loading' check or route resolver.
  
  if (authService.currentUser()) {
    return true;
  }

  // If loading, we might want to allow or wait, but here we redirect to login.
  // Ideally, we should wait for isLoading to be false.
  if (authService.isLoading()) {
     // Very simple non-blocking wait could go here, but for this demo we proceed or fail.
     // We'll rely on the session persisting in localStorage handled by Supabase client automatically.
  }

  // Check storage manually as fallback if signal isn't ready (Supabase restores session instantly usually)
  const session = localStorage.getItem('sb-apqvyyphlrtmuyjnzmuq-auth-token');
  if (session) return true;

  return router.createUrlTree(['/login']);
};
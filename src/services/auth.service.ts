import { Injectable, signal, inject } from '@angular/core';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);
  
  currentUser = signal<User | null>(null);
  session = signal<Session | null>(null);
  isLoading = signal(true);

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get current session from Supabase (checks localStorage automatically)
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      this.setSession(session);
      this.isLoading.set(false);

      // Listen for auth state changes
      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.setSession(session);
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.isLoading.set(false);
    }
  }

  private setSession(session: Session | null) {
    this.session.set(session);
    this.currentUser.set(session?.user ?? null);
  }

  async signUp(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: pass
    });
    
    if (error) throw error;
    
    // Try to create a public user profile
    if (data.user) {
      await this.createPublicUserProfile(data.user);
    }

    return data;
  }

  async login(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  // Helper to ensure public.users record exists
  private async createPublicUserProfile(user: User) {
    try {
      const { error } = await this.supabase
        .from('users')
        .upsert({
          uid: user.id,
          email: user.email,
          username: user.email?.split('@')[0],
          display_name: user.email?.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          created_at: new Date().toISOString()
        });
        
      if (error) console.error('Error creating profile:', error);
    } catch (e) {
      console.error('Error creating profile:', e);
    }
  }
}
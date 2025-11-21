import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://apqvyyphlrtmuyjnzmuq.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwcXZ5eXBobHJ0bXV5am56bXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDUwODcsImV4cCI6MjA3NDI4MTA4N30.On7kjijj7bUg_xzr2HwCTYvLaV-f_1aDYqVTfKai7gc'
    );
  }

  get client() {
    return this.supabase;
  }
}
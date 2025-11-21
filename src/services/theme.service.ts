
import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  darkMode = signal<boolean>(true);

  constructor() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.darkMode.set(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode.set(prefersDark);
    }

    effect(() => {
      const isDark = this.darkMode();
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      const html = document.documentElement;
      
      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    });
  }

  toggle() {
    this.darkMode.update(d => !d);
  }
}

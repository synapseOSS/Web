
import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  darkMode = signal<boolean>(true);
  private isTransitioning = false;

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

  toggle(event?: MouseEvent) {
    if (this.isTransitioning) return;
    
    // If View Transitions API is supported, use it with custom animation
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      this.isTransitioning = true;
      
      // Get click position for ripple effect
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;
      
      // Calculate the maximum distance from click point to corners
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Create clipPath for ripple animation
      const isDark = !this.darkMode();
      
      (document as any).startViewTransition(() => {
        this.darkMode.update(d => !d);
      }).ready.then(() => {
        // Animate the ripple effect
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 800,
            easing: 'ease-in-out',
            pseudoElement: isDark ? '::view-transition-new(root)' : '::view-transition-old(root)'
          }
        ).finished.finally(() => {
          this.isTransitioning = false;
        });
      });
    } else {
      // Fallback for browsers without View Transitions API
      this.createFallbackTransition(event);
    }
  }

  private createFallbackTransition(event?: MouseEvent) {
    this.isTransitioning = true;
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    
    // Create overlay element for ripple effect
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      background: ${this.darkMode() ? '#ffffff' : '#0f172a'};
      clip-path: circle(0px at ${x}px ${y}px);
      transition: clip-path 0.8s ease-in-out;
    `;
    
    document.body.appendChild(overlay);
    
    // Trigger animation
    requestAnimationFrame(() => {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;
    });
    
    // Toggle theme and cleanup
    setTimeout(() => {
      this.darkMode.update(d => !d);
      setTimeout(() => {
        overlay.remove();
        this.isTransitioning = false;
      }, 100);
    }, 400);
  }
}

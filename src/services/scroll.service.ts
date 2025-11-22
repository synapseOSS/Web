import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  headerCollapsed = signal(false);
  
  private lastScrollTop = 0;
  private scrollThreshold = 10;
  private scrollDelta = 5;
  
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Only apply on mobile
    if (window.innerWidth >= 768) {
      this.headerCollapsed.set(false);
      return;
    }
    
    // Don't do anything if scroll difference is too small
    if (Math.abs(scrollTop - this.lastScrollTop) < this.scrollDelta) {
      return;
    }
    
    // Scrolling down
    if (scrollTop > this.lastScrollTop && scrollTop > this.scrollThreshold) {
      this.headerCollapsed.set(true);
    } 
    // Scrolling up
    else if (scrollTop < this.lastScrollTop) {
      this.headerCollapsed.set(false);
    }
    
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
  
  reset() {
    this.headerCollapsed.set(false);
    this.lastScrollTop = 0;
  }
}

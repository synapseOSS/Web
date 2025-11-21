
import { Directive, ElementRef, inject, AfterViewInit, OnDestroy, input, OnInit } from '@angular/core';

export type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'blur-in' | 'scale-up';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;

  animation = input<AnimationType>('fade-up');
  delay = input<number>(0);
  threshold = input<number>(0.1);
  once = input<boolean>(true);

  ngOnInit() {
    // Set initial state as early as possible to avoid flash
    const element = this.el.nativeElement;
    element.classList.add('anim-entry'); // The persistent transition class
    element.classList.add('anim-hidden'); // The start state (invisible)
    element.classList.add(`anim-${this.animation()}`); // The specific transform start state
    
    if (this.delay() > 0) {
      element.style.transitionDelay = `${this.delay()}ms`;
    }
  }

  ngAfterViewInit() {
    const element = this.el.nativeElement;
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Element entered viewport
          element.classList.add('anim-visible');
          element.classList.remove('anim-hidden');
          
          if (this.once()) {
            this.observer?.unobserve(entry.target);
          }
        } else if (!this.once()) {
          // Element left viewport (reset if once is false)
          element.classList.remove('anim-visible');
          element.classList.add('anim-hidden');
        }
      });
    }, {
      threshold: this.threshold(),
      rootMargin: '0px 0px -10% 0px' // Trigger slightly before bottom of screen
    });

    this.observer.observe(element);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

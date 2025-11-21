import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, NgZone, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

@Component({
  selector: 'app-particles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="absolute inset-0 w-full h-full pointer-events-none"></canvas>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
    }
  `]
})
export class ParticlesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private themeService = inject(ThemeService);
  private ngZone = inject(NgZone);

  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private particles: Particle[] = [];
  private resizeObserver: ResizeObserver | null = null;

  private particleCount = 80;
  private colorDot = 'rgba(99, 102, 241, 0.5)'; // Indigo

  constructor() {
    // React to theme changes
    effect(() => {
      const isDark = this.themeService.darkMode();
      this.colorDot = isDark ? 'rgba(165, 180, 252, 0.8)' : 'rgba(79, 70, 229, 0.6)';
    });
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.initParticles();

    // Use ResizeObserver to handle size changes correctly
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.initCanvas();
        // Optional: re-init particles if you want to reset them on resize, 
        // or just let them be. Re-init avoids them getting stuck off-screen.
        this.initParticles();
      });
    });

    if (this.canvasRef.nativeElement.parentElement) {
      this.resizeObserver.observe(this.canvasRef.nativeElement.parentElement);
    }

    // Run animation loop outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // Removed @HostListener('window:resize') as ResizeObserver handles it better

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      // Set canvas resolution to match display size
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    this.ctx = canvas.getContext('2d')!;
    // Adjust particle count based on canvas area
    const area = canvas.width * canvas.height;
    this.particleCount = Math.floor(area / 8000);
  }

  private initParticles() {
    const canvas = this.canvasRef.nativeElement;
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      const size = Math.random() * 2 + 1;
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: size
      });
    }
  }

  private animate = () => {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    // Verify context exists (in case of rapid destruction)
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      // Move
      p.x += p.vx;
      p.y += p.vy;
      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      // Draw particle dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = this.colorDot;
      ctx.fill();
    }
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}

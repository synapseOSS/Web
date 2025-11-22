import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, NgZone, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  originalX: number;
  originalY: number;
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
  
  // Cursor tracking
  private mouseX = -1000;
  private mouseY = -1000;
  private gravitationalPull = 150; // Radius of gravitational effect
  private pullStrength = 0.3; // Strength of the pull

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

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  @HostListener('document:mouseleave')
  onMouseLeave() {
    this.mouseX = -1000;
    this.mouseY = -1000;
  }

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
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: size,
        originalX: x,
        originalY: y
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
      
      // Calculate distance to cursor
      const dx = this.mouseX - p.x;
      const dy = this.mouseY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Apply gravitational pull if within range
      if (distance < this.gravitationalPull && distance > 0) {
        // Calculate gravitational force (inverse square law with smoothing)
        const force = (1 - distance / this.gravitationalPull) * this.pullStrength;
        const angle = Math.atan2(dy, dx);
        
        // Apply force to velocity
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      } else {
        // Return to original position when cursor is far
        const returnDx = p.originalX - p.x;
        const returnDy = p.originalY - p.y;
        const returnDistance = Math.sqrt(returnDx * returnDx + returnDy * returnDy);
        
        if (returnDistance > 1) {
          p.vx += returnDx * 0.01;
          p.vy += returnDy * 0.01;
        }
      }
      
      // Apply damping to velocity
      p.vx *= 0.95;
      p.vy *= 0.95;
      
      // Move particle
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) {
        p.vx *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
      }
      if (p.y < 0 || p.y > canvas.height) {
        p.vy *= -1;
        p.y = Math.max(0, Math.min(canvas.height, p.y));
      }
      
      // Calculate opacity based on distance to cursor (space-time curve effect)
      let opacity = 0.5;
      if (distance < this.gravitationalPull) {
        opacity = 0.5 + (1 - distance / this.gravitationalPull) * 0.5;
      }
      
      // Draw particle with dynamic opacity
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      const baseColor = this.colorDot.match(/rgba?\(([^)]+)\)/)?.[1] || '99, 102, 241';
      ctx.fillStyle = `rgba(${baseColor}, ${opacity})`;
      ctx.fill();
      
      // Draw connection lines to nearby particles for space-time curve effect
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const pdx = p2.x - p.x;
        const pdy = p2.y - p.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        
        if (pdist < 100) {
          const lineOpacity = (1 - pdist / 100) * 0.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${baseColor}, ${lineOpacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}

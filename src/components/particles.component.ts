
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
  private mouse = { x: -1000, y: -1000 };
  private isPressed = false;
  
  // Configuration
  private particleCount = 80;
  private connectionDistance = 120;
  private mouseDistance = 180;
  
  // Colors
  private colorDot = 'rgba(99, 102, 241, 0.5)'; // Indigo
  private colorLine = '99, 102, 241'; // Indigo RGB

  constructor() {
    // React to theme changes
    effect(() => {
      const isDark = this.themeService.darkMode();
      this.colorDot = isDark ? 'rgba(165, 180, 252, 0.8)' : 'rgba(79, 70, 229, 0.6)';
      this.colorLine = isDark ? '165, 180, 252' : '79, 70, 229';
    });
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.initParticles();
    
    // Run animation loop outside Angular zone
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
    
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchstart', this.onMouseDown);
    window.addEventListener('touchend', this.onMouseUp);
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchstart', this.onMouseDown);
    window.removeEventListener('touchend', this.onMouseUp);
  }

  @HostListener('window:resize')
  onResize() {
    this.initCanvas();
    this.initParticles();
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    
    if (parent) {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    
    this.ctx = canvas.getContext('2d')!;
    
    // Adjust density based on screen size
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

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  private onTouchMove = (e: TouchEvent) => {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if(e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
    }
  }

  private onMouseDown = () => {
      this.isPressed = true;
  }

  private onMouseUp = () => {
      this.isPressed = false;
  }

  private animate = () => {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Interaction radius increases when pressed
    const currentMouseDist = this.isPressed ? this.mouseDistance * 2.0 : this.mouseDistance;
    
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];
      
      // Move
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      // Distance to mouse
      let dx = this.mouse.x - p.x;
      let dy = this.mouse.y - p.y;
      let distMouse = Math.sqrt(dx*dx + dy*dy);
      
      // Draw line to mouse if close
      if (distMouse < currentMouseDist) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${this.colorLine}, ${1 - distMouse/currentMouseDist})`;
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(this.mouse.x, this.mouse.y);
        ctx.stroke();
      }

      // Draw Particle Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = this.colorDot;
      ctx.fill();
      
      // Connect to other particles
      for (let j = i; j < this.particles.length; j++) {
        let p2 = this.particles[j];
        let distP = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
        
        if (distP < this.connectionDistance) {
          // Standard connection line
          const opacity = 1 - distP/this.connectionDistance;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${this.colorLine}, ${0.2 * opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // --- GEOMETRIC SHAPE GENERATION ---
          // Check if second particle is also near mouse
          let dx2 = this.mouse.x - p2.x;
          let dy2 = this.mouse.y - p2.y;
          let distMouse2 = Math.sqrt(dx2*dx2 + dy2*dy2);

          // If both particles are within range of mouse, form a triangle
          if (distMouse < currentMouseDist && distMouse2 < currentMouseDist) {
              ctx.beginPath();
              // Calculate fill opacity based on how close the triangle is to the center of cursor
              // Creates a "glowing core" effect
              const fillOpacity = (1 - distMouse/currentMouseDist) * (1 - distMouse2/currentMouseDist) * 0.4;
              ctx.fillStyle = `rgba(${this.colorLine}, ${fillOpacity})`;
              
              // Draw triangle: Mouse -> P1 -> P2
              ctx.moveTo(this.mouse.x, this.mouse.y);
              ctx.lineTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.closePath();
              ctx.fill();
          }
        }
      }
    }
    
    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}

import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, AfterViewInit } from '@angular/core';

interface Heart {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  scaleX: number; // For 3D spin simulation
  scaleSpeed: number;
  color: string;
}

@Component({
  selector: 'app-heart-emitter',
  template: `<canvas #heartCanvas class="heart-canvas"></canvas>`,
  styles: [`
    .heart-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }
  `]
})
export class HeartEmitterComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private hearts: Heart[] = [];
  private animationId?: number;
  private maxHearts = 40;
  private colors = [
    'rgba(244, 63, 94, 0.45)',  // Rose pink
    'rgba(236, 72, 153, 0.45)',  // Magenta
    'rgba(219, 39, 119, 0.45)',  // Deep Pink
    'rgba(168, 85, 247, 0.40)',  // Soft purple
    'rgba(251, 113, 133, 0.50)'  // Peach blush
  ];

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);

    // Run animation loop outside Angular to avoid change detection on every frame
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeCanvas);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private resizeCanvas = () => {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
  };

  private spawnHeart(canvasHeight: number, canvasWidth: number, isInitial = false): Heart {
    return {
      x: Math.random() * canvasWidth,
      y: isInitial ? Math.random() * canvasHeight : canvasHeight + 20,
      size: Math.random() * 15 + 10,
      speedY: -(Math.random() * 0.8 + 0.4),
      speedX: Math.sin(Math.random() * Math.PI * 2) * 0.3,
      opacity: Math.random() * 0.5 + 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      scaleX: Math.random() * 2 - 1,
      scaleSpeed: (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
      color: this.colors[Math.floor(Math.random() * this.colors.length)]
    };
  }

  private drawHeart(ctx: CanvasRenderingContext2D, heart: Heart) {
    ctx.save();
    ctx.translate(heart.x, heart.y);
    ctx.rotate(heart.rotation);
    ctx.scale(heart.scaleX, 1); // Simulate 3D rotation by scaling horizontal axis

    ctx.beginPath();
    // Bezier curve heart drawing starting from bottom center point
    ctx.moveTo(0, heart.size / 4);
    ctx.bezierCurveTo(
      -heart.size / 2, -heart.size / 2, 
      -heart.size, heart.size / 3, 
      0, heart.size
    );
    ctx.bezierCurveTo(
      heart.size, heart.size / 3, 
      heart.size / 2, -heart.size / 2, 
      0, heart.size / 4
    );

    ctx.closePath();
    ctx.fillStyle = heart.color;
    
    // Add neon glow to particles
    ctx.shadowBlur = 15;
    ctx.shadowColor = heart.color;
    
    ctx.fill();
    ctx.restore();
  }

  private animate = () => {
    if (!this.ctx || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Initial fill of hearts
    if (this.hearts.length < this.maxHearts) {
      const isInitial = this.hearts.length === 0;
      while (this.hearts.length < this.maxHearts) {
        this.hearts.push(this.spawnHeart(canvas.height, canvas.width, isInitial));
      }
    }

    // Update and draw hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const heart = this.hearts[i];
      heart.y += heart.speedY;
      heart.x += heart.speedX;
      heart.rotation += heart.rotationSpeed;
      
      // Update 3D spin scale
      heart.scaleX += heart.scaleSpeed;
      if (heart.scaleX > 1 || heart.scaleX < -1) {
        heart.scaleSpeed = -heart.scaleSpeed;
      }

      // Slowly fade out near top
      if (heart.y < 100) {
        heart.opacity -= 0.005;
      }

      // Recycle dead or offscreen hearts
      if (heart.y < -20 || heart.opacity <= 0 || heart.x < -20 || heart.x > canvas.width + 20) {
        this.hearts[i] = this.spawnHeart(canvas.height, canvas.width, false);
      } else {
        this.ctx.globalAlpha = heart.opacity;
        this.drawHeart(this.ctx, heart);
      }
    }
    
    this.ctx.globalAlpha = 1.0;
    this.animationId = requestAnimationFrame(this.animate);
  };
}

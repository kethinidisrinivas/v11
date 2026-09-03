import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, AfterViewInit, Input } from '@angular/core';

interface Sparkle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacitySpeed: number;
}

@Component({
  selector: 'app-sparkles',
  templateUrl: './sparkles.component.html',
  styleUrls: ['./sparkles.component.css']
})
export class SparklesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sparklesCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() minSize: number = 0.4;
  @Input() maxSize: number = 1.0;
  @Input() particleDensity: number = 1200;
  @Input() particleColor: string = '#FFFFFF';
  @Input() speed: number = 1;

  private ctx: CanvasRenderingContext2D | null = null;
  private sparkles: Sparkle[] = [];
  private animationId?: number;
  private maxSparkles = 50;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);

    // Run animation loop outside Angular Zone to optimize performance
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
    const parent = canvas.parentElement;
    
    canvas.width = parent?.offsetWidth || window.innerWidth;
    canvas.height = parent?.offsetHeight || window.innerHeight;
    
    // Update total particles based on new canvas size and density configuration
    const area = canvas.width * canvas.height;
    this.maxSparkles = Math.max(15, Math.floor((area * this.particleDensity) / 1000000));
    
    // Re-initialize sparkles list
    this.sparkles = [];
    for (let i = 0; i < this.maxSparkles; i++) {
      this.sparkles.push(this.spawnSparkle(canvas.width, canvas.height, true));
    }
  };

  private spawnSparkle(canvasWidth: number, canvasHeight: number, isInitial = false): Sparkle {
    return {
      x: Math.random() * canvasWidth,
      y: isInitial ? Math.random() * canvasHeight : canvasHeight + 5,
      size: Math.random() * (this.maxSize - this.minSize) + this.minSize,
      speedX: (Math.random() - 0.5) * 0.15 * this.speed,
      speedY: -(Math.random() * 0.2 + 0.05) * this.speed,
      opacity: Math.random() * 0.8 + 0.2,
      opacitySpeed: (Math.random() * 0.01 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
    };
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, sparkle: Sparkle) {
    ctx.beginPath();
    ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
    ctx.fillStyle = this.particleColor;
    ctx.globalAlpha = sparkle.opacity;
    ctx.fill();
  }

  private animate = () => {
    if (!this.ctx || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Keep sparkles list populated
    while (this.sparkles.length < this.maxSparkles) {
      this.sparkles.push(this.spawnSparkle(canvas.width, canvas.height, false));
    }

    // Update and draw sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sparkle = this.sparkles[i];
      sparkle.y += sparkle.speedY;
      sparkle.x += sparkle.speedX;
      
      // Twinkle logic
      sparkle.opacity += sparkle.opacitySpeed;
      if (sparkle.opacity >= 1.0) {
        sparkle.opacity = 1.0;
        sparkle.opacitySpeed = -Math.abs(sparkle.opacitySpeed);
      } else if (sparkle.opacity <= 0.15) {
        sparkle.opacity = 0.15;
        sparkle.opacitySpeed = Math.abs(sparkle.opacitySpeed);
      }

      // Recycle sparkles that leave canvas bounds
      if (
        sparkle.y < -5 || 
        sparkle.y > canvas.height + 10 || 
        sparkle.x < -5 || 
        sparkle.x > canvas.width + 5
      ) {
        this.sparkles[i] = this.spawnSparkle(canvas.width, canvas.height, false);
      } else {
        this.drawSparkle(this.ctx, sparkle);
      }
    }
    
    this.ctx.globalAlpha = 1.0;
    this.animationId = requestAnimationFrame(this.animate);
  };
}

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { COUNTRY_CODES, CountryCode, findCountryByPhone } from './services/country-codes';

class Particle {
  pos = { x: 0, y: 0 };
  vel = { x: 0, y: 0 };
  acc = { x: 0, y: 0 };
  target = { x: 0, y: 0 };
  closeEnoughTarget = 100;
  maxSpeed = 1.0;
  maxForce = 0.1;
  particleSize = 10;
  isKilled = false;
  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const distance = Math.hypot(this.pos.x - this.target.x, this.pos.y - this.target.y);
    if (distance < this.closeEnoughTarget) proximityMult = distance / this.closeEnoughTarget;

    const towards = { x: this.target.x - this.pos.x, y: this.target.y - this.pos.y };
    const mag = Math.hypot(towards.x, towards.y);
    if (mag > 0) {
      towards.x = (towards.x / mag) * this.maxSpeed * proximityMult;
      towards.y = (towards.y / mag) * this.maxSpeed * proximityMult;
    }

    const steer = { x: towards.x - this.vel.x, y: towards.y - this.vel.y };
    const steerMag = Math.hypot(steer.x, steer.y);
    if (steerMag > 0) {
      steer.x = (steer.x / steerMag) * this.maxForce;
      steer.y = (steer.y / steerMag) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;
    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.colorWeight < 1.0) this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    const c = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    };
    ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.fillRect(this.pos.x, this.pos.y, 3, 3);
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      const p = generateRandomPos(width / 2, height / 2, (width + height) / 2);
      this.target.x = p.x;
      this.target.y = p.y;
      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;
      this.isKilled = true;
    }
  }
}

function generateRandomPos(x: number, y: number, mag: number) {
  const randomX = Math.random() * 1000;
  const randomY = Math.random() * 500;
  const dir = { x: randomX - x, y: randomY - y };
  const mag2 = Math.hypot(dir.x, dir.y);
  if (mag2 > 0) {
    dir.x = (dir.x / mag2) * mag;
    dir.y = (dir.y / mag2) * mag;
  }
  return { x: x + dir.x, y: y + dir.y };
}

function findBlobs(pixels: Uint8ClampedArray, width: number, height: number) {
  const visited = new Uint8Array(width * height);
  const blobs: Array<{ minX: number; maxX: number; minY: number; maxY: number; count: number }> = [];
  const alphaAt = (x: number, y: number) => pixels[(y * width + x) * 4 + 3];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!visited[i] && alphaAt(x, y) > 0) {
        let minX = x, maxX = x, minY = y, maxY = y, count = 0;
        const stack: Array<[number, number]> = [[x, y]];
        visited[i] = 1;
        while (stack.length) {
          const popped = stack.pop();
          if (!popped) continue;
          const [cx, cy] = popped;
          count++;
          if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
          const neighbors: Array<[number, number]> = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
            [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = ny * width + nx;
              if (!visited[ni] && alphaAt(nx, ny) > 0) {
                visited[ni] = 1;
                stack.push([nx, ny]);
              }
            }
          }
        }
        blobs.push({ minX, maxX, minY, maxY, count });
      }
    }
  }
  return blobs;
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const top = size * 0.3;
  ctx.moveTo(cx, cy + top);
  ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + top);
  ctx.bezierCurveTo(cx - size / 2, cy + top + size / 4, cx, cy + top + size / 2, cx, cy + size);
  ctx.bezierCurveTo(cx, cy + top + size / 2, cx + size / 2, cy + top + size / 4, cx + size / 2, cy + top);
  ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + top);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Romantic Messenger';
  isLoggedIn = false;
  // Auth Mode Toggles & Fields
  isLoginMode = true; // toggles between Login and Register
  loginSubMode: 'email' | 'otp' = 'otp'; // default to Phone OTP login for easy testing

  // Form Fields - Login
  loginEmail = '';
  loginPassword = '';
  loginPhone = '';
  loginOtp = '';

  // Secret Code Protection State
  loginSecretCode = '';
  registerSecretCode = '';
  showLoginSecret = false;
  showRegisterSecret = false;
  secretCodeError = '';
  readonly SECRET_CODE = '050605';
  readonly WRONG_SECRET_MSG = 'Hmm, that doesn,t feel like love. Try again 💔';

  // Form Fields - Register
  registerStep: 1 | 2 | 3 = 1; // 1: Phone & Name, 2: OTP verification, 3: Email & Password
  registerPhone = '';
  registerName = '';
  registerOtp = '';
  registerEmail = '';
  registerPassword = '';

  // Country Flags & Dial Codes State
  countryCodes = COUNTRY_CODES;
  selectedLoginCountry: CountryCode = COUNTRY_CODES.find(c => c.code === 'IN') || COUNTRY_CODES[1]; // default India (+91)
  selectedRegisterCountry: CountryCode = COUNTRY_CODES.find(c => c.code === 'IN') || COUNTRY_CODES[1]; // default India (+91)
  showLoginCountryDropdown = false;
  showRegisterCountryDropdown = false;
  loginCountrySearch = '';
  registerCountrySearch = '';

  // Timer & Demo OTP State
  resendCountdown = 0;
  private resendTimerInterval: any;
  demoOtpAlert = '';

  // Messages
  errorMessage = '';
  successMessage = '';

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showLoginCountryDropdown = false;
    this.showRegisterCountryDropdown = false;
  }

  get filteredLoginCountries(): CountryCode[] {
    if (!this.loginCountrySearch.trim()) return this.countryCodes;
    const q = this.loginCountrySearch.toLowerCase().trim();
    return this.countryCodes.filter(
      c => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    );
  }

  get filteredRegisterCountries(): CountryCode[] {
    if (!this.registerCountrySearch.trim()) return this.countryCodes;
    const q = this.registerCountrySearch.toLowerCase().trim();
    return this.countryCodes.filter(
      c => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    );
  }

  toggleLoginCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.showLoginCountryDropdown = !this.showLoginCountryDropdown;
    this.showRegisterCountryDropdown = false;
    this.loginCountrySearch = '';
  }

  toggleRegisterCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.showRegisterCountryDropdown = !this.showRegisterCountryDropdown;
    this.showLoginCountryDropdown = false;
    this.registerCountrySearch = '';
  }

  selectLoginCountry(country: CountryCode): void {
    this.selectedLoginCountry = country;
    this.showLoginCountryDropdown = false;
    if (!this.loginPhone.startsWith(country.dialCode)) {
      const cleanNumber = this.loginPhone.replace(/^\+\d+\s*/, '');
      this.loginPhone = cleanNumber ? `${country.dialCode} ${cleanNumber}` : `${country.dialCode} `;
    }
  }

  selectRegisterCountry(country: CountryCode): void {
    this.selectedRegisterCountry = country;
    this.showRegisterCountryDropdown = false;
    if (!this.registerPhone.startsWith(country.dialCode)) {
      const cleanNumber = this.registerPhone.replace(/^\+\d+\s*/, '');
      this.registerPhone = cleanNumber ? `${country.dialCode} ${cleanNumber}` : `${country.dialCode} `;
    }
  }

  onLoginPhoneChange(): void {
    const match = findCountryByPhone(this.loginPhone);
    if (match) {
      this.selectedLoginCountry = match;
    }
  }

  onRegisterPhoneChange(): void {
    const match = findCountryByPhone(this.registerPhone);
    if (match) {
      this.selectedRegisterCountry = match;
    }
  }

  // Particle Animation variables
  private canvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx?: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mouse = { x: 0, y: 0, isPressed: false, isRightClick: false };
  private animationFrameId?: number;
  private sequenceTimeouts: any[] = [];
  private cleanupListeners: () => void = () => { };

  @ViewChild('particleCanvas', { static: false }) set canvas(content: ElementRef<HTMLCanvasElement> | undefined) {
    if (content) {
      this.canvasRef = content;
      const canvasEl = content.nativeElement;
      const context = canvasEl.getContext('2d');
      if (context) {
        this.ctx = context;
        this.initParticleAnimation(canvasEl);
      }
    } else {
      this.stopParticleAnimation();
    }
  }

  private authSub?: Subscription;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.authSub = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        this.router.navigate(['/messenger']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
    this.stopParticleAnimation();
    this.clearResendTimer();
  }

  updateLoginStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.registerStep = 1;
    this.clearMessages();
  }

  switchLoginSubMode(mode: 'email' | 'otp'): void {
    this.loginSubMode = mode;
    this.clearMessages();
  }

  private validateSecretCode(code: string): boolean {
    if ((code || '').trim() !== this.SECRET_CODE) {
      this.secretCodeError = this.WRONG_SECRET_MSG;
      return false;
    }
    this.secretCodeError = '';
    return true;
  }

  // --- OTP Login Handlers ---
  sendLoginOtp(): void {
    this.clearMessages();
    if (!this.validateSecretCode(this.loginSecretCode)) return;
    const result = this.authService.sendLoginOtp(this.loginPhone);
    if (result.success) {
      this.successMessage = result.message;
      this.demoOtpAlert = result.otp || '123456';
      this.startResendTimer();
    } else {
      this.errorMessage = result.message;
    }
  }

  resendLoginOtp(): void {
    if (this.resendCountdown > 0) return;
    this.sendLoginOtp();
  }

  onLoginWithOtp(): void {
    this.clearMessages();
    if (!this.validateSecretCode(this.loginSecretCode)) return;
    const result = this.authService.loginWithOtp(this.loginPhone, this.loginOtp);
    if (result.success) {
      this.isLoggedIn = true;
      this.clearFormFields();
      this.router.navigate(['/messenger']);
    } else {
      this.errorMessage = result.message;
    }
  }

  startResendTimer(): void {
    this.clearResendTimer();
    this.resendCountdown = 20;
    this.resendTimerInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.clearResendTimer();
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimerInterval) {
      clearInterval(this.resendTimerInterval);
      this.resendTimerInterval = null;
    }
    this.resendCountdown = 0;
  }

  // --- Registration Multi-step Handlers ---
  sendRegisterOtp(): void {
    this.clearMessages();
    if (!this.validateSecretCode(this.registerSecretCode)) return;
    const result = this.authService.sendRegistrationOtp(this.registerPhone);
    if (result.success) {
      this.successMessage = result.message;
      this.demoOtpAlert = result.otp || '123456';
      this.registerStep = 2;
    } else {
      this.errorMessage = result.message;
    }
  }

  verifyRegisterOtp(): void {
    this.clearMessages();
    if (!this.validateSecretCode(this.registerSecretCode)) return;
    const result = this.authService.verifyRegistrationOtp(this.registerPhone, this.registerOtp);
    if (result.success) {
      this.successMessage = result.message;
      this.registerStep = 3;
    } else {
      this.errorMessage = result.message;
    }
  }

  completeRegistration(): void {
    this.clearMessages();
    if (!this.validateSecretCode(this.registerSecretCode)) return;
    const result = this.authService.completePhoneRegistration(
      this.registerPhone,
      this.registerName,
      this.registerEmail,
      this.registerPassword
    );

    if (result.success) {
      this.successMessage = result.message;
      this.isLoggedIn = true;
      this.clearFormFields();
      this.router.navigate(['/messenger']);
    } else {
      this.errorMessage = result.message;
    }
  }

  // --- Standard Email Login ---
  onLogin(): void {
    this.clearMessages();
    if (!this.validateSecretCode(this.loginSecretCode)) return;
    const result = this.authService.login(this.loginEmail, this.loginPassword);

    if (result.success) {
      this.isLoggedIn = true;
      this.clearFormFields();
      this.router.navigate(['/messenger']);
    } else {
      this.errorMessage = result.message;
    }
  }

  handleLogout(): void {
    this.isLoggedIn = false;
    this.clearMessages();
    this.router.navigate(['/']);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.demoOtpAlert = '';
    this.secretCodeError = '';
  }

  private clearFormFields(): void {
    this.loginPassword = '';
    this.loginOtp = '';
    this.loginSecretCode = '';
    this.registerPassword = '';
    this.registerName = '';
    this.registerEmail = '';
    this.registerOtp = '';
    this.registerSecretCode = '';
    this.secretCodeError = '';
    this.registerStep = 1;
    this.clearResendTimer();
  }

  private initParticleAnimation(canvas: HTMLCanvasElement): void {
    this.stopParticleAnimation();
    this.particles = [];

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    };

    const mousedownHandler = (e: MouseEvent) => {
      this.mouse.isPressed = true;
      this.mouse.isRightClick = e.button === 2;
      getMousePos(e);
    };

    const mouseupHandler = () => {
      this.mouse.isPressed = false;
      this.mouse.isRightClick = false;
    };

    const mousemoveHandler = (e: MouseEvent) => {
      getMousePos(e);
    };

    const contextmenuHandler = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', mousedownHandler);
    window.addEventListener('mouseup', mouseupHandler);
    canvas.addEventListener('mousemove', mousemoveHandler);
    canvas.addEventListener('contextmenu', contextmenuHandler);

    this.cleanupListeners = () => {
      canvas.removeEventListener('mousedown', mousedownHandler);
      window.removeEventListener('mouseup', mouseupHandler);
      canvas.removeEventListener('mousemove', mousemoveHandler);
      canvas.removeEventListener('contextmenu', contextmenuHandler);
    };

    this.playSequence(canvas);

    const animate = () => {
      if (!this.ctx) return;
      this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        particle.move();
        particle.draw(this.ctx);
        if (particle.isKilled) {
          if (
            particle.pos.x < 0 ||
            particle.pos.x > canvas.width ||
            particle.pos.y < 0 ||
            particle.pos.y > canvas.height
          ) {
            this.particles.splice(i, 1);
          }
        }
      }

      if (this.mouse.isPressed && this.mouse.isRightClick) {
        this.particles.forEach(p => {
          const d = Math.hypot(p.pos.x - this.mouse.x, p.pos.y - this.mouse.y);
          if (d < 50) p.kill(canvas.width, canvas.height);
        });
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private stopParticleAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    this.sequenceTimeouts.forEach(t => clearTimeout(t));
    this.sequenceTimeouts = [];
    this.cleanupListeners();
  }

  private playSequence(canvas: HTMLCanvasElement): void {
    this.sequenceTimeouts.forEach(t => clearTimeout(t));
    this.sequenceTimeouts = [];

    this.setWord(canvas, [
      { text: 'Love ', color: '#ff3b5c' },
      { text: 'You', color: '#e63946' },
    ], 110);

    const t1 = setTimeout(() => {
      this.setWord(canvas, [
        { text: 'Varshitha', color: '#ffffff' },
      ], 150);
    }, 4500);

    this.sequenceTimeouts.push(t1);
  }

  private setWord(canvas: HTMLCanvasElement, segments: Array<{ text: string; color: string }>, fontSize: number = 110): void {
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const octx = off.getContext('2d');
    if (!octx) return;

    octx.font = `italic bold ${fontSize}px Arial`;
    octx.textAlign = 'left';
    octx.textBaseline = 'middle';

    const fullText = segments.map(s => s.text).join('');
    const totalWidth = octx.measureText(fullText).width;
    let x = canvas.width / 2 - totalWidth / 2;
    const y = canvas.height / 2;

    segments.forEach(seg => {
      octx.fillStyle = seg.color;
      octx.fillText(seg.text, x, y);
      x += octx.measureText(seg.text).width;
    });

    if (fullText.toLowerCase().includes('i')) {
      const probeData = octx.getImageData(0, 0, canvas.width, canvas.height);
      const blobs = findBlobs(probeData.data, canvas.width, canvas.height);
      if (blobs.length) {
        const dot = blobs.reduce((a, b) => (a.count < b.count ? a : b));
        const dotW = dot.maxX - dot.minX;
        const dotH = dot.maxY - dot.minY;
        const cx = (dot.minX + dot.maxX) / 2;
        const cy = (dot.minY + dot.maxY) / 2;
        const pad = 4;
        octx.clearRect(dot.minX - pad, dot.minY - pad, dotW + pad * 2, dotH + pad * 2);
        const heartSize = Math.max(dotW, dotH) * 2.6;
        drawHeart(octx, cx, cy - heartSize * 0.32, heartSize, 'rgb(139,0,0)');
      }
    }

    const pixelSteps = 6;
    const imageData = octx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const coordsIndexes: number[] = [];
    for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
      coordsIndexes.push(i);
    }
    for (let i = coordsIndexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = coordsIndexes[i];
      coordsIndexes[i] = coordsIndexes[j];
      coordsIndexes[j] = temp;
    }

    let particleIndex = 0;
    for (const coordIndex of coordsIndexes) {
      const alpha = pixels[coordIndex + 3];
      if (alpha > 0) {
        const px = (coordIndex / 4) % canvas.width;
        const py = Math.floor(coordIndex / 4 / canvas.width);
        const pixelColor = { r: pixels[coordIndex], g: pixels[coordIndex + 1], b: pixels[coordIndex + 2] };

        let particle: Particle;
        if (particleIndex < this.particles.length) {
          particle = this.particles[particleIndex];
          particle.isKilled = false;
          particleIndex++;
        } else {
          particle = new Particle();
          const p = generateRandomPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2);
          particle.pos.x = p.x;
          particle.pos.y = p.y;
          particle.particleSize = Math.random() * 6 + 6;
          particle.colorBlendRate = Math.random() * 0.0275 + 0.0025;
          this.particles.push(particle);
        }

        particle.maxSpeed = Math.random() * 3 + 2; // Slower speed
        particle.maxForce = particle.maxSpeed * 0.03; // Slower steering force

        particle.startColor = {
          r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
          g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
          b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
        };
        particle.targetColor = pixelColor;
        particle.colorWeight = 0;
        particle.target.x = px;
        particle.target.y = py;
      }
    }

    for (let i = particleIndex; i < this.particles.length; i++) {
      this.particles[i].kill(canvas.width, canvas.height);
    }
  }
}

export class YourAuthComponent {
  isFlipped = false;

  onCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // scroll area (auth-card-body) లో టచ్ అయితే flip చేయవద్దు
    if (target.closest('.auth-card-body')) {
      return;
    }

    // card మీద ఎక్కడైనా (image side / header / footer) tap చేస్తే flip అవ్వాలి
    this.isFlipped = !this.isFlipped;
  }
}
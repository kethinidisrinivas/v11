import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService, UserRecord } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('photoInput') photoInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('profileShaderCanvas') profileShaderCanvasRef!: ElementRef<HTMLCanvasElement>;

  currentUser: UserRecord | null = null;

  // Editing Flags
  isEditingName = false;
  tempName = '';

  isEditingAbout = false;
  tempAbout = '';

  // Photo Options Dialog State
  showPhotoOptionsModal = false;

  // Toast Banner
  toastMsg = '';
  private toastTimeout: any;
  private animationFrameId?: number;

  defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face';

  constructor(
    private authService: AuthService,
    private location: Location,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngAfterViewInit(): void {
    this.initProfileWebGLShader();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.currentUser = {
        id: 'me',
        name: 'Srinivas',
        avatar: this.defaultAvatar,
        statusText: 'Hey there! I am using this app.',
        phone: '+1 555 0101',
        songs: [],
        linkedDevices: []
      };
    }
  }

  goBack(): void {
    this.location.back();
  }

  // --- WebGL Starfield Shader Animation ---
  private initProfileWebGLShader(): void {
    if (!this.profileShaderCanvasRef) return;
    const canvas = this.profileShaderCanvasRef.nativeElement;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const syncSize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', syncSize);
    syncSize();

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      vec3 starLayer(vec2 uv, float scale, float time) {
        vec3 col = vec3(0.0);
        vec2 st = uv * scale;
        vec2 id = floor(st);
        vec2 gv = fract(st) - 0.5;

        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            float n = hash21(id + offset);
            
            // Floating drift motion
            vec2 p = vec2(hash21(id + offset + 1.0), hash21(id + offset + 2.0)) - 0.5;
            p += 0.08 * vec2(sin(time * 0.5 + n * 6.28), cos(time * 0.4 + n * 6.28));
            
            float d = length(gv - offset - p);
            
            // Star size & twinkle variation
            float starSize = mix(0.015, 0.07, fract(n * 34.5));
            float twinkle = 0.4 + 0.6 * sin(time * (1.5 + n * 3.5) + n * 12.0);
            
            float star = smoothstep(starSize, 0.0, d) * twinkle;
            vec3 starColor = mix(vec3(0.9, 0.95, 1.0), vec3(0.8, 0.7, 1.0), fract(n * 78.9));
            col += star * starColor;
          }
        }
        return col;
      }

      void main() {
          vec2 uv = v_texCoord;
          
          vec3 color1 = vec3(0.02, 0.08, 0.14);
          vec3 color2 = vec3(0.15, 0.05, 0.2);
          
          float pulse1 = 0.5 + 0.5 * sin(u_time * 0.4);
          float pulse2 = 0.5 + 0.5 * cos(u_time * 0.3 + 1.5);
          
          float dist1 = distance(uv, vec2(0.2, 0.8) + 0.1 * vec2(sin(u_time * 0.2), cos(u_time * 0.25)));
          float dist2 = distance(uv, vec2(0.8, 0.2) + 0.1 * vec2(cos(u_time * 0.3), sin(u_time * 0.2)));
          
          vec3 finalColor = mix(color1, color2, uv.y);
          
          finalColor += vec3(0.1, 0.05, 0.15) * (1.0 - smoothstep(0.0, 0.6, dist1)) * pulse1;
          finalColor += vec3(0.15, 0.1, 0.2) * (1.0 - smoothstep(0.0, 0.7, dist2)) * pulse2;
          
          // Realistic multi-layered twinkling star field
          vec3 stars = starLayer(uv, 32.0, u_time) * 0.85 + starLayer(uv + 0.35, 60.0, u_time * 0.8) * 0.55;
          finalColor += stars;

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    this.ngZone.runOutsideAngular(() => {
      const render = (t: number) => {
        gl.uniform1f(uTime, t * 0.001);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.animationFrameId = requestAnimationFrame(render);
      };
      render(0);
    });
  }

  // --- Photo Upload & Remove ---
  openPhotoOptions(): void {
    this.showPhotoOptionsModal = true;
  }

  closePhotoOptions(): void {
    this.showPhotoOptionsModal = false;
  }

  triggerPhotoPicker(): void {
    this.closePhotoOptions();
    if (this.photoInputRef) {
      this.photoInputRef.nativeElement.click();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const newAvatarUrl = e.target?.result as string;
      if (this.currentUser) {
        this.currentUser.avatar = newAvatarUrl;
        this.authService.updateProfile(newAvatarUrl, this.currentUser.statusText);
      }
      this.showToast('Profile photo updated! 📷');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removePhoto(): void {
    this.closePhotoOptions();
    if (this.currentUser) {
      this.currentUser.avatar = this.defaultAvatar;
      this.authService.updateProfile(this.defaultAvatar, this.currentUser.statusText);
      this.showToast('Profile photo removed');
    }
  }

  // --- Name Editing ---
  startEditingName(): void {
    this.tempName = this.currentUser?.name || '';
    this.isEditingName = true;
  }

  cancelEditingName(): void {
    this.isEditingName = false;
    this.tempName = '';
  }

  saveName(): void {
    if (!this.tempName.trim() || !this.currentUser) return;
    this.currentUser.name = this.tempName.trim();
    this.authService.updateProfile(this.currentUser.avatar, this.currentUser.statusText);
    this.isEditingName = false;
    this.showToast('Name saved successfully! 💖');
  }

  // --- About Editing ---
  startEditingAbout(): void {
    this.tempAbout = this.currentUser?.statusText || 'Hey there! I am using this app.';
    this.isEditingAbout = true;
  }

  cancelEditingAbout(): void {
    this.isEditingAbout = false;
    this.tempAbout = '';
  }

  saveAbout(): void {
    if (!this.tempAbout.trim() || !this.currentUser) return;
    this.currentUser.statusText = this.tempAbout.trim();
    this.authService.updateProfile(this.currentUser.avatar, this.tempAbout.trim());
    this.isEditingAbout = false;
    this.showToast('About updated! ✏️');
  }

  showToast(msg: string): void {
    this.toastMsg = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMsg = '';
    }, 3000);
  }
}

import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  ViewChild,
  NgZone,
  ViewEncapsulation
} from '@angular/core';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      
      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);
  
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

@Component({
  selector: 'app-galaxy',
  templateUrl: './galaxy.component.html',
  styleUrls: ['./galaxy.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GalaxyComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('galaxyContainer', { static: true }) galaxyContainer!: ElementRef<HTMLDivElement>;

  @Input() focal: number[] | [number, number] = [0.5, 0.5];
  @Input() rotation: number[] | [number, number] = [1.0, 0.0];
  @Input() starSpeed: number = 0.5;
  @Input() density: number = 1;
  @Input() hueShift: number = 140;
  @Input() disableAnimation: boolean = false;
  @Input() speed: number = 1.0;
  @Input() mouseInteraction: boolean = true;
  @Input() glowIntensity: number = 0.3;
  @Input() saturation: number = 0.0;
  @Input() mouseRepulsion: boolean = true;
  @Input() repulsionStrength: number = 0.5;
  @Input() twinkleIntensity: number = 0.3;
  @Input() rotationSpeed: number = 0.1;
  @Input() autoCenterRepulsion: number = 0;
  @Input() transparent: boolean = true;

  private renderer?: Renderer;
  private gl?: any;
  private program?: Program;
  private mesh?: Mesh;
  private animateId?: number;
  private initialized = false;

  private targetMousePos = { x: 0.5, y: 0.5 };
  private smoothMousePos = { x: 0.5, y: 0.5 };
  private targetMouseActive = 0.0;
  private smoothMouseActive = 0.0;
  private resizeObserver?: any;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.init();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    // Structural changes that require resetting the WebGL context
    if (changes['transparent']) {
      this.ngZone.runOutsideAngular(() => {
        this.recreate();
      });
      return;
    }

    // Toggle mouse interaction listeners
    if (changes['mouseInteraction']) {
      this.updateListeners();
    }

    // Update individual uniforms dynamically
    if (this.program) {
      if (changes['focal'] && this.focal) {
        this.program.uniforms['uFocal'].value = new Float32Array(this.focal);
      }
      if (changes['rotation'] && this.rotation) {
        this.program.uniforms['uRotation'].value = new Float32Array(this.rotation);
      }
      if (changes['starSpeed']) {
        this.program.uniforms['uStarSpeed'].value = this.starSpeed;
      }
      if (changes['density']) {
        this.program.uniforms['uDensity'].value = this.density;
      }
      if (changes['hueShift']) {
        this.program.uniforms['uHueShift'].value = this.hueShift;
      }
      if (changes['speed']) {
        this.program.uniforms['uSpeed'].value = this.speed;
      }
      if (changes['glowIntensity']) {
        this.program.uniforms['uGlowIntensity'].value = this.glowIntensity;
      }
      if (changes['saturation']) {
        this.program.uniforms['uSaturation'].value = this.saturation;
      }
      if (changes['mouseRepulsion']) {
        this.program.uniforms['uMouseRepulsion'].value = this.mouseRepulsion;
      }
      if (changes['twinkleIntensity']) {
        this.program.uniforms['uTwinkleIntensity'].value = this.twinkleIntensity;
      }
      if (changes['rotationSpeed']) {
        this.program.uniforms['uRotationSpeed'].value = this.rotationSpeed;
      }
      if (changes['repulsionStrength']) {
        this.program.uniforms['uRepulsionStrength'].value = this.repulsionStrength;
      }
      if (changes['autoCenterRepulsion']) {
        this.program.uniforms['uAutoCenterRepulsion'].value = this.autoCenterRepulsion;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private init(): void {
    if (!this.galaxyContainer) return;
    const ctn = this.galaxyContainer.nativeElement;

    this.renderer = new Renderer({
      alpha: this.transparent,
      premultipliedAlpha: false
    });
    this.gl = this.renderer.gl;

    if (this.transparent) {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.clearColor(0, 0, 0, 0);
    } else {
      this.gl.clearColor(0, 0, 0, 1);
    }

    this.onResize();
    window.addEventListener('resize', this.onResize, false);

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(ctn);

    const geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Color(this.gl.canvas.width, this.gl.canvas.height, this.gl.canvas.width / this.gl.canvas.height)
        },
        uFocal: { value: new Float32Array(this.focal) },
        uRotation: { value: new Float32Array(this.rotation) },
        uStarSpeed: { value: this.starSpeed },
        uDensity: { value: this.density },
        uHueShift: { value: this.hueShift },
        uSpeed: { value: this.speed },
        uMouse: {
          value: new Float32Array([this.smoothMousePos.x, this.smoothMousePos.y])
        },
        uGlowIntensity: { value: this.glowIntensity },
        uSaturation: { value: this.saturation },
        uMouseRepulsion: { value: this.mouseRepulsion },
        uTwinkleIntensity: { value: this.twinkleIntensity },
        uRotationSpeed: { value: this.rotationSpeed },
        uRepulsionStrength: { value: this.repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: this.autoCenterRepulsion },
        uTransparent: { value: this.transparent }
      }
    });

    this.mesh = new Mesh(this.gl, { geometry, program: this.program });
    
    ctn.appendChild(this.gl.canvas);

    this.updateListeners();

    this.animateId = requestAnimationFrame(this.update);
    
    this.initialized = true;
  }

  private destroy(): void {
    this.initialized = false;

    if (this.animateId) {
      cancelAnimationFrame(this.animateId);
      this.animateId = undefined;
    }

    window.removeEventListener('resize', this.onResize);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    if (this.galaxyContainer && this.gl && this.gl.canvas) {
      const ctn = this.galaxyContainer.nativeElement;
      if (ctn.contains(this.gl.canvas)) {
        ctn.removeChild(this.gl.canvas);
      }
    }

    if (this.galaxyContainer) {
      const ctn = this.galaxyContainer.nativeElement;
      ctn.removeEventListener('mousemove', this.handleMouseMove);
      ctn.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    if (this.gl) {
      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.gl = undefined;
    }

    this.renderer = undefined;
    this.program = undefined;
    this.mesh = undefined;
  }

  private recreate(): void {
    this.destroy();
    this.init();
  }

  private onResize = () => {
    if (!this.renderer || !this.program || !this.gl || !this.galaxyContainer) return;
    const ctn = this.galaxyContainer.nativeElement;
    const scale = 1;
    this.renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
    this.program.uniforms['uResolution'].value = new Color(
      this.gl.canvas.width,
      this.gl.canvas.height,
      this.gl.canvas.width / this.gl.canvas.height
    );
  };

  private updateListeners(): void {
    if (!this.galaxyContainer) return;
    const ctn = this.galaxyContainer.nativeElement;
    
    ctn.removeEventListener('mousemove', this.handleMouseMove);
    ctn.removeEventListener('mouseleave', this.handleMouseLeave);

    if (this.mouseInteraction) {
      ctn.addEventListener('mousemove', this.handleMouseMove);
      ctn.addEventListener('mouseleave', this.handleMouseLeave);
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.galaxyContainer) return;
    const rect = this.galaxyContainer.nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    this.targetMousePos = { x, y };
    this.targetMouseActive = 1.0;
  };

  private handleMouseLeave = () => {
    this.targetMouseActive = 0.0;
  };

  private update = (t: number) => {
    this.animateId = requestAnimationFrame(this.update);

    if (!this.program || !this.renderer) return;

    if (!this.disableAnimation) {
      this.program.uniforms['uTime'].value = t * 0.001;
      this.program.uniforms['uStarSpeed'].value = (t * 0.001 * this.starSpeed) / 10.0;
    }

    const lerpFactor = 0.05;
    this.smoothMousePos.x += (this.targetMousePos.x - this.smoothMousePos.x) * lerpFactor;
    this.smoothMousePos.y += (this.targetMousePos.y - this.smoothMousePos.y) * lerpFactor;

    this.smoothMouseActive += (this.targetMouseActive - this.smoothMouseActive) * lerpFactor;

    this.program.uniforms['uMouse'].value[0] = this.smoothMousePos.x;
    this.program.uniforms['uMouse'].value[1] = this.smoothMousePos.y;
    this.program.uniforms['uMouseActiveFactor'].value = this.smoothMouseActive;

    this.renderer.render({ scene: this.mesh });
  };
}

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessengerService } from './messenger.service';
import { AuthService } from '../services/auth.service';
import { Contact, Message, SharedMedia, User, CallState, LinkedDevice } from './messenger.model';

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('shaderCanvas', { static: false }) shaderCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('profileFileInput') profileFileInput!: ElementRef<HTMLInputElement>;

  lightboxImageUrl: string | null = null;

  avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
  ];

  currentUser!: User;
  contacts: Contact[] = [];
  selectedContact: Contact | null = null;
  activeMessages: Message[] = [];
  sharedMedia: SharedMedia = { images: [], documents: [], links: [] };
  typingStatus: { contactId: string; name: string } | null = null;

  // View state toggles
  showRightInfo = false;
  showMobileChat = false;
  showNewChatModal = false;

  // Settings & Linked Devices State
  showSettingsModal = false;
  settingsActiveSection: 'linked' | 'scanner' | 'profile' | 'logout' = 'linked';
  linkedDevices: LinkedDevice[] = [];
  showAddDeviceQr = false;
  qrCodeUrl = '';
  scannerSimulating = false;

  // Toast message
  toastMsg = '';
  private toastTimeout: any;

  // New Chat Form
  newContactName = '';
  newContactPhone = '';
  newContactAbout = '';

  // Active Call State Modal
  activeCall: CallState | null = null;
  callTimeFormatted = '00:00';
  private callInterval: any;
  private callRingTimeout: any;

  private subscriptions = new Subscription();
  private animationFrameId?: number;

  constructor(
    private messengerService: MessengerService,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentUser = this.messengerService.getCurrentUser();
    this.contacts = this.messengerService.getContacts();
    this.refreshSettingsData();

    // Subscribe to selected contact
    this.subscriptions.add(
      this.messengerService.getSelectedContact().subscribe(contact => {
        this.selectedContact = contact;
        if (contact) {
          this.activeMessages = this.messengerService.getMessages(contact.id);
          this.sharedMedia = this.messengerService.getSharedMedia(contact.id);
        }
      })
    );

    // Subscribe to typing indicator
    this.subscriptions.add(
      this.messengerService.getTypingStatus().subscribe(status => {
        this.typingStatus = status;
        if (status && this.selectedContact?.id === status.contactId) {
          this.activeMessages = this.messengerService.getMessages(status.contactId);
        }
      })
    );

    // Subscribe to real-time message updates (for dynamic Seen status transitions)
    this.subscriptions.add(
      this.messengerService.getMessagesSubject().subscribe(update => {
        if (update && this.selectedContact?.id === update.contactId) {
          this.activeMessages = update.messages;
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.initWebGLShader();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clearCallTimers();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.showMobileChat = false;
    }
  }

  refreshSettingsData(): void {
    this.linkedDevices = this.authService.getLinkedDevices();
  }

  // --- Settings & Linked Devices ---
  openSettings(section: 'linked' | 'scanner' | 'profile' | 'logout' = 'linked'): void {
    this.settingsActiveSection = section;
    this.showSettingsModal = true;
    this.showAddDeviceQr = false;
    this.refreshSettingsData();
  }

  closeSettings(): void {
    this.showSettingsModal = false;
    this.showAddDeviceQr = false;
  }

  logoutDevice(deviceId: string): void {
    this.authService.logoutDevice(deviceId);
    this.refreshSettingsData();
    this.showToast('Device logged out successfully.');
  }

  generateAddDeviceQr(): void {
    this.showAddDeviceQr = true;
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SanctuaryMessenger_AuthToken_${Date.now()}`;
  }

  simulateQrScan(): void {
    this.scannerSimulating = true;
    setTimeout(() => {
      this.scannerSimulating = false;
      const newDev = this.authService.addLinkedDevice('Scanned Mobile Tablet Session');
      this.refreshSettingsData();
      this.showToast(`✅ QR Scanner: Logged in device "${newDev.name}"!`);
      this.settingsActiveSection = 'linked';
    }, 1500);
  }

  showToast(msg: string): void {
    this.toastMsg = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMsg = '';
    }, 3500);
  }

  // --- Chat Selection ---
  onSelectContact(contact: Contact): void {
    this.messengerService.selectContact(contact);
    this.activeMessages = this.messengerService.getMessages(contact.id);
    this.sharedMedia = this.messengerService.getSharedMedia(contact.id);
    this.showMobileChat = true;
  }

  onSendMessage(event: { text: string; attachment?: any; replyTo?: any }): void {
    if (!this.selectedContact) return;
    this.messengerService.sendMessage(this.selectedContact.id, event.text, event.attachment, event.replyTo);
    this.activeMessages = this.messengerService.getMessages(this.selectedContact.id);
    this.sharedMedia = this.messengerService.getSharedMedia(this.selectedContact.id);
  }

  // Contact Edit & Delete State
  showEditContactModal = false;
  editingContactForm = {
    id: '',
    name: '',
    phone: '',
    avatar: '',
    about: ''
  };
  editFormError = '';
  deletingContact: Contact | null = null;

  openEditContactModal(contact: Contact): void {
    this.editingContactForm = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone || '',
      avatar: contact.avatar,
      about: contact.about || contact.statusText || ''
    };
    this.editFormError = '';
    this.showEditContactModal = true;
  }

  closeEditContactModal(): void {
    this.showEditContactModal = false;
    this.editFormError = '';
  }

  saveEditedContact(): void {
    const res = this.messengerService.updateContact(
      this.editingContactForm.id,
      this.editingContactForm
    );
    if (!res.success) {
      this.editFormError = res.error || 'Failed to update contact.';
      return;
    }

    this.contacts = this.messengerService.getContacts();
    this.showToast('Contact details updated! 💖');
    this.closeEditContactModal();
  }

  openDeleteContactConfirm(contact: Contact): void {
    this.deletingContact = contact;
  }

  closeDeleteContactConfirm(): void {
    this.deletingContact = null;
  }

  confirmDeleteContact(): void {
    if (this.deletingContact) {
      const deletedName = this.deletingContact.name;
      this.messengerService.deleteContact(this.deletingContact.id);
      this.contacts = this.messengerService.getContacts();
      this.showToast(`Deleted contact "${deletedName}"`);
      this.closeDeleteContactConfirm();
    }
  }

  toggleRightInfo(): void {
    this.showRightInfo = !this.showRightInfo;
  }

  onBackToContacts(): void {
    this.showMobileChat = false;
  }

  // --- Profile Picture Management ---
  openLightbox(url?: string): void {
    if (url) {
      this.lightboxImageUrl = url;
    }
  }

  closeLightbox(): void {
    this.lightboxImageUrl = null;
  }

  triggerProfileUpload(): void {
    if (this.profileFileInput) {
      this.profileFileInput.nativeElement.click();
    }
  }

  onProfileFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.authService.updateProfilePicture(dataUrl);
      this.currentUser = { ...this.currentUser, avatar: dataUrl };
      this.messengerService.syncContactAvatars();
      this.showToast('Profile picture updated! 📸');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeProfilePicture(): void {
    this.authService.removeProfilePicture();
    const updatedUser = this.authService.getCurrentUser();
    if (updatedUser) {
      this.currentUser = { ...this.currentUser, avatar: updatedUser.avatar };
    }
    this.messengerService.syncContactAvatars();
    this.showToast('Profile picture removed');
  }

  selectPresetProfilePhoto(url: string): void {
    this.authService.updateProfilePicture(url);
    this.currentUser = { ...this.currentUser, avatar: url };
    this.messengerService.syncContactAvatars();
    this.showToast('Profile picture updated! 📸');
  }

  // --- Simulated Voice & Video Calls ---
  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact) return;
    this.clearCallTimers();

    this.activeCall = {
      type: type,
      status: 'ringing',
      contactName: this.selectedContact.name,
      contactAvatar: this.selectedContact.avatar,
      duration: 0
    };

    this.callRingTimeout = setTimeout(() => {
      if (this.activeCall) {
        this.activeCall.status = 'connected';
        this.startCallTimer();
      }
    }, 2500);
  }

  endCall(): void {
    if (this.activeCall) {
      this.activeCall.status = 'ended';
      setTimeout(() => {
        this.activeCall = null;
        this.clearCallTimers();
      }, 1000);
    }
  }

  private startCallTimer(): void {
    this.callInterval = setInterval(() => {
      if (this.activeCall && this.activeCall.status === 'connected') {
        this.activeCall.duration++;
        const mins = Math.floor(this.activeCall.duration / 60);
        const secs = this.activeCall.duration % 60;
        this.callTimeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private clearCallTimers(): void {
    if (this.callInterval) clearInterval(this.callInterval);
    if (this.callRingTimeout) clearTimeout(this.callRingTimeout);
    this.callTimeFormatted = '00:00';
  }

  // --- Navigation & Logout ---
  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // --- WebGL Shader Animation Background ---
  private initWebGLShader(): void {
    if (!this.shaderCanvasRef) return;
    const canvas = this.shaderCanvasRef.nativeElement;
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const syncSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
            
            // Random floating drift motion
            vec2 p = vec2(hash21(id + offset + 1.0), hash21(id + offset + 2.0)) - 0.5;
            p += 0.08 * vec2(sin(time * 0.5 + n * 6.28), cos(time * 0.4 + n * 6.28));
            
            float d = length(gv - offset - p);
            
            // Star size & twinkle brightness variation
            float starSize = mix(0.015, 0.07, fract(n * 34.5));
            float twinkle = 0.4 + 0.6 * sin(time * (1.5 + n * 3.5) + n * 12.0);
            
            // Smooth glowing star halo
            float star = smoothstep(starSize, 0.0, d) * twinkle;
            
            // Subtle color tint: pure white to soft cyan/purple
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
}

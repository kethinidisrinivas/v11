import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessengerService } from './messenger.service';
import { AuthService, PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../services/auth.service';
import { Contact, Message, SharedMedia, User, CallState, LinkedDevice, CallLog } from './messenger.model';
import { WebRtcService, SignalingMessage } from './services/webrtc.service';

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('shaderCanvas', { static: false }) shaderCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('profileFileInput') profileFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('callLocalVideo') callLocalVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('callRemoteVideo') callRemoteVideoRef?: ElementRef<HTMLVideoElement>;

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

  // Advanced Profile Experience State
  profileSubTab: 'overview' | 'edit' | 'privacy' | 'qr' | 'blocked' = 'overview';
  editProfileForm = {
    name: '',
    username: '',
    about: '',
    avatar: ''
  };
  privacySettings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS;
  isSavingProfile = false;
  profileSaveError = '';
  profileSaveSuccess = '';
  showPreviewAvatarModal = false;
  stagedAvatarUrl = '';

  // Interactive Circular Crop & Adjust Profile Photo State
  showCropModal = false;
  stagedRawImageUrl = '';
  cropScale = 1.0;
  cropPanX = 0;
  cropPanY = 0;
  cropRotation = 0;
  isDraggingCrop = false;
  dragStartX = 0;
  dragStartY = 0;
  croppedPreviewUrl = '';
  private cropLoadedImage: HTMLImageElement | null = null;
  showShareProfileContactModal = false;
  blockedContactsList: Contact[] = [];
  profileQrUrl = '';

  // Toast message
  toastMsg = '';
  private toastTimeout: any;

  // New Chat Form
  newContactName = '';
  newContactPhone = '';
  newContactAbout = '';

  // Active Call State Modal & Real WebRTC Media Streams
  activeCall: CallState | null = null;
  callTimeFormatted = '00:00';
  localCallStream: MediaStream | null = null;
  remoteCallStream: MediaStream | null = null;
  isCallMuted = false;
  isCallCameraOff = false;
  isCallSpeakerOn = true;
  callFacingMode: 'user' | 'environment' = 'user';
  callPermissionError: string | null = null;
  isCallPermissionDenied = false;
  isCallMediaLoading = false;
  pipPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  incomingOfferData: SignalingMessage | null = null;
  showCallControls = true;
  private autoHideControlsTimer: any;
  private callInterval: any;
  private callRingTimeout: any;

  private subscriptions = new Subscription();
  private animationFrameId?: number;

  constructor(
    private messengerService: MessengerService,
    private authService: AuthService,
    private webRtcService: WebRtcService,
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

    // Subscribe to typing indicator with current-user filtering & stale state protection
    this.subscriptions.add(
      this.messengerService.getTypingStatus().subscribe(status => {
        const myId = this.messengerService.getCurrentUser()?.id || 'me';
        if (
          status &&
          this.selectedContact &&
          status.contactId === this.selectedContact.id &&
          status.userId !== 'me' &&
          status.userId !== myId &&
          (Date.now() - (status.updatedAt || 0)) < 3500
        ) {
          this.typingStatus = status;
        } else {
          this.typingStatus = null;
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

    // Initialize WebRTC signaling user identity
    this.webRtcService.setCurrentUser(this.currentUser.id || 'me');

    // Subscribe to WebRTC Incoming Calls
    this.subscriptions.add(
      this.webRtcService.incomingCall$.subscribe(signal => {
        this.handleIncomingCallSignal(signal);
      })
    );

    // Subscribe to WebRTC Remote Stream
    this.subscriptions.add(
      this.webRtcService.remoteStream$.subscribe(stream => {
        this.remoteCallStream = stream;
        this.attachCallStreams();
      })
    );

    // Subscribe to WebRTC Connection State
    this.subscriptions.add(
      this.webRtcService.connectionState$.subscribe(state => {
        this.handleWebRtcConnectionState(state);
      })
    );

    // Subscribe to WebRTC Remote Peer Actions
    this.subscriptions.add(
      this.webRtcService.remoteAction$.subscribe(data => {
        this.handleRemoteCallAction(data.action, data.payload);
      })
    );

    // Subscribe to avatar changes to keep profile photo synced everywhere in real time
    this.subscriptions.add(
      this.authService.avatarChanged$.subscribe(data => {
        if (this.currentUser && (data.userId === this.currentUser.id || data.phone === this.currentUser.phone)) {
          this.currentUser = { ...this.currentUser, avatar: data.avatar };
          this.editProfileForm.avatar = data.avatar;
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
    this.webRtcService.stopRingtone();
    this.webRtcService.closePeerConnection();
    this.stopCallMediaStream();
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

  showProfileModal = false;

  // --- Settings & Linked Devices ---
  openSettings(section: string = 'linked'): void {
    if (section === 'profile') {
      this.openProfileModal();
      return;
    }
    this.settingsActiveSection = (section === 'scanner' ? 'scanner' : 'linked');
    this.showSettingsModal = true;
    this.showAddDeviceQr = false;
    this.refreshSettingsData();
  }

  closeSettings(): void {
    this.showSettingsModal = false;
    this.showAddDeviceQr = false;
  }

  openProfileModal(): void {
    this.showProfileModal = true;
    this.initProfileExperience();
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
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

  getUserHandle(): string {
    if (!this.currentUser) return '@user';
    if (this.currentUser.username) return this.currentUser.username;
    return '@' + (this.currentUser.name || 'user').toLowerCase().split(' ').join('_');
  }

  // --- Advanced Messenger Profile Experience Methods ---
  initProfileExperience(): void {
    if (!this.currentUser) return;
    const sess = this.authService.getCurrentUser();
    const defaultUsername = `@${this.currentUser.name.toLowerCase().replace(/\s+/g, '_')}`;

    this.editProfileForm = {
      name: this.currentUser.name || '',
      username: (sess && sess.username) ? sess.username : defaultUsername,
      about: (sess && sess.statusText) ? sess.statusText : (this.currentUser.status || 'Hey there! Using Messenger'),
      avatar: this.currentUser.avatar || ''
    };

    this.privacySettings = this.authService.getPrivacySettings();
    this.profileQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Messenger_UserProfile_${encodeURIComponent(this.currentUser.phone || this.currentUser.id)}`;
    this.profileSaveError = '';
    this.profileSaveSuccess = '';
    this.profileSubTab = 'overview';
  }

  saveFullProfileForm(): void {
    this.profileSaveError = '';
    this.profileSaveSuccess = '';

    const nameTrim = (this.editProfileForm.name || '').trim();
    if (!nameTrim) {
      this.profileSaveError = 'Display Name cannot be empty.';
      return;
    }

    let userTrim = (this.editProfileForm.username || '').trim();
    if (userTrim && !userTrim.startsWith('@')) {
      userTrim = `@${userTrim}`;
      this.editProfileForm.username = userTrim;
    }

    if (userTrim && !/^@[a-zA-Z0-9_]{3,20}$/.test(userTrim)) {
      this.profileSaveError = 'Username must start with @ and contain 3-20 letters, numbers, or underscores.';
      return;
    }

    this.isSavingProfile = true;

    setTimeout(() => {
      const res = this.authService.updateFullProfile({
        name: nameTrim,
        username: userTrim,
        statusText: this.editProfileForm.about.trim(),
        avatar: this.editProfileForm.avatar
      });

      this.isSavingProfile = false;

      if (!res.success) {
        this.profileSaveError = res.error || 'Failed to save profile. Please check fields and try again.';
        return;
      }

      const updatedSess = this.authService.getCurrentUser();
      if (updatedSess) {
        this.currentUser = {
          ...this.currentUser,
          name: updatedSess.name,
          username: updatedSess.username,
          avatar: updatedSess.avatar,
          status: updatedSess.statusText
        };
      }

      this.messengerService.syncContactAvatars();
      this.profileSaveSuccess = 'Profile changes saved successfully! 💖';
      this.showToast('Profile updated successfully! ✨');
    }, 500);
  }

  retrySaveProfile(): void {
    this.saveFullProfileForm();
  }

  onPhotoSelectedWithPreview(event: Event): void {
    this.onPhotoSelectedForCrop(event);
  }

  onPhotoSelectedForCrop(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WEBP)');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.cropLoadedImage = img;
        this.stagedRawImageUrl = dataUrl;
        this.resetCropAdjustments();
        this.showCropModal = true;
        this.updateCroppedPreview();
      };
      img.onerror = () => {
        this.showToast('Failed to load selected image. Please try another file.');
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
    input.value = '';
  }

  resetCropAdjustments(): void {
    this.cropScale = 1.0;
    this.cropPanX = 0;
    this.cropPanY = 0;
    this.cropRotation = 0;
    this.isDraggingCrop = false;
    this.updateCroppedPreview();
  }

  rotateCropPhoto(): void {
    this.cropRotation = (this.cropRotation + 90) % 360;
    this.updateCroppedPreview();
  }

  onZoomSliderChange(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.cropScale = isNaN(val) ? 1.0 : val;
    this.updateCroppedPreview();
  }

  onCropWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    this.cropScale = Math.min(Math.max(1.0, this.cropScale + delta), 3.0);
    this.updateCroppedPreview();
  }

  onCropMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingCrop = true;
    this.dragStartX = event.clientX - this.cropPanX;
    this.dragStartY = event.clientY - this.cropPanY;
  }

  onCropMouseMove(event: MouseEvent): void {
    if (!this.isDraggingCrop) return;
    event.preventDefault();
    this.cropPanX = event.clientX - this.dragStartX;
    this.cropPanY = event.clientY - this.dragStartY;
    this.updateCroppedPreview();
  }

  onCropMouseUp(): void {
    this.isDraggingCrop = false;
  }

  onCropTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDraggingCrop = true;
      this.dragStartX = event.touches[0].clientX - this.cropPanX;
      this.dragStartY = event.touches[0].clientY - this.cropPanY;
    }
  }

  onCropTouchMove(event: TouchEvent): void {
    if (this.isDraggingCrop && event.touches.length === 1) {
      event.preventDefault();
      this.cropPanX = event.touches[0].clientX - this.dragStartX;
      this.cropPanY = event.touches[0].clientY - this.dragStartY;
      this.updateCroppedPreview();
    }
  }

  onCropTouchEnd(): void {
    this.isDraggingCrop = false;
  }

  private updateCroppedPreview(): void {
    if (!this.cropLoadedImage) return;
    this.croppedPreviewUrl = this.renderCroppedCanvas(150);
  }

  renderCroppedCanvas(outputSize: number = 400): string {
    if (!this.cropLoadedImage) return '';

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const img = this.cropLoadedImage;
    ctx.clearRect(0, 0, outputSize, outputSize);

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((this.cropRotation * Math.PI) / 180);
    ctx.scale(this.cropScale, this.cropScale);

    const imgAspect = img.width / img.height;
    let drawW = outputSize;
    let drawH = outputSize;

    if (imgAspect > 1) {
      drawW = outputSize * imgAspect;
      drawH = outputSize;
    } else {
      drawW = outputSize;
      drawH = outputSize / imgAspect;
    }

    const scaleFactor = outputSize / 240;
    const offsetX = this.cropPanX * scaleFactor;
    const offsetY = this.cropPanY * scaleFactor;

    ctx.drawImage(
      img,
      -drawW / 2 + offsetX,
      -drawH / 2 + offsetY,
      drawW,
      drawH
    );

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  confirmCropAndSavePhoto(): void {
    if (!this.cropLoadedImage) return;

    const finalCroppedUrl = this.renderCroppedCanvas(400);
    if (!finalCroppedUrl) return;

    this.authService.updateProfilePicture(finalCroppedUrl);
    this.currentUser = { ...this.currentUser, avatar: finalCroppedUrl };
    this.editProfileForm.avatar = finalCroppedUrl;
    this.messengerService.syncContactAvatars();

    this.showCropModal = false;
    this.showPreviewAvatarModal = false;
    this.stagedRawImageUrl = '';
    this.cropLoadedImage = null;
    this.showToast('Profile photo updated successfully! 📸');
  }

  cancelCropPhoto(): void {
    this.showCropModal = false;
    this.showPreviewAvatarModal = false;
    this.stagedRawImageUrl = '';
    this.cropLoadedImage = null;
    this.isDraggingCrop = false;
  }

  confirmStagedAvatar(): void {
    this.confirmCropAndSavePhoto();
  }

  cancelStagedAvatar(): void {
    this.cancelCropPhoto();
  }

  updatePrivacyControl(key: keyof PrivacySettings, val: any): void {
    const updated = this.authService.updatePrivacySettings({ [key]: val });
    this.privacySettings = updated;
    this.showToast(`Privacy setting updated! 🔒`);
  }

  copyToClipboard(text?: string, label: string = 'Text'): void {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    this.showToast(`Copied ${label} to clipboard! 📋`);
  }

  openShareProfileModal(): void {
    this.showShareProfileContactModal = true;
  }

  closeShareProfileModal(): void {
    this.showShareProfileContactModal = false;
  }

  shareProfileToContact(targetContact: Contact): void {
    if (!targetContact || !this.currentUser) return;
    const sess = this.authService.getCurrentUser();
    const handle = (sess && sess.username) ? sess.username : `@${this.currentUser.name.toLowerCase().replace(/\s+/g, '_')}`;

    const profileMsgText = `🪪 Messenger Profile Card\n👤 Name: ${this.currentUser.name}\n🏷️ Username: ${handle}\n📱 Phone: ${this.currentUser.phone || 'N/A'}\n💬 Bio: "${this.currentUser.status || 'Hey there! Using Messenger'}"`;

    this.messengerService.sendMessage(targetContact.id, profileMsgText);
    this.closeShareProfileModal();
    this.messengerService.selectContact(targetContact);
    this.showToast(`Shared your profile card with ${targetContact.name}! 🚀`);
  }

  unblockContact(contactId: string): void {
    this.blockedContactsList = this.blockedContactsList.filter(c => c.id !== contactId);
    this.showToast('Contact unblocked');
  }

  // --- Advanced WebRTC Voice & Video Calling System ---
  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact) return;
    this.clearCallTimers();
    this.stopCallMediaStream();
    this.webRtcService.closePeerConnection();

    this.isCallMuted = false;
    this.isCallCameraOff = false;
    this.isCallPermissionDenied = false;
    this.callPermissionError = null;

    this.activeCall = {
      type: type,
      status: 'calling',
      contactId: this.selectedContact.id,
      contactName: this.selectedContact.name,
      contactAvatar: this.selectedContact.avatar,
      duration: 0,
      direction: 'outgoing'
    };

    // Start outgoing ringback sound
    this.webRtcService.startOutgoingRingtone();

    // Request real hardware camera and mic on call start
    this.initCallMediaStream(type === 'video', true).then(() => {
      if (this.localCallStream && this.selectedContact) {
        this.webRtcService.createPeerConnection(this.localCallStream, true, this.selectedContact.id, type);
        if (this.activeCall) {
          this.activeCall.status = 'ringing';
        }

        // Automatic connection for local simulated demo testing
        this.callRingTimeout = setTimeout(() => {
          if (this.activeCall && (this.activeCall.status === 'calling' || this.activeCall.status === 'ringing')) {
            this.activeCall.status = 'connected';
            this.webRtcService.stopRingtone();
            this.startCallTimer();
            this.attachCallStreams();
          }
        }, 3000);
      }
    });
  }

  handleIncomingCallSignal(signal: SignalingMessage): void {
    this.clearCallTimers();
    this.stopCallMediaStream();
    this.incomingOfferData = signal;

    this.activeCall = {
      type: signal.callType || 'video',
      status: 'ringing',
      contactId: signal.senderId,
      contactName: signal.senderName || 'Incoming Contact',
      contactAvatar: signal.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      duration: 0,
      direction: 'incoming'
    };

    // Play incoming musical ringtone
    this.webRtcService.startIncomingRingtone();
  }

  async acceptIncomingCall(): Promise<void> {
    if (!this.activeCall || !this.incomingOfferData) return;
    this.webRtcService.stopRingtone();
    this.activeCall.status = 'connecting';

    await this.initCallMediaStream(this.activeCall.type === 'video', true);

    if (this.localCallStream && this.incomingOfferData) {
      await this.webRtcService.answerCall(this.incomingOfferData, this.localCallStream);
      this.activeCall.status = 'connected';
      this.startCallTimer();
      this.attachCallStreams();
    }
  }

  declineIncomingCall(): void {
    if (!this.activeCall) return;
    this.webRtcService.stopRingtone();

    if (this.incomingOfferData) {
      this.webRtcService.sendCallAction(this.incomingOfferData.senderId, 'decline');
    }

    // Save declined call log
    this.messengerService.addCallLog({
      id: 'call_' + Date.now(),
      contactId: this.activeCall.contactId || 'unknown',
      contactName: this.activeCall.contactName,
      contactAvatar: this.activeCall.contactAvatar,
      type: 'declined',
      mode: this.activeCall.type,
      timestamp: new Date(),
      timeStr: 'Just now',
      duration: 0,
      formattedDuration: '00:00'
    });

    this.activeCall.status = 'declined';
    setTimeout(() => {
      this.activeCall = null;
      this.stopCallMediaStream();
      this.incomingOfferData = null;
    }, 1200);
  }

  handleWebRtcConnectionState(state: string): void {
    if (!this.activeCall) return;
    if (state === 'connected') {
      this.activeCall.status = 'connected';
      this.webRtcService.stopRingtone();
      if (!this.callInterval) {
        this.startCallTimer();
      }
    } else if (state === 'reconnecting') {
      if (this.activeCall.status === 'connected') {
        this.activeCall.status = 'reconnecting';
      }
    } else if (state === 'failed') {
      this.activeCall.status = 'failed';
    }
  }

  handleRemoteCallAction(action: string, payload?: any): void {
    if (!this.activeCall) return;

    if (action === 'decline') {
      this.webRtcService.stopRingtone();
      this.activeCall.status = 'declined';
      this.showToast('Call declined');
      setTimeout(() => {
        this.endCall();
      }, 1500);
    } else if (action === 'end') {
      this.activeCall.status = 'ended';
      this.showToast('Call ended by ' + this.activeCall.contactName);
      setTimeout(() => {
        this.endCall();
      }, 1200);
    } else if (action === 'camera_toggle') {
      this.activeCall.isRemoteCameraOff = !!payload?.off;
    } else if (action === 'mic_toggle') {
      this.activeCall.isRemoteMuted = !!payload?.muted;
    }
  }

  async initCallMediaStream(video: boolean, audio: boolean): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.callPermissionError = 'Camera/Microphone access is not supported on this browser or environment.';
      this.isCallPermissionDenied = true;
      return;
    }

    this.isCallMediaLoading = true;
    this.callPermissionError = null;
    this.isCallPermissionDenied = false;

    try {
      const constraints: MediaStreamConstraints = {
        video: video ? {
          facingMode: this.callFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: audio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localCallStream = stream;
      this.isCallMediaLoading = false;
      this.attachCallStreams();
    } catch (err: any) {
      this.isCallMediaLoading = false;
      console.error('Call media access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.isCallPermissionDenied = true;
        this.callPermissionError = 'Camera and microphone permissions were denied. Please allow access in your browser settings to continue the video call.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.callPermissionError = 'No camera or microphone device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.callPermissionError = 'Camera or microphone is in use by another app. Please close other applications and retry.';
      } else {
        this.callPermissionError = `Unable to access media: ${err.message || 'Unknown error'}.`;
      }
    }
  }

  attachCallStreams(): void {
    setTimeout(() => {
      if (this.callLocalVideoRef && this.callLocalVideoRef.nativeElement && this.localCallStream) {
        this.callLocalVideoRef.nativeElement.srcObject = this.localCallStream;
        this.callLocalVideoRef.nativeElement.play().catch(() => {});
      }
      if (this.callRemoteVideoRef && this.callRemoteVideoRef.nativeElement) {
        const streamToUse = this.remoteCallStream || this.localCallStream;
        if (streamToUse) {
          this.callRemoteVideoRef.nativeElement.srcObject = streamToUse;
          this.callRemoteVideoRef.nativeElement.play().catch(() => {});
        }
      }
    }, 100);
  }

  toggleCallMute(): void {
    this.isCallMuted = !this.isCallMuted;
    if (this.localCallStream) {
      this.localCallStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !this.isCallMuted;
      });
    }
    if (this.activeCall && this.activeCall.contactId) {
      this.webRtcService.sendCallAction(this.activeCall.contactId, 'mic_toggle', { muted: this.isCallMuted });
    }
  }

  toggleCallCamera(): void {
    this.isCallCameraOff = !this.isCallCameraOff;
    if (this.localCallStream) {
      this.localCallStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !this.isCallCameraOff;
      });
    }
    if (this.activeCall && this.activeCall.contactId) {
      this.webRtcService.sendCallAction(this.activeCall.contactId, 'camera_toggle', { off: this.isCallCameraOff });
    }
  }

  async flipCallCamera(): Promise<void> {
    this.callFacingMode = this.callFacingMode === 'user' ? 'environment' : 'user';
    if (this.localCallStream) {
      const oldVideoTrack = this.localCallStream.getVideoTracks()[0];
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: this.callFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack) {
          if (oldVideoTrack) {
            this.localCallStream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          this.localCallStream.addTrack(newVideoTrack);
          newVideoTrack.enabled = !this.isCallCameraOff;
          await this.webRtcService.replaceVideoTrack(newVideoTrack);
          this.attachCallStreams();
        }
      } catch (err) {
        console.error('Failed to switch camera during call:', err);
      }
    }
  }

  toggleCallSpeaker(): void {
    this.isCallSpeakerOn = !this.isCallSpeakerOn;
  }

  cyclePipPosition(): void {
    const positions: Array<'top-right' | 'top-left' | 'bottom-left' | 'bottom-right'> = [
      'top-right', 'top-left', 'bottom-left', 'bottom-right'
    ];
    const currentIndex = positions.indexOf(this.pipPosition);
    this.pipPosition = positions[(currentIndex + 1) % positions.length];
  }

  setPipPosition(pos: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): void {
    this.pipPosition = pos;
  }

  simulateIncomingCall(type: 'audio' | 'video' = 'video'): void {
    const contact = this.selectedContact || this.contacts[0];
    this.handleIncomingCallSignal({
      type: 'offer',
      callId: 'sim_call_' + Date.now(),
      senderId: contact.id,
      senderName: contact.name,
      senderAvatar: contact.avatar,
      receiverId: this.currentUser.id || 'me',
      callType: type
    });
  }

  retryCallMedia(): void {
    if (this.activeCall) {
      this.initCallMediaStream(this.activeCall.type === 'video', true);
    }
  }

  endCall(): void {
    if (this.activeCall) {
      const durationSecs = this.activeCall.duration || 0;
      const mins = Math.floor(durationSecs / 60);
      const secs = durationSecs % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      // Save to Call History
      const logType = this.activeCall.status === 'declined'
        ? 'declined'
        : (this.activeCall.status === 'calling' || durationSecs === 0)
        ? (this.activeCall.direction === 'incoming' ? 'missed' : 'outgoing')
        : (this.activeCall.direction === 'incoming' ? 'incoming' : 'outgoing');

      this.messengerService.addCallLog({
        id: 'call_' + Date.now(),
        contactId: this.activeCall.contactId || this.selectedContact?.id || 'unknown',
        contactName: this.activeCall.contactName,
        contactAvatar: this.activeCall.contactAvatar,
        type: logType,
        mode: this.activeCall.type,
        timestamp: new Date(),
        timeStr: 'Just now',
        duration: durationSecs,
        formattedDuration: formatted
      });

      if (this.activeCall.contactId) {
        this.webRtcService.sendCallAction(this.activeCall.contactId, 'end');
      }

      this.activeCall.status = 'ended';
      this.webRtcService.stopRingtone();
      this.webRtcService.closePeerConnection();
      this.stopCallMediaStream();

      setTimeout(() => {
        this.activeCall = null;
        this.clearCallTimers();
        this.incomingOfferData = null;
      }, 1000);
    }
  }

  stopCallMediaStream(): void {
    if (this.localCallStream) {
      this.localCallStream.getTracks().forEach((track: MediaStreamTrack) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localCallStream = null;
    }
    this.remoteCallStream = null;
    if (this.callLocalVideoRef && this.callLocalVideoRef.nativeElement) {
      this.callLocalVideoRef.nativeElement.srcObject = null;
    }
    if (this.callRemoteVideoRef && this.callRemoteVideoRef.nativeElement) {
      this.callRemoteVideoRef.nativeElement.srcObject = null;
    }
  }

  resetAutoHideControlsTimer(): void {
    this.showCallControls = true;
    if (this.autoHideControlsTimer) {
      clearTimeout(this.autoHideControlsTimer);
    }
    if (this.activeCall && this.activeCall.status === 'connected') {
      this.autoHideControlsTimer = setTimeout(() => {
        if (this.activeCall && this.activeCall.status === 'connected') {
          this.showCallControls = false;
        }
      }, 4500);
    }
  }

  toggleCallControlsVisibility(): void {
    this.showCallControls = !this.showCallControls;
    if (this.showCallControls) {
      this.resetAutoHideControlsTimer();
    }
  }

  private startCallTimer(): void {
    this.clearCallTimers();
    this.resetAutoHideControlsTimer();
    this.callInterval = setInterval(() => {
      if (this.activeCall) {
        this.activeCall.duration = (this.activeCall.duration || 0) + 1;
        const mins = Math.floor(this.activeCall.duration / 60);
        const secs = this.activeCall.duration % 60;
        this.callTimeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private clearCallTimers(): void {
    if (this.callInterval) clearInterval(this.callInterval);
    if (this.callRingTimeout) clearTimeout(this.callRingTimeout);
    if (this.autoHideControlsTimer) clearTimeout(this.autoHideControlsTimer);
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

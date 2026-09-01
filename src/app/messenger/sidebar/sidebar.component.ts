import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Contact, User, StatusItem, UserStatusGroup, CallLog, UserSong } from '../messenger.model';
import { AuthService, UserRecord } from '../../services/auth.service';
import { MessengerService } from '../messenger.service';
import { COUNTRY_CODES, findCountryByPhone, CountryCode } from '../../services/country-codes';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() contacts: Contact[] = [];
  @Input() selectedContact: Contact | null = null;
  @Input() currentUser!: User;

  @Output() selectContact = new EventEmitter<Contact>();
  @Output() openNewChat = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<string>();
  @Output() openProfileModal = new EventEmitter<void>();

  @ViewChild('galleryInput') galleryInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('doodleCanvas') doodleCanvasRef!: ElementRef<HTMLCanvasElement>;

  // Primary Navigation View Mode
  activeNavTab: 'chats' | 'status' | 'phone' | 'profile' = 'chats';

  // Search & Registered User Invite State
  searchQuery = '';
  foundRegisteredUser: UserRecord | null = null;
  showInviteOption = false;

  // WhatsApp-Style Status State
  myStatusGroup: UserStatusGroup | null = null;
  recentStatusGroups: UserStatusGroup[] = [];
  viewedStatusGroups: UserStatusGroup[] = [];

  // Story Viewer Overlay State
  activeGroup: UserStatusGroup | null = null;
  activeItemIndex = 0;
  activeStatusItem: StatusItem | null = null;
  storyProgress = 0;
  statusReplyText = '';
  private storyTimer: any;

  // WhatsApp Status Creation & Media Editor State
  showStatusSourcePicker = false;
  showTextStatusModal = false;
  showMediaEditorModal = false;

  // Media Editor Tools State
  pickedMediaUrl = '';
  pickedMediaType: 'image' | 'video' = 'image';
  rotationAngle = 0;
  textOverlayText = '';
  showTextOverlayInput = false;
  mediaCaption = '';

  // Doodle Pencil Tool State
  isDoodlingMode = false;
  doodleColor = '#25D366';
  doodleColors = ['#25D366', '#facc15', '#ec4899', '#38bdf8', '#ffffff'];
  private isDrawing = false;
  private canvasCtx: CanvasRenderingContext2D | null = null;

  // Text Status Editor State
  textStatusInput = '';
  selectedBgColor = 'linear-gradient(135deg, #10b981, #059669)';
  selectedFont = 'Manrope';

  colorOptions = [
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #0284c7, #2563eb)',
    'linear-gradient(135deg, #e11d48, #f43f5e)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #7c3aed, #4c1d95)'
  ];

  fontOptions = ['Manrope', 'Playfair Display', 'Courier New', 'Caveat'];

  // Call History State
  callLogs: CallLog[] = [];

  // Profile Customization State
  profileAvatarUrl = '';
  profileStatusText = '';
  newSongTitle = '';
  newSongArtist = '';
  playingSongId: string | null = null;

  // Toast Notification
  toastMessage = '';
  private toastTimeout: any;

  private callLogsSub: any;

  constructor(
    private authService: AuthService,
    private messengerService: MessengerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshData();
    this.callLogsSub = this.messengerService.callLogs$.subscribe(logs => {
      this.callLogs = logs;
    });
  }

  ngOnDestroy(): void {
    if (this.storyTimer) clearInterval(this.storyTimer);
    if (this.callLogsSub) this.callLogsSub.unsubscribe();
  }

  refreshData(): void {
    this.myStatusGroup = this.messengerService.getMyStatusGroup();
    const groups = this.messengerService.getContactsStatusGroups();
    this.recentStatusGroups = groups.recent;
    this.viewedStatusGroups = groups.viewed;
    this.callLogs = this.messengerService.getCallLogs();

    if (this.currentUser) {
      this.profileAvatarUrl = this.currentUser.avatar;
      this.profileStatusText = this.currentUser.status;
    }
  }

  setNavTab(tab: 'chats' | 'status' | 'phone' | 'profile'): void {
    this.activeNavTab = tab;
    if (tab === 'profile') {
      this.openProfileModal.emit();
    }
    this.refreshData();
  }

  onCallLogClick(call: CallLog): void {
    if (!call) return;
    const targetContact = this.contacts.find(c => c.id === call.contactId || c.name.toLowerCase() === call.contactName.toLowerCase());
    if (targetContact) {
      this.selectContact.emit(targetContact);
      this.setNavTab('chats');
    }
  }

  getTotalUnreadCount(): number {
    return this.messengerService.getTotalUnreadCount();
  }

  // --- Contacts Search & Invite ---
  onSearchChange(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.foundRegisteredUser = null;
    this.showInviteOption = false;

    if (!q) return;

    const existing = this.contacts.filter(
      c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q))
    );

    if (existing.length === 0) {
      const isPhoneLike = /^[+0-9\s-]{4,}$/.test(q);
      if (isPhoneLike) {
        const found = this.authService.findUserByPhone(q);
        if (found && found.id !== this.currentUser?.id) {
          this.foundRegisteredUser = found;
        } else {
          this.showInviteOption = true;
        }
      } else {
        const allUsers = this.authService.getAllRegisteredUsers();
        const foundUser = allUsers.find(
          u => u.name.toLowerCase().includes(q) && u.id !== this.currentUser?.id
        );
        if (foundUser) {
          this.foundRegisteredUser = foundUser;
        }
      }
    }
  }

  addRegisteredUser(user: UserRecord): void {
    const newContact = this.messengerService.addContactFromRegisteredUser(user);
    this.searchQuery = '';
    this.onSearchChange();
    this.selectContact.emit(newContact);
    this.showToast(`Added ${user.name} to Contacts! 💖`);
  }

  sendSmsInvite(): void {
    this.showToast(`📩 Invitation SMS sent to ${this.searchQuery.trim()}!`);
    this.searchQuery = '';
    this.onSearchChange();
  }

  // --- WhatsApp Status Source Picker & Gallery Trigger ---
  openStatusSourcePicker(): void {
    this.showStatusSourcePicker = true;
  }

  closeStatusSourcePicker(): void {
    this.showStatusSourcePicker = false;
  }

  triggerGalleryPicker(): void {
    this.closeStatusSourcePicker();
    if (this.galleryInputRef) {
      this.galleryInputRef.nativeElement.click();
    }
  }

  onGalleryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.pickedMediaType = file.type.startsWith('video') ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = (e) => {
      this.pickedMediaUrl = e.target?.result as string;
      this.openMediaEditor();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  // --- WhatsApp Full-Screen Media Editor ---
  openMediaEditor(): void {
    this.showMediaEditorModal = true;
    this.rotationAngle = 0;
    this.textOverlayText = '';
    this.showTextOverlayInput = false;
    this.isDoodlingMode = false;
    this.mediaCaption = '';
    setTimeout(() => this.initCanvas(), 100);
  }

  closeMediaEditor(): void {
    this.showMediaEditorModal = false;
    this.pickedMediaUrl = '';
    this.rotationAngle = 0;
    this.isDoodlingMode = false;
  }

  rotateMedia(): void {
    this.rotationAngle = (this.rotationAngle + 90) % 360;
  }

  toggleDoodleMode(): void {
    this.isDoodlingMode = !this.isDoodlingMode;
    if (this.isDoodlingMode) {
      setTimeout(() => this.initCanvas(), 50);
    }
  }

  toggleTextOverlayInput(): void {
    this.showTextOverlayInput = !this.showTextOverlayInput;
  }

  private initCanvas(): void {
    if (!this.doodleCanvasRef) return;
    const canvas = this.doodleCanvasRef.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || 360;
    canvas.height = canvas.parentElement?.clientHeight || 480;
    this.canvasCtx = canvas.getContext('2d');
  }

  startDrawing(event: MouseEvent | TouchEvent): void {
    if (!this.isDoodlingMode || !this.canvasCtx) return;
    this.isDrawing = true;
    const { x, y } = this.getEventPos(event);
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(x, y);
    this.canvasCtx.strokeStyle = this.doodleColor;
    this.canvasCtx.lineWidth = 4;
    this.canvasCtx.lineCap = 'round';
  }

  draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing || !this.canvasCtx) return;
    const { x, y } = this.getEventPos(event);
    this.canvasCtx.lineTo(x, y);
    this.canvasCtx.stroke();
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clearDoodle(): void {
    if (!this.doodleCanvasRef || !this.canvasCtx) return;
    const canvas = this.doodleCanvasRef.nativeElement;
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private getEventPos(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (!this.doodleCanvasRef) return { x: 0, y: 0 };
    const rect = this.doodleCanvasRef.nativeElement.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (window.TouchEvent && event instanceof TouchEvent && event.touches[0]) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  publishMediaEditorStatus(): void {
    if (!this.pickedMediaUrl) return;

    let doodleDataUrl: string | undefined = undefined;
    if (this.doodleCanvasRef) {
      doodleDataUrl = this.doodleCanvasRef.nativeElement.toDataURL();
    }

    this.messengerService.addMediaStatus(
      this.pickedMediaUrl,
      this.mediaCaption.trim(),
      this.pickedMediaType,
      this.rotationAngle,
      this.textOverlayText.trim(),
      doodleDataUrl
    );

    this.closeMediaEditor();
    this.refreshData();
    this.showToast('Status published! 🟢✨');

    // Auto open My Status
    if (this.myStatusGroup) {
      this.openStatusGroup(this.myStatusGroup);
    }
  }

  // --- WhatsApp Text Status Editor ---
  openTextModal(): void {
    this.closeStatusSourcePicker();
    this.showTextStatusModal = true;
    this.textStatusInput = '';
    this.selectedBgColor = this.colorOptions[0];
  }

  closeTextModal(): void {
    this.showTextStatusModal = false;
    this.textStatusInput = '';
  }

  submitTextStatus(): void {
    if (!this.textStatusInput.trim()) return;
    this.messengerService.addTextStatus(this.textStatusInput.trim(), this.selectedBgColor);
    this.closeTextModal();
    this.refreshData();
    this.showToast('Text status published! 🟢✨');

    if (this.myStatusGroup) {
      this.openStatusGroup(this.myStatusGroup);
    }
  }

  // --- WhatsApp Story Viewer Overlay ---
  openStatusGroup(group: UserStatusGroup): void {
    if (!group || group.items.length === 0) return;
    this.activeGroup = group;
    this.activeItemIndex = 0;
    this.loadCurrentStatusItem();
  }

  private loadCurrentStatusItem(): void {
    if (this.storyTimer) clearInterval(this.storyTimer);
    if (!this.activeGroup || !this.activeGroup.items[this.activeItemIndex]) {
      this.closeStatusViewer();
      return;
    }

    this.activeStatusItem = this.activeGroup.items[this.activeItemIndex];
    this.storyProgress = 0;
    this.statusReplyText = '';

    if (!this.activeGroup.isMine && this.activeStatusItem) {
      this.messengerService.markStatusItemSeen(this.activeGroup.contactId, this.activeStatusItem.id);
    }

    this.storyTimer = setInterval(() => {
      this.storyProgress += 2;
      if (this.storyProgress >= 100) {
        this.nextStatusItem();
      }
    }, 100);
  }

  nextStatusItem(): void {
    if (!this.activeGroup) return;
    if (this.activeItemIndex < this.activeGroup.items.length - 1) {
      this.activeItemIndex++;
      this.loadCurrentStatusItem();
    } else {
      this.closeStatusViewer();
    }
  }

  prevStatusItem(): void {
    if (!this.activeGroup) return;
    if (this.activeItemIndex > 0) {
      this.activeItemIndex--;
      this.loadCurrentStatusItem();
    } else {
      this.storyProgress = 0;
    }
  }

  closeStatusViewer(): void {
    if (this.storyTimer) clearInterval(this.storyTimer);
    this.activeGroup = null;
    this.activeStatusItem = null;
    this.storyProgress = 0;
    this.statusReplyText = '';
    this.refreshData();
  }

  deleteCurrentStatusItem(): void {
    if (this.activeGroup?.isMine && this.activeStatusItem) {
      this.messengerService.deleteStatusItem(this.activeStatusItem.id);
      this.showToast('Status item deleted 🗑️');
      this.refreshData();
      this.nextStatusItem();
    }
  }

  sendStatusReply(): void {
    if (!this.activeGroup || !this.activeStatusItem || !this.statusReplyText.trim()) return;

    this.messengerService.replyToStatus(
      this.activeGroup.contactId,
      this.statusReplyText.trim(),
      this.activeStatusItem
    );

    this.showToast(`Reply sent to ${this.activeGroup.contactName}! 💬`);
    this.closeStatusViewer();
  }

  // --- Profile Customization & Songs ---
  saveProfileChanges(): void {
    this.authService.updateProfile(this.profileAvatarUrl, this.profileStatusText);
    this.currentUser.avatar = this.profileAvatarUrl;
    this.currentUser.status = this.profileStatusText;
    this.showToast('Profile updated successfully! 💖');
  }

  addFavoriteSong(): void {
    if (!this.newSongTitle.trim() || !this.newSongArtist.trim()) return;
    this.authService.addSongToProfile(this.newSongTitle.trim(), this.newSongArtist.trim());
    this.currentUser.songs = [...(this.currentUser.songs || []), {
      id: 'song_' + Date.now(),
      title: this.newSongTitle.trim(),
      artist: this.newSongArtist.trim(),
      duration: '03:30'
    }];
    this.newSongTitle = '';
    this.newSongArtist = '';
    this.showToast('Added song to your Profile! 🎵');
  }

  togglePlaySong(songId: string): void {
    if (this.playingSongId === songId) {
      this.playingSongId = null;
    } else {
      this.playingSongId = songId;
      this.showToast('Playing preview audio snippet 🎶');
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  // Add Contact Modal State
  showAddContactModal = false;
  countryCodes: CountryCode[] = COUNTRY_CODES;
  contactForm = {
    name: '',
    phone: '',
    selectedCountryCode: '+91',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    about: ''
  };
  formError = '';
  formSuccess = '';
  isImportingContacts = false;

  avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
  ];

  openAddContactModal(): void {
    this.showAddContactModal = true;
    this.formError = '';
    this.formSuccess = '';
    this.contactForm = {
      name: '',
      phone: '',
      selectedCountryCode: '+91',
      avatar: this.avatarPresets[0],
      about: ''
    };
  }

  closeAddContactModal(): void {
    this.showAddContactModal = false;
    this.formError = '';
    this.formSuccess = '';
  }

  selectAvatarPreset(url: string): void {
    this.contactForm.avatar = url;
  }

  async importNativePhoneContact(): Promise<void> {
    this.formError = '';
    this.formSuccess = '';
    this.isImportingContacts = true;

    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);

        if (contacts && contacts.length > 0) {
          const c = contacts[0];
          const rawName = (c.name && c.name.length > 0) ? c.name[0] : '';
          const rawTel = (c.tel && c.tel.length > 0) ? c.tel[0] : '';

          if (!rawTel) {
            this.formError = 'Selected phone contact does not contain a phone number.';
            this.isImportingContacts = false;
            return;
          }

          this.contactForm.name = rawName || 'Device Contact';

          const cleanTel = rawTel.trim();
          if (cleanTel.startsWith('+')) {
            const matched = findCountryByPhone(cleanTel);
            if (matched) {
              this.contactForm.selectedCountryCode = matched.dialCode;
              this.contactForm.phone = cleanTel.substring(matched.dialCode.length).trim();
            } else {
              this.contactForm.phone = cleanTel;
            }
          } else {
            this.contactForm.phone = cleanTel.replace(/[^0-9]/g, '');
          }

          this.formSuccess = `Imported "${this.contactForm.name}" from your Phone Contacts! Click Save Contact below.`;
          this.showToast(`Imported ${this.contactForm.name} from Phone Contacts! 📱`);
        }
      } catch (err: any) {
        if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
          this.formError = 'Permission to access phone contacts was denied.';
        } else {
          this.formError = 'Cancelled or unsupported phone contacts selection.';
        }
      } finally {
        this.isImportingContacts = false;
      }
    } else {
      this.isImportingContacts = false;
      this.formError = 'Device Contacts Picker API is not supported on this browser. Please enter contact details manually below.';
    }
  }

  saveNewContact(): void {
    this.formError = '';
    this.formSuccess = '';

    const rawPhoneDigits = (this.contactForm.phone || '').trim();
    if (!this.contactForm.name.trim()) {
      this.formError = 'Contact name is required.';
      return;
    }
    if (!rawPhoneDigits) {
      this.formError = 'Phone number is required.';
      return;
    }

    let fullPhone = rawPhoneDigits;
    if (!fullPhone.startsWith('+')) {
      fullPhone = `${this.contactForm.selectedCountryCode} ${rawPhoneDigits}`;
    }

    const res = this.messengerService.saveContact({
      name: this.contactForm.name.trim(),
      phone: fullPhone,
      avatar: this.contactForm.avatar,
      about: this.contactForm.about.trim()
    });

    if (!res.success) {
      this.formError = res.error || 'Failed to save contact.';
      return;
    }

    if (res.contact) {
      this.contacts = this.messengerService.getContacts();
      this.selectContact.emit(res.contact);
      this.showToast(`Contact "${res.contact.name}" saved! 💖`);
      this.closeAddContactModal();
    }
  }

  filteredContactsList(): Contact[] {
    if (!this.searchQuery.trim()) return this.contacts;
    const q = this.searchQuery.toLowerCase().trim();
    return this.contacts.filter(
      c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q))
    );
  }
}

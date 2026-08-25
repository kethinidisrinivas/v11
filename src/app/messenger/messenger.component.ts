import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener } from '@angular/core';
import { AuthService, UserSession, LinkedDevice, UserSong, UserRecord } from '../services/auth.service';
import { ChatService, Contact, Message, StatusStory, CallLog, SharedMedia } from '../services/chat.service';
import { COUNTRY_CODES, CountryCode, findCountryByPhone } from '../services/country-codes';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit, OnDestroy {
  @Output() onLogout = new EventEmitter<void>();

  currentUser: UserSession | null = null;
  contacts: Contact[] = [];
  filteredContacts: Contact[] = [];
  selectedContact: Contact | null = null;
  messages: Message[] = [];
  statusStories: StatusStory[] = [];
  callLogs: CallLog[] = [];
  activeTyping: string | null = null;

  // Primary Navigation State
  activeNavTab: 'chats' | 'status' | 'phone' | 'profile' = 'chats';

  // Search & Invite State
  searchQuery = '';
  foundRegisteredUser: UserRecord | null = null;
  showInviteOption = false;
  unregisteredPhone = '';

  // View & Modal Overlay States
  activeStory: StatusStory | null = null;
  storyProgress = 0;
  private storyTimeout: any;
  private storyInterval: any;

  showAddContactModal = false;
  newContactName = '';
  newContactStatus = '';
  newContactAvatar = '';
  newContactPhone = '';

  // Country Flags & Dial Codes State
  countryCodes = COUNTRY_CODES;
  selectedNewContactCountry: CountryCode = COUNTRY_CODES[0]; // default US
  showNewContactCountryDropdown = false;
  newContactCountrySearch = '';

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNewContactCountryDropdown = false;
  }

  get filteredNewContactCountries(): CountryCode[] {
    if (!this.newContactCountrySearch.trim()) return this.countryCodes;
    const q = this.newContactCountrySearch.toLowerCase().trim();
    return this.countryCodes.filter(
      c => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    );
  }

  toggleNewContactCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.showNewContactCountryDropdown = !this.showNewContactCountryDropdown;
    this.newContactCountrySearch = '';
  }

  selectNewContactCountry(country: CountryCode): void {
    this.selectedNewContactCountry = country;
    this.showNewContactCountryDropdown = false;
    if (!this.newContactPhone.startsWith(country.dialCode)) {
      const cleanNumber = this.newContactPhone.replace(/^\+\d+\s*/, '');
      this.newContactPhone = cleanNumber ? `${country.dialCode} ${cleanNumber}` : `${country.dialCode} `;
    }
  }

  onNewContactPhoneChange(): void {
    const match = findCountryByPhone(this.newContactPhone);
    if (match) {
      this.selectedNewContactCountry = match;
    }
  }

  // Shared Media Drawer State
  showSharedMediaDrawer = false;
  sharedMediaTab: 'links' | 'documents' | 'images' = 'images';
  activeSharedMedia: SharedMedia = { links: [], documents: [], images: [] };

  // Profile Image Full Lightbox Viewer State
  lightboxImageUrl: string | null = null;

  // Settings & Linked Devices State
  showSettingsModal = false;
  settingsActiveSection: 'linked' | 'scanner' | 'profile' | 'logout' = 'linked';
  linkedDevices: LinkedDevice[] = [];
  showAddDeviceQr = false;
  qrCodeUrl = '';
  scannerSimulating = false;

  // Profile Editing & Songs State
  profileAvatarUrl = '';
  profileStatusText = '';
  newSongTitle = '';
  newSongArtist = '';
  playingSongId: string | null = null;

  // Toast Notification
  toastMessage = '';
  private toastTimeout: any;

  // Chat Input
  newMessageText = '';
  showAttachMenu = false;
  sharedFiles: { name: string; type: string; url: string; size: string }[] = [];

  // Simulated Calls State
  activeCall: {
    type: 'audio' | 'video';
    status: 'ringing' | 'connected' | 'ended';
    contactName: string;
    contactAvatar: string;
    duration: number;
  } | null = null;

  callDurationFormatted = '00:00';
  private callInterval: any;
  private callRingTimeout: any;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.refreshData();

    // Select first contact by default on desktop view
    if (typeof window !== 'undefined' && window.innerWidth > 768 && this.contacts.length > 0) {
      this.selectContact(this.contacts[0]);
    }

    // Subscribe to typing indicator
    this.subscriptions.add(
      this.chatService.getActiveTyping().subscribe(name => {
        this.activeTyping = name;
        this.scrollToBottom();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearCallIntervals();
    this.clearStoryIntervals();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  refreshData(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileAvatarUrl = this.currentUser.avatar;
      this.profileStatusText = this.currentUser.statusText;
    }
    this.contacts = this.chatService.getContacts();
    this.filteredContacts = [...this.contacts];
    this.statusStories = this.chatService.getStatusStories();
    this.callLogs = this.chatService.getCallLogs();
    this.linkedDevices = this.authService.getLinkedDevices();
  }

  setNavTab(tab: 'chats' | 'status' | 'phone' | 'profile'): void {
    this.activeNavTab = tab;
    this.showSettingsModal = false;
    this.refreshData();
  }

  // --- Contacts Search & Invite ---
  onSearchChange(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.foundRegisteredUser = null;
    this.showInviteOption = false;
    this.unregisteredPhone = '';

    if (!q) {
      this.filteredContacts = [...this.contacts];
      return;
    }

    // Filter existing contacts list
    this.filteredContacts = this.contacts.filter(
      c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q))
    );

    // If no existing contact matches and input resembles a phone number or name:
    if (this.filteredContacts.length === 0) {
      const isPhoneLike = /^[+0-9\s-]{4,}$/.test(q);
      if (isPhoneLike) {
        const found = this.authService.findUserByPhone(q);
        if (found && found.id !== this.currentUser?.id) {
          this.foundRegisteredUser = found;
        } else {
          this.showInviteOption = true;
          this.unregisteredPhone = this.searchQuery.trim();
        }
      } else {
        // Search all registered users by name
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
    const newContact = this.chatService.addContactFromRegisteredUser(user);
    this.refreshData();
    this.searchQuery = '';
    this.onSearchChange();
    this.selectContact(newContact);
    this.showToast(`Added ${user.name} to your contacts! 💖`);
  }

  inviteContact(phone: string): void {
    this.showToast(`📩 Invitation SMS sent to ${phone}! They will appear in Contacts once registered.`);
    this.searchQuery = '';
    this.onSearchChange();
  }

  getTotalUnreadCount(): number {
    return this.chatService.getTotalUnreadCount();
  }

  // --- Profile Image Lightbox ---
  openProfileImage(url?: string): void {
    if (url) {
      this.lightboxImageUrl = url;
    }
  }

  closeProfileImage(): void {
    this.lightboxImageUrl = null;
  }

  // --- Shared Media Drawer ---
  openSharedMediaDrawer(): void {
    if (!this.selectedContact) return;
    this.activeSharedMedia = this.chatService.getSharedMedia(this.selectedContact.id);
    this.showSharedMediaDrawer = true;
  }

  closeSharedMediaDrawer(): void {
    this.showSharedMediaDrawer = false;
  }

  // --- Contacts Management ---
  selectContact(contact: Contact): void {
    this.selectedContact = contact;
    this.chatService.clearUnread(contact.id);
    this.loadMessages();
    this.scrollToBottom();
  }

  deselectContact(): void {
    this.selectedContact = null;
  }

  addNewContact(): void {
    if (!this.newContactName.trim()) return;

    const contact = this.chatService.addContact(
      this.newContactName,
      this.newContactStatus,
      this.newContactAvatar,
      this.newContactPhone
    );

    this.refreshData();
    this.selectContact(contact);

    this.newContactName = '';
    this.newContactStatus = '';
    this.newContactAvatar = '';
    this.newContactPhone = '';
    this.showAddContactModal = false;
    this.showToast('New partner added to Contacts! 🌹');
  }

  loadMessages(): void {
    if (this.selectedContact) {
      this.messages = this.chatService.getMessages(this.selectedContact.id);
      
      this.sharedFiles = this.messages
        .filter(m => m.file)
        .map(m => ({
          name: m.file!.name,
          type: m.file!.type,
          url: m.file!.url,
          size: m.file!.size || '1.2 MB'
        }));
    }
  }

  sendMessage(): void {
    if (!this.newMessageText.trim() || !this.selectedContact) return;
    
    this.chatService.sendMessage(this.selectedContact.id, this.newMessageText);
    this.newMessageText = '';
    this.loadMessages();
    this.scrollToBottom();
  }

  triggerAttachment(type: 'image' | 'audio' | 'file'): void {
    if (!this.selectedContact) return;

    let text = '';
    let fileMeta: Message['file'];

    if (type === 'image') {
      fileMeta = {
        name: 'Romantic Sunset.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=350&fit=crop',
        size: '1.8 MB'
      };
      text = 'Sent a beautiful memory 🌅❤️';
    } else if (type === 'audio') {
      fileMeta = {
        name: 'Our Love Theme.mp3',
        type: 'audio',
        url: '#',
        size: '4.2 MB'
      };
      text = 'Shared a song for us 🎵💞';
    } else {
      fileMeta = {
        name: 'Sweet Love Letter.pdf',
        type: 'file',
        url: '#',
        size: '345 KB'
      };
      text = 'Wrote a sweet message for you 💌';
    }

    this.chatService.sendMessage(this.selectedContact.id, text, fileMeta);
    this.showAttachMenu = false;
    this.loadMessages();
    this.scrollToBottom();
  }

  // --- Calls & Call History ---
  startCall(type: 'audio' | 'video', contact?: Contact): void {
    const targetContact = contact || this.selectedContact;
    if (!targetContact) return;

    this.clearCallIntervals();

    this.activeCall = {
      type,
      status: 'ringing',
      contactName: targetContact.name,
      contactAvatar: targetContact.avatar,
      duration: 0
    };

    // Log the call in Call History
    this.chatService.addCallLog({
      contactId: targetContact.id,
      contactName: targetContact.name,
      contactAvatar: targetContact.avatar,
      type: 'outgoing',
      mode: type,
      timestamp: new Date(),
      timeStr: 'Just now',
      duration: 0,
      formattedDuration: '00:00'
    });
    this.callLogs = this.chatService.getCallLogs();

    this.callRingTimeout = setTimeout(() => {
      if (this.activeCall) {
        this.activeCall.status = 'connected';
        this.startCallTimer();
      }
    }, 2500);
  }

  hangUp(): void {
    if (this.activeCall) {
      // Update duration on the latest call log
      if (this.callLogs.length > 0 && this.activeCall.duration > 0) {
        const latest = this.callLogs[0];
        latest.duration = this.activeCall.duration;
        latest.formattedDuration = this.callDurationFormatted;
      }
      this.activeCall.status = 'ended';
      setTimeout(() => {
        this.activeCall = null;
        this.clearCallIntervals();
      }, 1000);
    }
  }

  private startCallTimer(): void {
    this.callInterval = setInterval(() => {
      if (this.activeCall && this.activeCall.status === 'connected') {
        this.activeCall.duration++;
        const mins = Math.floor(this.activeCall.duration / 60);
        const secs = this.activeCall.duration % 60;
        this.callDurationFormatted = 
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private clearCallIntervals(): void {
    if (this.callInterval) clearInterval(this.callInterval);
    if (this.callRingTimeout) clearTimeout(this.callRingTimeout);
    this.callDurationFormatted = '00:00';
  }

  // --- WhatsApp Status view mode ---
  viewStatus(story: StatusStory): void {
    this.clearStoryIntervals();
    this.activeStory = story;
    this.storyProgress = 0;

    this.storyInterval = setInterval(() => {
      this.storyProgress += 2.5;
      if (this.storyProgress >= 100) {
        this.closeStory();
      }
    }, 100);
  }

  closeStory(): void {
    this.activeStory = null;
    this.clearStoryIntervals();
  }

  postNewStatus(): void {
    const caption = prompt('Enter status text or memory quote:');
    if (caption) {
      const sampleMedia = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&h=800&fit=crop';
      this.chatService.addStatusStory(sampleMedia, caption);
      this.statusStories = this.chatService.getStatusStories();
      this.showToast('Status story published! 🌟');
    }
  }

  private clearStoryIntervals(): void {
    if (this.storyInterval) clearInterval(this.storyInterval);
    this.storyProgress = 0;
  }

  // --- Settings & Linked Devices ---
  openSettings(section: 'linked' | 'scanner' | 'profile' | 'logout' = 'linked'): void {
    this.settingsActiveSection = section;
    this.showSettingsModal = true;
    this.linkedDevices = this.authService.getLinkedDevices();
  }

  closeSettings(): void {
    this.showSettingsModal = false;
    this.showAddDeviceQr = false;
  }

  logoutDevice(deviceId: string): void {
    this.authService.logoutDevice(deviceId);
    this.linkedDevices = this.authService.getLinkedDevices();
    this.showToast('Device logged out successfully.');
  }

  generateAddDeviceQr(): void {
    this.showAddDeviceQr = true;
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=RomanticMessenger_AuthToken_${Date.now()}`;
  }

  simulateQrScan(): void {
    this.scannerSimulating = true;
    setTimeout(() => {
      this.scannerSimulating = false;
      const newDev = this.authService.addLinkedDevice('Scanned Mobile Tablet Session');
      this.linkedDevices = this.authService.getLinkedDevices();
      this.showToast(`✅ QR Scanner: Logged in device "${newDev.name}"!`);
      this.settingsActiveSection = 'linked';
    }, 1500);
  }

  // --- Profile Customization & Favorite Songs ---
  saveProfileChanges(): void {
    this.authService.updateProfile(this.profileAvatarUrl, this.profileStatusText);
    this.currentUser = this.authService.getCurrentUser();
    this.showToast('Profile photo & status updated! 💖');
  }

  addFavoriteSong(): void {
    if (!this.newSongTitle.trim() || !this.newSongArtist.trim()) return;
    this.authService.addSongToProfile(this.newSongTitle.trim(), this.newSongArtist.trim());
    this.currentUser = this.authService.getCurrentUser();
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

  // --- Toasts & Helpers ---
  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  logout(): void {
    this.authService.logout();
    this.onLogout.emit();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const feed = document.querySelector('.chat-messages');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    }, 50);
  }
}


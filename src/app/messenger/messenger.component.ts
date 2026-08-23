import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { AuthService, UserSession } from '../services/auth.service';
import { ChatService, Contact, Message, StatusStory } from '../services/chat.service';
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
  selectedContact: Contact | null = null;
  messages: Message[] = [];
  statusStories: StatusStory[] = [];
  activeTyping: string | null = null;

  // View States
  activeStory: StatusStory | null = null;
  storyProgress = 0;
  private storyTimeout: any;
  private storyInterval: any;
  showAddContactModal = false;
  newContactName = '';
  newContactStatus = '';
  newContactAvatar = '';

  // Chat Input
  newMessageText = '';
  showAttachMenu = false;

  // Gallery / Files
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
    this.currentUser = this.authService.getCurrentUser();
    this.contacts = this.chatService.getContacts();
    this.statusStories = this.chatService.getStatusStories();

    // Select Emma by default if available
    if (this.contacts.length > 0) {
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
  }

  selectContact(contact: Contact): void {
    this.selectedContact = contact;
    this.chatService.clearUnread(contact.id);
    this.loadMessages();
    this.scrollToBottom();
  }

  addNewContact(): void {
    if (!this.newContactName.trim()) return;

    const contact = this.chatService.addContact(
      this.newContactName,
      this.newContactStatus,
      this.newContactAvatar
    );

    // Auto-select the newly added contact
    this.selectContact(contact);

    // Clear form and close modal
    this.newContactName = '';
    this.newContactStatus = '';
    this.newContactAvatar = '';
    this.showAddContactModal = false;
  }

  loadMessages(): void {
    if (this.selectedContact) {
      this.messages = this.chatService.getMessages(this.selectedContact.id);
      
      // Filter out shared files from the conversation
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

  // Simulated Phone & Video Calls
  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact) return;

    this.clearCallIntervals();

    this.activeCall = {
      type,
      status: 'ringing',
      contactName: this.selectedContact.name,
      contactAvatar: this.selectedContact.avatar,
      duration: 0
    };

    // Simulate contact picking up call after 2.5 seconds
    this.callRingTimeout = setTimeout(() => {
      if (this.activeCall) {
        this.activeCall.status = 'connected';
        this.startCallTimer();
      }
    }, 2500);
  }

  hangUp(): void {
    if (this.activeCall) {
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

  // WhatsApp Status view mode
  viewStatus(story: StatusStory): void {
    this.clearStoryIntervals();
    this.activeStory = story;
    this.storyProgress = 0;

    // Tick progress bar over 4 seconds
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

  private clearStoryIntervals(): void {
    if (this.storyInterval) clearInterval(this.storyInterval);
    this.storyProgress = 0;
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

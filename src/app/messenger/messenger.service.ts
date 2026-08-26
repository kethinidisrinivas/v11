import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Contact, Message, SharedMedia, User, Attachment, StatusItem, UserStatusGroup, CallLog } from './messenger.model';
import { AuthService, UserRecord } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessengerService {
  private currentUser: User = {
    id: 'me',
    name: 'Sanctuary Master',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    status: 'Connected & Secure ✨',
    isOnline: true
  };

  private contacts: Contact[] = [
    {
      id: 'sophia',
      name: 'Sophia Miller',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      statusText: 'Living in the moment 🌸',
      isOnline: true,
      unreadCount: 2,
      isFavorite: true,
      phone: '+1 555 0102',
      about: 'Design enthusiast & digital nomad. Always up for stargazing sessions.'
    },
    {
      id: 'emma',
      name: 'Emma Vance',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      statusText: 'Lost in audiobooks & tea ☕',
      isOnline: true,
      unreadCount: 1,
      isFavorite: true,
      phone: '+1 555 0101',
      about: 'UI/UX Designer dreaming in pastel violet gradients.'
    },
    {
      id: 'alex',
      name: 'Alex Rivers',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      statusText: 'Coding under midnight sky 🚀',
      isOnline: true,
      unreadCount: 0,
      isFavorite: true,
      phone: '+1 555 0103',
      about: 'Software engineer & tech explorer. Coffee first, code second.'
    },
    {
      id: 'lucas',
      name: 'Lucas Thorne',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      statusText: 'BRB - Mountain hiking 🏔️',
      isOnline: false,
      lastSeen: '12m ago',
      unreadCount: 0,
      isFavorite: false,
      phone: '+1 555 0104',
      about: 'Adventure photographer & nature seeker.'
    },
    {
      id: 'elena',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      statusText: 'Creative Director at Studio 🌌',
      isOnline: true,
      unreadCount: 0,
      isFavorite: true,
      phone: '+1 555 0105',
      about: 'Visual artist passionate about neon glassmorphism.'
    }
  ];

  // Status Groups Data (with 24h expiration check)
  private statusGroupsMap: Record<string, UserStatusGroup> = {};

  private callLogs: CallLog[] = [
    {
      id: 'call_1',
      contactId: 'sophia',
      contactName: 'Sophia Miller',
      contactAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      type: 'incoming',
      mode: 'video',
      timestamp: new Date(Date.now() - 3600000 * 2.5),
      timeStr: 'Today, 04:15 PM',
      duration: 342,
      formattedDuration: '05:42'
    },
    {
      id: 'call_2',
      contactId: 'emma',
      contactName: 'Emma Vance',
      contactAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      type: 'outgoing',
      mode: 'audio',
      timestamp: new Date(Date.now() - 3600000 * 18),
      timeStr: 'Yesterday, 09:30 PM',
      duration: 780,
      formattedDuration: '13:00'
    }
  ];

  private messagesMap: Record<string, Message[]> = {
    sophia: [
      {
        id: 'msg_s1',
        senderId: 'sophia',
        senderName: 'Sophia Miller',
        text: 'Thinking about our weekend trip. The cabin looks absolutely perfect. ✨',
        timestamp: new Date(Date.now() - 3600000 * 2),
        timeStr: '10:42 AM',
        isRead: true
      }
    ],
    emma: [
      {
        id: 'msg_e1',
        senderId: 'emma',
        senderName: 'Emma Vance',
        text: 'Loved the soft violet glow palette you picked for the main dashboard! 💜',
        timestamp: new Date(Date.now() - 3600000 * 1.2),
        timeStr: '10:10 AM',
        isRead: false
      }
    ]
  };

  private selectedContactSubject = new BehaviorSubject<Contact | null>(this.contacts[0]);
  private typingContactSubject = new BehaviorSubject<{ contactId: string; name: string } | null>(null);

  constructor(private authService: AuthService) {
    this.syncCurrentUser();
    this.initDefaultStatuses();
  }

  private initDefaultStatuses(): void {
    const now = Date.now();

    // My Statuses
    this.statusGroupsMap['me'] = {
      contactId: 'me',
      contactName: this.currentUser.name,
      contactAvatar: this.currentUser.avatar,
      isMine: true,
      hasUnseen: false,
      lastUpdated: 'Today, 08:30 AM',
      items: [
        {
          id: 'st_my_1',
          type: 'text',
          textContent: 'Building the future of messaging in Sanctuary 🌌✨',
          bgColor: 'linear-gradient(135deg, #10b981, #059669)',
          timestamp: now - 3600000 * 3,
          timeStr: '3h ago',
          seen: true,
          viewsCount: 14
        }
      ]
    };

    // Sophia's Statuses (Unseen)
    this.statusGroupsMap['sophia'] = {
      contactId: 'sophia',
      contactName: 'Sophia Miller',
      contactAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      hasUnseen: true,
      lastUpdated: 'Today, 10:15 AM',
      items: [
        {
          id: 'st_sophia_1',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&h=800&fit=crop',
          caption: 'Stargazing at the mountain cabin balcony ✨🌲',
          timestamp: now - 3600000 * 1.5,
          timeStr: 'Today, 10:15 AM',
          seen: false
        },
        {
          id: 'st_sophia_2',
          type: 'text',
          textContent: 'Coffee first, code second ☕💜',
          bgColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          timestamp: now - 3600000 * 1,
          timeStr: '1h ago',
          seen: false
        }
      ]
    };

    // Emma's Statuses (Unseen)
    this.statusGroupsMap['emma'] = {
      contactId: 'emma',
      contactName: 'Emma Vance',
      contactAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      hasUnseen: true,
      lastUpdated: 'Today, 09:00 AM',
      items: [
        {
          id: 'st_emma_1',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&h=800&fit=crop',
          caption: 'Quiet morning vibes ☕🌸',
          timestamp: now - 3600000 * 2.5,
          timeStr: 'Today, 09:00 AM',
          seen: false
        }
      ]
    };

    // Elena's Statuses (Viewed)
    this.statusGroupsMap['elena'] = {
      contactId: 'elena',
      contactName: 'Elena Rostova',
      contactAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      hasUnseen: false,
      lastUpdated: 'Yesterday, 08:45 PM',
      items: [
        {
          id: 'st_elena_1',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=800&fit=crop',
          caption: 'Sunset colors over the horizon 🌅',
          timestamp: now - 3600000 * 15,
          timeStr: 'Yesterday, 08:45 PM',
          seen: true
        }
      ]
    };
  }

  // Purge expired statuses older than 24h (86,400,000 ms)
  private cleanExpiredStatuses(): void {
    const now = Date.now();
    const cutoff = 86400000;

    Object.keys(this.statusGroupsMap).forEach(key => {
      const group = this.statusGroupsMap[key];
      group.items = group.items.filter(item => (now - item.timestamp) < cutoff);
      group.hasUnseen = group.items.some(item => !item.seen);
    });
  }

  getMyStatusGroup(): UserStatusGroup {
    this.cleanExpiredStatuses();
    return this.statusGroupsMap['me'];
  }

  getContactsStatusGroups(): { recent: UserStatusGroup[]; viewed: UserStatusGroup[] } {
    this.cleanExpiredStatuses();
    const recent: UserStatusGroup[] = [];
    const viewed: UserStatusGroup[] = [];

    Object.keys(this.statusGroupsMap).forEach(key => {
      if (key === 'me') return;
      const group = this.statusGroupsMap[key];
      if (group.items.length === 0) return;

      if (group.hasUnseen) {
        recent.push(group);
      } else {
        viewed.push(group);
      }
    });

    return { recent, viewed };
  }

  addTextStatus(text: string, bgColor: string): StatusItem {
    const now = Date.now();
    const newItem: StatusItem = {
      id: 'st_' + now,
      type: 'text',
      textContent: text,
      bgColor: bgColor || 'linear-gradient(135deg, #10b981, #059669)',
      timestamp: now,
      timeStr: 'Just now',
      seen: true,
      viewsCount: 0
    };

    if (!this.statusGroupsMap['me']) {
      this.statusGroupsMap['me'] = {
        contactId: 'me',
        contactName: this.currentUser.name,
        contactAvatar: this.currentUser.avatar,
        isMine: true,
        hasUnseen: false,
        lastUpdated: 'Just now',
        items: []
      };
    }

    this.statusGroupsMap['me'].items.unshift(newItem);
    this.statusGroupsMap['me'].lastUpdated = 'Just now';
    return newItem;
  }

  addMediaStatus(
    mediaUrl: string,
    caption: string,
    type: 'image' | 'video' = 'image',
    rotationAngle: number = 0,
    textOverlay?: string,
    doodleDataUrl?: string
  ): StatusItem {
    const now = Date.now();
    const newItem: StatusItem = {
      id: 'st_' + now,
      type: type,
      mediaUrl: mediaUrl,
      caption: caption,
      rotationAngle: rotationAngle,
      textOverlay: textOverlay,
      doodleDataUrl: doodleDataUrl,
      timestamp: now,
      timeStr: 'Just now',
      seen: true,
      viewsCount: 0
    };

    if (!this.statusGroupsMap['me']) {
      this.statusGroupsMap['me'] = {
        contactId: 'me',
        contactName: this.currentUser.name,
        contactAvatar: this.currentUser.avatar,
        isMine: true,
        hasUnseen: false,
        lastUpdated: 'Just now',
        items: []
      };
    }

    this.statusGroupsMap['me'].items.unshift(newItem);
    this.statusGroupsMap['me'].lastUpdated = 'Just now';
    return newItem;
  }

  deleteStatusItem(itemId: string): void {
    if (this.statusGroupsMap['me']) {
      this.statusGroupsMap['me'].items = this.statusGroupsMap['me'].items.filter(i => i.id !== itemId);
    }
  }

  markStatusItemSeen(contactId: string, itemId: string): void {
    const group = this.statusGroupsMap[contactId];
    if (group) {
      const item = group.items.find(i => i.id === itemId);
      if (item) {
        item.seen = true;
      }
      group.hasUnseen = group.items.some(i => !i.seen);
    }
  }

  replyToStatus(contactId: string, replyText: string, statusItem: StatusItem): void {
    const contextMsg = statusItem.caption || statusItem.textContent || 'Status Story';
    const text = `Replying to status: "${contextMsg}" -> ${replyText}`;
    this.sendMessage(contactId, text);
  }

  syncCurrentUser(): void {
    const sessionUser = this.authService.getCurrentUser();
    if (sessionUser) {
      this.currentUser.name = sessionUser.name;
      if (sessionUser.avatar) this.currentUser.avatar = sessionUser.avatar;
      if (sessionUser.statusText) this.currentUser.status = sessionUser.statusText;
      this.currentUser.songs = sessionUser.songs || [];
      this.currentUser.linkedDevices = sessionUser.linkedDevices || [];
    }
  }

  getCurrentUser(): User {
    this.syncCurrentUser();
    return this.currentUser;
  }

  getContacts(): Contact[] {
    return this.contacts;
  }

  getCallLogs(): CallLog[] {
    return this.callLogs;
  }

  getSelectedContact(): Observable<Contact | null> {
    return this.selectedContactSubject.asObservable();
  }

  getTypingStatus(): Observable<{ contactId: string; name: string } | null> {
    return this.typingContactSubject.asObservable();
  }

  setTypingStatus(contactId: string, name: string, isTyping: boolean): void {
    if (isTyping) {
      this.typingContactSubject.next({ contactId, name });
    } else {
      this.typingContactSubject.next(null);
    }
  }

  selectContact(contact: Contact): void {
    contact.unreadCount = 0;
    this.selectedContactSubject.next(contact);
  }

  getMessages(contactId: string): Message[] {
    this.loadMessagesFromStorage();
    return this.messagesMap[contactId] || [];
  }

  getTotalUnreadCount(): number {
    return this.contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }

  deleteMessage(contactId: string, messageId: string): void {
    if (this.messagesMap[contactId]) {
      this.messagesMap[contactId] = this.messagesMap[contactId].filter(m => m.id !== messageId);
      this.saveMessagesToStorage();
    }
  }

  sendMessage(contactId: string, text: string, attachment?: Attachment): void {
    if (!this.messagesMap[contactId]) {
      this.messagesMap[contactId] = [];
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderId: 'me',
      senderName: 'Me',
      text: text,
      timestamp: now,
      timeStr: timeStr,
      isRead: true,
      attachment: attachment
    };

    this.messagesMap[contactId].push(newMsg);
    this.saveMessagesToStorage();

    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && contact.isOnline) {
      setTimeout(() => {
        this.typingContactSubject.next({ contactId: contact.id, name: contact.name });
      }, 1000);

      setTimeout(() => {
        this.typingContactSubject.next(null);
        this.appendSimulatedReply(contact);
      }, 3200);
    }
  }

  private loadMessagesFromStorage(): void {
    try {
      const saved = localStorage.getItem('sanctuary_messages_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(k => {
          parsed[k] = parsed[k].map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        });
        // Merge saved messages into messagesMap
        Object.assign(this.messagesMap, parsed);
      }
    } catch (e) {}
  }

  private saveMessagesToStorage(): void {
    try {
      localStorage.setItem('sanctuary_messages_map', JSON.stringify(this.messagesMap));
    } catch (e) {}
  }

  private appendSimulatedReply(contact: Contact): void {
    const replies = [
      "That sounds wonderful! I am so looking forward to it. ✨",
      "Absolutely! Let's make sure we catch that view together. 🌌",
      "Got it! I will check the details right away. 💜",
      "That is so thoughtful of you. Thanks for sharing! 😊"
    ];

    const randomText = replies[Math.floor(Math.random() * replies.length)];
    const now = new Date();

    const replyMsg: Message = {
      id: 'msg_reply_' + Date.now(),
      senderId: contact.id,
      senderName: contact.name,
      text: randomText,
      timestamp: now,
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    if (!this.messagesMap[contact.id]) {
      this.messagesMap[contact.id] = [];
    }
    this.messagesMap[contact.id].push(replyMsg);
    this.saveMessagesToStorage();
  }

  addContactFromRegisteredUser(user: UserRecord): Contact {
    const contactId = user.id || 'c_' + Date.now();
    const existing = this.contacts.find(c => c.id === contactId || (user.phone && c.phone === user.phone));
    if (existing) return existing;

    const newContact: Contact = {
      id: contactId,
      name: user.name,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      statusText: user.statusText || 'Connected registered user ✨',
      isOnline: true,
      unreadCount: 0,
      phone: user.phone,
      about: 'Registered Sanctuary member.'
    };

    this.contacts.unshift(newContact);
    this.messagesMap[contactId] = [];
    return newContact;
  }

  addContact(name: string, phone?: string, about?: string): Contact {
    const newContact: Contact = {
      id: 'c_' + Date.now(),
      name: name,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      statusText: about || 'Hey there! Using Messenger Sanctuary.',
      isOnline: true,
      unreadCount: 0,
      phone: phone || '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
      about: about || 'Connected friend in Sanctuary.'
    };
    this.contacts.unshift(newContact);
    this.messagesMap[newContact.id] = [];
    return newContact;
  }

  getSharedMedia(contactId: string): SharedMedia {
    const msgs = this.messagesMap[contactId] || [];
    const images: SharedMedia['images'] = [];
    const documents: SharedMedia['documents'] = [];
    const links: SharedMedia['links'] = [];

    msgs.forEach(m => {
      if (m.attachment) {
        if (m.attachment.type === 'image') {
          images.push({
            id: m.id,
            title: m.attachment.name,
            url: m.attachment.url,
            date: m.timeStr
          });
        } else if (m.attachment.type === 'file') {
          documents.push({
            id: m.id,
            name: m.attachment.name,
            size: m.attachment.size || '1.5 MB',
            type: 'PDF Document',
            date: m.timeStr,
            url: m.attachment.url
          });
        }
      }
    });

    if (images.length === 0) {
      images.push(
        { id: 'i1', title: 'Stargazing Balcony', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&h=300&fit=crop', date: 'Today' },
        { id: 'i2', title: 'Forest Trail Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', date: 'Aug 24' }
      );
    }

    if (documents.length === 0) {
      documents.push(
        { id: 'd1', name: 'Cabin_Booking_Confirmation.pdf', size: '1.4 MB', type: 'PDF Document', date: 'Today', url: '#' },
        { id: 'd2', name: 'Stargazing_Map_Guide.pdf', size: '850 KB', type: 'PDF Document', date: 'Aug 23', url: '#' }
      );
    }

    links.push(
      { id: 'l1', title: 'Sanctuary Stargazing Guide', url: 'https://stargazing.example.com', domain: 'stargazing.example.com', date: 'Aug 24' }
    );

    return { images, documents, links };
  }
}

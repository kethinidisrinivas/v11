import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  avatar: string;
  statusText: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or contactId
  senderName: string;
  text: string;
  timestamp: Date;
  file?: {
    name: string;
    type: 'image' | 'file' | 'audio';
    url: string;
    size?: string;
  };
}

export interface StatusStory {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  mode: 'audio' | 'video';
  timestamp: Date;
  timeStr: string;
  duration: number; // in seconds
  formattedDuration: string;
}

export interface SharedLink {
  id: string;
  title: string;
  url: string;
  domain: string;
  date: string;
}

export interface SharedDoc {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  url: string;
}

export interface SharedImage {
  id: string;
  title: string;
  url: string;
  size: string;
  date: string;
}

export interface SharedMedia {
  links: SharedLink[];
  documents: SharedDoc[];
  images: SharedImage[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private contacts: Contact[] = [
    {
      id: 'emma',
      name: 'Emma 💖',
      phone: '+1 555 0101',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      statusText: 'Under the same starry sky... ✨',
      isOnline: true,
      unreadCount: 2
    },
    {
      id: 'sophia',
      name: 'Sophia 💕',
      phone: '+1 555 0102',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      statusText: 'Love is a song that never ends 🎵',
      isOnline: true,
      unreadCount: 0
    },
    {
      id: 'lucas',
      name: 'Lucas 🌹',
      phone: '+1 555 0103',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      statusText: 'Wishing you were here with me.',
      isOnline: false,
      lastSeen: '10 mins ago',
      unreadCount: 0
    },
    {
      id: 'lily',
      name: 'Lily ✨',
      phone: '+1 555 0104',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      statusText: 'Lost in our sweet little dream world 💫',
      isOnline: true,
      unreadCount: 0
    }
  ];

  private callLogs: CallLog[] = [
    {
      id: 'call_1',
      contactId: 'emma',
      contactName: 'Emma 💖',
      contactAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      type: 'incoming',
      mode: 'video',
      timestamp: new Date(Date.now() - 3600000 * 2.5),
      timeStr: 'Today, 04:15 PM',
      duration: 342,
      formattedDuration: '05:42'
    },
    {
      id: 'call_2',
      contactId: 'sophia',
      contactName: 'Sophia 💕',
      contactAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      type: 'outgoing',
      mode: 'audio',
      timestamp: new Date(Date.now() - 3600000 * 18),
      timeStr: 'Yesterday, 09:30 PM',
      duration: 780,
      formattedDuration: '13:00'
    },
    {
      id: 'call_3',
      contactId: 'lucas',
      contactName: 'Lucas 🌹',
      contactAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      type: 'missed',
      mode: 'audio',
      timestamp: new Date(Date.now() - 3600000 * 36),
      timeStr: 'Aug 23, 11:20 AM',
      duration: 0,
      formattedDuration: '00:00'
    },
    {
      id: 'call_4',
      contactId: 'lily',
      contactName: 'Lily ✨',
      contactAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      type: 'incoming',
      mode: 'video',
      timestamp: new Date(Date.now() - 3600000 * 50),
      timeStr: 'Aug 22, 08:45 PM',
      duration: 1245,
      formattedDuration: '20:45'
    }
  ];

  private messagesMap: Record<string, Message[]> = {
    emma: [
      {
        id: '1',
        senderId: 'emma',
        senderName: 'Emma 💖',
        text: 'Hey! The background you made looks absolutely stunning. Like a galaxy of dreams! ✨🚀',
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        id: '2',
        senderId: 'me',
        senderName: 'Me',
        text: 'Aww thank you! I made it with stars, just like the ones in your eyes.',
        timestamp: new Date(Date.now() - 3600000 * 1.8)
      },
      {
        id: '3',
        senderId: 'emma',
        senderName: 'Emma 💖',
        text: 'Oh, you always know exactly what to say to make my heart flutter! 🥰',
        timestamp: new Date(Date.now() - 120000)
      }
    ],
    sophia: [
      {
        id: '1',
        senderId: 'sophia',
        senderName: 'Sophia 💕',
        text: 'Did you listen to that romantic playlist I shared?',
        timestamp: new Date(Date.now() - 3600000 * 4)
      },
      {
        id: '2',
        senderId: 'me',
        senderName: 'Me',
        text: 'Yes! Every track reminds me of our walks by the lake.',
        timestamp: new Date(Date.now() - 3600000 * 3.8)
      }
    ],
    lucas: [
      {
        id: '1',
        senderId: 'lucas',
        senderName: 'Lucas 🌹',
        text: 'Hey mate, hope you are having a lovely evening!',
        timestamp: new Date(Date.now() - 3600000 * 24)
      }
    ],
    lily: [
      {
        id: '1',
        senderId: 'lily',
        senderName: 'Lily ✨',
        text: 'Can we call tonight? I want to hear your voice.',
        timestamp: new Date(Date.now() - 3600000 * 5)
      }
    ]
  };

  private statusStories: StatusStory[] = [
    {
      id: 'story1',
      contactId: 'emma',
      contactName: 'Emma 💖',
      contactAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      mediaUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&h=800&fit=crop',
      caption: 'Holding hands and making memories... 💑',
      timestamp: 'Today, 2:15 PM'
    },
    {
      id: 'story2',
      contactId: 'sophia',
      contactName: 'Sophia 💕',
      contactAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      mediaUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&h=800&fit=crop',
      caption: 'Love is in the air 🌸✨',
      timestamp: 'Today, 10:30 AM'
    },
    {
      id: 'story3',
      contactId: 'lily',
      contactName: 'Lily ✨',
      contactAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      mediaUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=800&fit=crop',
      caption: 'Beautiful sunset with you on my mind... 🌅❤️',
      timestamp: 'Yesterday, 8:45 PM'
    }
  ];

  private defaultSharedMedia: Record<string, SharedMedia> = {
    emma: {
      links: [
        { id: 'l1', title: 'Our Dream Stargazing Destination', url: 'https://stars.example.com/destinations', domain: 'stars.example.com', date: 'Aug 24' },
        { id: 'l2', title: 'Romantic Acoustic Playlist', url: 'https://music.example.com/playlist/romantic', domain: 'music.example.com', date: 'Aug 22' }
      ],
      documents: [
        { id: 'd1', name: 'Love Letter & Poem.pdf', size: '420 KB', type: 'PDF Document', date: 'Aug 23', url: '#' },
        { id: 'd2', name: 'Weekend Trip Itinerary.docx', size: '1.2 MB', type: 'Word Document', date: 'Aug 20', url: '#' }
      ],
      images: [
        { id: 'i1', title: 'Romantic Sunset.jpg', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=350&fit=crop', size: '1.8 MB', date: 'Aug 24' },
        { id: 'i2', title: 'Starlit Memories.jpg', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&h=350&fit=crop', size: '2.4 MB', date: 'Aug 21' },
        { id: 'i3', title: 'Rose Garden Walk.jpg', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&h=350&fit=crop', size: '1.5 MB', date: 'Aug 19' }
      ]
    },
    sophia: {
      links: [
        { id: 'l3', title: 'Piano Masterpiece Track', url: 'https://music.example.com/piano', domain: 'music.example.com', date: 'Aug 23' }
      ],
      documents: [
        { id: 'd3', name: 'Song Lyrics Draft.txt', size: '45 KB', type: 'Text File', date: 'Aug 22', url: '#' }
      ],
      images: [
        { id: 'i4', title: 'Flower Garden.jpg', url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=500&h=350&fit=crop', size: '2.1 MB', date: 'Aug 22' }
      ]
    }
  };

  private sweetReplies: string[] = [
    "Thinking of you makes my entire world light up. 💖",
    "You are my favorite thought. Always. 🥰",
    "No matter where I go, my heart always finds its way back to you. 🌹",
    "Every love song makes complete sense now because of you. 🎶❤️",
    "I wish I could hold you close right now. Sending you a warm hug! 🤗💕",
    "You are the star that guides me in the dark. ✨💞",
    "I love you more than words can say. Forever and always. 😘"
  ];

  private activeTypingSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  getContacts(): Contact[] {
    return this.contacts;
  }

  getCallLogs(): CallLog[] {
    return this.callLogs;
  }

  addCallLog(log: Omit<CallLog, 'id'>): void {
    const newLog: CallLog = {
      ...log,
      id: 'call_' + Date.now()
    };
    this.callLogs.unshift(newLog);
  }

  getSharedMedia(contactId: string): SharedMedia {
    if (!this.defaultSharedMedia[contactId]) {
      this.defaultSharedMedia[contactId] = {
        links: [],
        documents: [],
        images: []
      };
    }
    return this.defaultSharedMedia[contactId];
  }

  addContact(name: string, statusText: string, avatar?: string, phone?: string): Contact {
    const contactId = name.toLowerCase().replace(/\s+/g, '-');
    const existing = this.contacts.find(c => c.id === contactId || (phone && c.phone === phone));
    if (existing) return existing;

    const newContact: Contact = {
      id: contactId,
      name,
      phone: phone || '+1 555 ' + Math.floor(1000 + Math.random() * 9000),
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      statusText: statusText || 'Online 💖',
      isOnline: true,
      unreadCount: 0
    };
    this.contacts.push(newContact);
    this.messagesMap[contactId] = [];
    return newContact;
  }

  addContactFromRegisteredUser(user: { id: string; name: string; phone: string; avatar: string; statusText?: string }): Contact {
    return this.addContact(user.name, user.statusText || 'Online 💖', user.avatar, user.phone);
  }

  getMessages(contactId: string): Message[] {
    return this.messagesMap[contactId] || [];
  }

  getStatusStories(): StatusStory[] {
    return this.statusStories;
  }

  addStatusStory(mediaUrl: string, caption: string): StatusStory {
    const user = this.authService.getCurrentUser();
    const newStory: StatusStory = {
      id: 'story_' + Date.now(),
      contactId: 'me',
      contactName: user?.name || 'My Status',
      contactAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      mediaUrl,
      caption,
      timestamp: 'Just now'
    };
    this.statusStories.unshift(newStory);
    return newStory;
  }

  getActiveTyping(): Observable<string | null> {
    return this.activeTypingSubject.asObservable();
  }

  sendMessage(contactId: string, text: string, file?: Message['file']): void {
    if (!this.messagesMap[contactId]) {
      this.messagesMap[contactId] = [];
    }

    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'me',
      senderName: 'Me',
      text,
      timestamp: new Date(),
      file
    };

    this.messagesMap[contactId].push(newMessage);

    // Dynamic addition to shared media if file is included
    if (file) {
      const media = this.getSharedMedia(contactId);
      const nowStr = 'Today';
      if (file.type === 'image') {
        media.images.unshift({
          id: newMessage.id,
          title: file.name,
          url: file.url,
          size: file.size || '1.5 MB',
          date: nowStr
        });
      } else if (file.type === 'file') {
        media.documents.unshift({
          id: newMessage.id,
          name: file.name,
          size: file.size || '500 KB',
          type: 'Document',
          date: nowStr,
          url: file.url
        });
      }
    }

    // Dynamic link extraction
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (matches) {
      const media = this.getSharedMedia(contactId);
      matches.forEach((u, idx) => {
        let domain = 'web.com';
        try {
          domain = new URL(u).hostname;
        } catch(e) {}
        media.links.unshift({
          id: newMessage.id + '_' + idx,
          title: text.substring(0, 30) + '...',
          url: u,
          domain,
          date: 'Today'
        });
      });
    }

    // Simulated reply after delay
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && contact.isOnline) {
      setTimeout(() => {
        // Set typing status with custom sweet text
        this.activeTypingSubject.next(contact.name);
      }, 1000);

      setTimeout(() => {
        // Clear typing status
        this.activeTypingSubject.next(null);

        // Append automatic romantic response
        const randomReply = this.sweetReplies[Math.floor(Math.random() * this.sweetReplies.length)];
        const replyMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          senderId: contactId,
          senderName: contact.name,
          text: randomReply,
          timestamp: new Date()
        };
        this.messagesMap[contactId].push(replyMessage);
      }, 3500);
    }
  }

  simulateTyping(contactId: string, durationMs: number = 3000): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      this.activeTypingSubject.next(contact.name);
      setTimeout(() => {
        this.activeTypingSubject.next(null);
      }, durationMs);
    }
  }

  clearUnread(contactId: string): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.unreadCount = 0;
    }
  }

  getTotalUnreadCount(): number {
    return this.contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }
}

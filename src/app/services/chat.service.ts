import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Contact {
  id: string;
  name: string;
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

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private contacts: Contact[] = [
    {
      id: 'emma',
      name: 'Emma 💖',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      statusText: 'Under the same starry sky... ✨',
      isOnline: true,
      unreadCount: 2
    },
    {
      id: 'sophia',
      name: 'Sophia 💕',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      statusText: 'Love is a song that never ends 🎵',
      isOnline: true,
      unreadCount: 0
    },
    {
      id: 'lucas',
      name: 'Lucas 🌹',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      statusText: 'Wishing you were here with me.',
      isOnline: false,
      lastSeen: '10 mins ago',
      unreadCount: 0
    },
    {
      id: 'lily',
      name: 'Lily ✨',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      statusText: 'Lost in our sweet little dream world 💫',
      isOnline: true,
      unreadCount: 0
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

  getContacts(): Contact[] {
    return this.contacts;
  }

  addContact(name: string, statusText: string, avatar?: string): Contact {
    const contactId = name.toLowerCase().replace(/\s+/g, '-');
    const newContact: Contact = {
      id: contactId,
      name,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      statusText: statusText || 'Online 💖',
      isOnline: true,
      unreadCount: 0
    };
    this.contacts.push(newContact);
    this.messagesMap[contactId] = [];
    return newContact;
  }

  getMessages(contactId: string): Message[] {
    return this.messagesMap[contactId] || [];
  }

  getStatusStories(): StatusStory[] {
    return this.statusStories;
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
}

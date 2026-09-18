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
  private contacts: Contact[] = [];
  private messagesMap: Record<string, Message[]> = {};
  private statusStories: StatusStory[] = [];
  private sweetReplies: string[] = [];

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
  }

  simulateTyping(contactId: string, durationMs: number = 3000): void {
    // Disabled simulated typing for real users
  }

  clearUnread(contactId: string): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.unreadCount = 0;
    }
  }
}

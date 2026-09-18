import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Contact, Message, QuotedMessagePreview, SharedMedia, User, Attachment, StatusItem, UserStatusGroup, CallLog, MessageReaction } from './messenger.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
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

  private contacts: Contact[] = [];

  // Status Groups Data (with 24h expiration check)
  private statusGroupsMap: Record<string, UserStatusGroup> = {};

  private callLogs: CallLog[] = [];

  private messagesMap: Record<string, Message[]> = {};

  private selectedContactSubject = new BehaviorSubject<Contact | null>(null);
  private typingContactSubject = new BehaviorSubject<{ contactId: string; userId: string; name: string; updatedAt: number } | null>(null);
  private messagesSubject = new BehaviorSubject<{ contactId: string; messages: Message[] } | null>(null);
  private callLogsSubject = new BehaviorSubject<CallLog[]>(this.callLogs);
  public callLogs$ = this.callLogsSubject.asObservable();

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.loadContactsFromStorage();
    this.loadCallLogsFromStorage();
    this.syncCurrentUser();
    this.syncContactAvatars();
    this.initDefaultStatuses();

    this.authService.avatarChanged$.subscribe(() => {
      this.syncContactAvatars();
    });
  }

  syncContactAvatars(): void {
    const sessUser = this.authService.getCurrentUser();
    if (sessUser) {
      this.currentUser.avatar = sessUser.avatar;
    }

    this.contacts.forEach(c => {
      const globalAvatar = this.authService.getUserAvatar(c.phone || c.id);
      if (globalAvatar) {
        c.avatar = globalAvatar;
      }
    });

    this.saveContactsToStorage();

    const currentSelected = this.selectedContactSubject.value;
    if (currentSelected) {
      const updated = this.contacts.find(c => c.id === currentSelected.id);
      if (updated) {
        this.selectedContactSubject.next({ ...updated });
      }
    }
  }

  private initDefaultStatuses(): void {
    // No default statuses initialized in clean state
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

    const userId = this.authService.getCurrentUser()?.id || 'me';
    this.http.post<any>(`${environment.apiUrl}/status?userId=${encodeURIComponent(userId)}`, {
      type: 'text',
      textContent: text,
      bgColor: bgColor
    }).subscribe({ next: () => {}, error: () => {} });

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

    const userId = this.authService.getCurrentUser()?.id || 'me';
    this.http.post<any>(`${environment.apiUrl}/status?userId=${encodeURIComponent(userId)}`, {
      type: type,
      mediaUrl: mediaUrl,
      caption: caption
    }).subscribe({ next: () => {}, error: () => {} });

    return newItem;
  }

  deleteStatusItem(itemId: string): void {
    if (this.statusGroupsMap['me']) {
      this.statusGroupsMap['me'].items = this.statusGroupsMap['me'].items.filter(i => i.id !== itemId);
    }
    const userId = this.authService.getCurrentUser()?.id || 'me';
    this.http.delete<any>(`${environment.apiUrl}/status/${itemId}?userId=${encodeURIComponent(userId)}`).subscribe({ next: () => {}, error: () => {} });
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
    this.http.patch<any>(`${environment.apiUrl}/status/${itemId}/seen`, {}).subscribe({ next: () => {}, error: () => {} });
  }

  getStatusGroups(): UserStatusGroup[] {
    this.cleanExpiredStatuses();
    return Object.values(this.statusGroupsMap);
  }

  addStatusItem(item: Omit<StatusItem, 'id' | 'timestamp' | 'timeStr' | 'seen'>): void {
    const now = Date.now();
    const newItem: StatusItem = {
      id: 'st_' + now,
      ...item,
      timestamp: now,
      timeStr: 'Just now',
      seen: true
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
  }

  markStatusGroupSeen(contactId: string): void {
    const group = this.statusGroupsMap[contactId];
    if (group) {
      group.items.forEach(i => (i.seen = true));
      group.hasUnseen = false;
    }
  }

  clearCallLogs(): void {
    this.callLogs = [];
    const userId = this.authService.getCurrentUser()?.id || 'me';
    this.http.delete<any>(`${environment.apiUrl}/calls?userId=${encodeURIComponent(userId)}`).subscribe({ next: () => {}, error: () => {} });
  }

  startCall(mode: 'audio' | 'video', contactId: string, contactName: string, contactAvatar: string) {
    const newLog: CallLog = {
      id: 'call_' + Date.now(),
      contactId,
      contactName,
      contactAvatar,
      type: 'outgoing',
      mode,
      timestamp: new Date(),
      timeStr: 'Just now',
      duration: 0,
      formattedDuration: '00:00'
    };
    this.callLogs.unshift(newLog);

    const userId = this.authService.getCurrentUser()?.id || 'me';
    this.http.post<any>(`${environment.apiUrl}/calls?userId=${encodeURIComponent(userId)}`, {
      contactId,
      contactName,
      contactAvatar,
      type: 'outgoing',
      mode,
      duration: 0
    }).subscribe({ next: () => {}, error: () => {} });

    return {
      type: mode,
      status: 'calling' as const,
      contactId,
      contactName,
      contactAvatar,
      duration: 0,
      direction: 'outgoing' as const
    };
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

  addCallLog(log: CallLog): void {
    this.callLogs.unshift(log);
    this.saveCallLogsToStorage();
    this.callLogsSubject.next([...this.callLogs]);
  }

  private loadCallLogsFromStorage(): void {
    try {
      const saved = localStorage.getItem('sanctuary_call_logs');
      if (saved) {
        const parsed: CallLog[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.callLogs = parsed.map(c => ({
            ...c,
            timestamp: new Date(c.timestamp)
          }));
          this.callLogsSubject.next([...this.callLogs]);
        }
      }
    } catch (e) {}
  }

  saveCallLogsToStorage(): void {
    try {
      localStorage.setItem('sanctuary_call_logs', JSON.stringify(this.callLogs));
    } catch (e) {}
  }

  getSelectedContact(): Observable<Contact | null> {
    return this.selectedContactSubject.asObservable();
  }

  getTypingStatus(): Observable<{ contactId: string; userId: string; name: string; updatedAt: number } | null> {
    return this.typingContactSubject.asObservable();
  }

  setTypingStatus(contactId: string, name: string, isTyping: boolean, userId: string = 'me'): void {
    if (isTyping) {
      this.typingContactSubject.next({
        contactId,
        userId: userId || 'me',
        name,
        updatedAt: Date.now()
      });
    } else {
      const current = this.typingContactSubject.value;
      if (!current || (current.contactId === contactId && (current.userId === userId || userId === 'me'))) {
        this.typingContactSubject.next(null);
      }
    }
  }

  getMessagesSubject(): Observable<{ contactId: string; messages: Message[] } | null> {
    return this.messagesSubject.asObservable();
  }

  private notifyMessagesUpdated(contactId: string): void {
    const msgs = this.getMessages(contactId);
    this.messagesSubject.next({ contactId, messages: [...msgs] });
  }

  markMessagesAsSeenByRecipient(contactId: string): void {
    const msgs = this.messagesMap[contactId];
    if (msgs && msgs.length > 0) {
      let updated = false;
      msgs.forEach(m => {
        if (m.senderId === 'me' && (!m.isRead || m.status !== 'seen')) {
          m.isRead = true;
          m.status = 'seen';
          updated = true;
        }
      });
      if (updated) {
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
        this.updateReadStatusOnBackend(contactId, 'seen');
      }
    }
  }

  markIncomingMessagesAsRead(contactId: string): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.unreadCount = 0;
    }
    const msgs = this.messagesMap[contactId];
    if (msgs && msgs.length > 0) {
      let updated = false;
      msgs.forEach(m => {
        if (m.senderId !== 'me' && !m.isRead) {
          m.isRead = true;
          updated = true;
        }
      });
      if (updated) {
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
      }
    }
  }

  /**
   * Backend Read-Receipt Connector API
   * Connects local state mutations to remote backend API when endpoint is available.
   */
  updateReadStatusOnBackend(contactId: string, status: 'delivered' | 'seen'): void {
    // Backend API hook structure placeholder for future backend connectivity:
    // e.g. return this.http.patch(`/api/conversations/${contactId}/read-status`, { status });
  }

  selectContact(contact: Contact): void {
    this.markIncomingMessagesAsRead(contact.id);
    this.selectedContactSubject.next(contact);
    // Mark my sent messages to this contact as Seen when receiver has chat open
    this.markMessagesAsSeenByRecipient(contact.id);
  }

  getMessages(contactId: string): Message[] {
    this.loadMessagesFromStorage();
    const raw = this.messagesMap[contactId] || [];
    return raw.filter(m => !m.deletedForUsers || !m.deletedForUsers.includes('me'));
  }

  getMessagesForContact(contactId: string): Message[] {
    return this.getMessages(contactId);
  }

  getTotalUnreadCount(): number {
    return this.contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }

  deleteMessage(contactId: string, messageId: string): void {
    this.deleteMessageForMe(contactId, messageId);
  }

  deleteMessageForMe(contactId: string, messageId: string): void {
    const msgs = this.messagesMap[contactId];
    if (msgs) {
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        if (!msg.deletedForUsers) msg.deletedForUsers = [];
        if (!msg.deletedForUsers.includes('me')) {
          msg.deletedForUsers.push('me');
        }
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
      }
    }
  }

  deleteMessageForEveryone(contactId: string, messageId: string): void {
    const msgs = this.messagesMap[contactId];
    if (msgs) {
      const msg = msgs.find(m => m.id === messageId);
      if (msg && msg.senderId === 'me') {
        msg.isDeletedForEveryone = true;
        msg.text = '';
        msg.attachment = undefined;
        msg.reactions = [];
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
      }
    }
  }

  editMessage(contactId: string, messageId: string, newText: string): void {
    const msgs = this.messagesMap[contactId];
    if (msgs) {
      const msg = msgs.find(m => m.id === messageId);
      if (msg && msg.senderId === 'me' && !msg.isDeletedForEveryone) {
        msg.text = newText;
        msg.isEdited = true;
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
      }
    }
  }

  toggleReaction(contactId: string, messageId: string, emoji: string, userId: string = 'me'): void {
    const msgs = this.messagesMap[contactId];
    if (msgs) {
      const msg = msgs.find(m => m.id === messageId);
      if (msg && !msg.isDeletedForEveryone) {
        if (!msg.reactions) msg.reactions = [];
        let reaction = msg.reactions.find(r => r.emoji === emoji);

        if (!reaction) {
          reaction = { emoji, count: 1, users: [userId] };
          msg.reactions.push(reaction);
        } else {
          const userIdx = reaction.users.indexOf(userId);
          if (userIdx > -1) {
            reaction.users.splice(userIdx, 1);
            reaction.count--;
          } else {
            reaction.users.push(userId);
            reaction.count++;
          }
        }
        msg.reactions = msg.reactions.filter(r => r.count > 0);
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
      }
    }
  }

  sendMessage(contactId: string, text: string, attachment?: Attachment, replyTo?: QuotedMessagePreview): Message {
    if (!this.messagesMap[contactId]) {
      this.messagesMap[contactId] = [];
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderId: 'me',
      senderName: 'Me',
      receiverId: contactId,
      text: text,
      timestamp: now,
      timeStr: timeStr,
      isRead: false,
      status: 'delivered',
      attachment: attachment,
      replyTo: replyTo
    };

    this.messagesMap[contactId].push(newMsg);
    this.saveMessagesToStorage();
    this.notifyMessagesUpdated(contactId);

    const currentUserId = this.authService.getCurrentUser()?.id || 'me';
    this.http.post<any>(`${environment.apiUrl}/messages?senderId=${encodeURIComponent(currentUserId)}`, {
      contactId: contactId,
      text: text,
      type: attachment ? attachment.type : 'TEXT',
      mediaUrl: attachment ? attachment.url : null,
      fileName: attachment ? attachment.name : null,
      fileSize: attachment ? attachment.size : null,
      replyToMessageId: replyTo ? replyTo.id : null
    }).subscribe({
      next: () => {},
      error: () => {}
    });

    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && contact.isOnline) {
      // Simulate receiver opening the chat & viewing the message after short delay
      setTimeout(() => {
        this.markMessagesAsSeenByRecipient(contactId);
      }, 1500);

      setTimeout(() => {
        this.typingContactSubject.next({
          contactId: contact.id,
          userId: contact.id,
          name: contact.name,
          updatedAt: Date.now()
        });
      }, 2500);

      setTimeout(() => {
        this.typingContactSubject.next(null);
        this.appendSimulatedReply(contact);
      }, 4500);
    }

    return newMsg;
  }

  sendMessageWithUpload(contactId: string, text: string, attachment: Attachment, replyTo?: QuotedMessagePreview): Message {
    if (!this.messagesMap[contactId]) {
      this.messagesMap[contactId] = [];
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      senderId: 'me',
      senderName: 'Me',
      receiverId: contactId,
      text: text,
      timestamp: now,
      timeStr: timeStr,
      isRead: false,
      status: 'delivered',
      attachment: attachment,
      replyTo: replyTo
    };

    this.messagesMap[contactId].push(newMsg);
    this.saveMessagesToStorage();
    this.notifyMessagesUpdated(contactId);

    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && contact.isOnline) {
      setTimeout(() => {
        this.markMessagesAsSeenByRecipient(contactId);
      }, 1500);
    }

    return newMsg;
  }

  updateAttachmentProgress(contactId: string, messageId: string, progress: number, status: 'uploading' | 'completed' | 'failed'): void {
    const msgs = this.messagesMap[contactId];
    if (msgs) {
      const msg = msgs.find(m => m.id === messageId);
      if (msg && msg.attachment) {
        msg.attachment.uploadProgress = progress;
        msg.attachment.uploadStatus = status;
        this.saveMessagesToStorage();
        this.notifyMessagesUpdated(contactId);
      }
    }
  }

  forwardMessages(targetContactIds: string[], messages: Message[]): void {
    if (!targetContactIds || targetContactIds.length === 0 || !messages || messages.length === 0) return;

    targetContactIds.forEach(contactId => {
      if (!this.messagesMap[contactId]) {
        this.messagesMap[contactId] = [];
      }

      messages.forEach((originalMsg, idx) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const fwdMsg: Message = {
          id: 'msg_fwd_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
          senderId: 'me',
          senderName: 'Me',
          text: originalMsg.text || '',
          timestamp: now,
          timeStr: timeStr,
          isRead: false,
          status: 'delivered',
          isForwarded: true,
          attachment: originalMsg.attachment ? JSON.parse(JSON.stringify(originalMsg.attachment)) : undefined
        };

        this.messagesMap[contactId].push(fwdMsg);
      });

      this.saveMessagesToStorage();
      this.notifyMessagesUpdated(contactId);

      const contact = this.contacts.find(c => c.id === contactId);
      if (contact && contact.isOnline) {
        setTimeout(() => {
          this.markMessagesAsSeenByRecipient(contactId);
        }, 1500);
      }
    });
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
    // Disabled simulated auto-replies for real user interactions
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
    this.saveContactsToStorage();
    return newContact;
  }

  normalizePhone(phone?: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  }

  isValidPhoneNumber(phone: string): boolean {
    const norm = this.normalizePhone(phone);
    if (!norm) return false;
    const digitsOnly = norm.replace(/\+/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }

  saveContact(data: {
    name: string;
    phone: string;
    avatar?: string;
    about?: string;
  }): { success: boolean; contact?: Contact; error?: string } {
    const trimmedName = (data.name || '').trim();
    const trimmedPhone = (data.phone || '').trim();

    if (!trimmedName) {
      return { success: false, error: 'Contact name is required.' };
    }

    if (!trimmedPhone) {
      return { success: false, error: 'Phone number is required.' };
    }

    if (!this.isValidPhoneNumber(trimmedPhone)) {
      return { success: false, error: 'Please enter a valid phone number (7-15 digits).' };
    }

    const normPhone = this.normalizePhone(trimmedPhone);

    const existing = this.contacts.find(c => this.normalizePhone(c.phone) === normPhone);
    if (existing) {
      return { success: false, error: `Contact with phone number "${trimmedPhone}" already exists (${existing.name}).` };
    }

    const newContact: Contact = {
      id: 'c_' + Date.now(),
      name: trimmedName,
      phone: trimmedPhone,
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=e0b0ff&color=051424`,
      statusText: data.about || 'Hey there! Using Messenger',
      about: data.about || 'Connected friend in Messenger',
      isOnline: true,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      userId: this.currentUser.id
    };

    this.contacts.unshift(newContact);
    this.messagesMap[newContact.id] = [];
    this.saveContactsToStorage();
    this.selectContact(newContact);

    return { success: true, contact: newContact };
  }

  private loadContactsFromStorage(): void {
    try {
      const userKey = `sanctuary_contacts_${this.currentUser.id}`;
      let saved = localStorage.getItem(userKey);
      if (!saved) {
        saved = localStorage.getItem('sanctuary_contacts');
      }
      if (saved) {
        const parsed: Contact[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.contacts = parsed;
          this.contacts.forEach(c => {
            if (!this.messagesMap[c.id]) {
              this.messagesMap[c.id] = [];
            }
          });
        }
      }
    } catch (e) {}
  }

  saveContactsToStorage(): void {
    try {
      const userKey = `sanctuary_contacts_${this.currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(this.contacts));
      localStorage.setItem('sanctuary_contacts', JSON.stringify(this.contacts));
    } catch (e) {}
  }

  updateContact(
    contactId: string,
    data: { name: string; phone: string; avatar?: string; about?: string }
  ): { success: boolean; contact?: Contact; error?: string } {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) {
      return { success: false, error: 'Contact not found.' };
    }

    const trimmedName = (data.name || '').trim();
    const trimmedPhone = (data.phone || '').trim();

    if (!trimmedName) {
      return { success: false, error: 'Contact name is required.' };
    }

    if (!trimmedPhone) {
      return { success: false, error: 'Phone number is required.' };
    }

    if (!this.isValidPhoneNumber(trimmedPhone)) {
      return { success: false, error: 'Please enter a valid phone number (7-15 digits).' };
    }

    const normPhone = this.normalizePhone(trimmedPhone);
    const existing = this.contacts.find(c => c.id !== contactId && this.normalizePhone(c.phone) === normPhone);
    if (existing) {
      return { success: false, error: `Phone number is already used by contact "${existing.name}".` };
    }

    contact.name = trimmedName;
    contact.phone = trimmedPhone;
    if (data.avatar) contact.avatar = data.avatar;
    if (data.about) {
      contact.about = data.about;
      contact.statusText = data.about;
    }

    this.saveContactsToStorage();
    if (this.selectedContactSubject.value?.id === contactId) {
      this.selectedContactSubject.next({ ...contact });
    }

    return { success: true, contact };
  }

  deleteContact(contactId: string): void {
    const idx = this.contacts.findIndex(c => c.id === contactId);
    if (idx !== -1) {
      this.contacts.splice(idx, 1);
      delete this.messagesMap[contactId];
      this.saveContactsToStorage();

      if (this.selectedContactSubject.value?.id === contactId) {
        const nextContact = this.contacts.length > 0 ? this.contacts[0] : null;
        if (nextContact) {
          this.selectContact(nextContact);
        } else {
          this.selectedContactSubject.next(null);
        }
      }
    }
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

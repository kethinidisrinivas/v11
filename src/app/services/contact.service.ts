import { Injectable } from '@angular/core';
import { MessengerService } from '../messenger/messenger.service';
import { Contact, SharedMedia } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  constructor(private messengerService: MessengerService) {}

  getContacts(): Contact[] {
    return this.messengerService.getContacts();
  }

  getContactById(contactId: string): Contact | undefined {
    return this.messengerService.getContacts().find(c => c.id === contactId);
  }

  addContact(name: string, phone: string, about?: string): Contact {
    const res = this.messengerService.saveContact({ name, phone, about });
    if (res.contact) return res.contact;
    return {
      id: 'c_' + Date.now(),
      name,
      phone,
      about,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      statusText: 'Active',
      isOnline: false,
      unreadCount: 0
    };
  }

  toggleFavorite(contactId: string): void {
    const contact = this.messengerService.getContacts().find(c => c.id === contactId);
    if (contact) {
      contact.isFavorite = !contact.isFavorite;
      this.messengerService.saveContactsToStorage();
    }
  }

  getSharedMedia(contactId: string): SharedMedia {
    return this.messengerService.getSharedMedia(contactId);
  }
}

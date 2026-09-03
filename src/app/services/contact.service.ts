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
    return this.messengerService.getContactById(contactId);
  }

  addContact(name: string, phone: string, about?: string): Contact {
    return this.messengerService.addContact(name, phone, about);
  }

  toggleFavorite(contactId: string): void {
    this.messengerService.toggleFavorite(contactId);
  }

  getSharedMedia(contactId: string): SharedMedia {
    return this.messengerService.getSharedMedia(contactId);
  }
}

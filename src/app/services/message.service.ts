import { Injectable } from '@angular/core';
import { MessengerService } from '../messenger/messenger.service';
import { Message, Attachment, QuotedMessagePreview } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private messengerService: MessengerService) {}

  getMessagesForContact(contactId: string): Message[] {
    return this.messengerService.getMessagesForContact(contactId);
  }

  sendMessage(contactId: string, text: string, attachment?: Attachment, replyTo?: QuotedMessagePreview): Message {
    return this.messengerService.sendMessage(contactId, text, attachment, replyTo);
  }

  toggleReaction(contactId: string, messageId: string, emoji: string): void {
    this.messengerService.toggleReaction(contactId, messageId, emoji);
  }

  editMessage(contactId: string, messageId: string, newText: string): void {
    this.messengerService.editMessage(contactId, messageId, newText);
  }

  deleteMessageForMe(contactId: string, messageId: string): void {
    this.messengerService.deleteMessageForMe(contactId, messageId);
  }

  deleteMessageForEveryone(contactId: string, messageId: string): void {
    this.messengerService.deleteMessageForEveryone(contactId, messageId);
  }

  forwardMessages(targetContactIds: string[], messagesToForward: Message[]): void {
    this.messengerService.forwardMessages(targetContactIds, messagesToForward);
  }
}

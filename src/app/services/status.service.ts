import { Injectable } from '@angular/core';
import { MessengerService } from '../messenger/messenger.service';
import { UserStatusGroup, StatusItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  constructor(private messengerService: MessengerService) {}

  getStatusGroups(): UserStatusGroup[] {
    return this.messengerService.getStatusGroups();
  }

  getMyStatusGroup(): UserStatusGroup | undefined {
    return this.messengerService.getMyStatusGroup();
  }

  addStatusItem(item: Omit<StatusItem, 'id' | 'timestamp' | 'timeStr' | 'seen'>): void {
    this.messengerService.addStatusItem(item);
  }

  markStatusGroupSeen(contactId: string): void {
    this.messengerService.markStatusGroupSeen(contactId);
  }
}

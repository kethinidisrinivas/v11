import { Injectable } from '@angular/core';
import { MessengerService } from '../messenger/messenger.service';
import { CallLog, CallState } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  constructor(private messengerService: MessengerService) {}

  getCallLogs(): CallLog[] {
    return this.messengerService.getCallLogs();
  }

  clearCallLogs(): void {
    this.messengerService.clearCallLogs();
  }

  startCall(mode: 'audio' | 'video', contactId: string, contactName: string, contactAvatar: string): CallState {
    return this.messengerService.startCall(mode, contactId, contactName, contactAvatar);
  }
}

import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { MessengerService } from '../messenger/messenger.service';
import { User, PrivacySettings } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(
    private authService: AuthService,
    private messengerService: MessengerService
  ) {}

  getUserProfile(): User | null {
    const session = this.authService.getCurrentUser();
    if (!session) return null;
    return {
      id: session.id,
      name: session.name,
      username: session.username,
      avatar: session.avatar,
      status: session.statusText || 'Active & Connected',
      phone: session.phone,
      email: session.email,
      isOnline: true
    };
  }

  updateProfilePhoto(avatarDataUrl: string): void {
    this.authService.updateProfilePicture(avatarDataUrl);
    this.messengerService.syncContactAvatars();
  }

  updatePrivacy(settings: Partial<PrivacySettings>): PrivacySettings {
    return this.authService.updatePrivacySettings(settings);
  }
}

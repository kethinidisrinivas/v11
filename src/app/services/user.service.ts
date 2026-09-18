import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User, PrivacySettings } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private authService: AuthService) {}

  getCurrentUser(): User | null {
    const session = this.authService.getCurrentUser();
    if (!session) return null;
    return {
      id: session.id,
      name: session.name,
      username: session.username,
      avatar: session.avatar,
      status: session.statusText || 'Active',
      phone: session.phone,
      email: session.email,
      isOnline: true,
      songs: session.songs,
      linkedDevices: session.linkedDevices,
      privacySettings: session.privacySettings
    };
  }

  updateProfilePicture(newAvatarUrl: string): void {
    this.authService.updateProfilePicture(newAvatarUrl);
  }

  updateFullProfile(profile: { name: string; username?: string; statusText?: string; avatar?: string }) {
    return this.authService.updateFullProfile(profile);
  }

  getPrivacySettings(): PrivacySettings {
    return this.authService.getPrivacySettings();
  }

  updatePrivacySettings(settings: Partial<PrivacySettings>): PrivacySettings {
    return this.authService.updatePrivacySettings(settings);
  }
}

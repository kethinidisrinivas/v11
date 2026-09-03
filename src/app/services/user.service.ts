import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User, PrivacySettings } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private authService: AuthService) {}

  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
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

import { LinkedDevice } from './chat.model';

export interface PrivacySettings {
  profilePhotoVisibility: 'Everyone' | 'My Contacts' | 'Nobody';
  aboutVisibility: 'Everyone' | 'My Contacts' | 'Nobody';
  lastSeenVisibility: 'Everyone' | 'My Contacts' | 'Nobody';
  onlineVisibility: 'Everyone' | 'Same as Last Seen';
  readReceipts: boolean;
  whoCanContactMe: 'Everyone' | 'My Contacts Only';
}

export interface UserSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  status: string;
  phone?: string;
  email?: string;
  isOnline: boolean;
  songs?: UserSong[];
  linkedDevices?: LinkedDevice[];
  privacySettings?: PrivacySettings;
}

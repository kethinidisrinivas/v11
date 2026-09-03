import { PrivacySettings } from './user.model';

export interface Contact {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  statusText: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
  isFavorite?: boolean;
  phone?: string;
  about?: string;
  createdAt?: string;
  userId?: string;
  privacySettings?: PrivacySettings;
}

export interface SharedMedia {
  images: { id: string; title: string; url: string; date: string }[];
  documents: { id: string; name: string; size: string; type: string; date: string; url: string }[];
  links: { id: string; title: string; url: string; domain: string; date: string }[];
}

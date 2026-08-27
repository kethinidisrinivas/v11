export interface User {
  id: string;
  name: string;
  avatar: string;
  status: string;
  phone?: string;
  email?: string;
  isOnline: boolean;
  songs?: UserSong[];
  linkedDevices?: LinkedDevice[];
}

export interface Contact {
  id: string;
  name: string;
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
}

export interface Attachment {
  name: string;
  type: 'image' | 'file' | 'audio' | 'voice' | 'video';
  url: string;
  size?: string;
  duration?: string;
  mimeType?: string;
  extension?: string;
  uploadProgress?: number;
  uploadStatus?: 'uploading' | 'completed' | 'failed';
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface QuotedMessagePreview {
  id: string;
  senderName: string;
  text: string;
  senderId: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  timeStr: string;
  isRead: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  isStarred?: boolean;
  attachment?: Attachment;
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  deletedForUsers?: string[];
  reactions?: MessageReaction[];
  replyTo?: QuotedMessagePreview;
  isForwarded?: boolean;
}

export interface StatusItem {
  id: string;
  type: 'image' | 'video' | 'text';
  mediaUrl?: string;
  textContent?: string;
  bgColor?: string;
  caption?: string;
  rotationAngle?: number;
  textOverlay?: string;
  doodleDataUrl?: string;
  fontStyle?: string;
  timestamp: number;
  timeStr: string;
  seen: boolean;
  viewsCount?: number;
}

export interface UserStatusGroup {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  items: StatusItem[];
  hasUnseen: boolean;
  lastUpdated: string;
  isMine?: boolean;
}

export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  mode: 'audio' | 'video';
  timestamp: Date;
  timeStr: string;
  duration: number; // in seconds
  formattedDuration: string;
}

export interface UserSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export interface LinkedDevice {
  id: string;
  name: string;
  platform: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  loginTime: string;
}

export interface SharedMedia {
  images: { id: string; title: string; url: string; date: string }[];
  documents: { id: string; name: string; size: string; type: string; date: string; url: string }[];
  links: { id: string; title: string; url: string; domain: string; date: string }[];
}

export interface CallState {
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  contactName: string;
  contactAvatar: string;
  duration: number;
}

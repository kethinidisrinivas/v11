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

export interface ChatRoom {
  id: string;
  name: string;
  avatar: string;
  unreadCount: number;
  lastMessage?: string;
  updatedAt?: Date;
}

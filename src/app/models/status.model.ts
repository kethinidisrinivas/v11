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

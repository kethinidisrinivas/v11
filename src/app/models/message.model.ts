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
  receiverId?: string;
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

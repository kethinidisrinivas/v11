export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'declined';
  mode: 'audio' | 'video';
  timestamp: Date;
  timeStr: string;
  duration: number; // in seconds
  formattedDuration: string;
}

export interface CallState {
  type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed' | 'declined';
  contactId?: string;
  contactName: string;
  contactAvatar: string;
  duration: number;
  direction?: 'incoming' | 'outgoing';
  isRemoteCameraOff?: boolean;
  isRemoteMuted?: boolean;
}

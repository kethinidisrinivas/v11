import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice_candidate' | 'call_action';
  callId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  callType?: 'audio' | 'video';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  action?: 'accept' | 'decline' | 'end' | 'ringing' | 'camera_toggle' | 'mic_toggle';
  payload?: any;
}

export type WebRtcConnectionState = 'new' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected' | 'closed';

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {
  private peerConnection: RTCPeerConnection | null = null;
  private loopbackPeerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  public remoteStream$ = this.remoteStreamSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<WebRtcConnectionState>('new');
  public connectionState$ = this.connectionStateSubject.asObservable();

  private incomingCallSubject = new Subject<SignalingMessage>();
  public incomingCall$ = this.incomingCallSubject.asObservable();

  private remoteActionSubject = new Subject<{ action: string; payload?: any }>();
  public remoteAction$ = this.remoteActionSubject.asObservable();

  private broadcastChannel: BroadcastChannel | null = null;
  private activeCallId: string | null = null;
  private currentUserId: string = 'me';

  // Web Audio Context for Ringtone synthesis
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private ringtoneOscillators: OscillatorNode[] = [];

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  constructor(private ngZone: NgZone) {
    this.initSignalingChannel();
  }

  setCurrentUser(userId: string): void {
    this.currentUserId = userId || 'me';
  }

  // --- BroadcastChannel & Storage Signaling ---
  private initSignalingChannel(): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('sanctuary_webrtc_signaling');
        this.broadcastChannel.onmessage = (event: MessageEvent<SignalingMessage>) => {
          this.handleSignalingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not available, falling back to window storage events', e);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'sanctuary_webrtc_sig_event' && e.newValue) {
          try {
            const data: SignalingMessage = JSON.parse(e.newValue);
            this.handleSignalingMessage(data);
          } catch (err) {}
        }
      });
    }
  }

  private sendSignalingMessage(message: SignalingMessage): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
    try {
      localStorage.setItem('sanctuary_webrtc_sig_event', JSON.stringify({ ...message, _t: Date.now() }));
    } catch (e) {}
  }

  private handleSignalingMessage(data: SignalingMessage): void {
    this.ngZone.run(async () => {
      if (!data || data.senderId === this.currentUserId) return;

      if (data.type === 'offer') {
        this.incomingCallSubject.next(data);
      } else if (data.type === 'answer' && this.peerConnection && data.callId === this.activeCallId) {
        try {
          if (data.sdp && this.peerConnection.signalingState === 'have-local-offer') {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        } catch (e) {
          console.error('Failed to set remote answer sdp', e);
        }
      } else if (data.type === 'ice_candidate' && this.peerConnection && data.callId === this.activeCallId) {
        try {
          if (data.candidate && this.peerConnection.remoteDescription) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } catch (e) {
          console.error('Failed to add ICE candidate', e);
        }
      } else if (data.type === 'call_action' && data.callId === this.activeCallId) {
        if (data.action) {
          this.remoteActionSubject.next({ action: data.action, payload: data.payload });
        }
      }
    });
  }

  // --- Create Peer Connection ---
  async createPeerConnection(
    localStream: MediaStream,
    isCaller: boolean,
    targetUserId: string,
    callType: 'audio' | 'video' = 'video'
  ): Promise<RTCPeerConnection> {
    this.closePeerConnection();
    this.localStream = localStream;
    this.activeCallId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Add local tracks
    localStream.getTracks().forEach(track => {
      if (this.peerConnection) {
        this.peerConnection.addTrack(track, localStream);
      }
    });

    // Remote track listener
    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.ngZone.run(() => {
        if (event.streams && event.streams[0]) {
          this.remoteStreamSubject.next(event.streams[0]);
        } else {
          const stream = new MediaStream([event.track]);
          this.remoteStreamSubject.next(stream);
        }
      });
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState as WebRtcConnectionState;
      this.ngZone.run(() => {
        this.connectionStateSubject.next(state);
      });
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const iceState = this.peerConnection.iceConnectionState;
      if (iceState === 'disconnected' || iceState === 'failed') {
        this.ngZone.run(() => {
          this.connectionStateSubject.next('reconnecting');
        });
      } else if (iceState === 'connected' || iceState === 'completed') {
        this.ngZone.run(() => {
          this.connectionStateSubject.next('connected');
        });
      }
    };

    // ICE Candidate Exchange
    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && this.activeCallId) {
        this.sendSignalingMessage({
          type: 'ice_candidate',
          callId: this.activeCallId,
          senderId: this.currentUserId,
          receiverId: targetUserId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Single-tab Loopback Connection Setup for standalone local testing
    this.setupLoopbackConnection(localStream, isCaller);

    if (isCaller) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: 'offer',
        callId: this.activeCallId,
        senderId: this.currentUserId,
        receiverId: targetUserId,
        callType: callType,
        sdp: offer
      });
    }

    return this.peerConnection;
  }

  // Single-tab Loopback peer connection setup
  private setupLoopbackConnection(localStream: MediaStream, isCaller: boolean): void {
    if (!isCaller) return;
    try {
      this.loopbackPeerConnection = new RTCPeerConnection(this.rtcConfig);

      localStream.getTracks().forEach(track => {
        if (this.loopbackPeerConnection) {
          this.loopbackPeerConnection.addTrack(track, localStream);
        }
      });

      this.loopbackPeerConnection.ontrack = (event: RTCTrackEvent) => {
        this.ngZone.run(() => {
          if (event.streams && event.streams[0]) {
            this.remoteStreamSubject.next(event.streams[0]);
          } else {
            this.remoteStreamSubject.next(new MediaStream([event.track]));
          }
        });
      };

      if (this.peerConnection) {
        this.peerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate && this.loopbackPeerConnection) {
            try {
              await this.loopbackPeerConnection.addIceCandidate(event.candidate);
            } catch (e) {}
          }
        };

        this.loopbackPeerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate && this.peerConnection) {
            try {
              await this.peerConnection.addIceCandidate(event.candidate);
            } catch (e) {}
          }
        };

        setTimeout(async () => {
          if (this.peerConnection && this.loopbackPeerConnection) {
            try {
              const offer = await this.peerConnection.createOffer();
              await this.peerConnection.setLocalDescription(offer);
              await this.loopbackPeerConnection.setRemoteDescription(offer);

              const answer = await this.loopbackPeerConnection.createAnswer();
              await this.loopbackPeerConnection.setLocalDescription(answer);
              await this.peerConnection.setRemoteDescription(answer);

              this.connectionStateSubject.next('connected');
            } catch (err) {
              console.warn('Loopback setup fallback:', err);
            }
          }
        }, 800);
      }
    } catch (e) {
      console.warn('Loopback peer connection not supported in this environment', e);
    }
  }

  // Answer Incoming Call
  async answerCall(incomingOffer: SignalingMessage, localStream: MediaStream): Promise<void> {
    this.activeCallId = incomingOffer.callId;
    this.localStream = localStream;
    this.closePeerConnection();

    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    localStream.getTracks().forEach(track => {
      if (this.peerConnection) {
        this.peerConnection.addTrack(track, localStream);
      }
    });

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.ngZone.run(() => {
        if (event.streams && event.streams[0]) {
          this.remoteStreamSubject.next(event.streams[0]);
        } else {
          this.remoteStreamSubject.next(new MediaStream([event.track]));
        }
      });
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      this.ngZone.run(() => {
        this.connectionStateSubject.next(this.peerConnection!.connectionState as WebRtcConnectionState);
      });
    };

    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && this.activeCallId) {
        this.sendSignalingMessage({
          type: 'ice_candidate',
          callId: this.activeCallId,
          senderId: this.currentUserId,
          receiverId: incomingOffer.senderId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    if (incomingOffer.sdp) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOffer.sdp));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'answer',
        callId: this.activeCallId,
        senderId: this.currentUserId,
        receiverId: incomingOffer.senderId,
        sdp: answer
      });

      this.connectionStateSubject.next('connected');
    }
  }

  // Hot swap video track for front/rear camera switching
  async replaceVideoTrack(newVideoTrack: MediaStreamTrack): Promise<void> {
    if (!this.peerConnection) return;
    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
    if (videoSender) {
      await videoSender.replaceTrack(newVideoTrack);
    }
  }

  sendCallAction(receiverId: string, action: 'accept' | 'decline' | 'end' | 'camera_toggle' | 'mic_toggle', payload?: any): void {
    if (!this.activeCallId) return;
    this.sendSignalingMessage({
      type: 'call_action',
      callId: this.activeCallId,
      senderId: this.currentUserId,
      receiverId: receiverId,
      action: action,
      payload: payload
    });
  }

  closePeerConnection(): void {
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }
    if (this.loopbackPeerConnection) {
      try {
        this.loopbackPeerConnection.close();
      } catch (e) {}
      this.loopbackPeerConnection = null;
    }
    this.remoteStreamSubject.next(null);
    this.connectionStateSubject.next('new');
    this.stopRingtone();
  }

  // --- Web Audio Ringtone Synthesis ---
  startIncomingRingtone(): void {
    this.stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();

      const playChimeSequence = () => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const notes = [440, 554.37, 659.25, 880];

        notes.forEach((freq, i) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          gain.gain.setValueAtTime(0, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.18, now + i * 0.15 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.45);
          this.ringtoneOscillators.push(osc);
        });
      };

      playChimeSequence();
      this.ringtoneInterval = setInterval(() => {
        playChimeSequence();
      }, 2400);
    } catch (e) {
      console.warn('Ringtone synthesis error', e);
    }
  }

  startOutgoingRingtone(): void {
    this.stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();

      const playRingback = () => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);

        this.ringtoneOscillators.push(osc1, osc2);
      };

      playRingback();
      this.ringtoneInterval = setInterval(() => {
        playRingback();
      }, 3500);
    } catch (e) {
      console.warn('Outgoing ringback synthesis error', e);
    }
  }

  stopRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    this.ringtoneOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.ringtoneOscillators = [];

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}

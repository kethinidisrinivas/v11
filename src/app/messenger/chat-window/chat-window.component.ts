import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { Contact, Message, Attachment } from '../messenger.model';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements AfterViewChecked, OnDestroy {
  @Input() contact: Contact | null = null;
  @Input() messages: Message[] = [];
  @Input() typingStatus: { contactId: string; name: string } | null = null;

  @Output() sendMessage = new EventEmitter<{ text: string; attachment?: Attachment }>();
  @Output() startCall = new EventEmitter<'audio' | 'video'>();
  @Output() toggleContactInfo = new EventEmitter<void>();
  @Output() backToContacts = new EventEmitter<void>();

  @ViewChild('messagesFeed') private messagesFeedRef!: ElementRef<HTMLDivElement>;

  newMessageText = '';
  showEmojiPicker = false;
  showAttachMenu = false;
  lightboxImageUrl: string | null = null;

  // Voice recording simulation state
  isRecordingVoice = false;
  recordingSeconds = 0;
  private recordingInterval: any;

  // Emojis collection
  emojiList = ['✨', '💖', '🌸', '🚀', '🌲', '☕', '🎵', '💫', '🌌', '🥰', '🤗', '🔥', '🎉', '💌', '🎧', '👍', '🙌', '💯'];

  private shouldScrollToBottom = true;

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.recordingInterval) clearInterval(this.recordingInterval);
  }

  onSend(): void {
    if (!this.newMessageText.trim()) return;
    this.sendMessage.emit({ text: this.newMessageText.trim() });
    this.newMessageText = '';
    this.showEmojiPicker = false;
    this.showAttachMenu = false;
    this.shouldScrollToBottom = true;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.showAttachMenu = false;
  }

  addEmoji(emoji: string): void {
    this.newMessageText += emoji;
  }

  toggleAttachMenu(): void {
    this.showAttachMenu = !this.showAttachMenu;
    this.showEmojiPicker = false;
  }

  sendImageAttachment(): void {
    const images = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&h=400&fit=crop'
    ];
    const url = images[Math.floor(Math.random() * images.length)];

    this.sendMessage.emit({
      text: 'Sent an image attachment 📸',
      attachment: {
        name: 'Shared_Sanctuary_Photo.jpg',
        type: 'image',
        url: url,
        size: '2.1 MB'
      }
    });

    this.showAttachMenu = false;
    this.shouldScrollToBottom = true;
  }

  sendFileAttachment(): void {
    this.sendMessage.emit({
      text: 'Shared a document 📄',
      attachment: {
        name: 'Sanctuary_Notes_&_Plans.pdf',
        type: 'file',
        url: '#',
        size: '1.4 MB'
      }
    });

    this.showAttachMenu = false;
    this.shouldScrollToBottom = true;
  }

  toggleVoiceRecording(): void {
    if (!this.isRecordingVoice) {
      this.isRecordingVoice = true;
      this.recordingSeconds = 0;
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
      }, 1000);
    } else {
      // Finish recording and send voice message
      clearInterval(this.recordingInterval);
      this.isRecordingVoice = false;
      const durationStr = `0:${this.recordingSeconds.toString().padStart(2, '0')}`;

      this.sendMessage.emit({
        text: 'Voice note 🎙️',
        attachment: {
          name: 'Voice_Note.mp3',
          type: 'voice',
          url: '#',
          duration: durationStr
        }
      });
      this.recordingSeconds = 0;
      this.shouldScrollToBottom = true;
    }
  }

  openLightbox(url?: string): void {
    if (url && url !== '#') {
      this.lightboxImageUrl = url;
    }
  }

  closeLightbox(): void {
    this.lightboxImageUrl = null;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesFeedRef) {
        const el = this.messagesFeedRef.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {}
  }
}

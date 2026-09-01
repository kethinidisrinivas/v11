import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { Contact, Message, Attachment, QuotedMessagePreview } from '../messenger.model';
import { MessengerService } from '../messenger.service';
import { CameraCapturedEvent } from '../camera-modal/camera-modal.component';

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  type: 'image' | 'video' | 'file';
  sizeStr: string;
  previewUrl: string;
  mimeType: string;
  extension: string;
}

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements AfterViewChecked, OnDestroy {
  @Input() contact: Contact | null = null;
  @Input() messages: Message[] = [];
  @Input() typingStatus: { contactId: string; name: string } | null = null;

  @Output() sendMessage = new EventEmitter<{ text: string; attachment?: Attachment; replyTo?: QuotedMessagePreview }>();
  @Output() startCall = new EventEmitter<'audio' | 'video'>();
  @Output() toggleContactInfo = new EventEmitter<void>();
  @Output() backToContacts = new EventEmitter<void>();

  @ViewChild('messagesFeed') private messagesFeedRef!: ElementRef<HTMLDivElement>;
  @ViewChild('galleryFileInput') galleryFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('documentFileInput') documentFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraFileInput') cameraFileInputRef!: ElementRef<HTMLInputElement>;

  // Staged Files Preview State
  stagedFiles: StagedFile[] = [];
  isUploadingStaged = false;
  showCameraModal = false;

  newMessageText = '';
  showEmojiPicker = false;
  showAttachMenu = false;
  lightboxImageUrl: string | null = null;

  // Message Actions State
  activeMenuMessageId: string | null = null;
  activeReactionPickerMsgId: string | null = null;
  deleteModalMessage: Message | null = null;
  editingMessage: Message | null = null;
  replyingToMessage: QuotedMessagePreview | null = null;

  // Message Selection State
  isSelectionMode = false;
  selectedMessageIds: Set<string> = new Set();
  private longPressTimer: any;
  private isLongPressTriggered = false;

  // Contact Forwarding Modal State
  showForwardModal = false;
  forwardSearchQuery = '';
  availableContacts: Contact[] = [];
  selectedForwardContactIds: Set<string> = new Set();
  messagesToForward: Message[] = [];

  // Swipe to Reply Touch State
  touchStartX = 0;
  swipingMsgId: string | null = null;
  swipeOffsetMap: Record<string, number> = {};

  // Toast notice
  toastNotice: string = '';
  private toastTimeout: any;

  // Reaction Emojis
  reactionEmojis = ['❤️', '😂', '😍', '😢', '😡', '👍', '👎'];

  // Voice recording simulation state
  isRecordingVoice = false;
  recordingSeconds = 0;
  private recordingInterval: any;

  // Emojis collection
  emojiList = ['✨', '💖', '🌸', '🚀', '🌲', '☕', '🎵', '💫', '🌌', '🥰', '🤗', '🔥', '🎉', '💌', '🎧', '👍', '🙌', '💯'];

  private shouldScrollToBottom = true;

  constructor(private messengerService: MessengerService) {}

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.recordingInterval) clearInterval(this.recordingInterval);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
  }

  onSend(): void {
    if (this.isUploadingStaged) return;

    if (this.stagedFiles.length > 0 && this.contact) {
      this.isUploadingStaged = true;
      const contactId = this.contact.id;
      const textToUse = this.newMessageText.trim();
      const filesToUpload = [...this.stagedFiles];
      const replyTo = this.replyingToMessage ? { ...this.replyingToMessage } : undefined;

      this.stagedFiles = [];
      this.newMessageText = '';
      this.replyingToMessage = null;
      this.showEmojiPicker = false;
      this.showAttachMenu = false;

      filesToUpload.forEach((stagedFile, index) => {
        const attachment: Attachment = {
          name: stagedFile.name,
          type: stagedFile.type,
          url: stagedFile.previewUrl,
          size: stagedFile.sizeStr,
          mimeType: stagedFile.mimeType,
          extension: stagedFile.extension,
          uploadProgress: 0,
          uploadStatus: 'uploading'
        };

        const sentMsg = this.messengerService.sendMessageWithUpload(
          contactId,
          index === 0 ? textToUse : '',
          attachment,
          index === 0 ? replyTo : undefined
        );

        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 25) + 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            this.messengerService.updateAttachmentProgress(contactId, sentMsg.id, 100, 'completed');
            if (index === filesToUpload.length - 1) {
              this.isUploadingStaged = false;
            }
          } else {
            this.messengerService.updateAttachmentProgress(contactId, sentMsg.id, progress, 'uploading');
          }
        }, 250 + index * 100);
      });

      this.shouldScrollToBottom = true;
      return;
    }

    if (!this.newMessageText.trim()) return;

    if (this.editingMessage && this.contact) {
      this.messengerService.editMessage(this.contact.id, this.editingMessage.id, this.newMessageText.trim());
      this.editingMessage = null;
      this.showToast('Message updated');
    } else {
      this.sendMessage.emit({
        text: this.newMessageText.trim(),
        replyTo: this.replyingToMessage ? { ...this.replyingToMessage } : undefined
      });
      this.replyingToMessage = null;
    }

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

  // --- Real Device File Pickers ---
  triggerGalleryPicker(): void {
    if (this.galleryFileInputRef) {
      this.galleryFileInputRef.nativeElement.click();
    }
    this.showAttachMenu = false;
  }

  triggerDocumentPicker(): void {
    if (this.documentFileInputRef) {
      this.documentFileInputRef.nativeElement.click();
    }
    this.showAttachMenu = false;
  }

  triggerCameraPicker(): void {
    this.showCameraModal = true;
    this.showAttachMenu = false;
  }

  onCameraCapturedMedia(event: CameraCapturedEvent): void {
    this.showCameraModal = false;
    if (!this.contact) return;

    const attachment: Attachment = {
      name: event.fileName,
      type: event.type,
      url: event.url,
      size: event.fileSizeStr,
      mimeType: event.mimeType,
      duration: event.duration,
      extension: event.fileName.includes('.') ? event.fileName.split('.').pop()!.toUpperCase() : (event.type === 'image' ? 'JPG' : 'MP4'),
      uploadProgress: 100,
      uploadStatus: 'completed'
    };

    const textToUse = this.newMessageText.trim();
    const replyTo = this.replyingToMessage ? { ...this.replyingToMessage } : undefined;

    this.newMessageText = '';
    this.replyingToMessage = null;

    const sentMsg = this.messengerService.sendMessageWithUpload(
      this.contact.id,
      textToUse,
      attachment,
      replyTo
    );

    this.messengerService.updateAttachmentProgress(this.contact.id, sentMsg.id, 100, 'completed');
    this.shouldScrollToBottom = true;
    this.showToast(event.type === 'image' ? 'Photo sent' : 'Video sent');
  }

  onGalleryFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.processSelectedFiles(Array.from(input.files));
    input.value = '';
  }

  onDocumentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.processSelectedFiles(Array.from(input.files));
    input.value = '';
  }

  onCameraFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.processSelectedFiles(Array.from(input.files));
    input.value = '';
  }

  private processSelectedFiles(files: File[]): void {
    files.forEach(file => {
      let attachmentType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) attachmentType = 'image';
      else if (file.type.startsWith('video/')) attachmentType = 'video';

      const extension = file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : '';

      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        this.stagedFiles.push({
          id: 'staged_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          file: file,
          name: file.name,
          type: attachmentType,
          sizeStr: this.formatFileSize(file.size),
          previewUrl: previewUrl,
          mimeType: file.type || 'application/octet-stream',
          extension: extension
        });
        this.shouldScrollToBottom = true;
      };
      reader.readAsDataURL(file);
    });
  }

  removeStagedFile(id: string): void {
    this.stagedFiles = this.stagedFiles.filter(f => f.id !== id);
  }

  clearStagedFiles(): void {
    this.stagedFiles = [];
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getDocumentIcon(filename?: string, extension?: string): string {
    const ext = (extension || (filename?.split('.').pop() || '')).toLowerCase();
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx'].includes(ext)) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
    if (['txt', 'md', 'json', 'csv'].includes(ext)) return 'article';
    return 'insert_drive_file';
  }

  retryUpload(msg: Message): void {
    if (!this.contact || !msg.attachment) return;
    const contactId = this.contact.id;
    this.messengerService.updateAttachmentProgress(contactId, msg.id, 10, 'uploading');

    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        this.messengerService.updateAttachmentProgress(contactId, msg.id, 100, 'completed');
        this.showToast('Upload completed!');
      } else {
        this.messengerService.updateAttachmentProgress(contactId, msg.id, currentProgress, 'uploading');
      }
    }, 300);
  }

  toggleVoiceRecording(): void {
    if (!this.isRecordingVoice) {
      this.isRecordingVoice = true;
      this.recordingSeconds = 0;
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
      }, 1000);
    } else {
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
        },
        replyTo: this.replyingToMessage ? { ...this.replyingToMessage } : undefined
      });
      this.replyingToMessage = null;
      this.recordingSeconds = 0;
      this.shouldScrollToBottom = true;
    }
  }

  // --- Message Action Handlers ---
  toggleActionMenu(msgId: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.activeMenuMessageId === msgId) {
      this.activeMenuMessageId = null;
    } else {
      this.activeMenuMessageId = msgId;
      this.activeReactionPickerMsgId = null;
    }
  }

  closeActionMenu(): void {
    this.activeMenuMessageId = null;
    this.activeReactionPickerMsgId = null;
  }

  toggleReactionPicker(msgId: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.activeReactionPickerMsgId === msgId) {
      this.activeReactionPickerMsgId = null;
    } else {
      this.activeReactionPickerMsgId = msgId;
    }
  }

  addReaction(msg: Message, emoji: string): void {
    if (!this.contact || msg.isDeletedForEveryone) return;
    this.messengerService.toggleReaction(this.contact.id, msg.id, emoji, 'me');
    this.closeActionMenu();
  }

  copyMessageText(msg: Message): void {
    if (!msg.text || msg.isDeletedForEveryone) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg.text).then(() => {
        this.showToast('Copied');
      }).catch(() => {
        this.fallbackCopy(msg.text);
      });
    } else {
      this.fallbackCopy(msg.text);
    }
    this.closeActionMenu();
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.showToast('Copied');
    } catch (e) {}
    document.body.removeChild(textArea);
  }

  startReply(msg: Message): void {
    if (msg.isDeletedForEveryone) return;
    this.editingMessage = null;
    this.replyingToMessage = {
      id: msg.id,
      senderName: msg.senderId === 'me' ? 'You' : msg.senderName,
      text: msg.text || (msg.attachment ? msg.attachment.name : 'Attachment'),
      senderId: msg.senderId
    };
    this.closeActionMenu();
  }

  cancelReply(): void {
    this.replyingToMessage = null;
  }

  startEdit(msg: Message): void {
    if (msg.senderId !== 'me' || msg.isDeletedForEveryone) return;
    this.replyingToMessage = null;
    this.editingMessage = msg;
    this.newMessageText = msg.text || '';
    this.closeActionMenu();
  }

  cancelEdit(): void {
    this.editingMessage = null;
    this.newMessageText = '';
  }

  confirmDelete(msg: Message): void {
    this.deleteModalMessage = msg;
    this.closeActionMenu();
  }

  closeDeleteModal(): void {
    this.deleteModalMessage = null;
  }

  deleteForMe(msg: Message): void {
    if (!this.contact) return;
    this.messengerService.deleteMessageForMe(this.contact.id, msg.id);
    this.closeDeleteModal();
    this.showToast('Message deleted for you');
  }

  deleteForEveryone(msg: Message): void {
    if (!this.contact || msg.senderId !== 'me') return;
    this.messengerService.deleteMessageForEveryone(this.contact.id, msg.id);
    this.closeDeleteModal();
    this.showToast('Message deleted for everyone');
  }

  scrollToMessage(msgId: string): void {
    if (!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('highlight-pulse');
      setTimeout(() => target.classList.remove('highlight-pulse'), 1800);
    }
  }

  // --- Drag / Swipe to Reply Handlers ---
  onMessageTouchStart(msg: Message, event: MouseEvent | TouchEvent): void {
    if (msg.isDeletedForEveryone) return;
    const clientX = (event instanceof MouseEvent) ? event.clientX : (event.touches[0] ? event.touches[0].clientX : 0);
    this.touchStartX = clientX;
    this.swipingMsgId = msg.id;
  }

  onMessageTouchMove(msg: Message, event: MouseEvent | TouchEvent): void {
    if (this.swipingMsgId !== msg.id) return;
    const clientX = (event instanceof MouseEvent) ? event.clientX : (event.touches[0] ? event.touches[0].clientX : 0);
    const deltaX = clientX - this.touchStartX;
    if (deltaX > 0 && deltaX < 120) {
      this.swipeOffsetMap[msg.id] = deltaX;
    }
  }

  onMessageTouchEnd(msg: Message): void {
    if (this.swipingMsgId !== msg.id) return;
    const offset = this.swipeOffsetMap[msg.id] || 0;
    if (offset > 45) {
      this.startReply(msg);
    }
    this.swipeOffsetMap[msg.id] = 0;
    this.swipingMsgId = null;
  }

  showToast(msg: string): void {
    this.toastNotice = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastNotice = '';
    }, 2500);
  }

  openLightbox(url?: string): void {
    if (url && url !== '#') {
      this.lightboxImageUrl = url;
    }
  }

  closeLightbox(): void {
    this.lightboxImageUrl = null;
  }

  // --- Long Press & Multi-Selection Methods ---
  onMessageMouseDown(msg: Message, event: MouseEvent | TouchEvent): void {
    if (msg.isDeletedForEveryone) return;
    this.isLongPressTriggered = false;

    this.onMessageTouchStart(msg, event);

    if (this.longPressTimer) clearTimeout(this.longPressTimer);
    this.longPressTimer = setTimeout(() => {
      this.isLongPressTriggered = true;
      if (!this.isSelectionMode) {
        this.enterSelectionMode(msg);
      } else {
        this.toggleMessageSelection(msg);
      }
    }, 500);
  }

  onMessageMouseUp(msg: Message): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    this.onMessageTouchEnd(msg);
  }

  onMessageClick(msg: Message, event: Event): void {
    if (this.isLongPressTriggered) {
      event.stopPropagation();
      this.isLongPressTriggered = false;
      return;
    }

    if (this.isSelectionMode) {
      event.stopPropagation();
      this.toggleMessageSelection(msg);
    }
  }

  enterSelectionMode(initialMsg?: Message): void {
    this.isSelectionMode = true;
    this.selectedMessageIds.clear();
    if (initialMsg && !initialMsg.isDeletedForEveryone) {
      this.selectedMessageIds.add(initialMsg.id);
    }
    this.closeActionMenu();
  }

  exitSelectionMode(): void {
    this.isSelectionMode = false;
    this.selectedMessageIds.clear();
  }

  toggleMessageSelection(msg: Message): void {
    if (msg.isDeletedForEveryone) return;
    if (this.selectedMessageIds.has(msg.id)) {
      this.selectedMessageIds.delete(msg.id);
      if (this.selectedMessageIds.size === 0) {
        this.isSelectionMode = false;
      }
    } else {
      this.selectedMessageIds.add(msg.id);
    }
  }

  selectAllMessages(): void {
    this.messages.forEach(msg => {
      if (!msg.isDeletedForEveryone) {
        this.selectedMessageIds.add(msg.id);
      }
    });
  }

  isMessageSelected(msgId: string): boolean {
    return this.selectedMessageIds.has(msgId);
  }

  // --- Contact Forwarding Flow ---
  openForwardModalForSingle(msg: Message): void {
    if (msg.isDeletedForEveryone) return;
    this.messagesToForward = [msg];
    this.initForwardModal();
    this.closeActionMenu();
  }

  openForwardModalForSelected(): void {
    if (this.selectedMessageIds.size === 0) {
      this.showToast('Select at least one message to forward');
      return;
    }
    this.messagesToForward = this.messages.filter(m => this.selectedMessageIds.has(m.id) && !m.isDeletedForEveryone);
    this.initForwardModal();
  }

  private initForwardModal(): void {
    this.availableContacts = this.messengerService.getContacts();
    this.selectedForwardContactIds.clear();
    this.forwardSearchQuery = '';
    this.showForwardModal = true;
  }

  closeForwardModal(): void {
    this.showForwardModal = false;
    this.selectedForwardContactIds.clear();
    this.messagesToForward = [];
    this.forwardSearchQuery = '';
  }

  getFilteredForwardContacts(): Contact[] {
    if (!this.forwardSearchQuery.trim()) {
      return this.availableContacts;
    }
    const q = this.forwardSearchQuery.toLowerCase().trim();
    return this.availableContacts.filter(
      c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q))
    );
  }

  toggleForwardContact(contactId: string): void {
    if (this.selectedForwardContactIds.has(contactId)) {
      this.selectedForwardContactIds.delete(contactId);
    } else {
      this.selectedForwardContactIds.add(contactId);
    }
  }

  isForwardContactSelected(contactId: string): boolean {
    return this.selectedForwardContactIds.has(contactId);
  }

  confirmForward(): void {
    if (this.selectedForwardContactIds.size === 0) {
      this.showToast('Please select at least one contact');
      return;
    }
    if (this.messagesToForward.length === 0) {
      this.showToast('No messages selected to forward');
      return;
    }

    const targetContactIds = Array.from(this.selectedForwardContactIds);
    this.messengerService.forwardMessages(targetContactIds, this.messagesToForward);

    const contactCount = targetContactIds.length;
    const msgCount = this.messagesToForward.length;
    this.showToast(`Forwarded ${msgCount} message${msgCount > 1 ? 's' : ''} to ${contactCount} contact${contactCount > 1 ? 's' : ''}`);

    this.closeForwardModal();
    this.exitSelectionMode();
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

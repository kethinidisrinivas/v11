import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Contact, SharedMedia } from '../messenger.model';

@Component({
  selector: 'app-contact-info',
  templateUrl: './contact-info.component.html',
  styleUrls: ['./contact-info.component.css']
})
export class ContactInfoComponent {
  @Input() contact: Contact | null = null;
  @Input() sharedMedia: SharedMedia = { images: [], documents: [], links: [] };

  @Output() closeInfo = new EventEmitter<void>();
  @Output() toggleFavorite = new EventEmitter<Contact>();

  activeTab: 'media' | 'docs' | 'links' = 'media';
  isMuted = false;
  isBlocked = false;

  lightboxUrl: string | null = null;

  setTab(tab: 'media' | 'docs' | 'links'): void {
    this.activeTab = tab;
  }

  onStarClick(): void {
    if (this.contact) {
      this.contact.isFavorite = !this.contact.isFavorite;
      this.toggleFavorite.emit(this.contact);
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  toggleBlock(): void {
    this.isBlocked = !this.isBlocked;
  }

  openMediaLightbox(url?: string): void {
    if (url && url !== '#') {
      this.lightboxUrl = url;
    }
  }

  closeMediaLightbox(): void {
    this.lightboxUrl = null;
  }
}

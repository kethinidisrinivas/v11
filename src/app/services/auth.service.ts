import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

export interface UserSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  url?: string;
}

export interface PrivacySettings {
  profilePhotoVisibility: 'Everyone' | 'My Contacts' | 'Nobody';
  aboutVisibility: 'Everyone' | 'My Contacts' | 'Nobody';
  lastSeenVisibility: 'Everyone' | 'My Contacts' | 'Nobody';
  onlineVisibility: 'Everyone' | 'Same as Last Seen';
  readReceipts: boolean;
  whoCanContactMe: 'Everyone' | 'My Contacts Only';
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profilePhotoVisibility: 'Everyone',
  aboutVisibility: 'Everyone',
  lastSeenVisibility: 'Everyone',
  onlineVisibility: 'Everyone',
  readReceipts: true,
  whoCanContactMe: 'Everyone'
};

export interface UserSession {
  id: string;
  phone: string;
  email?: string;
  name: string;
  username?: string;
  avatar: string;
  statusText: string;
  songs: UserSong[];
  linkedDevices: LinkedDevice[];
  privacySettings?: PrivacySettings;
  token?: string;
}

export interface UserRecord {
  id: string;
  phone: string;
  email?: string;
  name: string;
  username?: string;
  pass?: string;
  avatar: string;
  statusText: string;
  songs: UserSong[];
  linkedDevices: LinkedDevice[];
  privacySettings?: PrivacySettings;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private currentSession: UserSession | null = null;
  private pendingOtps: Record<string, string> = {};
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  private avatarChangedSubject = new Subject<{ userId: string; phone: string; avatar: string }>();
  public avatarChanged$: Observable<{ userId: string; phone: string; avatar: string }> = this.avatarChangedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initDefaultUsers();
    const saved = localStorage.getItem('romantic_messenger_session');
    if (saved) {
      try {
        this.currentSession = JSON.parse(saved);
      } catch (e) {
        this.currentSession = null;
      }
    }
    this.isLoggedInSubject.next(this.currentSession !== null);
  }

  private normalizePhone(phone: string): string {
    if (!phone) return '';
    const trimmed = phone.trim();
    if (trimmed.startsWith('+')) return trimmed;
    return `+91 ${trimmed}`;
  }

  private initDefaultUsers(): void {
    const users = this.getSavedUsers();
    let updated = false;

    const defaultUsers: UserRecord[] = [
      {
        id: 'emma',
        phone: '+91 98765 0101',
        email: 'emma@love.com',
        name: 'Emma 💖',
        pass: 'password123',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        statusText: 'Under the same starry sky... ✨',
        songs: [
          { id: 's1', title: 'Starry Night Serenade', artist: 'Luna Dream', duration: '03:45' },
          { id: 's2', title: 'Whispers in the Wind', artist: 'Acoustic Hearts', duration: '04:12' }
        ],
        linkedDevices: [
          {
            id: 'dev-1',
            name: 'Windows Desktop PC',
            platform: 'Windows 11',
            browser: 'Chrome 122.0',
            location: 'Mumbai, India',
            lastActive: 'Active Now',
            isCurrent: true,
            loginTime: 'Today at 09:30 AM'
          },
          {
            id: 'dev-2',
            name: 'iPhone 15 Pro',
            platform: 'iOS 17.3',
            browser: 'Safari Mobile',
            location: 'Mumbai, India',
            lastActive: '2 hours ago',
            isCurrent: false,
            loginTime: 'Yesterday at 08:15 PM'
          }
        ]
      },
      {
        id: 'sophia',
        phone: '+91 98765 0102',
        email: 'sophia@love.com',
        name: 'Sophia 💕',
        pass: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
        statusText: 'Love is a song that never ends 🎵',
        songs: [
          { id: 's3', title: 'Melody of Us', artist: 'Violin Romance', duration: '03:20' }
        ],
        linkedDevices: []
      },
      {
        id: 'lucas',
        phone: '+91 98765 0103',
        email: 'lucas@love.com',
        name: 'Lucas 🌹',
        pass: 'password123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        statusText: 'Wishing you were here with me.',
        songs: [],
        linkedDevices: []
      },
      {
        id: 'lily',
        phone: '+91 98765 0104',
        email: 'lily@love.com',
        name: 'Lily ✨',
        pass: 'password123',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
        statusText: 'Lost in our sweet little dream world 💫',
        songs: [],
        linkedDevices: []
      }
    ];

    defaultUsers.forEach(u => {
      const key = u.phone.replace(/\s+/g, '').toLowerCase();
      if (!users[key]) {
        users[key] = u;
        if (u.email) {
          users[u.email.toLowerCase()] = u;
        }
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('romantic_messenger_users', JSON.stringify(users));
    }
  }

  // --- OTP Operations ---
  sendRegistrationOtp(phone: string): { success: boolean; message: string; otp?: string } {
    const cleanPhone = this.normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 6) {
      return { success: false, message: 'Please enter a valid phone number.' };
    }
    const otp = '123456'; // Simulated standard test OTP
    this.pendingOtps[cleanPhone] = otp;
    return {
      success: true,
      message: `OTP sent successfully to ${cleanPhone}. (Demo OTP: ${otp})`,
      otp
    };
  }

  verifyRegistrationOtp(phone: string, code: string): { success: boolean; message: string } {
    const cleanPhone = this.normalizePhone(phone);
    if (!code || code.trim() !== (this.pendingOtps[cleanPhone] || '123456')) {
      return { success: false, message: 'Invalid OTP code. Please enter 123456.' };
    }
    delete this.pendingOtps[cleanPhone];
    return { success: true, message: 'Phone number verified! Now please set your email and password.' };
  }

  completePhoneRegistration(
    phone: string,
    name: string,
    email?: string,
    pass?: string
  ): { success: boolean; message: string } {
    if (!phone || !name) {
      return { success: false, message: 'Phone number and Name are required.' };
    }

    const cleanPhone = phone.trim();
    const users = this.getSavedUsers();
    const phoneKey = cleanPhone.replace(/\s+/g, '').toLowerCase();

    if (users[phoneKey]) {
      return { success: false, message: 'This phone number is already registered.' };
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return { success: false, message: 'Please enter a valid email address.' };
      }
      if (users[email.trim().toLowerCase()]) {
        return { success: false, message: 'This email is already registered.' };
      }
    }

    const userId = 'usr_' + Date.now();
    const newUser: UserRecord = {
      id: userId,
      phone: cleanPhone,
      name: name.trim(),
      email: email ? email.trim() : undefined,
      pass: pass ? pass.trim() : undefined,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      statusText: 'Living in a world of love & stars ✨',
      songs: [
        { id: 'song_1', title: 'Galactic Dreams', artist: 'Cosmic Hearts', duration: '03:50' }
      ],
      linkedDevices: [
        {
          id: 'dev_curr',
          name: 'Web Browser Session',
          platform: navigator.platform || 'Desktop Browser',
          browser: 'Web Session',
          location: 'Local Session',
          lastActive: 'Active Now',
          isCurrent: true,
          loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    // Sync with Spring Boot backend REST API
    this.http.post<any>(`${this.apiUrl}/register`, {
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : undefined,
      password: pass ? pass.trim() : 'password123'
    }, {
      headers: { 'X-Secret-Key': '050605' }
    }).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          console.log('Registered user saved on Spring Boot backend:', res.data.id);
        }
      },
      error: (err) => console.log('Backend registration notice:', err?.error?.message || err.message)
    });

    users[phoneKey] = newUser;
    if (newUser.email) {
      users[newUser.email.toLowerCase()] = newUser;
    }
    localStorage.setItem('romantic_messenger_users', JSON.stringify(users));

    // Automatically set current session
    this.createSession(newUser);
    return { success: true, message: 'Registration complete! Welcome to Romantic Messenger.' };
  }

  // --- OTP Login ---
  sendLoginOtp(phone: string): { success: boolean; message: string; otp?: string } {
    const cleanPhone = this.normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 6) {
      return { success: false, message: 'Please enter a valid phone number.' };
    }

    this.http.post<any>(`${this.apiUrl}/send-otp`, { phone: cleanPhone }).subscribe({
      next: () => {},
      error: () => {}
    });

    const user = this.findUserByPhone(cleanPhone);
    if (!user) {
      return { success: false, message: 'Phone number not found. Please register first.' };
    }

    const otp = '123456';
    this.pendingOtps[cleanPhone] = otp;
    return {
      success: true,
      message: `OTP sent to ${phone.trim()}. (Demo OTP: ${otp})`,
      otp
    };
  }

  loginWithOtp(phone: string, code: string): { success: boolean; message: string } {
    const cleanPhone = this.normalizePhone(phone);
    this.http.post<any>(`${this.apiUrl}/verify-otp`, { phone: cleanPhone, code }).subscribe({
      next: () => {},
      error: () => {}
    });

    const user = this.findUserByPhone(cleanPhone);
    if (!user) {
      return { success: false, message: 'Phone number not found.' };
    }

    if (!code || code.trim() !== (this.pendingOtps[cleanPhone] || '123456')) {
      return { success: false, message: 'Invalid OTP code. Use 123456 for demo.' };
    }

    delete this.pendingOtps[cleanPhone];
    this.createSession(user);
    return { success: true, message: 'Login successful!' };
  }

  // --- Standard Email Login ---
  login(emailOrPhone: string, pass: string): { success: boolean; message: string } {
    if (!emailOrPhone || !pass) {
      return { success: false, message: 'Credentials and password are required.' };
    }

    // Call Spring Boot REST API
    this.http.post<any>(`${this.apiUrl}/login`, {
      emailOrPhone: emailOrPhone.trim(),
      password: pass.trim()
    }, {
      headers: { 'X-Secret-Key': '050605' }
    }).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const userRec: UserRecord = {
            id: res.data.id,
            phone: res.data.phone || emailOrPhone,
            email: res.data.email,
            name: res.data.name,
            username: res.data.username,
            avatar: res.data.avatar,
            statusText: res.data.statusText || 'Online 💖',
            songs: [],
            linkedDevices: []
          };
          this.createSession(userRec);
        }
      },
      error: (err) => console.log('Backend login notice:', err?.error?.message || err.message)
    });

    const users = this.getSavedUsers();
    const cleanKey = emailOrPhone.trim().replace(/\s+/g, '').toLowerCase();
    const user = users[cleanKey] || users[emailOrPhone.trim().toLowerCase()];

    if (!user || user.pass !== pass) {
      return { success: false, message: 'Invalid email/phone or password.' };
    }

    this.createSession(user);
    return { success: true, message: 'Login successful!' };
  }

  // --- Search Users by Phone / Query ---
  findUserByPhone(phone: string): UserRecord | null {
    if (!phone) return null;
    const users = this.getSavedUsers();
    const cleanSearch = phone.trim().replace(/\s+/g, '').toLowerCase();

    for (const key of Object.keys(users)) {
      const u = users[key];
      if (u.phone && u.phone.replace(/\s+/g, '').toLowerCase().includes(cleanSearch)) {
        return u;
      }
    }
    return null;
  }

  getAllRegisteredUsers(): UserRecord[] {
    const users = this.getSavedUsers();
    const list: UserRecord[] = [];
    const seenIds = new Set<string>();

    Object.values(users).forEach(u => {
      if (u && u.id && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        list.push(u);
      }
    });

    return list;
  }

  // --- Linked Devices Management ---
  getLinkedDevices(): LinkedDevice[] {
    if (!this.currentSession) return [];
    return this.currentSession.linkedDevices || [];
  }

  logoutDevice(deviceId: string): void {
    if (!this.currentSession) return;
    this.currentSession.linkedDevices = (this.currentSession.linkedDevices || []).filter(
      d => d.id !== deviceId
    );
    this.saveCurrentSessionState();
  }

  addLinkedDevice(deviceName: string): LinkedDevice {
    const newDev: LinkedDevice = {
      id: 'dev_' + Date.now(),
      name: deviceName || 'New Linked Device',
      platform: 'Web App',
      browser: 'Linked Browser',
      location: 'Nearby Device',
      lastActive: 'Active Now',
      isCurrent: false,
      loginTime: 'Just now'
    };

    if (this.currentSession) {
      this.currentSession.linkedDevices = this.currentSession.linkedDevices || [];
      this.currentSession.linkedDevices.push(newDev);
      this.saveCurrentSessionState();
    }
    return newDev;
  }

  // --- Profile Management ---
  getDefaultAvatar(name: string = 'User'): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0b0ff&color=051424&bold=true`;
  }

  getUserAvatar(userIdOrPhone?: string): string {
    if (!userIdOrPhone) return this.getDefaultAvatar();
    const cleanKey = userIdOrPhone.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    try {
      const profilesMap = JSON.parse(localStorage.getItem('sanctuary_user_profiles') || '{}');
      if (profilesMap[cleanKey]) {
        return profilesMap[cleanKey];
      }
    } catch (e) {}

    const users = this.getSavedUsers();
    for (const k of Object.keys(users)) {
      const u = users[k];
      if (u) {
        const uIdClean = (u.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const uPhoneClean = (u.phone || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cleanKey === uIdClean || cleanKey === uPhoneClean) {
          if (u.avatar) return u.avatar;
        }
      }
    }

    if (this.currentSession) {
      const sessIdClean = (this.currentSession.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const sessPhoneClean = (this.currentSession.phone || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanKey === sessIdClean || cleanKey === sessPhoneClean) {
        return this.currentSession.avatar;
      }
    }

    return this.getDefaultAvatar(userIdOrPhone);
  }

  updateProfilePicture(avatarUrl: string): void {
    if (!this.currentSession) return;
    this.currentSession.avatar = avatarUrl;
    this.saveCurrentSessionState();

    try {
      const profilesMap = JSON.parse(localStorage.getItem('sanctuary_user_profiles') || '{}');
      const cleanId = (this.currentSession.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanPhone = (this.currentSession.phone || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanId) profilesMap[cleanId] = avatarUrl;
      if (cleanPhone) profilesMap[cleanPhone] = avatarUrl;
      localStorage.setItem('sanctuary_user_profiles', JSON.stringify(profilesMap));
    } catch (e) {}

    this.avatarChangedSubject.next({
      userId: this.currentSession.id,
      phone: this.currentSession.phone,
      avatar: avatarUrl
    });
  }

  uploadProfilePhotoApi(file: File): Observable<{ success: boolean; avatarUrl?: string; error?: string }> {
    if (!this.currentSession || !this.currentSession.id) {
      return of({ success: false, error: 'User is not logged in' });
    }
    const formData = new FormData();
    formData.append('file', file);
    const userId = this.currentSession.id;

    return this.http.post<any>(`${environment.apiUrl}/users/${userId}/profile-picture`, formData).pipe(
      map(res => {
        const avatarUrl = res.profilePictureUrl || res.avatar || (res.data ? (res.data.avatar || res.data.profilePictureUrl) : null);
        if (avatarUrl) {
          this.updateProfilePicture(avatarUrl);
          return { success: true, avatarUrl };
        }
        return { success: false, error: res.message || 'Upload failed' };
      }),
      catchError(err => {
        console.warn('Spring Boot photo upload fallback:', err);
        return of({ success: false, error: err.error?.message || err.message || 'Backend upload failed' });
      })
    );
  }

  removeProfilePicture(): void {
    if (!this.currentSession) return;
    const defaultAv = this.getDefaultAvatar(this.currentSession.name);
    this.updateProfilePicture(defaultAv);
  }

  updateFullProfile(data: {
    name: string;
    username?: string;
    statusText?: string;
    avatar?: string;
  }): { success: boolean; error?: string } {
    if (!this.currentSession) return { success: false, error: 'User is not logged in.' };

    const trimmedName = (data.name || '').trim();
    if (!trimmedName) {
      return { success: false, error: 'Display name cannot be empty.' };
    }

    let formattedUsername = (data.username || '').trim();
    if (formattedUsername && !formattedUsername.startsWith('@')) {
      formattedUsername = `@${formattedUsername}`;
    }

    if (formattedUsername && !/^@[a-zA-Z0-9_]{3,20}$/.test(formattedUsername)) {
      return { success: false, error: 'Username must start with @ and contain 3-20 letters, numbers, or underscores.' };
    }

    this.currentSession.name = trimmedName;
    this.currentSession.username = formattedUsername || `@user_${this.currentSession.id.slice(-4)}`;
    if (data.statusText !== undefined) this.currentSession.statusText = data.statusText.trim();
    if (data.avatar) this.updateProfilePicture(data.avatar);

    this.saveCurrentSessionState();
    return { success: true };
  }

  updatePrivacySettings(settings: Partial<PrivacySettings>): PrivacySettings {
    if (!this.currentSession) return DEFAULT_PRIVACY_SETTINGS;

    this.currentSession.privacySettings = {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...(this.currentSession.privacySettings || {}),
      ...settings
    };

    this.saveCurrentSessionState();
    return this.currentSession.privacySettings;
  }

  getPrivacySettings(): PrivacySettings {
    if (!this.currentSession || !this.currentSession.privacySettings) {
      return DEFAULT_PRIVACY_SETTINGS;
    }
    return { ...DEFAULT_PRIVACY_SETTINGS, ...this.currentSession.privacySettings };
  }

  updateProfile(avatar?: string, statusText?: string, songs?: UserSong[]): void {
    if (!this.currentSession) return;

    if (avatar) {
      this.updateProfilePicture(avatar);
    }
    if (statusText !== undefined) this.currentSession.statusText = statusText;
    if (songs) this.currentSession.songs = songs;

    this.saveCurrentSessionState();
  }

  addSongToProfile(title: string, artist: string, duration: string = '03:30'): void {
    if (!this.currentSession) return;
    const newSong: UserSong = {
      id: 'song_' + Date.now(),
      title,
      artist,
      duration
    };
    this.currentSession.songs = [...(this.currentSession.songs || []), newSong];
    this.saveCurrentSessionState();
  }

  logout(): void {
    this.currentSession = null;
    localStorage.removeItem('romantic_messenger_session');
    this.isLoggedInSubject.next(false);
  }

  getCurrentUser(): UserSession | null {
    return this.currentSession;
  }

  isLoggedIn(): boolean {
    return this.currentSession !== null;
  }

  private createSession(user: UserRecord): void {
    this.currentSession = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      username: user.username || `@${user.id}`,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      statusText: user.statusText || 'Online 💖',
      songs: user.songs || [],
      privacySettings: user.privacySettings || { ...DEFAULT_PRIVACY_SETTINGS },
      linkedDevices: user.linkedDevices || [
        {
          id: 'dev_1',
          name: 'Current Session Device',
          platform: 'Web App',
          browser: 'Browser',
          location: 'Local',
          lastActive: 'Active Now',
          isCurrent: true,
          loginTime: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    this.saveCurrentSessionState();
    this.isLoggedInSubject.next(true);
  }

  private saveCurrentSessionState(): void {
    if (!this.currentSession) return;
    localStorage.setItem('romantic_messenger_session', JSON.stringify(this.currentSession));

    const users = this.getSavedUsers();
    const phoneKey = this.currentSession.phone.replace(/\s+/g, '').toLowerCase();
    if (users[phoneKey]) {
      users[phoneKey].name = this.currentSession.name;
      users[phoneKey].username = this.currentSession.username;
      users[phoneKey].avatar = this.currentSession.avatar;
      users[phoneKey].statusText = this.currentSession.statusText;
      users[phoneKey].privacySettings = this.currentSession.privacySettings;
      users[phoneKey].songs = this.currentSession.songs;
      users[phoneKey].linkedDevices = this.currentSession.linkedDevices;
      localStorage.setItem('romantic_messenger_users', JSON.stringify(users));
    }
  }

  private getSavedUsers(): Record<string, UserRecord> {
    const raw = localStorage.getItem('romantic_messenger_users');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }
}


import { Injectable } from '@angular/core';

export interface UserSession {
  email: string;
  name: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentSession: UserSession | null = null;

  constructor() {
    const saved = localStorage.getItem('romantic_messenger_session');
    if (saved) {
      try {
        this.currentSession = JSON.parse(saved);
      } catch (e) {
        this.currentSession = null;
      }
    }
  }

  register(email: string, name: string, pass: string): { success: boolean; message: string } {
    if (!email || !name || !pass) {
      return { success: false, message: 'All fields are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const users = this.getSavedUsers();
    if (users[email.toLowerCase()]) {
      return { success: false, message: 'This email is already registered.' };
    }

    users[email.toLowerCase()] = { email, name, pass };
    localStorage.setItem('romantic_messenger_users', JSON.stringify(users));

    return { success: true, message: 'Registration successful! You can now log in.' };
  }

  login(email: string, pass: string): { success: boolean; message: string } {
    if (!email || !pass) {
      return { success: false, message: 'Email and password are required.' };
    }

    const users = this.getSavedUsers();
    const user = users[email.toLowerCase()];

    if (!user || user.pass !== pass) {
      return { success: false, message: 'Invalid email or password.' };
    }

    this.currentSession = {
      email: user.email,
      name: user.name,
      avatar: 'assets/avatars/user-avatar.png'
    };
    localStorage.setItem('romantic_messenger_session', JSON.stringify(this.currentSession));

    return { success: true, message: 'Login successful!' };
  }

  logout(): void {
    this.currentSession = null;
    localStorage.removeItem('romantic_messenger_session');
  }

  getCurrentUser(): UserSession | null {
    return this.currentSession;
  }

  isLoggedIn(): boolean {
    return this.currentSession !== null;
  }

  private getSavedUsers(): Record<string, { email: string; name: string; pass: string }> {
    const raw = localStorage.getItem('romantic_messenger_users');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }
}

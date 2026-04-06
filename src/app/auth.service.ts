// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
   private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔧 AuthService initialized');
    console.log('📦 Token at startup:', this.getToken());
  }

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

   private loadUserFromStorage() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error loading user from storage:', e);
      }
    }
  }

  // auth.service.ts
login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_role', response.role);
          
          // Stocker les infos utilisateur complètes
          const user = {
            id: response.userId,
            nom: response.nom || response.name,
            email: response.email,
            role: response.role,
            equipeId: response.equipeId
          };
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }
getCurrentUserInfo(): Observable<any> {
  return this.http.get(`${this.apiUrl}/me`);
}
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  getUserName(): string {
    const user = this.getCurrentUser();
    return user?.nom || user?.name || 'Utilisateur';
  }
  logout(): void {
    console.log('🚪 Logout');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    if (token === 'null' || token === 'undefined') {
      console.warn('⚠️ Token is "null" string, removing it');
      localStorage.removeItem(this.tokenKey);
      return null;
    }
    return token;
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  hasToken(): boolean {
    const token = this.getToken();
    return !!token && token !== 'null' && token !== 'undefined';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isChef(): boolean {
    return this.getRole() === 'CHEF_EQUIPE';
  }

  isRH(): boolean {
    return this.getRole() === 'RH';
  }
}
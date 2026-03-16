import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.roleKey, response.role);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
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


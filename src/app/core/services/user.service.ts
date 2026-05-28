import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface User {
  id?: number;
  nom: string;
  email: string;
  role: string;
  equipeId?: number | null;
  equipeNom?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  matricule?: string | null;
}

/**
 * Fields that are optional AND unique in the database (matricule, telephone, etc.)
 * must be typed as `string | null` — never `string | undefined` — so the component
 * can explicitly send null instead of an empty string, which would violate the
 * unique constraint on the second user who leaves the field blank.
 */
export interface CreateUserRequest {
  nom: string;
  email: string;
  role: string;
  equipeId?: number | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  matricule?: string | null;
}

export interface UpdateUserRequest {
  nom?: string;
  email?: string;
  role?: string;
  password?: string;
  equipeId?: number | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  matricule?: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:8080/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, user, { headers: this.getHeaders() });
  }

  updateUser(id: number, user: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateMyProfile(data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/me`, data, { headers: this.getHeaders() });
  }

  getMyTeam(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/my-team`, { headers: this.getHeaders() });
  }

  // ─── Equipes ─────────────────────────────────────────────────────────────────

  getAllEquipes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/equipes`, { headers: this.getHeaders() });
  }

  createEquipe(equipe: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/equipes`, equipe, { headers: this.getHeaders() });
  }

  updateEquipe(id: number, equipe: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/equipes/${id}`, equipe, { headers: this.getHeaders() });
  }

  deleteEquipe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/equipes/${id}`, { headers: this.getHeaders() });
  }
}
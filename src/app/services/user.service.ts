import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  nom: string;
  email: string;
  password?: string;
  role: string;
  equipeId?: number;
}

export interface CreateUserRequest {
  nom: string;
  email: string;
  password?: string;
  role: string;
  equipeId?: number;
}

export interface UpdateUserRequest {
  nom?: string;
  email?: string;
  password?: string;
  role?: string;
  equipeId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteUserByEmail(email: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/email/${email}`);
  }
}


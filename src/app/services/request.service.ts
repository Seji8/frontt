import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

export interface DemandeTeletravail {
  id?: number;
  motif: string;
  dateDebut: string;
  dateFin: string;
  type: string;
  statut?: string;
  fichierjustificatif?: string;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private apiUrl = 'http://localhost:8080/api/requests';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Ne PAS mettre Content-Type ici, le navigateur le fera automatiquement avec la boundary
    });
  }

  getAllRequests(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  createRequest(formData: FormData): Observable<DemandeTeletravail> {
    return this.http.post<DemandeTeletravail>(this.apiUrl, formData, {
      headers: this.getHeaders()
    });
  }

  updateRequest(id: number, formData: FormData): Observable<DemandeTeletravail> {
    return this.http.put<DemandeTeletravail>(`${this.apiUrl}/${id}`, formData, {
      headers: this.getHeaders()
    });
  }

  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  approveRequest(id: number): Observable<DemandeTeletravail> {
    return this.http.put<DemandeTeletravail>(`${this.apiUrl}/${id}/approve`, {}, {
      headers: this.getHeaders()
    });
  }

  rejectRequest(id: number): Observable<DemandeTeletravail> {
    return this.http.put<DemandeTeletravail>(`${this.apiUrl}/${id}/reject`, {}, {
      headers: this.getHeaders()
    });
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

export interface DemandeTeletravail {
  id: number;
  motif: string;
  dateDebut: string;
  dateFin: string;
  type: string;
  statut: string;
  fichierjustificatif?: string;
  utilisateurNom?: string;
  utilisateurEmail?: string;
  utilisateurId?: number;
  dateCreation?: string;
  commentaire?: string;  // ← Optionnel
  historiqueValidations?: ValidationResponse[];
  duree?: number;                    // ← AJOUTER
  prochainValidateur?: string;       // ← AJOUTER
  etapeValidation?: number; 
   utilisateurRole?: string;      // ← AJOUTER
  utilisateurEquipe?: string;    // ← AJOUTER
}

export interface ValidationResponse {
  id: number;
  validateurNom: string;
  validateurRole: string;
  statut: string;
  commentaire: string;
  dateValidation: string;
  etape: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllRequests(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  getMyRequests(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(`${this.apiUrl}/user`, {
      headers: this.getHeaders()
    });
  }
  // request.service.ts
uploadJustificatif(demandeId: number, formData: FormData): Observable<any> {
  const token = this.authService.getToken();
  return this.http.put(`${this.apiUrl}/demandes/${demandeId}/justificatif`, formData, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
  });
}


getDemandeSuivi(demandeId: number): Observable<any> {
  const token = this.authService.getToken();
  console.log('📤 getDemandeSuivi appelé avec ID:', demandeId);
  
  return this.http.get(`${this.apiUrl}/camunda/demandes/${demandeId}/suivi`, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    })
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
getMyDemandes(): Observable<DemandeTeletravail[]> {
  const token = this.authService.getToken();
  return this.http.get<DemandeTeletravail[]>(`${this.apiUrl}/camunda/demandes`, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
  });
}
}
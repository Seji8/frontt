import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

export interface DemandeTeletravail {
  demandeId: any;
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
  commentaire?: string;
  historiqueValidations?: ValidationResponse[];
  duree?: number;
  prochainValidateur?: string;
  etapeValidation?: number;
  utilisateurRole?: string;
  utilisateurEquipe?: string;
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

  // ✅ CORRECTION: Utiliser /api/camunda/demandes
  createRequest(formData: FormData): Observable<any> {
    const url = `${this.apiUrl}/camunda/demandes`;
    console.log('📤 Envoi POST à:', url);
    return this.http.post(url, formData, {
      headers: this.getHeaders()
    });
  }

  // ✅ CORRECTION: Utiliser /api/camunda/demandes
  getMyDemandes(): Observable<DemandeTeletravail[]> {
    const url = `${this.apiUrl}/camunda/demandes`;
    console.log('📤 Appel API:', url);
    return this.http.get<DemandeTeletravail[]>(url, {
      headers: this.getHeaders()
    });
  }

  // ✅ CORRECTION: Utiliser /api/camunda/demandes/all
  getAllDemandes(): Observable<DemandeTeletravail[]> {
    const url = `${this.apiUrl}/camunda/demandes/all`;
    return this.http.get<DemandeTeletravail[]>(url, {
      headers: this.getHeaders()
    });
  }

  // ✅ CORRECTION: Utiliser /api/camunda/demandes/{id}/suivi
  getDemandeSuivi(demandeId: number): Observable<any> {
    const url = `${this.apiUrl}/camunda/demandes/${demandeId}/suivi`;
    console.log('📤 getDemandeSuivi:', url);
    return this.http.get(url, {
      headers: this.getHeaders()
    });
  }

  // ✅ CORRECTION: Utiliser /api/camunda/demandes/{id}
  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/camunda/demandes/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ Garder les autres méthodes avec les bons paths
  uploadJustificatif(demandeId: number, formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    return this.http.put(`${this.apiUrl}/demandes/${demandeId}/justificatif`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  updateRequest(id: number, formData: FormData): Observable<DemandeTeletravail> {
    return this.http.put<DemandeTeletravail>(`${this.apiUrl}/demandes/${id}`, formData, {
      headers: this.getHeaders()
    });
  }

  approveRequest(id: number): Observable<DemandeTeletravail> {
    return this.http.put<DemandeTeletravail>(`${this.apiUrl}/demandes/${id}/approve`, {}, {
      headers: this.getHeaders()
    });
  }

  rejectRequest(id: number): Observable<DemandeTeletravail> {
    return this.http.put<DemandeTeletravail>(`${this.apiUrl}/demandes/${id}/reject`, {}, {
      headers: this.getHeaders()
    });
  }
}
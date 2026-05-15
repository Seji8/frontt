// src/app/services/camunda.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';

// ==================== INTERFACES ====================

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
  processInstanceId?: string;
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

export interface Task {
  id: string;
  name: string;
  assignee: string;
  createTime: string;
  processInstanceId: string;
  taskDefinitionKey: string;
  priority: number;
  motif?: string;
  demandeId?: number;
  utilisateurNom?: string;
  dateDebut?: string;
  dateFin?: string;
  duree?: number;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class CamundaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // No Content-Type — browser sets it automatically for FormData
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ==================== DEMANDES ====================

  createDemande(formData: FormData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/camunda/demandes`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  getMyDemandes(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(
      `${this.apiUrl}/camunda/demandes`,
      { headers: this.getHeaders() }
    );
  }

  getAllDemandes(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(
      `${this.apiUrl}/camunda/demandes/all`,
      { headers: this.getHeaders() }
    );
  }

  getDemandeSuivi(demandeId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/camunda/demandes/${demandeId}/suivi`,
      { headers: this.getHeaders() }
    );
  }

  updateDemande(id: number, formData: FormData): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/camunda/demandes/${id}`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/camunda/demandes/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== TÂCHES ====================

  getChefTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/camunda/taches/chef`,
      { headers: this.getHeaders() }
    );
  }

  getAdminTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/camunda/taches/admin`,
      { headers: this.getHeaders() }
    );
  }

  approveTask(taskId: string, commentaire?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/camunda/taches/${taskId}/approuver`,
      { commentaire },
      { headers: this.getHeaders() }
    );
  }

  rejectTask(taskId: string, commentaire?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/camunda/taches/${taskId}/rejeter`,
      { commentaire },
      { headers: this.getHeaders() }
    );
  }

  // ==================== STATISTIQUES ====================

  getStatistiques(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/camunda/statistiques`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== FICHIERS ====================

  downloadFichier(filename: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/camunda/download/${filename}`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }
getScoreDemande(demandeId: number): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/camunda/demandes/${demandeId}/score`,
    { headers: this.getHeaders() }
  );
}
getDemandesEquipe(): Observable<DemandeTeletravail[]> {
  return this.http.get<DemandeTeletravail[]>(
    `${this.apiUrl}/camunda/demandes/equipe`,
    { headers: this.getHeaders() }
  );
}
getTaskVariables(taskId: string) {
  return this.http.get<any>(
    `http://localhost:8080/api/camunda/task/${taskId}/variables`
  );
}
}
// src/app/services/camunda.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

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
}

export interface ProcessResponse {
  processInstanceId: string;
  message: string;
}

export interface DemandeResponse {
  id: number;
  motif: string;
  dateDebut: string;
  dateFin: string;
  type: string;
  statut: string;
}

@Injectable({
  providedIn: 'root'
})
export class CamundaService {
  private apiUrl = 'http://localhost:8080/api/camunda';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('🔑 Token dans CamundaService:', token ? token.substring(0, 30) + '...' : 'NON TROUVÉ');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Créer une nouvelle demande de télétravail
  createDemande(motif: string, dateDebut: string, dateFin: string, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('motif', motif);
    formData.append('dateDebut', dateDebut);
    formData.append('dateFin', dateFin);
    formData.append('type', type);
    
    const token = this.authService.getToken();
    return this.http.post(`${this.apiUrl}/demandes`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  // Obtenir les tâches du chef connecté
  getMyTasks(): Observable<Task[]> {
    const token = this.authService.getToken();
    console.log('📤 Récupération des tâches chef...');
    
    return this.http.get<Task[]>(`${this.apiUrl}/taches/chef`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  // Obtenir les tâches admin
  getAdminTasks(): Observable<Task[]> {
    const token = this.authService.getToken();
    return this.http.get<Task[]>(`${this.apiUrl}/taches/admin`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  // Approuver une tâche
  approveTask(taskId: string, commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/taches/${taskId}/approuver`, 
      { commentaire }, { headers: this.getHeaders() });
  }

  // Rejeter une tâche
  rejectTask(taskId: string, commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/taches/${taskId}/rejeter`,
      { commentaire }, { headers: this.getHeaders() });
  }

  // Récupérer mes demandes
  getMyDemandes(): Observable<DemandeResponse[]> {
    const token = this.authService.getToken();
    return this.http.get<DemandeResponse[]>(`${this.apiUrl}/demandes`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }
}
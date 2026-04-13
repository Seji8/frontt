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
  private apiUrl = 'http://localhost:8080/api';

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

  createDemande(motif: string, dateDebut: string, dateFin: string, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('motif', motif);
    formData.append('dateDebut', dateDebut);
    formData.append('dateFin', dateFin);
    formData.append('type', type);
    
    const token = this.authService.getToken();
    const url = `${this.apiUrl}/camunda/demandes`;
    console.log('📤 createDemande URL:', url);
    
    return this.http.post(url, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }
  
  getChefTasks(): Observable<Task[]> {
    const url = `${this.apiUrl}/camunda/taches/chef`;
    console.log('📤 getChefTasks URL:', url);
    return this.http.get<Task[]>(url, {
      headers: this.getHeaders()
    });
  }

  getAdminTasks(): Observable<Task[]> {
    const url = `${this.apiUrl}/camunda/taches/admin`;
    console.log('📤 getAdminTasks URL:', url);
    return this.http.get<Task[]>(url, {
      headers: this.getHeaders()
    });
  }

  approveTask(taskId: string, commentaire?: string): Observable<any> {
    const url = `${this.apiUrl}/camunda/taches/${taskId}/approuver`;
    console.log('📤 approveTask URL:', url);
    return this.http.post(url, { commentaire }, { headers: this.getHeaders() });
  }

  rejectTask(taskId: string, commentaire?: string): Observable<any> {
    const url = `${this.apiUrl}/camunda/taches/${taskId}/rejeter`;
    console.log('📤 rejectTask URL:', url);
    return this.http.post(url, { commentaire }, { headers: this.getHeaders() });
  }

  getMyDemandes(): Observable<DemandeResponse[]> {
    const url = `${this.apiUrl}/camunda/demandes`;
    console.log('📤 getMyDemandes URL:', url);
    const token = this.authService.getToken();
    return this.http.get<DemandeResponse[]>(url, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }


}
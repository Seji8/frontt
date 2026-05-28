import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { DemandeTeletravail } from "../services/camunda.service";

@Injectable({ providedIn: 'root' })
export class RequestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  createRequest(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/camunda/demandes`, formData);
  }

  getMyDemandes(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(`${this.apiUrl}/camunda/demandes`);
  }

  getAllDemandes(): Observable<DemandeTeletravail[]> {
    return this.http.get<DemandeTeletravail[]>(`${this.apiUrl}/camunda/demandes/all`);
  }

  getDemandeSuivi(demandeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/camunda/demandes/${demandeId}/suivi`);
  }

  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/camunda/demandes/${id}`);
  }

  getChefTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/camunda/taches/chef`);
  }

  getAdminTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/camunda/taches/admin`);
  }

  approveTask(taskId: string, commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/camunda/taches/${taskId}/approuver`, { commentaire });
  }

  rejectTask(taskId: string, commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/camunda/taches/${taskId}/rejeter`, { commentaire });
  }

  getStatistiques(): Observable<any> {
    return this.http.get(`${this.apiUrl}/camunda/statistiques`);
  }

  downloadFichier(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/camunda/download/${filename}`, { responseType: 'blob' });
  }

  /**
   * Check if an existing (non-cancelled, non-rejected) demand overlaps
   * with the requested [dateDebut, dateFin] range AND has the same type.
   * Returns the conflicting demand if found, null otherwise.
   */
  checkDuplicate(
    type: string,
    dateDebut: string,
    dateFin: string,
    existingDemandes: DemandeTeletravail[]
  ): DemandeTeletravail | null {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);

    const ACTIVE_STATUSES = ['PENDING', 'APPROVED'];

    for (const d of existingDemandes) {
      if (!ACTIVE_STATUSES.includes(d.statut)) continue;
      if (d.type !== type) continue;

      const dStart = new Date(d.dateDebut);
      const dEnd = new Date(d.dateFin);

      // Overlap: not (end < dStart || start > dEnd)
      const overlaps = !(end < dStart || start > dEnd);
      if (overlaps) return d;
    }

    return null;
  }
}
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  date: string;
  action: string;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  details: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private apiUrl = 'http://localhost:8080/api/audit';

  constructor(private http: HttpClient) {}

  getLogs(filters?: {
    action?: string;
    userId?: number;
    from?: string;
    to?: string;
  }): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (filters?.action)  params = params.set('action',  filters.action);
    if (filters?.userId)  params = params.set('userId',  filters.userId.toString());
    if (filters?.from)    params = params.set('from',    filters.from);
    if (filters?.to)      params = params.set('to',      filters.to);
    return this.http.get<AuditLog[]>(`${this.apiUrl}/logs`, { params });
  }
}

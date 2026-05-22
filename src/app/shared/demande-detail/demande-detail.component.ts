import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CamundaService, Task } from '../../core/services/camunda.service';
import { AuthService } from '../../core/auth.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.css']
})
export class DemandeDetailComponent implements OnInit {

  demande: any = null;
  historiqueValidations: any[] = [];
  loading = true;
  error = '';

  selectedFile: File | null = null;
  isUploading  = false;
  isCancelling = false;
  cancelSuccess = false;

  rejectReason       = '';
  employeRejectReason = '';

  isAdminView = false;
  isChefView  = false;

  selectedTask: Task | undefined;

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private camundaService: CamundaService,
    private authService:    AuthService,
    private cdr:            ChangeDetectorRef,
    private http:           HttpClient
  ) {}

  ngOnInit(): void {
    const url = this.router.url;
    this.isAdminView = url.includes('/admin/');
    this.isChefView  = url.includes('/chef/');

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDemande(parseInt(id));
    } else {
      this.error   = 'ID de demande non trouvé';
      this.loading = false;
    }
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.error   = '';

    this.camundaService.getDemandeSuivi(id).subscribe({
      next: (data: any) => {
        this.demande               = data?.demande ?? data;
        this.historiqueValidations = this.demande?.historiqueValidations ?? [];

        this.employeRejectReason =
          this.demande?.rejectReason     ||
          this.demande?.motifRejet       ||
          this.demande?.rejectionReason  ||
          this.getRejectReasonFromHistory() || '';

        const role = this.authService.getRole()?.toUpperCase();

        if (role === 'ADMIN') {
          this.camundaService.getAdminTasks().subscribe({
            next: (tasks) => {
              this.selectedTask = tasks.find(t => Number(t.demandeId) === Number(this.demande.id));
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
          });
        } else if (role === 'CHEF_EQUIPE') {
          this.camundaService.getChefTasks().subscribe({
            next: (tasks) => {
              this.selectedTask = tasks.find(t => Number(t.demandeId) === Number(this.demande.id));
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
          });
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.error   = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getRejectReasonFromHistory(): string {
    const r = this.historiqueValidations?.find(
      h => h.statut === 'REJECTED' || h.action === 'REJECT'
    );
    return r?.commentaire || r?.reason || '';
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  canCancel(): boolean {
    if (!this.demande) return false;
    const cancellable = ['PENDING'];          // extend if needed
    const role = this.authService.getRole()?.toUpperCase() ?? '';
    const isEmployee = !['ADMIN', 'CHEF_EQUIPE', 'RH'].includes(role);
    return isEmployee && cancellable.includes(this.demande.statut);
  }

  cancelDemande(): void {
    if (!confirm('Voulez-vous vraiment annuler cette demande ?')) return;
    this.isCancelling = true;
    this.cdr.detectChanges();

    this.camundaService.deleteDemande(this.demande.id).subscribe({
      next: () => {
        this.isCancelling  = false;
        this.cancelSuccess = true;
        this.demande.statut = 'CANCELLED';   // optimistic update
        this.cdr.detectChanges();
        setTimeout(() => this.goBack(), 1800);
      },
      error: (err) => {
        this.isCancelling = false;
        this.error = err.error?.message || 'Erreur lors de l\'annulation';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goBack(): void {
    const role = this.authService.getRole()?.toUpperCase();
    if      (role === 'ADMIN')      this.router.navigate(['/admin/tasks']);
    else if (role === 'CHEF_EQUIPE') this.router.navigate(['/chef/tasks']);
    else if (role === 'RH')         this.router.navigate(['/toutes-demandes']);
    else                            this.router.navigate(['/mes-demandes']);
  }

  // ── Approve / Reject ──────────────────────────────────────────────────────
  approveTask(): void {
    if (!this.selectedTask) return;
    this.camundaService.approveTask(this.selectedTask.id, 'Approuvé').subscribe({
      next: () => { alert('✅ Approuvé'); this.goBack(); },
      error: (err) => { console.error(err); alert('❌ Erreur approbation'); }
    });
  }

  rejectTaskWithReason(): void {
    if (!this.selectedTask?.id || !this.rejectReason.trim()) return;
    this.camundaService.rejectTask(this.selectedTask.id, this.rejectReason).subscribe({
      next: () => { alert('Demande rejetée'); this.loadDemande(this.demande.id); },
      error: (err) => { console.error(err); alert('Erreur rejet'); }
    });
  }

  // ── File ──────────────────────────────────────────────────────────────────
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.demande?.id) return;
    const fd = new FormData();
    fd.append('fichier', this.selectedFile);
    this.isUploading = true;

    this.http.put(`http://localhost:8080/api/camunda/demandes/${this.demande.id}`, fd).subscribe({
      next: () => { this.isUploading = false; this.loadDemande(this.demande.id); },
      error: (err) => { this.isUploading = false; console.error(err); }
    });
  }

  downloadFile(): void { console.log('download'); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isEmploye(): boolean {
    const role = this.authService.getRole()?.toUpperCase() ?? '';
    return !['ADMIN', 'CHEF_EQUIPE', 'RH'].includes(role);
  }

  getStatusLabel(s: string): string {
    return ({ PENDING: 'En attente', APPROVED: 'Approuvée', REJECTED: 'Refusée', CANCELLED: 'Annulée' } as any)[s] || s;
  }

  getStatusClass(s: string): string { return 'status-' + (s || '').toLowerCase(); }

  getTypeLabel(t: string): string {
    return ({ OCCASIONAL: 'Occasionnel', REGULAR: 'Régulier', FULL: 'Complet' } as any)[t] || t;
  }

  getFileName(url: string): string { return url?.split('/').pop() || url; }

  getDurationDays(): number {
    if (!this.demande?.dateDebut || !this.demande?.dateFin) return 0;
    const diff = new Date(this.demande.dateFin).getTime() - new Date(this.demande.dateDebut).getTime();
    return Math.round(diff / 86400000) + 1;
  }
}
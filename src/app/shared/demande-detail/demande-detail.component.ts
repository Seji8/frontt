import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CamundaService, Task } from '../../core/services/camunda.service';
import { AuthService } from '../../core/auth.service';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.css']
})
export class DemandeDetailComponent implements OnInit {

  demande: any = null;
  historiqueValidations: any[] = [];
  loading = true;
  error = '';

  selectedFile: File | null = null;
  isUploading = false;
  isCancelling = false;

  // Champ de saisie admin pour le motif (lié à ngModel)
  rejectReason = '';

  // Motif affiché à l'employé (lu depuis la demande)
  employeRejectReason = '';

  isAdminView = false;
  isChefView = false;

  selectedTask: Task | undefined;
  userRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private camundaService: CamundaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const url = this.router.url;
    this.isAdminView = url.includes('/admin/');
    this.isChefView = url.includes('/chef/');

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDemande(parseInt(id));
    } else {
      this.error = 'ID de demande non trouvé';
      this.loading = false;
    }
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.error = '';

    this.camundaService.getDemandeSuivi(id).subscribe({
      next: (data: any) => {

        // Récupération de la demande
        if (data && data.demande) {
          this.demande = data.demande;
          this.historiqueValidations = data.demande.historiqueValidations || [];
        } else {
          this.demande = data;
          this.historiqueValidations = data.historiqueValidations || [];
        }

        // ✅ Charger le motif de rejet pour l'employé
        this.employeRejectReason =
          this.demande?.rejectReason ||
          this.demande?.motifRejet ||
          this.demande?.rejectionReason ||
          this.getRejectReasonFromHistory() ||
          '';

        const role = this.authService.getRole();

        if (role === 'ADMIN' || role === 'admin') {

          this.camundaService.getAdminTasks().subscribe({
            next: (tasks) => {
              this.selectedTask = tasks.find(
                t => Number(t.demandeId) === Number(this.demande.id)
              );
              console.log('TASK ADMIN TROUVÉE:', this.selectedTask);
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            }
          });

        } else if (role === 'CHEF_EQUIPE' || role === 'chef') {

          this.camundaService.getChefTasks().subscribe({
            next: (tasks) => {
              this.selectedTask = tasks.find(
                t => Number(t.demandeId) === Number(this.demande.id)
              );
              console.log('TASK CHEF TROUVÉE:', this.selectedTask);
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            }
          });

        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },

      error: (err: any) => {
        console.error('❌ Erreur:', err);
        this.error = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Cherche le motif dans l'historique si non trouvé dans la demande
  private getRejectReasonFromHistory(): string {
    const lastReject = this.historiqueValidations?.find(
      h => h.statut === 'REJECTED' || h.action === 'REJECT'
    );
    return lastReject?.commentaire || lastReject?.reason || '';
  }

  goBack(): void {
    const role = this.authService.getRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/tasks']);
    } else if (role === 'CHEF_EQUIPE') {
      this.router.navigate(['/chef/tasks']);
    } else if (role === 'RH') {
      this.router.navigate(['/toutes-demandes']);
    } else {
      this.router.navigate(['/mes-demandes']);
    }
  }

  approveTask(): void {
    if (!this.selectedTask) {
      alert('Task Camunda introuvable');
      return;
    }
    this.camundaService.approveTask(this.selectedTask.id, 'Approuvé').subscribe({
      next: () => {
        alert('✅ Approuvé');
        this.goBack();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Erreur approbation');
      }
    });
  }

  rejectTaskWithReason(): void {
    if (!this.selectedTask?.id) return;

    if (!this.rejectReason.trim()) {
      alert('Motif obligatoire');
      return;
    }

    this.camundaService.rejectTask(this.selectedTask.id, this.rejectReason).subscribe({
      next: () => {
        alert('❌ Demande rejetée');
        this.loadDemande(this.demande.id);
      },
      error: (err) => {
        console.error(err);
        alert('Erreur rejet');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.demande?.id) return;

    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    this.isUploading = true;

    this.http.put(
      `http://localhost:8080/api/camunda/demandes/${this.demande.id}`,
      formData
    ).subscribe({
      next: () => {
        this.isUploading = false;
        alert('Upload OK');
        this.loadDemande(this.demande.id);
      },
      error: (err) => {
        this.isUploading = false;
        console.error(err);
      }
    });
  }

  downloadFile(): void {
    console.log('download');
  }

  cancelDemande(): void {
    if (!confirm('Annuler ?')) return;
    this.isCancelling = true;
    this.camundaService.deleteDemande(this.demande.id).subscribe({
      next: () => {
        this.isCancelling = false;
        alert('Annulée');
        this.goBack();
      },
      error: () => {
        this.isCancelling = false;
      }
    });
  }

  getStatusLabel(s: string): string {
    return ({
      PENDING: 'En attente',
      APPROVED: 'Approuvée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée'
    } as any)[s] || s;
  }

  getStatusClass(s: string): string {
    return 'status-' + s.toLowerCase();
  }

  getTypeLabel(t: string): string {
    return ({
      OCCASIONAL: 'Occasionnel',
      REGULAR: 'Régulier',
      FULL: 'Complet'
    } as any)[t] || t;
  }

  getFileName(url: string): string {
    return url?.split('/').pop() || '';
  }

  isEmploye(): boolean {
    const role = this.authService.getRole();
    return role === 'EMPLOYE';
  }

  isAdmin(): boolean {
    return this.authService.getRole() === 'ADMIN';
  }

  isChef(): boolean {
    return this.authService.getRole() === 'CHEF_EQUIPE';
  }

  getDurationDays(): number {
    if (!this.demande?.dateDebut || !this.demande?.dateFin) return 0;
    const start = new Date(this.demande.dateDebut);
    const end = new Date(this.demande.dateFin);
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CamundaService } from '../../core/services/camunda.service';
import { AuthService } from '../../core/auth.service';
import { ButtonModule } from 'primeng/button';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule],
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private camundaService: CamundaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
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
        console.log('✅ Données brutes:', data);

        // ✅ Fix — API returns { demande: {...}, historiqueCamunda: [...] }
        if (data && data.demande) {
          this.demande = data.demande;
          this.historiqueValidations = data.demande.historiqueValidations || [];
        } else {
          // Fallback — API returned demande directly
          this.demande = data;
          this.historiqueValidations = data.historiqueValidations || [];
        }

        console.log('✅ Demande extraite:', this.demande);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur:', err);
        this.error = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    const role = this.authService.getRole();
    if (role === 'ADMIN' || role === 'admin') {
      this.router.navigate(['/admin/tasks']);
    } else if (role === 'CHEF_EQUIPE' || role === 'chef') {
      this.router.navigate(['/chef/tasks']);
    } else if (role === 'RH' || role === 'rh') {
      this.router.navigate(['/toutes-demandes']);
    } else {
      this.router.navigate(['/mes-demandes']);
    }
  }

  // ✅ File upload
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.cdr.detectChanges();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.demande?.id) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    formData.append('motif', this.demande.motif);
    formData.append('dateDebut', this.demande.dateDebut);
    formData.append('dateFin', this.demande.dateFin);
    formData.append('type', this.demande.type);

    const token = this.authService.getToken();
    this.http.put(
      `http://localhost:8080/api/camunda/demandes/${this.demande.id}`,
      formData,
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
    ).subscribe({
      next: () => {
        alert('✅ Justificatif ajouté avec succès');
        this.isUploading = false;
        this.selectedFile = null;
        this.loadDemande(this.demande.id);
      },
      error: (err) => {
        console.error('❌ Erreur upload:', err);
        alert('Erreur lors de l\'upload du fichier');
        this.isUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadFile(): void {
    if (!this.demande?.fichierjustificatif) {
      alert('Aucun fichier à télécharger');
      return;
    }

    const fileName = this.demande.fichierjustificatif;
    const token = this.authService.getToken();

    this.http.get(`http://localhost:8080/api/camunda/download/${fileName}`, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }),
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        if (err.status === 404) alert('Fichier non trouvé');
        else if (err.status === 403) alert('Accès non autorisé');
        else alert('Erreur lors du téléchargement');
      }
    });
  }

  cancelDemande(): void {
    if (!this.demande) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;

    this.isCancelling = true;
    this.camundaService.deleteDemande(this.demande.id).subscribe({
      next: () => {
        alert('✅ Demande annulée avec succès');
        this.goBack();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Erreur lors de l\'annulation');
        this.isCancelling = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente', 'APPROVED': 'Approuvée',
      'REJECTED': 'Refusée', 'CANCELLED': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatusClass(statut: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'status-pending', 'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected', 'CANCELLED': 'status-cancelled'
    };
    return classes[statut] || '';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'OCCASIONAL': 'Occasionnel', 'REGULAR': 'Régulier', 'FULL': 'Complet'
    };
    return labels[type] || type;
  }

  getFileName(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || url;
  }

  isEmploye(): boolean {
    const role = this.authService.getRole();
    return role === 'EMPLOYE' || role === 'employe';
  }
}
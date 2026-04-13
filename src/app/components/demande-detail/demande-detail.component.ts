import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.css']
})
export class DemandeDetailComponent implements OnInit {
  demande: any = null;
  loading = true;
  error = '';
  selectedFile: File | null = null;
  isUploading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
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
    this.cdr.detectChanges();
    
    this.requestService.getDemandeSuivi(id).subscribe({
      next: (data) => {
        console.log('✅ Données chargées:', data);
        this.demande = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.error = err.error?.message || 'Erreur lors du chargement de la demande';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    const role = this.authService.getRole();
    console.log('🔙 Retour, rôle:', role);
    
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

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileName(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || url;
  }

  downloadFile(): void {
    if (!this.demande?.fichierjustificatif) {
      alert('Aucun fichier à télécharger');
      return;
    }
    
    const fileName = this.demande.fichierjustificatif;
    const token = this.authService.getToken();
    const downloadUrl = `http://localhost:8080/api/camunda/download/${fileName}`;
    
    console.log('📥 Téléchargement depuis:', downloadUrl);
    
    this.http.get(downloadUrl, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }),
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
        console.log('✅ Téléchargement réussi');
      },
      error: (err) => {
        console.error('❌ Erreur téléchargement:', err);
        if (err.status === 404) {
          alert('Fichier non trouvé sur le serveur');
        } else if (err.status === 403) {
          alert('Accès non autorisé au fichier');
        } else {
          alert('Erreur lors du téléchargement du fichier');
        }
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      this.selectedFile = file;
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.demande) return;
    
    this.isUploading = true;
    this.cdr.detectChanges();
    
    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    
    this.requestService.uploadJustificatif(this.demande.id, formData).subscribe({
      next: () => {
        alert('✅ Justificatif ajouté avec succès');
        this.isUploading = false;
        this.loadDemande(this.demande.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur upload:', err);
        alert('❌ Erreur lors de l\'upload du justificatif');
        this.isUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvée',
      'REJECTED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatusClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'CANCELLED': 'status-cancelled'
    };
    return classes[statut] || '';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'OCCASIONAL': 'Occasionnel',
      'REGULAR': 'Régulier',
      'FULL': 'Complet'
    };
    return labels[type] || type;
  }
}
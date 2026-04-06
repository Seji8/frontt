// demande-detail.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../auth.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef  // ← AJOUTER ICI
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDemande(parseInt(id));
    }
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.cdr.detectChanges(); // ← Forcer la détection
    
    this.requestService.getDemandeSuivi(id).subscribe({
      next: (data) => {
        this.demande = data;
        this.loading = false;
        this.cdr.detectChanges(); // ← Forcer la détection après changement
        console.log('✅ Données chargées, loading =', this.loading);
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/tasks']);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR');
  }

  getFileName(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || url;
  }

  downloadFile(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.demande) return;
    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    this.requestService.uploadJustificatif(this.demande.id, formData).subscribe({
      next: () => {
        alert('Justificatif ajouté');
        this.loadDemande(this.demande.id);
      },
      error: (err) => {
        alert('Erreur lors de l\'upload');
      }
    });
  }
}
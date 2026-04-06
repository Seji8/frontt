// mes-demandes.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService, DemandeTeletravail } from '../../services/request.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mes-demandes.component.html',
  styleUrls: ['./mes-demandes.component.css']
})
export class MesDemandesComponent implements OnInit {
  demandes: DemandeTeletravail[] = [];
  loading = true;
  error = '';
  selectedDemande: DemandeTeletravail | null = null;
  showDetailModal = false;

  constructor(
    private requestService: RequestService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    this.requestService.getMyDemandes().subscribe({
      next: (data) => {
        console.log('✅ Demandes reçues:', data);
        this.demandes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.error = 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }

  voirDetail(demande: DemandeTeletravail): void {
    this.selectedDemande = demande;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedDemande = null;
  }

  nouvelleDemande(): void {
    this.router.navigate(['/requests/new']);
  }

  // ✅ Correction : Ajouter un paramètre par défaut
  getStatusLabel(statut: string | undefined): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvée',
      'REJECTED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut || ''] || statut || 'Inconnu';
  }

  // ✅ Correction : Ajouter un paramètre par défaut
  getStatusClass(statut: string | undefined): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'CANCELLED': 'status-cancelled'
    };
    return classes[statut || ''] || '';
  }

  getTypeLabel(type: string | undefined): string {
    const labels: { [key: string]: string } = {
      'OCCASIONAL': 'Occasionnel',
      'REGULAR': 'Régulier',
      'FULL': 'Complet'
    };
    return labels[type || ''] || type || 'Non spécifié';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getCommentaire(demande: DemandeTeletravail): string {
    if (demande.historiqueValidations && demande.historiqueValidations.length > 0) {
      const dernierRejet = demande.historiqueValidations.find(v => v.statut === 'REJECTED');
      if (dernierRejet && dernierRejet.commentaire) {
        return dernierRejet.commentaire;
      }
    }
    return '';
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CamundaService, DemandeTeletravail } from '../../../core/services/camunda.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-toutes-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toutes-demandes.component.html',
  styleUrls: ['./toutes-demandes.component.css']
})
export class ToutesDemandesComponent implements OnInit {
  demandes: DemandeTeletravail[] = [];
  filteredDemandes: DemandeTeletravail[] = [];
  loading = true;
  error = '';

  statusFilter: string = 'ALL';
  typeFilter: string = 'ALL';
  searchTerm: string = '';

  statusOptions = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuvée' },
    { value: 'REJECTED', label: 'Refusée' },
    { value: 'CANCELLED', label: 'Annulée' }
  ];

  typeOptions = [
    { value: 'ALL', label: 'Tous les types' },
    { value: 'OCCASIONAL', label: 'Occasionnel' },
    { value: 'REGULAR', label: 'Régulier' },
    { value: 'FULL', label: 'Complet' }
  ];

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

loadDemandes(): void {
  this.loading = true;
  this.error = '';
  this.cdr.detectChanges();

  const isChef = this.authService.isChef();
  const isAdmin = this.authService.isAdmin();
  const isRH = this.authService.isRH();

  // ✅ Chaque rôle appelle son propre endpoint
  const request$ = isChef
    ? this.camundaService.getDemandesEquipe()
    : (isAdmin || isRH)
      ? this.camundaService.getAllDemandes()
      : this.camundaService.getMyDemandes();

  request$.subscribe({
    next: (data) => {
      console.log('✅ Demandes reçues:', data.length);
      this.demandes = data;
      this.applyFilters();
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('❌ Erreur:', err);
      this.error = 'Erreur lors du chargement des demandes';
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  applyFilters(): void {
    let filtered = [...this.demandes];

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.statut === this.statusFilter);
    }

    if (this.typeFilter !== 'ALL') {
      filtered = filtered.filter(d => d.type === this.typeFilter);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.motif?.toLowerCase().includes(term) ||
        d.id?.toString().includes(term) ||
        d.utilisateurNom?.toLowerCase().includes(term)
      );
    }

    this.filteredDemandes = filtered;
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.statusFilter = 'ALL';
    this.typeFilter = 'ALL';
    this.searchTerm = '';
    this.applyFilters();
  }

  voirDetail(demande: DemandeTeletravail): void {
    this.router.navigate(['/demande', demande.id]);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
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

  getTotalCount(): number { return this.demandes.length; }
  getFilteredCount(): number { return this.filteredDemandes.length; }
}
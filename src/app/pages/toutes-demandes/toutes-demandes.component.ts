// toutes-demandes.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService, DemandeTeletravail } from '../../services/request.service';
import { AuthService } from '../../auth.service';

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
  selectedDemande: DemandeTeletravail | null = null;
  showDetailModal = false;

  // Filtres
  statusFilter: string = 'ALL';
  typeFilter: string = 'ALL';
  searchTerm: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  userFilter: string = 'ALL';
  
  availableUsers: { id: number; nom: string; email: string }[] = [];
  
  userRole: string = '';
  isAdmin: boolean = false;
  isRH: boolean = false;
  isChef: boolean = false;

  statusOptions = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuvées' },
    { value: 'REJECTED', label: 'Refusées' },
    { value: 'CANCELLED', label: 'Annulées' }
  ];

  typeOptions = [
    { value: 'ALL', label: 'Tous les types' },
    { value: 'OCCASIONAL', label: 'Occasionnel' },
    { value: 'REGULAR', label: 'Régulier' },
    { value: 'FULL', label: 'Complet' }
  ];

  constructor(
    private requestService: RequestService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
    this.loadDemandes();
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role || this.authService.getRole() || '';
        this.isAdmin = this.userRole === 'ADMIN' || this.userRole === 'admin';
        this.isRH = this.userRole === 'RH' || this.userRole === 'rh';
        this.isChef = this.userRole === 'CHEF_EQUIPE' || this.userRole === 'chef';
      } catch (e) {}
    }
  }

  loadDemandes(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    // Utiliser le même endpoint mais le backend retourne toutes les demandes selon le rôle
    this.requestService.getMyDemandes().subscribe({
      next: (data) => {
        console.log('✅ Toutes les demandes reçues:', data);
        this.demandes = data;
        this.extractAvailableUsers();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.error = 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  extractAvailableUsers(): void {
    const usersMap = new Map();
    this.demandes.forEach(demande => {
      if (demande.utilisateurId && !usersMap.has(demande.utilisateurId)) {
        usersMap.set(demande.utilisateurId, {
          id: demande.utilisateurId,
          nom: demande.utilisateurNom || `Utilisateur ${demande.utilisateurId}`,
          email: demande.utilisateurEmail || ''
        });
      }
    });
    this.availableUsers = Array.from(usersMap.values());
  }

  applyFilters(): void {
    let filtered = [...this.demandes];

    if (this.userFilter !== 'ALL') {
      const userId = parseInt(this.userFilter);
      filtered = filtered.filter(d => d.utilisateurId === userId);
    }

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.statut === this.statusFilter);
    }

    if (this.typeFilter !== 'ALL') {
      filtered = filtered.filter(d => d.type === this.typeFilter);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.motif.toLowerCase().includes(term) ||
        d.id.toString().includes(term)
      );
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(d => new Date(d.dateDebut) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(d => new Date(d.dateFin) <= toDate);
    }

    this.filteredDemandes = filtered;
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.statusFilter = 'ALL';
    this.typeFilter = 'ALL';
    this.searchTerm = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.userFilter = 'ALL';
    this.applyFilters();
  }

  voirDetail(demande: DemandeTeletravail): void {
    const demandeId=demande.id;
    if (!demandeId) {
        alert('ID de demande non trouvé');
        return;
    }
     console.log('🔍 Navigation vers détail demande:', demandeId);
        this.router.navigate(['/demande', demandeId]);
      

    }
  

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusLabel(statut: string | undefined): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvée',
      'REJECTED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut || ''] || statut || 'Inconnu';
  }

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

  getTotalCount(): number {
    return this.demandes.length;
  }

  getFilteredCount(): number {
    return this.filteredDemandes.length;
  }
}
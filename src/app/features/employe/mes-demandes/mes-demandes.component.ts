// mes-demandes.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../../core/services/request.service';
import { DemandeTeletravail } from 'src/app/core/services/camunda.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mes-demandes.component.html',
  styleUrls: ['./mes-demandes.component.css']
})
export class MesDemandesComponent implements OnInit {
  demandes: DemandeTeletravail[] = [];
  filteredDemandes: DemandeTeletravail[] = [];
  loading = true;
  error = '';
  selectedDemande: DemandeTeletravail | null = null;
  showDetailModal = false;
  showArchive = false;
selectedArchiveMonth = '';          // format 'YYYY-MM'
availableMonths: { value: string; label: string }[] = [];
private allDemandes: DemandeTeletravail[] = [];  // garde une copie complète

  statusFilter: string = 'ALL';
  typeFilter: string = 'ALL';
  searchTerm: string = '';

  userRole: string = '';
  currentUserEmail: string = '';
  currentUserId: number = 0;

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
    console.log(' MesDemandesComponent - ngOnInit');
      this.buildAvailableMonths();
    this.loadUserInfo();
    this.cdr.detectChanges();
    this.loadDemandes();
  }
  buildAvailableMonths(): void {
  const now = new Date();
  const months: { value: string; label: string }[] = [];
  for (let i = 1; i <= 12; i++) {          // 12 derniers mois
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  this.availableMonths = months;
  this.selectedArchiveMonth = months[0]?.value ?? '';
}

  loadUserInfo(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role || this.authService.getRole() || '';
        this.currentUserEmail = user.email || '';
        this.currentUserId = user.id || 0;
        console.log('👤 Utilisateur - Email:', this.currentUserEmail, 'ID:', this.currentUserId, 'Rôle:', this.userRole);
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }
  }

  loadDemandes(): void {
  console.log(' loadDemandes - DÉBUT');
  this.cdr.detectChanges();
  
  this.requestService.getMyDemandes().subscribe({
    next: (data) => {
      console.log('✅ Demandes reçues du backend:', data.length);
        this.allDemandes = data;          // on garde une copie complète
        this.applyFilters();      
      if (data.length > 0) {
        console.log('📊 Exemple de demande:', data[0]);
        console.log('📊 Propriétés disponibles:', Object.keys(data[0]));
      }
      
      // Filtrer par email
      this.demandes = data.filter(d => {
        const matchByEmail = d.utilisateurEmail === this.currentUserEmail;
        const matchById = d.utilisateurId === this.currentUserId;
        
        if (matchByEmail || matchById) {
          console.log('✅ Demande correspondante:', d.id, d.motif);
          return true;
        }
        return false;
      });
      
      console.log('📊 Demandes filtrées pour', this.currentUserEmail, ':', this.demandes.length);
      
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
      d.motif.toLowerCase().includes(term) ||
      d.id.toString().includes(term)
    );
  }

  this.filteredDemandes = filtered;  // ← Important !
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

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedDemande = null;
  }

  nouvelleDemande(): void {
    this.router.navigate(['/nouvelle-demande']);
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

  getFilteredCount(): number {
    return this.filteredDemandes.length;
  }

  getTotalCount(): number {
    return this.demandes.length;
  }
toggleArchive(): void {
  this.showArchive = !this.showArchive;
  this.applyMonthFilter();
}

onArchiveMonthChange(): void {
  this.applyMonthFilter();
}

applyMonthFilter(): void {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (this.showArchive) {
    this.demandes = this.allDemandes.filter(d => {
      if (!d.dateCreation) return false;
      const dm = d.dateCreation.substring(0, 7);   // 'YYYY-MM'
      return dm === this.selectedArchiveMonth;
    });
  } else {
    this.demandes = this.allDemandes.filter(d => {
      if (!d.dateCreation) return false;
      return d.dateCreation.substring(0, 7) === currentMonth;
    });
  }

  this.applyFilters();
  this.cdr.detectChanges();
}

getSelectedMonthLabel(): string {
  return this.availableMonths.find(m => m.value === this.selectedArchiveMonth)?.label ?? '';
}

getCurrentMonthLabel(): string {
  const now = new Date();
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
}
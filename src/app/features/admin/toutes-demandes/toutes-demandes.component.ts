// toutes-demandes.component.ts
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

  // ── Données ────────────────────────────────────────────────────────────────
  /** Copie complète de toutes les demandes reçues du backend */
  private allDemandes: DemandeTeletravail[] = [];
  /** Demandes du mois affiché (courant ou archivé) */
  demandes: DemandeTeletravail[] = [];
  /** Résultat final après filtres statut / type / recherche */
  filteredDemandes: DemandeTeletravail[] = [];

  loading = true;
  error = '';

  // ── Filtres ────────────────────────────────────────────────────────────────
  statusFilter = 'ALL';
  typeFilter   = 'ALL';
  searchTerm   = '';

  statusOptions = [
    { value: 'ALL',       label: 'Tous les statuts' },
    { value: 'PENDING',   label: 'En attente' },
    { value: 'APPROVED',  label: 'Approuvée' },
    { value: 'REJECTED',  label: 'Refusée' },
    { value: 'CANCELLED', label: 'Annulée' }
  ];

  typeOptions = [
    { value: 'ALL',        label: 'Tous les types' },
    { value: 'OCCASIONAL', label: 'Occasionnel' },
    { value: 'REGULAR',    label: 'Régulier' },
    { value: 'FULL',       label: 'Complet' }
  ];

  // ── Archives ───────────────────────────────────────────────────────────────
  showArchive          = false;
  selectedArchiveMonth = '';                              // format 'YYYY-MM'
  availableMonths: { value: string; label: string }[] = [];

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Cycle de vie ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildAvailableMonths();
    this.loadDemandes();
  }

  // ── Chargement ─────────────────────────────────────────────────────────────

  loadDemandes(): void {
    this.loading = true;
    this.error   = '';
    this.cdr.detectChanges();

    const isChef  = this.authService.isChef();
    const isAdmin = this.authService.isAdmin();
    const isRH    = this.authService.isRH();

    const request$ = isChef
      ? this.camundaService.getDemandesEquipe()
      : (isAdmin || isRH)
        ? this.camundaService.getAllDemandes()
        : this.camundaService.getMyDemandes();

    request$.subscribe({
      next: (data) => {
        console.log('✅ Demandes reçues:', data.length);
        this.allDemandes = data;          // on garde une copie complète
        this.applyMonthFilter();          // applique le filtre de mois courant
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.error   = 'Erreur lors du chargement des demandes';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Archive ────────────────────────────────────────────────────────────────

  /**
   * Construit la liste des 12 derniers mois (hors mois courant)
   * pour le sélecteur d'archives.
   */
  buildAvailableMonths(): void {
    const now    = new Date();
    const months: { value: string; label: string }[] = [];

    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const raw   = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      months.push({ value, label });
    }

    this.availableMonths    = months;
    this.selectedArchiveMonth = months[0]?.value ?? '';
  }

  /** Bascule entre le mois courant et le mode archives. */
  toggleArchive(): void {
    this.showArchive = !this.showArchive;
    this.applyMonthFilter();
  }

  /** Appelé quand l'utilisateur choisit un autre mois dans le select. */
  onArchiveMonthChange(): void {
    this.applyMonthFilter();
  }

  /**
   * Filtre `allDemandes` par mois puis appelle `applyFilters()`.
   * - Mode normal  → mois courant
   * - Mode archive → selectedArchiveMonth
   */
  applyMonthFilter(): void {
    const now          = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth  = this.showArchive ? this.selectedArchiveMonth : currentMonth;

    this.demandes = this.allDemandes.filter(d => {
      if (!d.dateCreation) return false;
      return d.dateCreation.substring(0, 7) === targetMonth;
    });

    this.applyFilters();
    this.cdr.detectChanges();
  }

  // ── Filtres combinés ───────────────────────────────────────────────────────

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
    this.typeFilter   = 'ALL';
    this.searchTerm   = '';
    this.applyFilters();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  voirDetail(demande: DemandeTeletravail): void {
    this.router.navigate(['/demande', demande.id]);
  }

  // ── Helpers d'affichage ────────────────────────────────────────────────────

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PENDING':   'En attente',
      'APPROVED':  'Approuvée',
      'REJECTED':  'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatusClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'PENDING':   'status-pending',
      'APPROVED':  'status-approved',
      'REJECTED':  'status-rejected',
      'CANCELLED': 'status-cancelled'
    };
    return classes[statut] || '';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'OCCASIONAL': 'Occasionnel',
      'REGULAR':    'Régulier',
      'FULL':       'Complet'
    };
    return labels[type] || type;
  }

  /** Label du mois sélectionné dans le select d'archives. */
  getSelectedMonthLabel(): string {
    return this.availableMonths.find(m => m.value === this.selectedArchiveMonth)?.label ?? '';
  }

  /** Label du mois courant (ex: « Mai 2025 »). */
  getCurrentMonthLabel(): string {
    const now = new Date();
    const raw = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  getTotalCount(): number    { return this.demandes.length; }
  getFilteredCount(): number { return this.filteredDemandes.length; }
}
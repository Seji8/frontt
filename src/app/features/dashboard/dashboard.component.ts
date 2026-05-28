import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CamundaService, DemandeTeletravail } from '../../core/services/camunda.service';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── User info ──
  userName = 'Utilisateur';
  userEmail = '';
  currentDate = '';
  notificationsCount = 0;

  // ── Stats ──
  totalRequests = 0;
  pendingRequests = 0;
  approvedRequests = 0;
  rejectedRequests = 0;
  pendingValidations = 0;

  // ── Admin stats ──
  totalTeams = 0;
  totalEmployees = 0;

  // ── Role flags ──
  isAdmin = false;
  isChef = false;
  isRH = false;

  // ── State ──
  loading = false;
  errorMessage = '';
  recentRequests: RecentRequest[] = [];
  recentAllDemandes: AdminRecentRequest[] = [];   // admin global feed
  teamOverview: TeamOverview[] = [];               // admin teams widget
  allDemandes: DemandeTeletravail[] = [];
  selectedPeriod: 'week' | 'month' | 'year' = 'month';

  private chart: Chart | null = null;
  private subs = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private camundaService: CamundaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    this.loadUserInfo();
    this.checkUserRoles();
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // Chart init deferred until after data loads
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.chart) this.chart.destroy();
  }

  // ── User ──

  loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.nom || user.name || user.username || 'Utilisateur';
      this.userEmail = user.email || '';
    }
    this.cdr.detectChanges();
  }

  checkUserRoles(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isChef  = this.authService.isChef();
    this.isRH    = this.authService.isRH();
  }

  // ── Data loading ──

  loadAllData(): void {
    this.loading = true;
    this.errorMessage = '';

    const sub = this.camundaService.getMyDemandes().subscribe({
      next: (demandes) => {
        this.allDemandes = demandes;
        this.computeStats(demandes);
        this.buildRecentRequests(demandes);

        // Admin-specific data
        if (this.isAdmin) {
          this.buildAdminFeed(demandes);
          this.loadTeamOverview();
        }

        this.loading = false;
        this.cdr.detectChanges();

        // Build chart after view is ready
        setTimeout(() => this.buildChart(), 0);

        // Load chef pending count if applicable
        if (this.isChef) this.loadPendingValidations();
      },
      error: (err) => {
        this.errorMessage = err.status === 403
          ? "Accès non autorisé."
          : err.error?.message || 'Erreur lors du chargement des données.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.subs.add(sub);
  }

  loadPendingValidations(): void {
    const sub = this.camundaService.getChefTasks().subscribe({
      next: (tasks) => {
        this.pendingValidations = tasks.length;
        this.notificationsCount = tasks.length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
    this.subs.add(sub);
  }

  // ── Stats ──

  computeStats(demandes: DemandeTeletravail[]): void {
    this.totalRequests    = demandes.length;
    this.pendingRequests  = demandes.filter(d => d.statut === 'PENDING').length;
    this.approvedRequests = demandes.filter(d => d.statut === 'APPROVED').length;
    this.rejectedRequests = demandes.filter(d => d.statut === 'REJECTED').length;
  }

  buildRecentRequests(demandes: DemandeTeletravail[]): void {
    this.recentRequests = [...demandes]
      .sort((a, b) => {
        const da = new Date(a.dateCreation || 0).getTime();
        const db = new Date(b.dateCreation || 0).getTime();
        return db - da;
      })
      .slice(0, 5)
      .map(d => ({
        id: d.id,
        motif: d.motif || 'Non spécifié',
        dateCreation: d.dateCreation
          ? new Date(d.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '—',
        statut: d.statut,
        statutLabel: this.getStatusLabel(d.statut),
        type: this.getTypeLabel(d.type)
      }));
  }

  // ── Admin feed ──

  buildAdminFeed(demandes: DemandeTeletravail[]): void {
    this.recentAllDemandes = [...demandes]
      .sort((a, b) => new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime())
      .slice(0, 8)
      .map(d => {
        const name = (d as any).employeeName || (d as any).nomEmploye || 'Inconnu';
        const parts = name.trim().split(' ');
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
        return {
          id: d.id,
          employeeName: name,
          employeeInitials: initials,
          motif: d.motif || 'Non spécifié',
          dateCreation: d.dateCreation
            ? new Date(d.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '—',
          statut: d.statut,
          statutLabel: this.getStatusLabel(d.statut),
          type: this.getTypeLabel(d.type)
        };
      });
  }

  loadTeamOverview(): void {
    // Replace with your actual teams service call, e.g.:
    // this.equipeService.getEquipes().subscribe(teams => {
    //   this.teamOverview = teams.map(t => ({
    //     name: t.nom,
    //     initials: t.nom.slice(0, 2).toUpperCase(),
    //     chefName: t.chef?.nom || '',
    //     memberCount: t.membres?.length || 0
    //   }));
    //   this.totalTeams = this.teamOverview.length;
    //   this.totalEmployees = this.teamOverview.reduce((acc, t) => acc + t.memberCount, 0);
    //   this.cdr.detectChanges();
    // });
    this.teamOverview = [];
    this.totalTeams = 0;
    this.totalEmployees = 0;
  }

  // ── Chart ──

  onChartPeriodChange(event: Event): void {
    this.selectedPeriod = (event.target as HTMLSelectElement).value as 'week' | 'month' | 'year';
    this.buildChart();
  }

  buildChart(): void {
    const ctx = document.getElementById('requestsChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const { labels, approved, rejected, pending } = this.getChartDataForPeriod(this.selectedPeriod);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Approuvées',
            data: approved,
            backgroundColor: 'rgba(5, 150, 105, 0.15)',
            borderColor: '#059669',
            borderWidth: 1.5,
            borderRadius: 5,
          },
          {
            label: 'Refusées',
            data: rejected,
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            borderColor: '#dc2626',
            borderWidth: 1.5,
            borderRadius: 5,
          },
          {
            label: 'En attente',
            data: pending,
            backgroundColor: 'rgba(217, 119, 6, 0.12)',
            borderColor: '#d97706',
            borderWidth: 1.5,
            borderRadius: 5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#94a3b8' }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0, font: { size: 11 }, color: '#94a3b8' },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      }
    });
  }

  private getChartDataForPeriod(period: 'week' | 'month' | 'year'): ChartDataset {
    const now = new Date();

    if (period === 'week') {
      const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const approved = new Array(7).fill(0);
      const rejected = new Array(7).fill(0);
      const pending  = new Array(7).fill(0);

      // Get start of current week (Monday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);

      this.allDemandes.forEach(d => {
        if (!d.dateCreation) return;
        const date = new Date(d.dateCreation);
        const diffDays = Math.floor((date.getTime() - startOfWeek.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 7) {
          if (d.statut === 'APPROVED') approved[diffDays]++;
          else if (d.statut === 'REJECTED') rejected[diffDays]++;
          else if (d.statut === 'PENDING') pending[diffDays]++;
        }
      });

      return { labels, approved, rejected, pending };
    }

    if (period === 'month') {
      const weeks = ['S1', 'S2', 'S3', 'S4', 'S5'];
      const approved = new Array(5).fill(0);
      const rejected = new Array(5).fill(0);
      const pending  = new Array(5).fill(0);

      const year = now.getFullYear();
      const month = now.getMonth();

      this.allDemandes.forEach(d => {
        if (!d.dateCreation) return;
        const date = new Date(d.dateCreation);
        if (date.getFullYear() !== year || date.getMonth() !== month) return;
        const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 4);
        if (d.statut === 'APPROVED') approved[weekIndex]++;
        else if (d.statut === 'REJECTED') rejected[weekIndex]++;
        else if (d.statut === 'PENDING') pending[weekIndex]++;
      });

      return { labels: weeks, approved, rejected, pending };
    }

    // year
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const approved = new Array(12).fill(0);
    const rejected = new Array(12).fill(0);
    const pending  = new Array(12).fill(0);

    this.allDemandes.forEach(d => {
      if (!d.dateCreation) return;
      const date = new Date(d.dateCreation);
      if (date.getFullYear() !== now.getFullYear()) return;
      const m = date.getMonth();
      if (d.statut === 'APPROVED') approved[m]++;
      else if (d.statut === 'REJECTED') rejected[m]++;
      else if (d.statut === 'PENDING') pending[m]++;
    });

    return { labels: monthLabels, approved, rejected, pending };
  }

  // ── Helpers ──

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      OCCASIONAL: 'Occasionnel',
      REGULAR: 'Régulier',
      FULL: 'Complet',
      PARTIAL: 'Partiel'
    };
    return labels[type] || type || '—';
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée'
    };
    return labels[statut] || statut || '—';
  }

  getApprovalRate(): number {
    if (!this.totalRequests) return 0;
    return Math.round((this.approvedRequests / this.totalRequests) * 100);
  }

  getProcessingRate(): number {
    if (!this.totalRequests) return 0;
    return Math.round(((this.approvedRequests + this.rejectedRequests) / this.totalRequests) * 100);
  }

  // ── Navigation ──

  newRequest(): void           { this.router.navigate(['/nouvelle-demande']); }
  viewRequests(): void         { this.router.navigate(['/mes-demandes']); }
  manageUsers(): void          { this.router.navigate(['/users']); }
  validateRequests(): void     { this.router.navigate(['/chef/tasks']); }
  viewAllRequests(): void      { this.router.navigate(['/toutes-les-demandes']); }
  manageTeams(): void          { this.router.navigate(['/equipes']); }
  viewAudit(): void            { this.router.navigate(['/audit']); }
  viewRequestDetail(id: number): void { this.router.navigate(['/mes-demandes'], { queryParams: { id } }); }
  refresh(): void              { this.loadAllData(); }
}

// ── Interfaces ──

interface RecentRequest {
  id: number;
  motif: string;
  dateCreation: string;
  statut: string;
  statutLabel: string;
  type: string;
}

interface AdminRecentRequest {
  id: number;
  employeeName: string;
  employeeInitials: string;
  motif: string;
  dateCreation: string;
  statut: string;
  statutLabel: string;
  type: string;
}

interface TeamOverview {
  name: string;
  initials: string;
  chefName: string;
  memberCount: number;
}

interface ChartDataset {
  labels: string[];
  approved: number[];
  rejected: number[];
  pending: number[];
}
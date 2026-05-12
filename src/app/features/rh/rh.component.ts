import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CamundaService, DemandeTeletravail } from '../../core/services/camunda.service';

@Component({
  selector: 'app-rh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rh.component.html',
  styleUrls: ['./rh.component.css']
})
export class RhComponent implements OnInit {
  demandes: DemandeTeletravail[] = [];
  filteredDemandes: DemandeTeletravail[] = []; // ✅ cached, not recomputed every cycle
  loading = false;
  error = '';

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },     { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre'},{ value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre'},{ value: 12, label: 'Décembre' }
  ];

  years: number[] = [];

  // Stats
  totalDemandes = 0;
  approvedDemandes = 0;
  rejectedDemandes = 0;
  pendingDemandes = 0;
  cancelledDemandes = 0; // ✅ was missing
  tauxTeletravail = 0;
  tauxSurSite = 0;
  statsParEquipe: { equipe: string; total: number; approved: number; taux: number }[] = [];

  constructor(
    private camundaService: CamundaService, // ✅ use CamundaService (has auth headers)
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear; y++) {
      this.years.push(y);
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.camundaService.getAllDemandes().subscribe({
      next: (data) => {
        this.demandes = data;
        this.computeStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des données. Vérifiez votre connexion.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  computeStats(): void {
    // ✅ Single filter, shared everywhere
    this.filteredDemandes = this.demandes.filter(d => {
      if (!d.dateCreation) return false;
      const date = new Date(d.dateCreation);
      return date.getMonth() + 1 === this.selectedMonth &&
             date.getFullYear() === this.selectedYear;
    });

    const filtered = this.filteredDemandes;
    this.totalDemandes     = filtered.length;
    this.approvedDemandes  = filtered.filter(d => d.statut === 'APPROVED').length;
    this.rejectedDemandes  = filtered.filter(d => d.statut === 'REJECTED').length;
    this.pendingDemandes   = filtered.filter(d => d.statut === 'PENDING').length;
    this.cancelledDemandes = filtered.filter(d => d.statut === 'CANCELLED').length;

    this.tauxTeletravail = this.totalDemandes > 0
      ? Math.round((this.approvedDemandes / this.totalDemandes) * 100) : 0;
    this.tauxSurSite = 100 - this.tauxTeletravail;

    // Stats par équipe
    const equipeMap = new Map<string, { total: number; approved: number }>();
    filtered.forEach(d => {
      const equipe = d.utilisateurEquipe || 'Non assignée';
      if (!equipeMap.has(equipe)) equipeMap.set(equipe, { total: 0, approved: 0 });
      const stats = equipeMap.get(equipe)!;
      stats.total++;
      if (d.statut === 'APPROVED') stats.approved++;
    });

    this.statsParEquipe = Array.from(equipeMap.entries())
      .map(([equipe, stats]) => ({
        equipe,
        total: stats.total,
        approved: stats.approved,
        taux: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.taux - a.taux); // ✅ sorted by rate descending
  }

  onFilterChange(): void {
    this.computeStats();
  }

  getMonthLabel(): string {
    return this.months.find(m => m.value === this.selectedMonth)?.label || '';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'OCCASIONAL': 'Occasionnel',
      'REGULAR': 'Régulier',
      'FULL': 'Complet'
    };
    return labels[type] || type || '-';
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvée',
      'REJECTED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut] || statut || '-';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  generatePDF(): void {
    const monthLabel = this.getMonthLabel();
    const now = new Date();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport Télétravail - ${monthLabel} ${this.selectedYear}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
          .header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
          .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
          .header p { font-size: 13px; opacity: 0.8; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
          .stat-card .value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
          .stat-card .label { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
          .approved .value { color: #059669; } .rejected .value { color: #dc2626; }
          .pending .value { color: #d97706; } .cancelled .value { color: #64748b; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 16px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 16px; }
          .taux-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .taux-card { border-radius: 10px; padding: 24px; text-align: center; }
          .taux-card.teletravail { background: #ecfdf5; border: 1px solid #a7f3d0; }
          .taux-card.sursite { background: #eff6ff; border: 1px solid #bfdbfe; }
          .taux-card .pct { font-size: 48px; font-weight: 700; }
          .teletravail .pct { color: #059669; } .sursite .pct { color: #2563eb; }
          .bar-container { margin-bottom: 12px; }
          .bar-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
          .bar-track { background: #f1f5f9; border-radius: 999px; height: 10px; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #059669, #34d399); }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f8fafc; padding: 8px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0; }
          td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #4b5563; }
          .badge-approved { background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .badge-rejected { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .badge-pending  { background: #fffbeb; color: #d97706; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .badge-cancelled{ background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Rapport Mensuel Télétravail</h1>
          <p>Période : ${monthLabel} ${this.selectedYear}</p>
          <span class="badge">Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="value">${this.totalDemandes}</div><div class="label">Total</div></div>
          <div class="stat-card approved"><div class="value">${this.approvedDemandes}</div><div class="label">Approuvées</div></div>
          <div class="stat-card rejected"><div class="value">${this.rejectedDemandes}</div><div class="label">Refusées</div></div>
          <div class="stat-card pending"><div class="value">${this.pendingDemandes}</div><div class="label">En attente</div></div>
          <div class="stat-card cancelled"><div class="value">${this.cancelledDemandes}</div><div class="label">Annulées</div></div>
        </div>

        <div class="section">
          <h2>Taux de présence</h2>
          <div class="taux-container">
            <div class="taux-card teletravail"><div class="pct">${this.tauxTeletravail}%</div><div>🏠 En télétravail</div></div>
            <div class="taux-card sursite"><div class="pct">${this.tauxSurSite}%</div><div>🏢 Sur site</div></div>
          </div>
        </div>

        ${this.statsParEquipe.length > 0 ? `
        <div class="section">
          <h2>Statistiques par équipe</h2>
          ${this.statsParEquipe.map(e => `
            <div class="bar-container">
              <div class="bar-label"><span>${e.equipe}</span><span>${e.approved}/${e.total} approuvées — ${e.taux}%</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:${e.taux}%"></div></div>
            </div>`).join('')}
        </div>` : ''}

        <div class="section">
          <h2>Détail des demandes (${this.filteredDemandes.length})</h2>
          <table>
            <thead><tr><th>#</th><th>Employé</th><th>Équipe</th><th>Type</th><th>Date début</th><th>Date fin</th><th>Statut</th></tr></thead>
            <tbody>
              ${this.filteredDemandes.map(d => `
                <tr>
                  <td>${d.id}</td>
                  <td>${d.utilisateurNom || '-'}</td>
                  <td>${d.utilisateurEquipe || '-'}</td>
                  <td>${this.getTypeLabel(d.type)}</td>
                  <td>${this.formatDate(d.dateDebut)}</td>
                  <td>${this.formatDate(d.dateFin)}</td>
                  <td><span class="badge-${d.statut?.toLowerCase()}">${this.getStatusLabel(d.statut)}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">Rapport généré automatiquement par RemoteFlow — ${now.getFullYear()}</div>
      </body>
      </html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }
  }
}
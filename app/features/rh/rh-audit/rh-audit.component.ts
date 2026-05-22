import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLog, AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-rh-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rh-audit.component.html',
  styleUrls: ['./rh-audit.component.css']
})
export class RhAuditComponent implements OnInit {

  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  loading = false;
  error = '';

  // Filters
  selectedAction = '';
  searchUser = '';
  fromDate = '';
  toDate = '';


actions = [
  { value: '',                label: 'Toutes les actions'      },
  { value: 'CREATE_DEMANDE',  label: 'Création demande'        },
  { value: 'APPROVE_DEMANDE', label: 'Approbation demande'     },
  { value: 'REJECT_DEMANDE',  label: 'Refus demande'           },
  { value: 'CREATE_USER',     label: 'Création utilisateur'    },
  { value: 'UPDATE_USER',     label: 'Modification utilisateur'},
  { value: 'DELETE_USER',     label: 'Suppression utilisateur' },
];

// Summary counts
get totalLogs()          { return this.filteredLogs.length; }
get createDemandeCount() { return this.filteredLogs.filter(l => l.action === 'CREATE_DEMANDE').length; }
get approveCount()       { return this.filteredLogs.filter(l => l.action === 'APPROVE_DEMANDE').length; }
get rejectCount()        { return this.filteredLogs.filter(l => l.action === 'REJECT_DEMANDE').length; }
  constructor(
    private auditService: AuditService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';

    const filters: any = {};
    if (this.selectedAction) filters.action = this.selectedAction;
    if (this.fromDate) filters.from = new Date(this.fromDate).toISOString();
    if (this.toDate) {
      const to = new Date(this.toDate);
      to.setHours(23, 59, 59);
      filters.to = to.toISOString();
    }

    this.auditService.getLogs(filters).subscribe({
      next: (data) => {
        this.logs = data;
        this.applyLocalFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des logs d\'audit.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyLocalFilter(): void {
    const search = this.searchUser.toLowerCase().trim();
    this.filteredLogs = this.logs.filter(log => {
      if (!search) return true;
      return (
        (log.userName?.toLowerCase().includes(search)) ||
        (log.userEmail?.toLowerCase().includes(search)) ||
        (log.details?.toLowerCase().includes(search))
      );
    });
  }

  onFilterChange(): void {
    this.loadLogs();
  }

  onSearchChange(): void {
    this.applyLocalFilter();
  }

  resetFilters(): void {
    this.selectedAction = '';
    this.searchUser = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadLogs();
  }

getActionLabel(action: string): string {
  const map: Record<string, string> = {
    'CREATE_DEMANDE':  'Création',
    'APPROVE_DEMANDE': 'Approuvée',
    'REJECT_DEMANDE':  'Refusée',
    'CREATE_USER':     'Création user',
    'UPDATE_USER':     'Modification user',
    'DELETE_USER':     'Suppression user',
  };
  return map[action] || action;
}

getActionClass(action: string): string {
  const map: Record<string, string> = {
    'CREATE_DEMANDE':  'action-create',
    'APPROVE_DEMANDE': 'action-update',
    'REJECT_DEMANDE':  'action-delete',
    'CREATE_USER':     'action-create',
    'UPDATE_USER':     'action-update',
    'DELETE_USER':     'action-delete',
  };
  return map[action] || 'action-other';
}

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  exportCSV(): void {
    const header = ['ID', 'Date', 'Action', 'Utilisateur', 'Email', 'Détails'];
    const rows = this.filteredLogs.map(l => [
      l.id,
      this.formatDate(l.date),
      l.action,
      l.userName || '-',
      l.userEmail || '-',
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

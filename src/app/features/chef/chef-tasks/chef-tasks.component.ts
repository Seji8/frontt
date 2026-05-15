import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// PrimeNG
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { CamundaService, Task } from '../../../core/services/camunda.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-chef-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [
    ConfirmationService,
    MessageService,
  ],
  templateUrl: './chef-tasks.component.html',
  styleUrls: ['./chef-tasks.component.css']
})
export class ChefTasksComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];
  loading = false;
  errorMessage = '';
  scores: { [key: number]: any } = {};

  selectedTask: Task | null = null;
  showDetailModal = false;
  rejectReason = '';

  /** Tracks the task currently being actioned so we can show a spinner on its buttons */
  processingTaskId: string | null = null;

  private subs = new Subscription();

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  loadScores(tasks: Task[]): void {
  tasks.forEach(task => {
    if (task.demandeId) {
      this.camundaService.getScoreDemande(task.demandeId).subscribe({
        next: (score) => {
          this.scores = { ...this.scores, [task.demandeId!]: score };
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  });
}

  // ── Data ──────────────────────────────────────────────────

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';

    const sub = this.camundaService.getChefTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
        this.loadScores(tasks);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.status === 403
          ? "Vous n'avez pas les droits pour accéder à cette page."
          : error.error?.message || 'Erreur lors du chargement des tâches';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.subs.add(sub);
  }

  refresh(): void {
    this.loadTasks();
  }
getScore(demandeId: number | undefined): any {
  if (!demandeId) return null;
  return this.scores[demandeId] ?? null;
}
  // ── Modal ─────────────────────────────────────────────────

  openDetailModal(task: Task): void {
    this.selectedTask = task;
    this.rejectReason = '';
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedTask = null;
    this.rejectReason = '';
    this.cdr.detectChanges();
  }

  viewDemandeDetail(task: Task): void {
    if (!task.demandeId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Introuvable',
        detail: 'Aucun ID de demande associé à cette tâche.',
        life: 4000,
      });
      return;
    }
    this.router.navigate(['/chef/demande', task.demandeId]);
  }

  // ── Approve ───────────────────────────────────────────────

  approveTask(task: Task): void {
    if (confirm(`Approuver la demande de ${task.utilisateurNom || task.name} ?`)) {
      this.camundaService.approveTask(task.id, 'Approuvé par chef').subscribe({
        next: () => {
          alert('✅ Demande approuvée');
          this.scores = {};
          this.loadTasks();
        },
        error: (error) => {
          alert('❌ Erreur: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  private doApprove(task: Task): void {
    this.processingTaskId = task.id;

    const sub = this.camundaService.approveTask(task.id, 'Approuvé par le chef').subscribe({
      next: () => {
        this.processingTaskId = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Demande approuvée',
          detail: `La demande de ${task.utilisateurNom || task.name} a été approuvée.`,
          life: 4000,
        });
        this.loadTasks();
        this.closeDetailModal();
      },
      error: (err) => {
        this.processingTaskId = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Impossible d\'approuver la demande.',
          life: 5000,
        });
        this.cdr.detectChanges();
      }
    });

    this.subs.add(sub);
  }


   rejectTask(task: Task): void {
    if (confirm(`Rejeter la demande de ${task.utilisateurNom || task.name} ?`)) {
      const raison = prompt('Motif du rejet :');
      if (raison) {
        this.camundaService.rejectTask(task.id, raison).subscribe({
          next: () => {
            alert('❌ Demande rejetée');
            this.scores = {};
            this.loadTasks();
          },
          error: (error) => {
            alert('❌ Erreur: ' + (error.error?.error || error.message));
          }
        });
      }
    }
  }

  // ── Reject with reason (from modal) ──────────────────────

  rejectTaskWithReason(): void {
    if (!this.selectedTask) return;

    if (!this.rejectReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Motif requis',
        detail: 'Veuillez saisir un motif de rejet avant de continuer.',
        life: 4000,
      });
      return;
    }

    const task = this.selectedTask;

    this.confirmationService.confirm({
      header: 'Confirmer le rejet',
      message: `Rejeter la demande de <strong>${task.utilisateurNom || task.name}</strong> ?<br><em>${this.rejectReason}</em>`,
      icon: 'pi pi-times-circle',
      acceptLabel: 'Rejeter',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.doReject(task, this.rejectReason);
      }
    });
  }

  private doReject(task: Task, reason: string): void {
    this.processingTaskId = task.id;

    const sub = this.camundaService.rejectTask(task.id, reason).subscribe({
      next: () => {
        this.processingTaskId = null;
        this.messageService.add({
          severity: 'info',
          summary: 'Demande rejetée',
          detail: `La demande de ${task.utilisateurNom || task.name} a été rejetée.`,
          life: 4000,
        });
        this.loadTasks();
        this.closeDetailModal();
      },
      error: (err) => {
        this.processingTaskId = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Impossible de rejeter la demande.',
          life: 5000,
        });
        this.cdr.detectChanges();
      }
    });

    this.subs.add(sub);
  }

  // ── Helpers ───────────────────────────────────────────────

  isProcessing(taskId: string): boolean {
    return this.processingTaskId === taskId;
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Non définie';
    try {
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }

  formatDateShort(date: string | undefined): string {
    if (!date) return 'Non définie';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  }
}
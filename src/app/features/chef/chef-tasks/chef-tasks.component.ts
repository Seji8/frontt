import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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

  // 👉 cache des scores
  scores: Record<number, any> = {};

  selectedTask: Task | null = null;
  showDetailModal = false;
  rejectReason = '';

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

  // ───────────────────────── TASKS ─────────────────────────

  loadTasks(): void {
  this.loading = true;
  this.errorMessage = '';

  this.camundaService.getChefTasks().subscribe({
    next: (tasks) => {
      this.tasks = tasks;
      this.loading = false;

      // reset + reload scores proprement
      this.loadScores(tasks);

      setTimeout(() => {
        this.loadScores(tasks);
      }, 100);

      this.cdr.detectChanges();
    },
    error: (error) => {
      this.errorMessage =
        error.status === 403
          ? "Accès refusé"
          : error.error?.message || 'Erreur';

      this.loading = false;
    }
  });
}

  refresh(): void {
    this.loadTasks();
  }

  // ───────────────────────── SCORES ─────────────────────────

 loadScores(tasks: Task[]): void {
  tasks.forEach(task => {
    if (!task.demandeId) return;

    this.camundaService.getScoreDemande(task.demandeId).subscribe({
      next: (res) => {

        this.scores = {
          ...this.scores,
          [task.demandeId!]: { ...res }
        };

        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  });
}

  getScore(demandeId: number | undefined): any {
    if (!demandeId) return null;
    return this.scores[demandeId] ?? null;
  }

  // ───────────────────────── DETAILS ─────────────────────────

  openDetailModal(task: Task): void {
    this.selectedTask = task;
    this.rejectReason = '';
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.selectedTask = null;
    this.showDetailModal = false;
    this.rejectReason = '';
  }

  viewDemandeDetail(task: Task): void {
    if (!task.demandeId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Introuvable',
        detail: 'Aucun ID de demande associé.',
      });
      return;
    }

    this.router.navigate(['/chef/demande', task.demandeId]);
  }

  // ───────────────────────── APPROVE ─────────────────────────
refreshScore(demandeId: number) {

  this.camundaService.getScoreDemande(demandeId).subscribe({

    next: (res) => {

      console.log("🔥 SCORE API =", res);

      this.scores = {
        ...this.scores,
        [demandeId]: { ...res }
      };

      console.log("🔥 SCORES CACHE =", this.scores);

      this.cdr.detectChanges();
    },

    error: (err) => console.error(err)
  });
}
  approveTask(task: Task): void {
  this.camundaService.approveTask(task.id, 'Approuvé par chef').subscribe({
    next: () => {

      this.messageService.add({
        severity: 'success',
        summary: 'Approuvé',
        detail: 'Demande validée'
      });

      // 🔥 refresh SCORE d'abord
      if (task.demandeId) {
        delete this.scores[task.demandeId];
      }

      // 🔥 puis reload tasks avec petit delay
      setTimeout(() => {
        this.loadTasks();
      }, 300);

    },
    error: (err) => console.error(err)
  });
  
}

  private doApprove(task: Task): void {
    this.processingTaskId = task.id;

    const sub = this.camundaService.approveTask(task.id, 'Approuvé par chef')
      .subscribe({
        next: () => {
          this.processingTaskId = null;

          this.messageService.add({
            severity: 'success',
            summary: 'Approuvé',
            detail: 'Demande approuvée avec succès'
          });

          this.loadTasks();
        },
        error: () => {
          this.processingTaskId = null;
        }
      });
      

    this.subs.add(sub);
  }

  // ───────────────────────── REJECT ─────────────────────────

 rejectTask(task: Task): void {
  const reason = prompt('Motif du rejet :');
  if (!reason) return;

  this.camundaService.rejectTask(task.id, reason).subscribe({
    next: () => {

      this.messageService.add({
        severity: 'info',
        summary: 'Rejeté',
        detail: 'Demande rejetée'
      });

      if (task.demandeId) {
        delete this.scores[task.demandeId];
      }

      setTimeout(() => {
        this.loadTasks();
      }, 300);

    },
    error: (err) => console.error(err)
  });
}

  // ───────────────────────── HELPERS ─────────────────────────

  isProcessing(taskId: string): boolean {
    return this.processingTaskId === taskId;
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Non définie';

    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CamundaService, Task } from '../../../core/services/camunda.service';
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tasks.component.html',
  styleUrls: ['./admin-tasks.component.css']
})
export class AdminTasksComponent implements OnInit {
  tasks: Task[] = [];
  scores: { [key: number]: any } = {};
  loading = false;
  errorMessage = '';

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadTasks(); }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.scores = {};
    this.camundaService.getAdminTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
        this.loadScores(tasks);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.status === 403
          ? "Accès refusé — rôle ADMIN requis."
          : 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

  getScore(demandeId: number | undefined): any {
    if (!demandeId) return null;
    return this.scores[demandeId] ?? null;
  }

  viewDemandeDetail(task: Task): void {
    if (!task.demandeId) { alert('ID de demande non trouvé'); return; }
    this.router.navigate(['/admin/demande', task.demandeId]);
  }

  approveTask(task: Task): void {
    if (confirm(`Approuver la demande de ${task.utilisateurNom || task.name} ?`)) {
      this.camundaService.approveTask(task.id, 'Approuvé par admin').subscribe({
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR');
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}
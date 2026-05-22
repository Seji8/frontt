import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CamundaService, Task } from '../../../core/services/camunda.service';
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chef-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chef-tasks.component.html',
  styleUrls: ['./chef-tasks.component.css']
})
export class ChefTasksComponent implements OnInit {
  tasks: Task[] = [];
  loading = false;
  errorMessage = '';
  selectedTask: Task | null = null;
  showDetailModal = false;
  rejectReason = '';

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.camundaService.getChefTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
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
  }

  viewDemandeDetail(task: Task): void {
    if (!task.demandeId) {
      alert('ID de demande non trouvé');
      return;
    }
    this.router.navigate(['/chef/demande', task.demandeId]);
  }

  openDetailModal(task: Task): void {
    this.selectedTask = task;
    this.showDetailModal = true;
    this.rejectReason = '';
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedTask = null;
    this.rejectReason = '';
    this.cdr.detectChanges();
  }

  approveTask(task: Task): void {
    if (confirm(`Approuver la demande de ${task.utilisateurNom || task.name} ?`)) {
      this.camundaService.approveTask(task.id, 'Approuvé par le chef').subscribe({
        next: () => {
          alert('✅ Demande approuvée avec succès');
          this.loadTasks();
          this.closeDetailModal();
        },
        error: () => alert('❌ Erreur lors de l\'approbation')
      });
    }
  }

  rejectTask(task: Task): void {
    const raison = prompt('Motif du rejet :');
    if (raison?.trim()) {
      this.camundaService.rejectTask(task.id, raison).subscribe({
        next: () => {
          alert('❌ Demande rejetée');
          this.loadTasks();
          this.closeDetailModal();
        },
        error: () => alert('❌ Erreur lors du rejet')
      });
    }
  }

  rejectTaskWithReason(): void {
    if (this.selectedTask && this.rejectReason.trim()) {
      this.camundaService.rejectTask(this.selectedTask.id, this.rejectReason).subscribe({
        next: () => {
          alert('❌ Demande rejetée');
          this.loadTasks();
          this.closeDetailModal();
        },
        error: () => alert('❌ Erreur lors du rejet')
      });
    } else {
      alert('Veuillez saisir un motif de rejet');
    }
  }

  // Méthodes de formatage sécurisées
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

  refresh(): void {
    this.loadTasks();
  }
}
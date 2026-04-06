// src/app/components/chef-tasks/chef-tasks.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CamundaService, Task } from '../../services/camunda.service';
import { AuthService } from '../../auth.service';

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
  
  // Formulaire nouvelle demande
  showRequestForm = false;
  requestMotif = '';
  requestDateDebut = '';
  requestDateFin = '';
  requestType = 'OCCASIONAL';
  
  types = [
    { value: 'OCCASIONAL', label: 'Occasionnel' },
    { value: 'REGULAR', label: 'Régulier' },
    { value: 'FULL', label: 'Complet' }
  ];

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.errorMessage = '';
    
    console.log('📥 Chargement des tâches...');
    console.log('👤 Rôle:', this.authService.getRole());
    
    this.camundaService.getMyTasks().subscribe({
      next: (tasks) => {
        console.log('✅ Tâches reçues:', tasks);
        this.tasks = tasks;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des tâches';
        this.loading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          this.errorMessage = 'Vous n\'avez pas les droits pour accéder à cette page.';
        }
      }
    });
  }

  startNewRequest(): void {
    this.showRequestForm = true;
    this.requestMotif = '';
    this.requestDateDebut = '';
    this.requestDateFin = '';
    this.requestType = 'OCCASIONAL';
  }

  submitRequest(): void {
    if (!this.requestMotif) {
      alert('Veuillez entrer un motif');
      return;
    }
    if (!this.requestDateDebut || !this.requestDateFin) {
      alert('Veuillez entrer les dates');
      return;
    }

    
    this.camundaService.createDemande(
      this.requestMotif,
      this.requestDateDebut,
      this.requestDateFin,
      this.requestType
    ).subscribe({
      next: (response) => {
        console.log('✅ Demande créée:', response);
        alert('Demande de télétravail créée avec succès');
        this.showRequestForm = false;
        this.loading = false;
        this.loadTasks(); // Recharger les tâches
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        alert('Erreur lors de la création: ' + (error.error?.error || error.message));
        this.loading = false;
      }
    });
  }

  cancelRequest(): void {
    this.showRequestForm = false;
  }

  approveTask(task: Task): void {
    if (confirm(`Approuver la demande "${task.name}" ?`)) {
      this.camundaService.approveTask(task.id, 'Approuvé par le chef').subscribe({
        next: () => {
          alert('✅ Demande approuvée avec succès');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Erreur approbation:', error);
          alert('❌ Erreur lors de l\'approbation');
        }
      });
    }
  }

  rejectTask(task: Task): void {
    if (confirm(`Rejeter la demande "${task.name}" ?`)) {
      this.camundaService.rejectTask(task.id, 'Rejeté par le chef').subscribe({
        next: () => {
          alert('❌ Demande rejetée');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Erreur rejet:', error);
          alert('❌ Erreur lors du rejet');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR');
  }
}
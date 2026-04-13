// src/app/components/chef-tasks/chef-tasks.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CamundaService, Task } from '../../services/camunda.service';
import { AuthService } from '../../auth.service';
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
    this.cdr.detectChanges();
    
    console.log('📥 Chargement des tâches chef...');
    
    this.camundaService.getChefTasks().subscribe({
      next: (tasks) => {
        console.log('✅ Tâches reçues:', tasks);
        this.tasks = tasks;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des tâches';
        this.loading = false;
        this.cdr.detectChanges();
        
        if (error.status === 401) {
          this.errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          this.errorMessage = 'Vous n\'avez pas les droits pour accéder à cette page.';
        }
      }
    });
  }

  // ✅ Naviguer vers la page de détail au lieu du modal
  // chef-tasks.component.ts
viewDemandeDetail(task: Task): void {
  const demandeId = task.demandeId;
  if (!demandeId) {
    alert('ID de demande non trouvé');
    return;
  }
  
  console.log('🔍 Navigation vers détail demande:', demandeId);
  // ✅ Utiliser la route générique ou chef/demande
   this.router.navigate(['/chef/demande', demandeId]);
}

  approveTask(task: Task): void {
    if (confirm(`Approuver la demande "${task.motif || task.name}" ?`)) {
      this.cdr.detectChanges();
      
      this.camundaService.approveTask(task.id, 'Approuvé par le chef').subscribe({
        next: () => {
          alert('✅ Demande approuvée avec succès');
          this.loadTasks();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur approbation:', error);
          alert('❌ Erreur lors de l\'approbation');
          this.cdr.detectChanges();
        }
      });
    }
  }

  rejectTask(task: Task): void {
    const raison = prompt('Motif du rejet :');
    if (raison) {
      this.cdr.detectChanges();
      
      this.camundaService.rejectTask(task.id, raison).subscribe({
        next: () => {
          alert('❌ Demande rejetée');
          this.loadTasks();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur rejet:', error);
          alert('❌ Erreur lors du rejet');
          this.cdr.detectChanges();
        }
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
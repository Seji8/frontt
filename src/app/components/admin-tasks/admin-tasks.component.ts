// admin-tasks.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CamundaService, Task } from '../../services/camunda.service';
import { AuthService } from '../../auth.service';
import { RequestService } from '../../services/request.service';
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
  loading = false;
  errorMessage = '';
  
  // Pour le modal de détail
  showDetailModal = false;
  selectedDemande: any = null;
  loadingDetail = false;
  selectedFile: File | null = null;

  constructor(
    private camundaService: CamundaService,
    private authService: AuthService,
    private requestService: RequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    console.log('📥 Chargement des tâches admin...');
    
    this.camundaService.getAdminTasks().subscribe({
      next: (tasks) => {
        console.log('✅ Tâches admin reçues:', tasks);
        this.tasks = tasks;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.errorMessage = 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  // Voir le détail de la demande
  viewDemandeDetail(task: Task): void {
  const demandeId = task.demandeId;
  if (!demandeId) {
    alert('ID de demande non trouvé');
    return;
  }
  // Navigation vers la page de détail
  this.router.navigate(['/admin/demande', demandeId]);
}

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedDemande = null;
    this.selectedFile = null;
  }

  // Sélectionner un fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Upload de fichier pour la demande
  uploadJustificatif(): void {
    if (!this.selectedFile || !this.selectedDemande) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    formData.append('demandeId', this.selectedDemande.id);

    this.requestService.uploadJustificatif(this.selectedDemande.id, formData).subscribe({
      next: () => {
        alert('✅ Justificatif ajouté avec succès');
        this.closeDetailModal();
        this.loadTasks();
      },
      error: (error) => {
        console.error('❌ Erreur upload:', error);
        alert('Erreur lors de l\'upload');
      }
    });
  }

  approveTask(task: Task): void {
    if (confirm(`Approuver la demande "${task.name}" ?`)) {
      this.camundaService.approveTask(task.id, 'Approuvé par admin').subscribe({
        next: () => {
          alert('✅ Demande approuvée');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de l\'approbation');
        }
      });
    }
  }

  rejectTask(task: Task): void {
    if (confirm(`Rejeter la demande "${task.name}" ?`)) {
      const raison = prompt('Motif du rejet :');
      if (raison) {
        this.camundaService.rejectTask(task.id, raison).subscribe({
          next: () => {
            alert('❌ Demande rejetée');
            this.loadTasks();
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors du rejet');
          }
        });
      }
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR');
  }

  getFileName(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || url;
  }

  downloadFile(url: string): void {
    window.open(url, '_blank');
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RequestService, DemandeTeletravail } from '../../services/request.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit {
  requests: DemandeTeletravail[] = [];
  loading = true;
  error = '';
  success = '';
  showForm = false;
  editingId: number | null = null;
  requestForm: FormGroup;

  selectedFile: File | null = null;
  fileName: string = '';

  types = ['OCCASIONAL', 'REGULAR', 'FULL'];
  statuses = ['PENDING', 'APPROVED', 'REJECTED'];

  constructor(
    private requestService: RequestService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.requestForm = this.fb.group({
      motif: ['', [Validators.required, Validators.minLength(5)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      type: ['OCCASIONAL', Validators.required],
      fichierjustificatif: ['']
    });
  }

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.error = '';

    this.requestService.getAllRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load requests';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Nouvelle méthode pour gérer la sélection du fichier
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
      console.log('Fichier sélectionné:', file.name);
    }
  }

  // Nouvelle méthode pour supprimer le fichier
  removeFile() {
    this.selectedFile = null;
    this.fileName = '';
  }

  openForm() {
    this.showForm = true;
    this.editingId = null;
    this.requestForm.reset({ type: 'OCCASIONAL' });
    this.selectedFile = null;
    this.fileName = '';
  }

  closeForm() {
    this.showForm = false;
    this.requestForm.reset();
    this.selectedFile = null;
    this.fileName = '';
  }

  editRequest(request: DemandeTeletravail) {
    this.editingId = request.id || null;
    
    // Formater les dates pour l'affichage (si nécessaire)
    const dateDebut = this.formatDateForDisplay(request.dateDebut);
    const dateFin = this.formatDateForDisplay(request.dateFin);
    
    this.requestForm.patchValue({
      motif: request.motif,
      dateDebut: dateDebut,
      dateFin: dateFin,
      type: request.type,
      fichierjustificatif: request.fichierjustificatif
    });
    this.fileName = request.fichierjustificatif || '';
    this.selectedFile = null; // On ne peut pas récupérer le fichier original
    this.showForm = true;
  }

  // Formater la date pour le backend (MM/DD/YYYY → YYYY-MM-DDThh:mm:ss)
  formatDateForBackend(date: string): string {
    if (!date) return '';
    
    console.log('Date originale:', date);
    
    // Si la date est au format MM/DD/YYYY (venant du input)
    if (date.includes('/')) {
      const parts = date.split('/');
      // parts[0] = MM, parts[1] = DD, parts[2] = YYYY
      return `${parts[2]}-${parts[0]}-${parts[1]}T00:00:00`;
    }
    
    // Si la date est au format YYYY-MM-DD
    if (date.includes('-') && date.length === 10) {
      return `${date}T00:00:00`;
    }
    
    return date;
  }

  // Formater pour l'affichage (YYYY-MM-DDThh:mm:ss → MM/DD/YYYY)
  formatDateForDisplay(date: string): string {
    if (!date) return '';
    
    // Enlever l'heure si présente
    if (date.includes('T')) {
      date = date.split('T')[0];
    }
    
    // Convertir YYYY-MM-DD en MM/DD/YYYY
    if (date.includes('-')) {
      const parts = date.split('-');
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    
    return date;
  }

  onSubmit() {
    if (this.requestForm.invalid) {
      return;
    }

    this.error = '';
    this.success = '';
    this.loading = true;

    // CRÉER FORMDATA (PAS UN OBJET JSON)
    const formData = new FormData();
    
    // Ajouter les champs texte
    formData.append('motif', this.requestForm.get('motif')?.value);
    
    // Formater les dates correctement pour le backend
    const dateDebut = this.formatDateForBackend(this.requestForm.get('dateDebut')?.value);
    const dateFin = this.formatDateForBackend(this.requestForm.get('dateFin')?.value);
    
    console.log('Dates formatées pour backend:', dateDebut, dateFin);
    
    formData.append('dateDebut', dateDebut);
    formData.append('dateFin', dateFin);
    formData.append('type', this.requestForm.get('type')?.value);
    
    // Ajouter le fichier si sélectionné
    if (this.selectedFile) {
      formData.append('fichier', this.selectedFile, this.selectedFile.name);
      console.log('Fichier ajouté:', this.selectedFile.name);
    }

    // DEBUG : Voir le contenu de FormData
    console.log('Contenu de FormData:');
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    if (this.editingId) {
      this.requestService.updateRequest(this.editingId, formData).subscribe({
        next: (response) => {
          console.log('Succès mise à jour:', response);
          this.success = 'Request updated successfully';
          this.closeForm();
          this.loadRequests();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur mise à jour:', err);
          this.error = err.error?.message || 'Failed to update request';
          this.loading = false;
        }
      });
    } else {
      this.requestService.createRequest(formData).subscribe({
        next: (response) => {
          console.log('Succès création:', response);
          this.success = 'Request created successfully';
          this.closeForm();
          this.loadRequests();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.error = err.error?.message || 'Failed to create request';
          this.loading = false;
        }
      });
    }
  }

  approveRequest(id: number) {
    this.requestService.approveRequest(id).subscribe({
      next: () => {
        this.success = 'Request approved successfully';
        this.loadRequests();
      },
      error: (err) => {
        this.error = 'Failed to approve request';
        console.error(err);
      }
    });
  }

  rejectRequest(id: number) {
    this.requestService.rejectRequest(id).subscribe({
      next: () => {
        this.success = 'Request rejected successfully';
        this.loadRequests();
      },
      error: (err) => {
        this.error = 'Failed to reject request';
        console.error(err);
      }
    });
  }

  deleteRequest(id: number) {
    if (confirm('Are you sure you want to delete this request?')) {
      this.requestService.deleteRequest(id).subscribe({
        next: () => {
          this.success = 'Request deleted successfully';
          this.loadRequests();
        },
        error: (err) => {
          this.error = 'Failed to delete request';
          console.error(err);
        }
      });
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isRH(): boolean {
    return this.authService.isRH();
  }

  isChef(): boolean {
    return this.authService.isChef();
  }

  canApprove(request: DemandeTeletravail): boolean {
    return (this.isRH() || this.isChef() || this.isAdmin()) && request.statut === 'PENDING';
  }
}
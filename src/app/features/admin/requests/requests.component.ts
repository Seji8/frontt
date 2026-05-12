import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RequestService, DemandeTeletravail, ValidationResponse } from '../../../core/services/request.service';
import { AuthService } from '../../../core/auth.service';

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

  // Pour le suivi
  showSuivi = false;
  selectedDemande: DemandeTeletravail | null = null;
  loadingSuivi = false;

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

  // ==================== CHARGEMENT DES DEMANDES ====================

  loadRequests() {
    this.loading = true;
    this.error = '';

    console.log('Rôle:', this.authService.getRole());
    console.log('Admin:', this.isAdmin());
    console.log('Chef:', this.isChef());

    if (this.isAdmin()) {
      console.log('Chargement toutes demandes');
      this.requestService.getAllRequests().subscribe({
        next: (requests) => {
          this.requests = requests;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load requests';
          this.loading = false;
        }
      });
    } else if (this.isChef()) {
      console.log('Chargement demandes équipe');
      this.requestService.getMyRequests().subscribe({
        next: (requests) => {
          this.requests = requests;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load team requests';
          this.loading = false;
        }
      });
    } else {
      console.log('Chargement mes demandes');
      this.requestService.getMyRequests().subscribe({
        next: (requests) => {
          this.requests = requests;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load my requests';
          this.loading = false;
        }
      });
    }
  }

  // ==================== SUIVI ====================

  voirSuivi(id: number) {
    this.showSuivi = true;
    this.loadingSuivi = true;
    this.selectedDemande = null;
    
    this.requestService.getDemandeSuivi(id).subscribe({
      next: (demande) => {
        this.selectedDemande = demande;
        this.loadingSuivi = false;
      },
      error: (err) => {
        this.error = 'Failed to load request details';
        this.loadingSuivi = false;
      }
    });
  }

  closeSuivi() {
    this.showSuivi = false;
    this.selectedDemande = null;
  }

  getValidationByEtape(etape: number): ValidationResponse | undefined {
    if (!this.selectedDemande?.historiqueValidations) return undefined;
    return this.selectedDemande.historiqueValidations.find(v => v.etape === etape);
  }

  getValidationByRole(role: string): ValidationResponse | undefined {
    if (!this.selectedDemande?.historiqueValidations) return undefined;
    return this.selectedDemande.historiqueValidations.find(v => v.validateurRole === role);
  }

  // ==================== GESTION DU FICHIER ====================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileName = '';
  }

  // ==================== FORMULAIRE ====================

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
    this.selectedFile = null;
    this.showForm = true;
  }

  // ==================== FORMATAGE DES DATES ====================

  formatDateForBackend(date: string): string {
    if (!date) return '';
    if (date.includes('/')) {
      const parts = date.split('/');
      return `${parts[2]}-${parts[0]}-${parts[1]}T00:00:00`;
    }
    if (date.includes('-') && date.length === 10) {
      return `${date}T00:00:00`;
    }
    return date;
  }

  formatDateForDisplay(date: string): string {
    if (!date) return '';
    if (date.includes('T')) date = date.split('T')[0];
    if (date.includes('-')) {
      const parts = date.split('-');
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return date;
  }

  // ==================== SOUMISSION ====================

  onSubmit() {
    if (this.requestForm.invalid) return;

    this.error = '';
    this.success = '';
    this.loading = true;

    const formData = new FormData();
    formData.append('motif', this.requestForm.get('motif')?.value);
    formData.append('dateDebut', this.formatDateForBackend(this.requestForm.get('dateDebut')?.value));
    formData.append('dateFin', this.formatDateForBackend(this.requestForm.get('dateFin')?.value));
    formData.append('type', this.requestForm.get('type')?.value);
    
    if (this.selectedFile) {
      formData.append('fichier', this.selectedFile);
    }

    if (this.editingId) {
      this.requestService.updateRequest(this.editingId, formData).subscribe({
        next: () => {
          this.success = 'Request updated successfully';
          this.closeForm();
          this.loadRequests();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update request';
          this.loading = false;
        }
      });
    } else {
      this.requestService.createRequest(formData).subscribe({
        next: () => {
          this.success = 'Request created successfully';
          this.closeForm();
          this.loadRequests();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create request';
          this.loading = false;
        }
      });
    }
  }

  // ==================== ACTIONS ====================

  approveRequest(id: number) {
  const request = this.requests.find(r => r.id === id);
  if (request && request.statut !== 'PENDING') {
    this.success = `Request is already ${request.statut}`;
    return;
  }
  
  this.requestService.approveRequest(id).subscribe({
    next: () => {
      this.success = 'Request approved successfully';
      this.loadRequests();
    },
    error: (err) => {
      if (err.error?.message === 'Vous avez déjà validé cette demande') {
        this.loadRequests();
        this.success = 'Request already processed';
      } else {
        this.error = err.error?.message || 'Failed to approve request';
      }
    }
  });
}

rejectRequest(id: number) {
  const request = this.requests.find(r => r.id === id);
  if (request && request.statut !== 'PENDING') {
    this.success = `Request is already ${request.statut}`;
    return;
  }
  
  this.requestService.rejectRequest(id).subscribe({
    next: () => {
      this.success = 'Request rejected successfully';
      this.loadRequests();
    },
    error: (err) => {
      if (err.error?.message === 'Vous avez déjà validé cette demande') {
        this.loadRequests();
        this.success = 'Request already processed';
      } else {
        this.error = err.error?.message || 'Failed to reject request';
      }
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
        }
      });
    }
  }

  // ==================== UTILITAIRES ====================

  getRoleLabel(role: string | undefined): string {
    if (!role) return '-';
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrator',
      'CHEF_EQUIPE': 'Team Leader',
      'RH': 'HR',
      'EMPLOYE': 'Employee'
    };
    return labels[role] || role;
  }

  getStatusLabel(statut: string | undefined): string {
    if (!statut) return '-';
    const labels: { [key: string]: string } = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };
    return labels[statut] || statut;
  }

  getTypeLabel(type: string | undefined): string {
    if (!type) return '-';
    const labels: { [key: string]: string } = {
      'OCCASIONAL': 'Occasional',
      'REGULAR': 'Regular',
      'FULL': 'Full Time'
    };
    return labels[type] || type;
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

  isEmployee(): boolean {
    return this.authService.getRole() === 'EMPLOYE';
  }

  canApprove(request: DemandeTeletravail): boolean {
    return (this.isAdmin() || this.isChef()) && request.statut === 'PENDING';
  }

  canSeeSuivi(request: DemandeTeletravail): boolean {
    return this.isAdmin() || this.isChef() || request.utilisateurId === this.getCurrentUserId();
  }

  getCurrentUserId(): number {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : 0;
  }

  getValidationStatusText(etape: number): string {
    const validation = this.getValidationByEtape(etape);
    if (!validation) return 'Pending';
    if (validation.statut === 'APPROVED') return 'Approved';
    if (validation.statut === 'REJECTED') return 'Rejected';
    return 'Pending';
  }

  getValidationIcon(etape: number): string {
    const validation = this.getValidationByEtape(etape);
    if (!validation) return '⏳';
    if (validation.statut === 'APPROVED') return '✓';
    if (validation.statut === 'REJECTED') return '✗';
    return '⏳';
  }

  isLastStep(etape: number): boolean {
    return etape === 2;
  }

  getStepClass(etape: number): string {
    const validation = this.getValidationByEtape(etape);
    if (!validation) return 'pending';
    if (validation.statut === 'APPROVED') return 'approved';
    if (validation.statut === 'REJECTED') return 'rejected';
    return 'pending';
  }
}
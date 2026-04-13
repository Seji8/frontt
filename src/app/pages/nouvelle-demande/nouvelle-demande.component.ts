import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-nouvelle-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './nouvelle-demande.component.html',
  styleUrls: ['./nouvelle-demande.component.css']
})
export class NouvelleDemandeComponent implements OnInit {
  requestForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  
  selectedFile: File | null = null;
  fileName: string = '';
  
  requestTypes = [
    { value: 'OCCASIONAL', label: 'Occasionnelle' },
    { value: 'REGULAR', label: 'Régulière' },
    { value: 'FULL', label: 'Complet' }
  ];

  // ✅ Empêcher les dates passées
  minDate: string = '';

  constructor(
    private fb: FormBuilder,
    private requestService: RequestService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.requestForm = this.fb.group({
      motif: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      type: ['OCCASIONAL', Validators.required],
      fichierjustificatif: ['']
    });
  }

  ngOnInit(): void {
    // ✅ Définir la date minimale à aujourd'hui
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // ✅ Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      
      // ✅ Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format de fichier non supporté. Utilisez PDF, JPG, PNG ou DOC');
        return;
      }
      
      this.selectedFile = file;
      this.fileName = file.name;
      this.cdr.detectChanges();
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileName = '';
    this.cdr.detectChanges();
  }

  formatDateForBackend(date: string): string {
    if (!date) return '';
    if (date.includes('/')) {
      const parts = date.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`;
    }
    if (date.includes('-') && date.length === 10) {
      return `${date}T00:00:00`;
    }
    return date;
  }

  onSubmit() {
    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach(key => {
        this.requestForm.get(key)?.markAsTouched();
      });
      this.cdr.detectChanges();
      return;
    }

    // ✅ Vérification supplémentaire des dates
    if (!this.isDateValid()) {
      this.error = 'La date de fin doit être postérieure à la date de début';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.success = '';
    this.loading = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('motif', this.requestForm.get('motif')?.value);
    formData.append('dateDebut', this.formatDateForBackend(this.requestForm.get('dateDebut')?.value));
    formData.append('dateFin', this.formatDateForBackend(this.requestForm.get('dateFin')?.value));
    formData.append('type', this.requestForm.get('type')?.value);
    
    if (this.selectedFile) {
      formData.append('fichier', this.selectedFile);
    }

    console.log('📤 Envoi de la demande:', {
      motif: this.requestForm.get('motif')?.value,
      dateDebut: this.formatDateForBackend(this.requestForm.get('dateDebut')?.value),
      dateFin: this.formatDateForBackend(this.requestForm.get('dateFin')?.value),
      type: this.requestForm.get('type')?.value,
      fichier: this.selectedFile?.name || 'Aucun'
    });

    this.requestService.createRequest(formData).subscribe({
      next: (response) => {
        console.log('✅ Demande créée avec succès:', response);
        this.success = 'Votre demande a été créée avec succès !';
        this.loading = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.router.navigate(['/mes-demandes']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la création:', err);
        this.error = err.error?.message || err.error?.error || 'Erreur lors de la création de la demande';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel() {
    this.router.navigate(['/mes-demandes']);
  }

  isDateValid(): boolean {
    const dateDebut = this.requestForm.get('dateDebut')?.value;
    const dateFin = this.requestForm.get('dateFin')?.value;
    
    if (!dateDebut || !dateFin) return true;
    
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    
    return fin >= debut;
  }
}
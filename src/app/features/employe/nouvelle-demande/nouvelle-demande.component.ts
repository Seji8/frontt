import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../../core/services/request.service';
import { AuthService } from '../../../core/auth.service';

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
  minDate: string = '';
  
  requestTypes = [
    { value: 'OCCASIONAL', label: 'Occasionnelle' },
    { value: 'REGULAR', label: 'Régulière' },
    { value: 'FULL', label: 'Complet' }
  ];

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
    this.minDate = new Date().toISOString().split('T')[0];

    // When type changes
    this.requestForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'OCCASIONAL') {
        const dateDebut = this.requestForm.get('dateDebut')?.value;
        if (dateDebut) {
          this.requestForm.get('dateFin')?.setValue(dateDebut);
        }
        this.requestForm.get('dateFin')?.disable();
      } else {
        this.requestForm.get('dateFin')?.enable();
      }
      this.cdr.detectChanges();
    });

    // When dateDebut changes
    this.requestForm.get('dateDebut')?.valueChanges.subscribe(dateDebut => {
      if (this.requestForm.get('type')?.value === 'OCCASIONAL') {
        this.requestForm.get('dateFin')?.setValue(dateDebut);
        this.requestForm.get('dateFin')?.disable();
      }
      this.cdr.detectChanges();
    });

    // Default type is OCCASIONAL so disable dateFin on init
    this.requestForm.get('dateFin')?.disable();

    this.cdr.detectChanges();
  }

  get isOccasional(): boolean {
    return this.requestForm.get('type')?.value === 'OCCASIONAL';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
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

  isDateValid(): boolean {
    const raw = this.requestForm.getRawValue();
    const dateDebut = raw.dateDebut;
    const dateFin = raw.dateFin;
    if (!dateDebut || !dateFin) return true;
    return new Date(dateFin) >= new Date(dateDebut);
  }

  onSubmit() {
    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach(key => {
        this.requestForm.get(key)?.markAsTouched();
      });
      this.cdr.detectChanges();
      return;
    }

    if (!this.isDateValid()) {
      this.error = 'La date de fin doit être postérieure à la date de début';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.success = '';
    this.loading = true;
    this.cdr.detectChanges();

    // getRawValue() includes disabled fields (dateFin when OCCASIONAL)
    const rawValues = this.requestForm.getRawValue();

    const formData = new FormData();
    formData.append('motif', rawValues.motif);
    formData.append('dateDebut', this.formatDateForBackend(rawValues.dateDebut));
    formData.append('dateFin', this.formatDateForBackend(rawValues.dateFin));
    formData.append('type', rawValues.type);
    if (this.selectedFile) {
      formData.append('fichier', this.selectedFile);
    }

    this.requestService.createRequest(formData).subscribe({
      next: (response) => {
        console.log('✅ Demande créée avec succès:', response);
        this.success = 'Votre demande a été créée avec succès !';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/mes-demandes']), 2000);
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
}
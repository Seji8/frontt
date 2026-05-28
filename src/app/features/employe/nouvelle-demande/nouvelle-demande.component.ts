import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../../core/services/request.service';
import { AuthService } from '../../../core/auth.service';
import { DemandeTeletravail } from 'src/app/core/services/camunda.service';

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

  /** Only the current user's active demands — used for duplicate detection */
  existingDemandes: DemandeTeletravail[] = [];
  existingDemandesLoaded = false;

  duplicateConflict: DemandeTeletravail | null = null;

  requestTypes = [
    { value: 'OCCASIONAL', label: 'Occasionnelle' },
    { value: 'REGULAR',    label: 'Régulière'     },
    { value: 'FULL',       label: 'Complet'        }
  ];

  private currentUserEmail = '';
  private currentUserId    = 0;

  // ── Calendar fields ──────────────────────────────────────────────────────
  dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  private readonly DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  private readonly MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  calendarDays: { num: number; isRemote: boolean; isSelected: boolean; otherMonth: boolean }[] = [];
  remoteCount = 0;

  constructor(
    private fb:             FormBuilder,
    private requestService: RequestService,
    private authService:    AuthService,
    private router:         Router,
    private cdr:            ChangeDetectorRef
  ) {
    this.requestForm = this.fb.group({
      motif:               ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      dateDebut:           ['', Validators.required],
      dateFin:             ['', Validators.required],
      type:                ['OCCASIONAL', Validators.required],
      fichierjustificatif: ['']
    });
  }

  ngOnInit(): void {

  const today = new Date();

const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');

this.minDate = `${yyyy}-${mm}-${dd}`;
  // ===== USER =====
  const user = this.authService.getCurrentUser();

  if (user) {
    this.currentUserEmail = user.email ?? '';
    this.currentUserId    = user.id ?? 0;
  }

  console.log(
    '👤 Current user — email:',
    this.currentUserEmail,
    'id:',
    this.currentUserId
  );

  // ===== LOAD DEMANDES =====
  this.loadExistingDemandes();

  // =========================================================
  // TYPE CHANGES
  // =========================================================
  this.requestForm.get('type')?.valueChanges.subscribe(type => {

    const dateDebut = this.requestForm.get('dateDebut')?.value;

    if (type === 'OCCASIONAL') {

  if (dateDebut) {

    this.requestForm.get('dateFin')?.setValue(
      dateDebut,
      { emitEvent: false }
    );

  }

  

      this.requestForm.get('dateFin')?.disable();

    }

    else if (type === 'REGULAR') {

  this.requestForm.get('dateFin')?.enable();

  if (dateDebut) {

    const start = new Date(dateDebut + 'T00:00:00');

    const lastDayOfMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0
    );

    let lastOccurrence = new Date(start);

    const current = new Date(start);

    while (current <= lastDayOfMonth) {

      if (current.getDay() === start.getDay()) {
        lastOccurrence = new Date(current);
      }

      current.setDate(current.getDate() + 1);

    }

    const yyyy = lastOccurrence.getFullYear();
    const mm = String(lastOccurrence.getMonth() + 1).padStart(2, '0');
    const dd = String(lastOccurrence.getDate()).padStart(2, '0');

    const formattedDate = `${yyyy}-${mm}-${dd}`;

    this.requestForm.get('dateFin')?.setValue(
      formattedDate,
      { emitEvent: false }
    );

    this.buildCalendar(dateDebut);

  }

}

    // ===== FULL =====
    else {

      this.requestForm.get('dateFin')?.enable();

    }

    this.checkDuplicate();
    this.cdr.detectChanges();

  });

  // =========================================================
  // DATE DEBUT CHANGES
  // =========================================================
  this.requestForm.get('dateDebut')?.valueChanges.subscribe(dateDebut => {

    const type = this.requestForm.get('type')?.value;

    // ===== OCCASIONAL =====
    if (type === 'OCCASIONAL') {

      this.requestForm.get('dateFin')?.setValue(
        dateDebut,
        { emitEvent: false }
      );

      this.requestForm.get('dateFin')?.disable();

    }

    // ===== REGULAR =====
    else if (type === 'REGULAR') {

      this.requestForm.get('dateFin')?.enable();

      if (dateDebut) {

        const start = new Date(dateDebut + 'T00:00:00');

        // dernier jour du mois
        const lastDayOfMonth = new Date(
          start.getFullYear(),
          start.getMonth() + 1,
          0
        );

        let lastOccurrence = new Date(start);

        const current = new Date(start);

        while (current <= lastDayOfMonth) {

          if (current.getDay() === start.getDay()) {
            lastOccurrence = new Date(current);
          }

          current.setDate(current.getDate() + 1);

        }

        this.requestForm.get('dateFin')?.setValue(
          
          { emitEvent: false }
        );

        this.buildCalendar(dateDebut);

      }

    }

    // ===== FULL =====
    else {

      this.requestForm.get('dateFin')?.enable();

    }

    this.checkDuplicate();
    this.cdr.detectChanges();

  });

  // =========================================================
  // DATE FIN CHANGES
  // =========================================================
  this.requestForm.get('dateFin')?.valueChanges.subscribe(() => {

    this.checkDuplicate();
    this.cdr.detectChanges();

  });

  // ===== DEFAULT =====
  if (this.requestForm.get('type')?.value === 'OCCASIONAL') {
    this.requestForm.get('dateFin')?.disable();
  }

  this.cdr.detectChanges();

}

  // ── Load & filter to current user ─────────────────────────────────────────
  private loadExistingDemandes(): void {
    this.requestService.getMyDemandes().subscribe({
      next: (data) => {
        console.log('📦 Raw demands from backend:', data.length, data);

        // Keep only demands that belong to this user
        this.existingDemandes = data.filter(d => {
          const byEmail = this.currentUserEmail && d.utilisateurEmail === this.currentUserEmail;
          const byId    = this.currentUserId    && d.utilisateurId    === this.currentUserId;
          return byEmail || byId;
        });

        // If nothing matched the filter, assume the endpoint already scopes
        // to the current user and use all results
        if (this.existingDemandes.length === 0 && data.length > 0) {
          console.warn('⚠️  User filter produced 0 results — using all returned demands');
          this.existingDemandes = data;
        }

        this.existingDemandesLoaded = true;
        console.log('✅ existingDemandes for duplicate check:', this.existingDemandes.length, this.existingDemandes);

        // Re-run check now that data is loaded (user may have already filled dates)
        this.checkDuplicate();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Could not load existing demands:', err);
        this.existingDemandesLoaded = true; // don't block the form
      }
    });
  }

  // ── Core duplicate logic ──────────────────────────────────────────────────
  checkDuplicate(): void {
    const raw = this.requestForm.getRawValue();
    const { type, dateDebut, dateFin } = raw;

    if (!type || !dateDebut || !dateFin) {
      this.duplicateConflict = null;
      return;
    }

    const ACTIVE = ['PENDING', 'APPROVED'];
    const start  = new Date(dateDebut);
    const end    = new Date(dateFin);

    console.log(`🔍 Checking duplicate — type:${type} ${dateDebut}→${dateFin} against ${this.existingDemandes.length} demands`);

    const conflict = this.existingDemandes.find(d => {
      if (!ACTIVE.includes(d.statut)) return false;
      if (d.type !== type)            return false;

      const dStart = new Date(d.dateDebut.substring(0, 10));
      const dEnd   = new Date(d.dateFin.substring(0, 10));

      // ===== REGULAR =====
if (type === 'REGULAR') {

  // compare uniquement le jour de semaine
  const newDay = start.getDay();
  const oldDay = dStart.getDay();

  // pas le même jour => pas conflit
  if (newDay !== oldDay) {
    return false;
  }

}

// chevauchement normal
const overlaps = !(end < dStart || start > dEnd);

return overlaps;
    });

    this.duplicateConflict = conflict ?? null;
    console.log('🚦 Conflict result:', this.duplicateConflict ? `#${this.duplicateConflict.id}` : 'none');
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  get hasDuplicate(): boolean { return this.duplicateConflict !== null; }

  get isOccasional(): boolean {
  return this.requestForm.get('type')?.value === 'OCCASIONAL';
}

  get isRegular(): boolean { return this.requestForm.get('type')?.value === 'REGULAR'; }

  // ── Calendar helpers ───────────────────────────────────────────────────────
  getWeekdayLabel(): string {
    const d = this.requestForm.getRawValue().dateDebut;
    if (!d) return '';
    return this.DAYS_FR[new Date(d + 'T00:00:00').getDay()];
  }

  getMonthLabel(): string {
    const d = this.requestForm.getRawValue().dateDebut;
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return this.MONTHS_FR[date.getMonth()] + ' ' + date.getFullYear();
  }

 buildCalendar(dateStr: string): void {
  const chosen      = new Date(dateStr + 'T00:00:00');
  const dow         = chosen.getDay();
  const year        = chosen.getFullYear();
  const month       = chosen.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const days: { num: number; isRemote: boolean; isSelected: boolean; otherMonth: boolean }[] = [];

  // Previous-month padding
  for (let i = 0; i < firstDay; i++) {
    days.push({ num: daysInPrev - firstDay + i + 1, isRemote: false, isSelected: false, otherMonth: true });
  }

  // Current month
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const isRemote   = new Date(year, month, d).getDay() === dow && d >= chosen.getDate();
    const isSelected = d === chosen.getDate();
    if (isRemote) count++;
    days.push({ num: d, isRemote, isSelected, otherMonth: false });
  }

  // Next-month padding
  const remaining = 42 - firstDay - daysInMonth;
  for (let i = 1; i <= remaining; i++) {
    days.push({ num: i, isRemote: false, isSelected: false, otherMonth: true });
  }

  this.calendarDays = days;
  this.remoteCount  = count;
  this.cdr.detectChanges();
}
  // ── File handling ─────────────────────────────────────────────────────────
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 5 Mo');
      return;
    }
    const allowed = [
      'application/pdf', 'image/jpeg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowed.includes(file.type)) {
      alert('Format non supporté. Utilisez PDF, JPG, PNG ou DOC');
      return;
    }
    this.selectedFile = file;
    this.fileName     = file.name;
    this.cdr.detectChanges();
  }

  removeFile() {
    this.selectedFile = null;
    this.fileName     = '';
    this.cdr.detectChanges();
  }

  // ── Date helpers ──────────────────────────────────────────────────────────
  private formatDateForBackend(date: string): string {
    if (!date) return '';
    const d = date.substring(0, 10);
    return `${d}T00:00:00`;
  }

  isDateValid(): boolean {
    const { dateDebut, dateFin } = this.requestForm.getRawValue();
    if (!dateDebut || !dateFin) return true;
    return new Date(dateFin) >= new Date(dateDebut);
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = { OCCASIONAL: 'Occasionnelle', REGULAR: 'Régulière', FULL: 'Complète' };
    return map[type] ?? type;
  }

  getStatusLabel(statut: string): string {
    const map: Record<string, string> = { PENDING: 'en attente', APPROVED: 'approuvée' };
    return map[statut] ?? statut;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit() {
    this.checkDuplicate();

    if (this.hasDuplicate) {
      this.error = 'Une demande similaire existe déjà pour cette période. Veuillez consulter vos demandes existantes.';
      this.cdr.detectChanges();
      return;
    }

    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach(k => this.requestForm.get(k)?.markAsTouched());
      this.cdr.detectChanges();
      return;
    }

    if (!this.isDateValid()) {
      this.error = 'La date de fin doit être postérieure à la date de début';
      this.cdr.detectChanges();
      return;
    }

    this.error   = '';
    this.success = '';
    this.loading = true;
    this.cdr.detectChanges();

    const raw      = this.requestForm.getRawValue();
const formData = new FormData();

formData.append('motif', raw.motif);
formData.append('type', raw.type);

// ===== DEMANDE RÉGULIÈRE =====
if (raw.type === 'REGULAR') {

  const start = new Date(raw.dateDebut + 'T00:00:00');

  // dernier jour du mois
  const lastDayOfMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0
  );

  let lastOccurrence = new Date(start);

  // cherche le dernier même jour (vendredi etc.)
  const current = new Date(start);

  while (current <= lastDayOfMonth) {

    if (current.getDay() === start.getDay()) {
      lastOccurrence = new Date(current);
    }

    current.setDate(current.getDate() + 1);
  }

  formData.append(
    'dateDebut',
    this.formatDateForBackend(raw.dateDebut)
  );

  const yyyy = lastOccurrence.getFullYear();
const mm = String(lastOccurrence.getMonth() + 1).padStart(2, '0');
const dd = String(lastOccurrence.getDate()).padStart(2, '0');

const finalDate = `${yyyy}-${mm}-${dd}`;

formData.append(
  'dateFin',
  this.formatDateForBackend(finalDate)
);

} else {

  // ===== DEMANDE NORMALE =====
  formData.append(
    'dateDebut',
    this.formatDateForBackend(raw.dateDebut)
  );

  formData.append(
    'dateFin',
    this.formatDateForBackend(raw.dateFin)
  );
}

if (this.selectedFile) {
  formData.append('fichier', this.selectedFile);
}
    this.requestService.createRequest(formData).subscribe({
      next: (response) => {
        console.log('✅ Demande créée:', response);
        this.success = 'Votre demande a été créée avec succès !';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/mes-demandes']), 2000);
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.error   = err.error?.message || err.error?.error || 'Erreur lors de la création';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel() { this.router.navigate(['/mes-demandes']); }
}
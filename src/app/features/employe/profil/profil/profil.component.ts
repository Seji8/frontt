// mon-profil.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { UserService, User, UpdateUserRequest } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/auth.service';

// ── Custom validator: passwords must match if filled ──────────
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  if (pw && cpw && pw !== cpw) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class MonProfilComponent implements OnInit {

  currentUser: User | null = null;
  profilForm!: FormGroup;
  loading = false;
  error   = '';
  success = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCurrentUser();
  }

  // ── Build reactive form ──────────────────────────────────────
  private buildForm(): void {
    this.profilForm = this.fb.group(
      {
        nom:             ['', [Validators.required, Validators.minLength(2)]],
        email:           ['', [Validators.required, Validators.email]],
        matricule:       [''],
        telephone:       [''],
        adresse:         [''],
        ville:           [''],
        password:        [''],
        confirmPassword: [''],
      },
      { validators: passwordMatchValidator }
    );
  }

  // ── Load current logged-in user ──────────────────────────────
  // Uses GET /auth/me — accessible to ALL roles, no ADMIN needed.
  // Falls back to localStorage if the request fails.
  loadCurrentUser(): void {
    this.authService.getCurrentUserInfo().subscribe({
      next: (user: User) => {
        this.currentUser = user;
        this.patchForm(user);
      },
      error: (err: any) => {
        console.error('Erreur chargement profil via /auth/me:', err);
        // Fallback: use data already stored at login
        const stored = this.authService.getCurrentUser();
        if (stored) {
          this.currentUser = stored;
          this.patchForm(stored);
        } else {
          this.error = 'Impossible de charger vos informations.';
        }
      }
    });
  }

  // ── Patch form with user data ────────────────────────────────
  private patchForm(user: User): void {
    this.profilForm.patchValue({
      nom:       user.nom       ?? '',
      email:     user.email     ?? '',
      matricule: user.matricule ?? '',
      telephone: user.telephone ?? '',
      adresse:   user.adresse   ?? '',
      ville:     user.ville     ?? '',
    });
  }

  // ── Submit ───────────────────────────────────────────────────
  onSubmit(): void {
    if (this.profilForm.invalid) {
      this.profilForm.markAllAsTouched();
      return;
    }

    const stored = this.authService.getCurrentUser();
    if (!stored?.id) return;

    this.loading = true;
    this.error   = '';
    this.success = '';

    const payload: UpdateUserRequest = {
      nom:       this.profilForm.get('nom')?.value,
      email:     this.profilForm.get('email')?.value,
      matricule: this.profilForm.get('matricule')?.value,
      telephone: this.profilForm.get('telephone')?.value,
      adresse:   this.profilForm.get('adresse')?.value,
      ville:     this.profilForm.get('ville')?.value,
    };

    const pw = this.profilForm.get('password')?.value;
    if (pw) payload.password = pw;

   this.userService.updateMyProfile(payload).subscribe({
  next: (updated: User) => {
    this.currentUser = updated;
    this.success = 'Profil mis à jour avec succès.';
    this.loading = false;
    this.profilForm.patchValue({ password: '', confirmPassword: '' });
  },
  error: (err: any) => {
    this.error = err?.error ?? 'Échec de la mise à jour.';
    this.loading = false;
  }
});
  }

  // ── Reset form to current user data ─────────────────────────
  resetForm(): void {
    if (this.currentUser) this.patchForm(this.currentUser);
    this.profilForm.patchValue({ password: '', confirmPassword: '' });
    this.profilForm.markAsUntouched();
    this.error   = '';
    this.success = '';
  }

  // ── Avatar initials helper ───────────────────────────────────
  getInitials(): string {
    const name = this.currentUser?.nom ?? this.authService.getUserName();
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('');
  }
  
}
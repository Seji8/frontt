import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../../../core/services/user.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  equipes: any[] = [];
  loading = true;
  error = '';
  success = '';
  showForm = false;
  editingId: number | null = null;
  userForm: FormGroup;

  // Custom confirm dialog state
  showConfirmDialog = false;
  confirmDialogMessage = '';
  confirmDialogTitle = '';
  pendingDeleteId: number | null = null;

  roles = ['ADMIN', 'RH', 'CHEF_EQUIPE', 'EMPLOYE'];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['EMPLOYE', Validators.required],
      equipeId: [''],
      telephone: [''],
      adresse: [''],
      ville: [''],
      matricule: ['']
    });
  }

  ngOnInit() {
    console.log('=== UsersComponent ===');
    console.log('Role:', this.authService.getRole());
    console.log('Is Admin?', this.authService.isAdmin());

    if (!this.authService.isAdmin()) {
      this.error = 'Accès refusé. Droits administrateur requis.';
      this.loading = false;
      return;
    }

    this.loadUsers();
    this.loadEquipes();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = err.status === 403
          ? 'Accès refusé. Droits ADMIN requis.'
          : 'Impossible de charger les utilisateurs.';
        this.loading = false;
      }
    });
  }

  loadEquipes() {
    this.userService.getAllEquipes().subscribe({
      next: (equipes) => {
        this.equipes = equipes;
        console.log('Equipes loaded:', equipes.length);
      },
      error: (err) => {
        console.error('Failed to load equipes:', err);
      }
    });
  }

  openForm() {
    this.showForm = true;
    this.editingId = null;
    this.userForm.reset({
      role: 'EMPLOYE',
      equipeId: '',
      telephone: '',
      adresse: '',
      ville: '',
      matricule: ''
    });
    if (this.userForm.contains('password')) {
      this.userForm.removeControl('password');
    }
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.userForm.reset();
    if (this.userForm.contains('password')) {
      this.userForm.removeControl('password');
    }
  }

  editUser(user: User) {
    this.editingId = user.id || null;

    if (!this.userForm.contains('password')) {
      this.userForm.addControl('password', this.fb.control(''));
    }

    this.userForm.patchValue({
      nom: user.nom,
      email: user.email,
      role: user.role,
      equipeId: user.equipeId || '',
      telephone: user.telephone || '',
      adresse: user.adresse || '',
      ville: user.ville || '',
      matricule: user.matricule || ''
    });

    this.showForm = true;
  }

  /**
   * Converts an empty/blank string to null.
   * Critical for unique-constrained optional fields (matricule, telephone, etc.)
   * — the DB treats '' as a real value and rejects duplicates, while NULL is not.
   */
  private nullIfEmpty(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  /**
   * HTML <select> always returns a string, but equipeId is a number on the backend.
   * Converts '' → null, and any non-empty string → parsed integer.
   */
  private nullOrNumber(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }

  onSubmit() {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.error = '';
    this.success = '';

    if (this.editingId) {
      const updateData: UpdateUserRequest = {
        nom: this.userForm.get('nom')?.value,
        email: this.userForm.get('email')?.value,
        role: this.userForm.get('role')?.value,
        equipeId: this.nullOrNumber(this.userForm.get('equipeId')?.value),
        telephone: this.nullIfEmpty(this.userForm.get('telephone')?.value),
        adresse: this.nullIfEmpty(this.userForm.get('adresse')?.value),
        ville: this.nullIfEmpty(this.userForm.get('ville')?.value),
        matricule: this.nullIfEmpty(this.userForm.get('matricule')?.value)
      };

      const passwordValue = this.userForm.get('password')?.value;
      if (passwordValue) {
        updateData.password = passwordValue;
      }

      this.userService.updateUser(this.editingId, updateData).subscribe({
        next: () => {
          this.success = 'Utilisateur mis à jour avec succès.';
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error || 'Erreur lors de la mise à jour.';
          console.error(err);
        }
      });

    } else {
      const createData: CreateUserRequest = {
        nom: this.userForm.get('nom')?.value,
        email: this.userForm.get('email')?.value,
        role: this.userForm.get('role')?.value,
        equipeId: this.nullOrNumber(this.userForm.get('equipeId')?.value),
        telephone: this.nullIfEmpty(this.userForm.get('telephone')?.value),
        adresse: this.nullIfEmpty(this.userForm.get('adresse')?.value),
        ville: this.nullIfEmpty(this.userForm.get('ville')?.value),
        matricule: this.nullIfEmpty(this.userForm.get('matricule')?.value)
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.success = 'Utilisateur créé. Les identifiants ont été envoyés par e-mail.';
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error || 'Erreur lors de la création.';
          console.error(err);
        }
      });
    }
  }

  // ─── Custom confirm dialog ───────────────────────────────────────────────

  deleteUser(id: number) {
    this.pendingDeleteId = id;
    this.confirmDialogTitle = 'Supprimer cet utilisateur ?';
    this.confirmDialogMessage =
      'Cette action est irréversible. L\'utilisateur perdra immédiatement l\'accès au système.';
    this.showConfirmDialog = true;
  }

  onConfirmDelete() {
    if (this.pendingDeleteId === null) return;
    this.showConfirmDialog = false;

    this.userService.deleteUser(this.pendingDeleteId).subscribe({
      next: () => {
        this.success = 'Utilisateur supprimé avec succès.';
        this.pendingDeleteId = null;
        this.loadUsers();
      },
      error: (err) => {
        this.error = 'Impossible de supprimer l\'utilisateur.';
        this.pendingDeleteId = null;
        console.error(err);
      }
    });
  }

  onCancelDelete() {
    this.showConfirmDialog = false;
    this.pendingDeleteId = null;
  }

  // ─── Template helpers ────────────────────────────────────────────────────

  getInitials(nom: string): string {
    return nom
      .split(' ')
      .slice(0, 2)
      .map(n => n[0]?.toUpperCase() ?? '')
      .join('');
  }
}
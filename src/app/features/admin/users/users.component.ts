import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../../../core/services/user.service';
import { AuthService } from '../../../core/auth.service';  // ← AJOUTE CET IMPORT

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
    // Vérifier le rôle avant de charger
    console.log('=== UsersComponent ===');
    console.log('Role:', this.authService.getRole());
    console.log('Is Admin?', this.authService.isAdmin());
    
    if (!this.authService.isAdmin()) {
      this.error = 'Access denied. Admin rights required.';
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
        if (err.status === 403) {
          this.error = 'Access denied. You need ADMIN rights.';
        } else {
          this.error = 'Failed to load users';
        }
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
        if (err.status === 403) {
          console.error('Access denied for equipes endpoint');
        }
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
    // Supprimer le contrôle password s'il existe
    if (this.userForm.contains('password')) {
      this.userForm.removeControl('password');
    }
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.userForm.reset();
    // Supprimer le contrôle password
    if (this.userForm.contains('password')) {
      this.userForm.removeControl('password');
    }
  }

  editUser(user: User) {
    this.editingId = user.id || null;
    
    // Ajouter le contrôle password pour l'édition
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

  onSubmit() {
    if (this.userForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
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
        equipeId: this.userForm.get('equipeId')?.value,
        telephone: this.userForm.get('telephone')?.value,
        adresse: this.userForm.get('adresse')?.value,
        ville: this.userForm.get('ville')?.value,
        matricule: this.userForm.get('matricule')?.value
      };
      
      const passwordControl = this.userForm.get('password');
      if (passwordControl && passwordControl.value) {
        updateData.password = passwordControl.value;
      }

      console.log('Updating user with data:', updateData);

      this.userService.updateUser(this.editingId, updateData).subscribe({
        next: (updatedUser) => {
          this.success = 'User updated successfully';
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error || 'Failed to update user';
          console.error(err);
        }
      });
    } else {
      const createData: CreateUserRequest = {
        nom: this.userForm.get('nom')?.value,
        email: this.userForm.get('email')?.value,
        role: this.userForm.get('role')?.value,
        equipeId: this.userForm.get('equipeId')?.value,
        telephone: this.userForm.get('telephone')?.value,
        adresse: this.userForm.get('adresse')?.value,
        ville: this.userForm.get('ville')?.value,
        matricule: this.userForm.get('matricule')?.value
      };

      console.log('Creating user with data:', createData);

      this.userService.createUser(createData).subscribe({
        next: (newUser) => {
          this.success = 'User created successfully. Credentials have been sent to their email.';
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error || 'Failed to create user';
          console.error(err);
        }
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.success = 'User deleted successfully';
          this.loadUsers();
        },
        error: (err) => {
          this.error = 'Failed to delete user';
          console.error(err);
        }
      });
    }
  }
}
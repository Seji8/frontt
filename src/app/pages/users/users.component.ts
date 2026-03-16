import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';
  success = '';
  showForm = false;
  editingId: number | null = null;
  userForm: FormGroup;

  roles = ['ADMIN', 'RH', 'CHEF_EQUIPE', 'EMPLOYE'];

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['EMPLOYE', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUsers();
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
        this.error = 'Failed to load users';
        this.loading = false;
        console.error(err);
      }
    });
  }

  openForm() {
    this.showForm = true;
    this.editingId = null;
    this.userForm.reset({ role: 'EMPLOYE' });
  }

  closeForm() {
    if (this.userForm.contains('password')) {
    this.userForm.removeControl('password');
  }
  
  this.userForm.reset();
  this.editingId = null;
}

  editUser(user: User) {
  this.editingId = user.id || null;
  
  
  if (!this.userForm.contains('password')) {
    this.userForm.addControl('password', this.fb.control(''));
  }
  
  this.userForm.patchValue({
    nom: user.nom,
    email: user.email,
    role: user.role
  });
  
  this.showForm = true;
}
  onSubmit() {
    if (this.userForm.invalid) {
      return;
    }

    this.error = '';
    this.success = '';

    if (this.editingId) {
      const updateData: UpdateUserRequest = {
        nom: this.userForm.get('nom')?.value,
        email: this.userForm.get('email')?.value,
        role: this.userForm.get('role')?.value
      };
      const passwordControl = this.userForm.get('password');
    if (passwordControl && passwordControl.value) {
      updateData.password = passwordControl.value;
    }

    console.log('Updating user with data:', updateData); // Pour déboguer


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
        role: this.userForm.get('role')?.value
        // No password field needed
      };

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
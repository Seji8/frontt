import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from './../services/user.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-equipes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './equipes.component.html',
  styleUrls: ['./equipes.component.css']
})
export class EquipesComponent implements OnInit {
  equipes: any[] = [];
  users: any[] = [];
  loading = true;
  error = '';
  success = '';
  showForm = false;
  editingId: number | null = null;
  equipeForm: FormGroup;
  
  // Pour le chef d'équipe
  isAdminUser = false;
  isChefUser = false;
  myTeam: any = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.equipeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      chefId: ['']
    });
  }

  ngOnInit() {
    this.isAdminUser = this.authService.isAdmin();
    this.isChefUser = this.authService.isChef();
    
    if (this.isAdminUser) {
      // ADMIN voit toutes les équipes
      this.loadEquipes();
      this.loadUsers();
    } else if (this.isChefUser) {
      // CHEF voit seulement son équipe
      this.loadMyTeam();
    } else {
      this.error = 'You do not have permission to view this page.';
      this.loading = false;
    }
  }

  loadEquipes() {
    this.loading = true;
    this.error = '';
    
    this.userService.getAllEquipes().subscribe({
      next: (equipes) => {
        console.log('Équipes chargées:', equipes);
        this.equipes = equipes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement équipes:', err);
        this.error = err.error?.message || 'Erreur chargement équipes';
        this.loading = false;
      }
    });
  }

 loadMyTeam() {
  this.loading = true;
  this.error = '';
  
  this.userService.getMyTeam().subscribe({
    next: (members) => {
      console.log('My team loaded:', members);
      
      if (members && members.length > 0) {
        this.myTeam = {
          id: members[0]?.equipeId,
          nom: members[0]?.equipeNom || 'My Team',
          membres: members,
          chef_id: members.find(m => m.role === 'CHEF_EQUIPE')?.id
        };
        console.log('myTeam created:', this.myTeam);
      } else {
        this.myTeam = null;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading team:', err);
      if (err.status === 404) {
        this.error = 'You are not assigned to any team.';
      } else if (err.status === 403) {
        this.error = 'Access denied. You need team leader privileges.';
      } else {
        this.error = 'Unable to load your team.';
      }
      this.myTeam = null;
      this.loading = false;
    }
  });
}
  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.filter(user => user.role === 'CHEF_EQUIPE');
        console.log('Chefs potentiels:', this.users);
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
      }
    });
  }

  openForm() {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can edit teams.';
      return;
    }
    this.showForm = true;
    this.editingId = null;
    this.error = '';
    this.success = '';
    this.equipeForm.reset({ nom: '', chefId: '' });
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.equipeForm.reset();
    this.error = '';
    this.success = '';
  }

  editEquipe(equipe: any) {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can edit teams.';
      return;
    }
    this.editingId = equipe.id;
    this.error = '';
    this.success = '';
    this.equipeForm.patchValue({
      nom: equipe.nom,
      chefId: equipe.chef_id || equipe.chefId || ''
    });
    this.showForm = true;
  }

  onSubmit() {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can modify teams.';
      return;
    }
    
    if (this.equipeForm.invalid) {
      Object.keys(this.equipeForm.controls).forEach(key => {
        this.equipeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.error = '';
    this.success = '';

    const equipeData = {
      nom: this.equipeForm.get('nom')?.value,
      chefId: this.equipeForm.get('chefId')?.value || null
    };

    console.log('Données à envoyer:', equipeData);

    if (this.editingId) {
      this.userService.updateEquipe(this.editingId, equipeData).subscribe({
        next: (response) => {
          console.log('Équipe mise à jour:', response);
          this.success = 'Team updated successfully';
          this.closeForm();
          this.loadEquipes();
        },
        error: (err) => {
          console.error('Erreur mise à jour:', err);
          this.error = err.error?.message || 'Error updating team';
        }
      });
    } else {
      this.userService.createEquipe(equipeData).subscribe({
        next: (response) => {
          console.log('Équipe créée:', response);
          this.success = 'Team created successfully';
          this.closeForm();
          this.loadEquipes();
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.error = err.error?.message || 'Error creating team';
        }
      });
    }
  }

  deleteEquipe(id: number) {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can delete teams.';
      return;
    }
    
    if (confirm('Are you sure you want to delete this team?')) {
      this.userService.deleteEquipe(id).subscribe({
        next: () => {
          console.log('Équipe supprimée:', id);
          this.success = 'Team deleted successfully';
          this.loadEquipes();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.error = err.error?.message || 'Error deleting team';
        }
      });
    }
  }

  getChefName(chefId: number): string {
    if (!chefId) return 'No team leader';
    const chef = this.users.find(u => u.id === chefId);
    return chef ? chef.nom : 'Unknown leader';
  }

  getCurrentUserId(): number {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : 0;
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrator',
      'CHEF_EQUIPE': 'Team Leader',
      'RH': 'HR',
      'EMPLOYE': 'Employee'
    };
    return labels[role] || role;
  }

  canEdit(): boolean {
    return this.isAdminUser;
  }
}
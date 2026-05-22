import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../core/services/user.service';
import { AuthService } from '../core/auth.service';

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
  error = '';
  success = '';
  showForm = false;
  editingId: number | null = null;
  equipeForm: FormGroup;
  
  isAdminUser = false;
  isChefUser = false;
  myTeam: any = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef  // ← AJOUTER
  ) {
    this.equipeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      chefId: ['']
    });
  }

  ngOnInit() {
    this.isAdminUser = this.authService.isAdmin();
    this.isChefUser = this.authService.isChef();
    this.cdr.detectChanges();
    
    if (this.isAdminUser) {
      this.loadEquipes();
      this.loadUsers();
    } else if (this.isChefUser) {
      this.loadMyTeam();
    } else {
      this.error = 'You do not have permission to view this page.';
      this.cdr.detectChanges();
    }
  }

  loadEquipes() {
    this.error = '';
    this.cdr.detectChanges();
    
    this.userService.getAllEquipes().subscribe({
      next: (equipes) => {
        console.log('Équipes chargées:', equipes);
        this.equipes = equipes;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement équipes:', err);
        this.error = err.error?.message || 'Erreur chargement équipes';
        this.cdr.detectChanges();
      }
    });
  }

  loadMyTeam() {
    this.error = '';
    this.cdr.detectChanges();
    
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
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      }
    });
  }

 loadUsers() {
  this.userService.getAllUsers().subscribe({
    next: (users) => {
      // Tous les chefs, pas de filtre d'exclusion
      this.users = users.filter(user => user.role === 'CHEF_EQUIPE');
      console.log('Chefs potentiels:', this.users);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement utilisateurs:', err);
      this.cdr.detectChanges();
    }
  });
}

  openForm() {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can edit teams.';
      this.cdr.detectChanges();
      return;
    }
    this.showForm = true;
    this.editingId = null;
    this.error = '';
    this.success = '';
    this.equipeForm.reset({ nom: '', chefId: '' });
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.equipeForm.reset();
    this.error = '';
    this.success = '';
    this.cdr.detectChanges();
  }

  editEquipe(equipe: any) {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can edit teams.';
      this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can modify teams.';
      this.cdr.detectChanges();
      return;
    }
    
    if (this.equipeForm.invalid) {
      Object.keys(this.equipeForm.controls).forEach(key => {
        this.equipeForm.get(key)?.markAsTouched();
      });
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.success = '';
    this.cdr.detectChanges();

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
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur mise à jour:', err);
          this.error = err.error?.message || 'Error updating team';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.userService.createEquipe(equipeData).subscribe({
        next: (response) => {
          console.log('Équipe créée:', response);
          this.success = 'Team created successfully';
          this.closeForm();
          this.loadEquipes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.error = err.error?.message || 'Error creating team';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteEquipe(id: number) {
    if (!this.isAdminUser) {
      this.error = 'Only administrators can delete teams.';
      this.cdr.detectChanges();
      return;
    }
    
    if (confirm('Are you sure you want to delete this team?')) {
      this.cdr.detectChanges();
      
      this.userService.deleteEquipe(id).subscribe({
        next: () => {
          console.log('Équipe supprimée:', id);
          this.success = 'Team deleted successfully';
          this.loadEquipes();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.error = err.error?.message || 'Error deleting team';
          this.cdr.detectChanges();
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
  getChefLabel(user: any): string {
  if (user.equipeNom) {
    return `${user.nom} — déjà chef de: ${user.equipeNom}`;
  }
  return user.nom;
}
}
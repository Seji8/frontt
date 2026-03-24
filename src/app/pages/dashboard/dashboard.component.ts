import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { UserService, User } from '../../services/user.service';
import { RequestService } from '../../services/request.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string | null = null;
  userName: string | null = null;
  totalUsers = 0;
  totalRequests = 0;
  pendingRequests = 0;
  approvedRequests = 0;
  rejectedRequests = 0;
  loading = true;
  
  // Pour l'équipe
  teamMembers: User[] = [];
  loadingTeam = false;
  teamError = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private requestService: RequestService
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getRole();
    this.userName = localStorage.getItem('nom') || 'Utilisateur';
    this.loadDashboardData();
    
    if (this.isChef()) {
      this.loadTeamMembers();
    }
  }

  loadDashboardData() {
    this.loading = true;

    if (this.authService.isAdmin()) {
      this.userService.getAllUsers().subscribe({
        next: (users) => {
          this.totalUsers = users.length;
        },
        error: (err) => console.error('Error loading users', err)
      });
    }

    this.requestService.getAllRequests().subscribe({
      next: (requests) => {
        this.totalRequests = requests.length;
        this.pendingRequests = requests.filter(r => r.statut === 'PENDING').length;
        this.approvedRequests = requests.filter(r => r.statut === 'APPROVED').length;
        this.rejectedRequests = requests.filter(r => r.statut === 'REJECTED').length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests', err);
        this.loading = false;
      }
    });
  }

getRoleLabel(role: string): string {
  const roleLabels: { [key: string]: string } = {
    'ADMIN': 'Administrator',
    'CHEF_EQUIPE': 'Team Leader',
    'RH': 'HR',
    'EMPLOYE': 'Employee'
  };
  return roleLabels[role] || role;
}

loadTeamMembers() {
    console.log('=== loadTeamMembers START ===');
    console.log('Is Chef?', this.authService.isChef());
    console.log('Token:', this.authService.getToken()?.substring(0, 50));
    
    this.loadingTeam = true;
    this.teamError = '';
    
    this.userService.getMyTeam().subscribe({
      next: (members) => {
        console.log('✅ SUCCESS - Members received:', members);
        console.log('Number of members:', members?.length);
        this.teamMembers = members || [];
        this.loadingTeam = false;
      },
      error: (err) => {
        console.error('❌ ERROR - Details:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Error body:', err.error);
        
        // Afficher l'erreur dans le template
        if (err.status === 404) {
            this.teamError = 'You are not assigned to any team.';
        } else if (err.status === 403) {
            this.teamError = 'Access denied. You need team leader privileges.';
        } else if (err.status === 401) {
            this.teamError = 'Session expired. Please login again.';
        } else if (err.status === 0) {
            this.teamError = 'Cannot connect to server. Check if backend is running.';
        } else {
            this.teamError = `Error: ${err.message || 'Unknown error'}`;
        }
        
        this.teamMembers = [];
        this.loadingTeam = false;
      },
      complete: () => {
        console.log('Request completed');
      }
    });
}

  getCurrentUserId(): number {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : 0;
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
    return !this.isAdmin() && !this.isChef() && !this.isRH();
  }
}
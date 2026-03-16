import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { UserService } from '../../services/user.service';
import { RequestService } from '../../services/request.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string | null = null;
  totalUsers = 0;
  totalRequests = 0;
  pendingRequests = 0;
  approvedRequests = 0;
  loading = true;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private requestService: RequestService
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getRole();
    this.loadDashboardData();
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests', err);
        this.loading = false;
      }
    });
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
}


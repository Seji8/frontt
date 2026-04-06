// dashboard.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service'
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  userName = 'Utilisateur';
  userEmail = '';
  userRole = '';
  currentDate = '';
  notificationsCount = 3;
  
  totalRequests = 0;
  pendingRequests = 0;
  approvedRequests = 0;
  rejectedRequests = 0;
  pendingValidations = 2;
  
  isAdmin = false;
  isChef = false;
  
  recentRequests: any[] = [];
  
  constructor(private router: Router,private authService: AuthService) {}
  
  ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.loadUserInfo(); 
    this.loadStatistics();
    this.loadRecentRequests();
    this.checkUserRole();
  }
    loadUserInfo() {
    // Récupérer depuis localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.nom || user.name || user.username || 'Utilisateur';
        this.userEmail = user.email || '';
        this.userRole = user.role || '';
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }
    
    // Alternative: utiliser AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.nom || currentUser.name || this.userName;
      this.userEmail = currentUser.email || this.userEmail;
      this.userRole = currentUser.role || this.userRole;
    }
    
    console.log('Utilisateur connecté:', this.userName, this.userEmail);
  }
  
  ngAfterViewInit() {
    this.initChart();
  }
  
  
  loadStatistics() {
    // Simuler le chargement des données
    this.totalRequests = 42;
    this.pendingRequests = 8;
    this.approvedRequests = 30;
    this.rejectedRequests = 4;
  }
  
  loadRecentRequests() {
    // Simuler des demandes récentes
    this.recentRequests = [
      { id: 1, date: new Date(), type: 'Télétravail complet', status: 'En attente' },
      { id: 2, date: new Date(Date.now() - 86400000), type: 'Télétravail partiel', status: 'Approuvée' },
      { id: 3, date: new Date(Date.now() - 172800000), type: 'Télétravail complet', status: 'Approuvée' }
    ];
  }
  
  checkUserRole() {
    const role = this.authService.getRole() || localStorage.getItem('user_role');
    this.isAdmin = role === 'admin' || role === 'ADMIN';
    this.isChef = role === 'chef' || role === 'CHEF_EQUIPE';
  }
  
  initChart() {
    const ctx = document.getElementById('requestsChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Demandes',
          data: [5, 8, 6, 12, 9, 4, 3],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  newRequest() {
    this.router.navigate(['/requests/new']);
  }
  
  viewRequests() {
    this.router.navigate(['/requests']);
  }
  
  viewAllRequests() {
    this.router.navigate(['/requests']);
  }
  
  viewRequestDetail(id: number) {
    this.router.navigate(['/requests', id]);
  }
  
  manageUsers() {
    this.router.navigate(['/users']);
  }
  
  validateRequests() {
    this.router.navigate(['/camunda/chef/tasks']);
  }
}
import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service'
import { CamundaService, DemandeTeletravail } from '../../core/services/camunda.service'; 
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
  private chart: Chart | null = null;
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private camundaService: CamundaService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.loadUserInfo(); 
    this.loadAllData();
    this.checkUserRole();
    this.cdr.detectChanges();
  }
  
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  
  loadUserInfo() {
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
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.nom || currentUser.name || this.userName;
      this.userEmail = currentUser.email || this.userEmail;
      this.userRole = currentUser.role || this.userRole;
    }
    
    console.log('Utilisateur connecté:', this.userName, this.userEmail);
    this.cdr.detectChanges();
  }
  
  loadAllData() {
    console.log('🔄 Dashboard - Chargement des données');
    
    this.camundaService.getMyDemandes().subscribe({
      next: (demandes: DemandeTeletravail[]) => {
        console.log('📊 NOMBRE DE DEMANDES:', demandes.length);
        
        // 1. Mettre à jour les statistiques
        this.totalRequests = demandes.length;
        this.pendingRequests = demandes.filter(d => d.statut === 'PENDING').length;
        this.approvedRequests = demandes.filter(d => d.statut === 'APPROVED').length;
        this.rejectedRequests = demandes.filter(d => d.statut === 'REJECTED').length;
        
        // 2. Mettre à jour les demandes récentes (les 5 plus récentes)
        this.recentRequests = demandes
          .sort((a, b) => {
            const dateA = new Date(a.dateCreation || new Date());
            const dateB = new Date(b.dateCreation || new Date());
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5)
          .map(d => ({
            id: d.id,
            date: new Date(d.dateCreation || new Date()),
            type: this.getTypeLabel(d.type),
            status: this.getStatusLabel(d.statut),
            rawStatus: d.statut
          }));
        
        // 3. Initialiser le graphique
        this.initChartWithData(demandes);
        
        // 4. Forcer la mise à jour de l'affichage
        this.cdr.detectChanges();
        
        console.log('📊 Statistiques mises à jour:', {
          total: this.totalRequests,
          pending: this.pendingRequests,
          approved: this.approvedRequests,
          rejected: this.rejectedRequests,
          recentCount: this.recentRequests.length
        });
      },
      error: (err) => {
        console.error('❌ Erreur chargement:', err);
        this.cdr.detectChanges();
      }
    });
  }
  
  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'OCCASIONAL': 'Télétravail occasionnel',
      'REGULAR': 'Télétravail régulier',
      'FULL': 'Télétravail complet',
      'PARTIAL': 'Télétravail partiel'
    };
    return labels[type] || type || 'Non spécifié';
  }
  
  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvée',
      'REJECTED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut] || statut || 'Inconnu';
  }
  
  initChartWithData(demandes: DemandeTeletravail[]) {
    const ctx = document.getElementById('requestsChart') as HTMLCanvasElement;
    
    if (!ctx) {
      console.error('Canvas requestsChart non trouvé');
      return;
    }
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dataParJour = new Array(7).fill(0);
    
    demandes.forEach(demande => {
      if (demande.dateCreation) {
        const date = new Date(demande.dateCreation);
        if (!isNaN(date.getTime())) {
          const jourSemaine = date.getDay();
          const index = jourSemaine === 0 ? 6 : jourSemaine - 1;
          dataParJour[index]++;
        }
      }
    });
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: jours,
        datasets: [{
          label: 'Demandes',
          data: dataParJour,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.raw} demande(s)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            title: { display: true, text: 'Nombre de demandes' }
          },
          x: {
            title: { display: true, text: 'Jours de la semaine' }
          }
        }
      }
    });
    
    this.cdr.detectChanges();
  }
  
  onChartPeriodChange(event: any) {
    const period = event.target.value;
    console.log('Période sélectionnée:', period);
    // Recharger les données pour la nouvelle période
    this.loadAllData();
  }
  
  checkUserRole() {
    const role = this.authService.getRole() || localStorage.getItem('user_role');
    this.isAdmin = role === 'admin' || role === 'ADMIN';
    this.isChef = role === 'chef' || role === 'CHEF_EQUIPE';
    this.cdr.detectChanges();
  }
  
  newRequest() {
    this.router.navigate(['/nouvelle-demande']);
  }
  
  viewRequests() {
    this.router.navigate(['mes-demandes']);
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
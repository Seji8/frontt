// app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [CommonModule, RouterModule], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobileOpen = false;
  userRole: string = '';
  currentUrl: string = '';
  userName: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Récupérer le rôle et les infos utilisateur
    this.userRole = localStorage.getItem('user_role') || 'EMPLOYE';
    
    // Récupérer le nom de l'utilisateur
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.nom || user.name || 'Utilisateur';
      } catch (e) {
        this.userName = 'Utilisateur';
      }
    }
    
    console.log('👤 Rôle utilisateur:', this.userRole);
    console.log('📝 Nom utilisateur:', this.userName);
    
    // Suivre les changements d'URL
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
      }
    });
  }

  // Vérifier si on est sur la page de login
  isLoginPage(): boolean {
    return this.currentUrl === '/login' || this.currentUrl === '/';
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Vérifier si l'utilisateur est ADMIN
  isAdmin(): boolean {
    return this.userRole === 'ADMIN' || this.userRole === 'admin';
  }

  // Vérifier si l'utilisateur est CHEF_EQUIPE
  isChef(): boolean {
    return this.userRole === 'CHEF_EQUIPE' || this.userRole === 'chef';
  }

  // Vérifier si l'utilisateur est RH
  isRH(): boolean {
    return this.userRole === 'RH' || this.userRole === 'rh';
  }

  // Vérifier si l'utilisateur est EMPLOYE
  isEmploye(): boolean {
    return this.userRole === 'EMPLOYE' || this.userRole === 'employe' || 
           (!this.isAdmin() && !this.isChef() && !this.isRH());
  }

  getRoleLabel(): string {
    switch(this.userRole.toUpperCase()) {
      case 'ADMIN': return 'Administrateur';
      case 'CHEF_EQUIPE': return 'Chef d\'équipe';
      case 'RH': return 'Ressources Humaines';
      default: return 'Employé';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
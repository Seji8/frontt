// app.component.ts
import { Component, NgZone, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { filter } from 'rxjs';

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
    private authService: AuthService,
    private ngZone: NgZone
  ) {this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.urlAfterRedirects;
    });
  }

   ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.nom || user.name || '';
        this.userRole = user.role || this.authService.getRole() || '';
      } catch (e) {
        console.error('Erreur:', e);
      }
    }
  }

  // ✅ Méthode de navigation - corrige le problème du double clic
   navigateTo(path: string) {
    console.log('🔗 Navigation vers:', path);
    console.log('📍 URL avant:', this.router.url);
    
    // Vérifier si on est déjà sur la page
    if (this.router.url === path) {
      console.log('🔄 Déjà sur cette page, rechargement des données');
      // Recharger le composant actuel
      this.ngZone.run(() => {
        this.router.navigate([path]).then(() => {
          window.location.reload();
        });
      });
      return;
    }
    // Navigation vers nouvelle page
    this.ngZone.run(() => {
      this.router.navigate([path]).then(() => {
        console.log('✅ Navigation terminée vers:', path);
      }).catch(err => {
        console.error('❌ Erreur navigation:', err);
        // Fallback
        window.location.href = path;
      });
    });
  }
  // ✅ Vérifier si un lien est actif
  isActive(url: string): boolean {
    return this.currentUrl === url || this.currentUrl?.startsWith(url + '/');
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN' || this.userRole === 'admin';
  }

  isChef(): boolean {
    return this.userRole === 'CHEF_EQUIPE' || this.userRole === 'chef';
  }

  isRH(): boolean {
    return this.userRole === 'RH' || this.userRole === 'rh';
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
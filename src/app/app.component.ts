import { Component, NgZone, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';
import { filter, Subscription } from 'rxjs';
import { NotificationService, AppNotification } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  isSidebarCollapsed = false;
  isMobileOpen = false;
  isMobile = false;
  userRole: string = '';
  currentUrl: string = '';
  userName: string = '';
  userEmail: string = '';

  // Notification state
  notificationCount = 0;
  showNotifications = false;
  notifications: AppNotification[] = [];

  private notifSub!: Subscription;
  private countSub!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone,
    private notificationService: NotificationService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.urlAfterRedirects;
      if (this.isMobile) this.isMobileOpen = false;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() { this.checkScreenSize(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.showNotifications = false;
    }
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.checkScreenSize();

    const token = this.authService.getToken();
    const user  = this.authService.getCurrentUser(); // { id, nom, email, role, equipeId }
      console.log('🔍 user au init:', user); 

    if (token && user) {
      const role     = user.role     || '';
      const equipeId = user.equipeId ? Number(user.equipeId) : undefined;

      console.log('🔍 role passé au connect:', role);

      // Connect WebSocket with role-based topic subscriptions
      this.notificationService.connect(token, role, equipeId);

      // Subscribe to notifications list
      this.notifSub = this.notificationService.notifications.subscribe(notifs => {
        this.ngZone.run(() => { this.notifications = notifs; });
      });

      // Subscribe to unread badge count
      this.countSub = this.notificationService.unreadCount.subscribe(count => {
        this.ngZone.run(() => { this.notificationCount = count; });
      });
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.countSub?.unsubscribe();
    this.notificationService.disconnect();
  }

  // ── Notification methods ─────────────────────────────────────────

  // app.component.ts — change uniquement cette méthode
toggleNotifications(event: MouseEvent): void {
  event.stopPropagation();
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.notificationService.markAllRead();
  }
}
  getNotificationIcon(type: string, statut: string): string {
    if (type === 'NEW_DEMANDE') return '📋';
    if (statut === 'APPROVED')  return '✅';
    if (statut === 'REJECTED')  return '❌';
    return '🔔';
  }

  navigateToDemandeFromNotif(notif: AppNotification): void {
    this.showNotifications = false;
    if (notif.demandeId) {
      this.navigateTo('/demande/' + notif.demandeId);
    }
  }

  // ── Navigation & UI ──────────────────────────────────────────────

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.isSidebarCollapsed = false;
  }

  loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName  = user.nom   || user.name  || '';
      this.userEmail = user.email || '';
      this.userRole  = user.role  || this.authService.getRole() || '';
    }
  }

  navigateTo(path: string): void {
    if (this.isMobile) this.isMobileOpen = false;
    if (this.router.url === path) {
      this.ngZone.run(() => {
        this.router.navigate([path]).then(() => window.location.reload());
      });
      return;
    }
    this.ngZone.run(() => {
      this.router.navigate([path]).catch(() => { window.location.href = path; });
    });
  }

  isActive(url: string): boolean {
    return this.currentUrl === url || this.currentUrl?.startsWith(url + '/');
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.isMobileOpen = !this.isMobileOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  isLoginPage(): boolean { return this.router.url === '/login'; }
  isAdmin(): boolean { return this.userRole === 'ADMIN';      }
  isChef(): boolean  { return this.userRole === 'CHEF_EQUIPE'; }
  isRH(): boolean    { return this.userRole === 'RH';          }

  logout(): void {
    this.notificationService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
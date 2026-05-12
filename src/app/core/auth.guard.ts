// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Step 1 — no token → login
    if (!this.authService.hasToken()) {
      console.log('AuthGuard - No token, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // Step 2 — check roles if defined on route
    const requiredRoles: string[] = route.data?.['roles'];
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = this.authService.getRole();
      console.log('AuthGuard - Required:', requiredRoles, '| User role:', userRole);

      if (!requiredRoles.includes(userRole || '')) {
        console.log('AuthGuard - Wrong role, redirecting to dashboard');
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
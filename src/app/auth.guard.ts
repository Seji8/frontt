// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const isAuthenticated = this.authService.hasToken();
    console.log('AuthGuard - Is authenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
// app/auth.interceptor.ts - Version fonctionnelle
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Récupérer le token
  const token = localStorage.getItem('auth_token');
  
  console.log('🔍 Interceptor - URL:', req.url);
  console.log('🔍 Interceptor - Token présent?', token ? 'OUI' : 'NON');
  
  let authReq = req;
  if (token) {
    // Ajouter le token à l'en-tête
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Token ajouté à la requête');
  }
  
  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        console.error('❌ Erreur 401 - Non autorisé');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
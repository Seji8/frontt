import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
imports: [ReactiveFormsModule, CommonModule, ButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      console.log('❌ Formulaire invalide');
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;
    
    console.log('📝 Tentative de login avec:', email);
    console.log('🔑 Mot de passe:', password ? '****' : 'vide');

    // Nettoyer l'ancien token avant login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user');
    console.log('🧹 Anciennes données nettoyées');

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('📥 Réponse reçue:', response);
        
        if (response && response.token) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_role', response.role);
          
          // Si le backend ne renvoie pas le nom, faire un appel pour récupérer l'utilisateur
          if (!response.nom && !response.name) {
            // Appeler l'API pour récupérer les infos utilisateur
            this.authService.getCurrentUserInfo().subscribe({
              next: (user) => {
                const userInfo = {
                  id: user.id,
                  nom: user.nom || user.name,
                  email: user.email || email,
                  role: response.role,
                  equipeId: user.equipeId
                };
                localStorage.setItem('user', JSON.stringify(userInfo));
                console.log('✅ Infos utilisateur récupérées:', userInfo.nom);
                this.loading = false;
                
                // ✅ SOLUTION 1: Forcer le rechargement complet
                window.location.href = '/dashboard';
                // OU utiliser cette alternative:
                // window.location.reload();
              },
              error: (err) => {
                console.error('Erreur récupération user:', err);
                // Fallback: utiliser l'email comme nom
                const userName = email.split('@')[0];
                const formattedName = userName
                  .split(/[._-]/)
                  .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                  .join(' ');
                
                const userInfo = {
                  id: null,
                  nom: formattedName,
                  email: email,
                  role: response.role
                };
                localStorage.setItem('user', JSON.stringify(userInfo));
                this.loading = false;
                
                // ✅ SOLUTION 1: Forcer le rechargement complet
                window.location.href = '/dashboard';
              }
            });
          } else {
            // Stocker directement les infos
            const userInfo = {
              id: response.userId || response.id,
              nom: response.nom || response.name,
              email: response.email || email,
              role: response.role,
              equipeId: response.equipeId
            };
            localStorage.setItem('user', JSON.stringify(userInfo));
            console.log('✅ Utilisateur connecté:', userInfo.nom);
            this.loading = false;
            
            // ✅ SOLUTION 1: Forcer le rechargement complet
            window.location.href = '/dashboard';
          }
        } else {
          this.loading = false;
          this.error = 'Réponse invalide du serveur';
        }
      },
      error: (err) => {
        console.error('❌ Erreur login:', err);
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
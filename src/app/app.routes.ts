import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UsersComponent } from './features/admin/users/users.component';
import { EquipesComponent } from './equipes/equipes.component';
import { ChefTasksComponent } from './features/chef/chef-tasks/chef-tasks.component';
import { AuthGuard } from './core/auth.guard';
import { AdminTasksComponent } from './features/admin/admin-tasks/admin-tasks.component';
import { DemandeDetailComponent } from './shared/demande-detail/demande-detail.component';
import { MesDemandesComponent } from './features/employe/mes-demandes/mes-demandes.component';
import { NouvelleDemandeComponent } from './features/employe/nouvelle-demande/nouvelle-demande.component';
import { ToutesDemandesComponent } from './features/admin/toutes-demandes/toutes-demandes.component';
import { RhComponent } from './features/rh/rh.component';
import { RhAuditComponent } from './features/rh/rh-audit/rh-audit.component';
import { MonProfilComponent } from './features/employe/profil/profil/profil.component';
import { PolitiqueTeletravailComponent } from './features/politique-teletravail/politique-teletravail.component';
export const routes: Routes = [
  // Public
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Shared
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'demande/:id', component: DemandeDetailComponent, canActivate: [AuthGuard] },

  // Employé
  { path: 'mes-demandes', component: MesDemandesComponent, canActivate: [AuthGuard] },
  { path: 'nouvelle-demande', component: NouvelleDemandeComponent, canActivate: [AuthGuard] },
  { path: 'profil', component: MonProfilComponent, canActivate: [AuthGuard] },
  {
  path: 'politique-teletravail',
  component: PolitiqueTeletravailComponent
},
  // Chef
  { path: 'chef/tasks', component: ChefTasksComponent, canActivate: [AuthGuard] },
  // ✅ Fix — was missing, caused redirect to login
  { path: 'chef/demande/:id', component: DemandeDetailComponent, canActivate: [AuthGuard] },

  // Admin
  { path: 'admin/tasks', component: AdminTasksComponent, canActivate: [AuthGuard] },
  { path: 'admin/demande/:id', component: DemandeDetailComponent, canActivate: [AuthGuard] }, // ✅ same fix for admin
  { path: 'toutes-demandes', component: ToutesDemandesComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: 'equipes', component: EquipesComponent, canActivate: [AuthGuard] },

  // RH — ✅ removed duplicate
  { path: 'rh/rapport', component: RhComponent, canActivate: [AuthGuard], data: { roles: ['RH','ADMIN'] } },
  { path: 'rh/audit',   component: RhAuditComponent, canActivate: [AuthGuard], data: { roles: ['RH','ADMIN'] } }, // ── ADDED

  // Fallback
  { path: '**', redirectTo: '/login' }
];
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { RequestsComponent } from './pages/requests/requests.component';
import { EquipesComponent } from './equipes/equipes.component';
import { ChefTasksComponent } from './components/chef-tasks/chef-tasks.component';
import { AuthGuard } from './auth.guard';
import { AdminTasksComponent } from './components/admin-tasks/admin-tasks.component';
import { DemandeDetailComponent } from './components/demande-detail/demande-detail.component';
import { MesDemandesComponent } from './components/mes-demandes/mes-demandes.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'requests', component: RequestsComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: 'equipes', component: EquipesComponent, canActivate: [AuthGuard] },
   { path: 'chef/tasks', component: ChefTasksComponent, canActivate: [AuthGuard] },
   { path: 'admin/tasks', component: AdminTasksComponent, canActivate: [AuthGuard] }, 
   { path: 'admin/demande/:id', component: DemandeDetailComponent, canActivate: [AuthGuard] },
   { path: 'mes-demandes', component: MesDemandesComponent, canActivate: [AuthGuard] }, 
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
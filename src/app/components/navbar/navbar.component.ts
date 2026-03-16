import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isAuthenticated$ = this.authService.isAuthenticated$;
  userRole: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.userRole = this.authService.getRole();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isChef(): boolean {
    return this.authService.isChef();
  }

  isRH(): boolean {
    return this.authService.isRH();
  }
}


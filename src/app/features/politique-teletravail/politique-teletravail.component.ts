import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface PolitiqueResponse {
  id?: number;
  annee: number;
  mois: number;
  pourcentageMaxSurSite: number;
  nomEquipe: string;
  pourcentageActuel: number;
  membresEnTeletravail: number;
  totalMembres: number;
}

@Component({
  selector: 'app-politique-teletravail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './politique-teletravail.component.html',
  styleUrls: ['./politique-teletravail.component.css']
})
export class PolitiqueTeletravailComponent implements OnInit {

  selectedMois = new Date().getMonth() + 1;
  selectedAnnee = new Date().getFullYear();

  formPourcentage = 60;

  politique: PolitiqueResponse | null = null;

  saving = false;

  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ticks = [0, 25, 50, 75, 100];

  private readonly API = 'http://localhost:8080/api/politique';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPolitique();
  }

  loadPolitique(): void {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<PolitiqueResponse>(
      `${this.API}/equipe?annee=${this.selectedAnnee}&mois=${this.selectedMois}`,
      { headers }
    ).subscribe({
      next: (p) => {
        this.politique = p;
        this.formPourcentage = p.pourcentageMaxSurSite;
        this.updateSliderFill();
      },

      error: () => {
        this.politique = {
          annee: this.selectedAnnee,
          mois: this.selectedMois,
          pourcentageMaxSurSite: 60,
          nomEquipe: '',
          pourcentageActuel: 0,
          membresEnTeletravail: 0,
          totalMembres: 0
        };

        this.formPourcentage = 60;
      }
    });
  }

  savePolitique(): void {

    this.saving = true;

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<PolitiqueResponse>(
      `${this.API}/definir`,
      {
        annee: this.selectedAnnee,
        mois: this.selectedMois,
        pourcentageMaxSurSite: this.formPourcentage
      },
      { headers }
    ).subscribe({
      next: (p) => {
        this.politique = p;
        this.saving = false;

        this.showToast(
          'Politique enregistrée avec succès',
          'success'
        );
      },

      error: (err) => {

        this.saving = false;

        this.showToast(
          err.error?.error || 'Erreur lors de l\'enregistrement',
          'error'
        );
      }
    });
  }
  

  prevMois(): void {

    if (this.selectedMois === 1) {
      this.selectedMois = 12;
      this.selectedAnnee--;
    } else {
      this.selectedMois--;
    }

    this.loadPolitique();
  }

  nextMois(): void {

    if (this.selectedMois === 12) {
      this.selectedMois = 1;
      this.selectedAnnee++;
    } else {
      this.selectedMois++;
    }

    this.loadPolitique();
  }

  resetForm(): void {
    this.formPourcentage =
      this.politique?.pourcentageMaxSurSite ?? 60;

    this.updateSliderFill();
  }

  onSliderChange(): void {
    this.updateSliderFill();
  }

  updateSliderFill(): void {

    const el =
      document.querySelector('.slider-input') as HTMLInputElement;

    if (el) {
      el.style.setProperty(
        '--slider-pct',
        `${this.formPourcentage}%`
      );
    }
  }

  isOverLimit(): boolean {

    if (!this.politique) {
      return false;
    }

    const maxTeletravail =
      100 - this.politique.pourcentageMaxSurSite;

    const actuel =
      this.politique.totalMembres > 0
        ? (
            this.politique.membresEnTeletravail /
            this.politique.totalMembres
          ) * 100
        : 0;

    return actuel > maxTeletravail;
  }

  getSurSiteCount(): number {

    if (!this.politique) {
      return 0;
    }

    return Math.ceil(
      this.politique.totalMembres *
      this.formPourcentage / 100
    );
  }

  getTeletravailCount(): number {

    if (!this.politique) {
      return 0;
    }

    return Math.floor(
      this.politique.totalMembres *
      (100 - this.formPourcentage) / 100
    );
  }

  getMoisNom(mois: number): string {

    return [
      '',
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre'
    ][mois];
  }

  showToast(
    msg: string,
    type: 'success' | 'error'
  ): void {

    this.toastMessage = msg;
    this.toastType = type;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3500);
  }
}
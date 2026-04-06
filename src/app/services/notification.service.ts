// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
    // Couleurs selon le type
    const colors = {
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    };

    // Icônes selon le type
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 20px; font-weight: bold;">${icons[type]}</span>
        <span style="flex: 1;">${message}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 14px 20px;
      background: ${colors[type]};
      color: white;
      border-radius: 8px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
      min-width: 250px;
      max-width: 400px;
      cursor: pointer;
    `;

    document.body.appendChild(notification);

    // Auto-fermeture après 3 secondes
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);

    // Fermeture au clic
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    });
  }

  showSuccess(message: string): void {
    this.show(message, 'success');
  }

  showError(message: string): void {
    this.show(message, 'error');
  }

  showWarning(message: string): void {
    this.show(message, 'warning');
  }

  showInfo(message: string): void {
    this.show(message, 'info');
  }
}
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface AppNotification {
  id: string;
  type: string;
  titre: string;
  message: string;
  demandeId?: number;
  statut?: string;
  timestamp: string;
  lu: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private client!: Stomp.Client;
  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  private _unreadCount   = new BehaviorSubject<number>(0);
  private token: string = '';
  private apiUrl = 'http://localhost:8080/api/notifications';

  notifications = this._notifications.asObservable();
  unreadCount   = this._unreadCount.asObservable();

  connect(token: string, role: string, equipeId?: number): void {
    if (this.client?.active) return;

    
    this.token = token;

    console.log('🔌 connect() appelé — rôle:', role, 'equipeId:', equipeId);

    // ✅ Charge les notifs depuis la DB avec le token reçu en paramètre
    this.loadNotificationsFromDB(token);

    this.client = new Stomp.Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('✅ WebSocket connecté, rôle:', role, 'equipeId:', equipeId);

        this.client.subscribe('/user/queue/notifications', (msg: any) => {
          console.log('📩 Notif personnelle reçue:', msg.body);
          this.pushNotification(JSON.parse(msg.body));
        });

        if (role === 'CHEF_EQUIPE' && equipeId) {
          this.client.subscribe(`/topic/chef/${equipeId}/notifications`, (msg) => {
            console.log('📩 Notif chef reçue:', msg.body);
            this.pushNotification(JSON.parse(msg.body));
          });
        }

        if (role === 'ADMIN' || role === 'RH') {
          this.client.subscribe('/topic/admin/notifications', (msg: any) => {
            console.log('📩 Notif admin reçue:', msg.body);
            this.pushNotification(JSON.parse(msg.body));
          });
        }
      },

      onStompError:     (frame: any) => console.error('❌ STOMP error:', frame),
      onWebSocketError: (error: any) => console.error('❌ WebSocket error:', error),
      onDisconnect:     ()           => console.warn('⚠️ WebSocket déconnecté'),
    });

    this.client.activate();
  }

  disconnect(): void {
    this.token = '';
    this._notifications.next([]);
    this._unreadCount.next(0);
    if (this.client?.active) this.client.deactivate();
  }

  markAllRead(): void {
    const updated = this._notifications.getValue().map(n => ({ ...n, lu: true }));
    this._notifications.next(updated);
    this._unreadCount.next(0);

    if (!this.token) return;
    fetch(`${this.apiUrl}/mark-read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.token}` }
    }).catch(err => console.error('❌ Erreur mark-read:', err));
  }

  private loadNotificationsFromDB(token: string): void {
    console.log('📦 Chargement notifs DB, token présent:', !!token);

    fetch(this.apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
      console.log('📦 Réponse DB:', r.status);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((notifs: AppNotification[]) => {
      this._notifications.next(notifs);
      this._unreadCount.next(notifs.filter(n => !n.lu).length);
      console.log('📦 Notifs chargées:', notifs.length);
    })
    .catch(err => console.error('❌ Erreur chargement notifs:', err));
  }

  private pushNotification(data: any): void {
    const current = this._notifications.getValue();
    const alreadyExists = current.some(n =>
      n.type === data.type &&
      n.demandeId === data.demandeId &&
      n.timestamp === (data.timestamp ? data.timestamp.replace(' ', 'T') : '')
    );
    if (alreadyExists) return;

    const notif: AppNotification = {
      id:        Date.now().toString(),
      type:      data.type,
      titre:     data.titre ?? data.message,
      message:   data.message,
      demandeId: data.demandeId,
      statut:    data.statut,
      timestamp: data.timestamp
        ? data.timestamp.replace(' ', 'T')
        : new Date().toISOString(),
      lu: false
    };

    const updated = [notif, ...current];
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.lu).length);
  }
}
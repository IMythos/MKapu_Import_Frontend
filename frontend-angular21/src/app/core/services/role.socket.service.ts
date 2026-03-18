import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class RoleSocketService {
  private socket: Socket;
  private ngZone = inject(NgZone);
  constructor() {
    this.socket = io(`${environment.apiUrl}/roles`, {
      path: '/admin/socket.io/',
      transports: ['websocket'], // 👈 1. FORZAMOS SOLO WEBSOCKET (Evita el limbo del polling)
    });

    // 👇 2. LISTENERS DE DEPURACIÓN (Obligatorio para saber qué pasa)
    this.socket.on('connect', () => {
      console.log('✅ [Roles Socket] Conectado exitosamente al backend!');
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ [Roles Socket] Falló la conexión:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Roles Socket] Desconectado por:', reason);
    });
  }

  onRolePermissionsUpdated(): Observable<{ roleId: number }> {
    return new Observable((observer) => {
      this.socket.on('role_permissions_updated', (data) => {
        this.ngZone.run(() => {
          console.log('🔔 [Roles Socket] Señal recibida dentro de Angular Zone:', data);
          observer.next(data);
        });
      });
    });
  }
}

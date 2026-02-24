import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class CashboxSocketService {
  private socket: Socket;

  private readonly _caja        = signal<any>(null);
  private readonly _connected   = signal<boolean>(false);

  readonly caja      = this._caja.asReadonly();
  readonly connected = this._connected.asReadonly();

  // Signal derivado para el header
  readonly cajaAbierta = () => this._caja() !== null;

  // Múltiples listeners — Set en lugar de un solo callback
  private readonly _listeners = new Set<() => void>();

  constructor() {
    this.socket = io(`${environment.apiUrl}/cashbox`, {
      path: '/sales/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: false,
    });

    this.socket.on('connect', () => {
      this._connected.set(true);
    });

    this.socket.on('disconnect',    () => this._connected.set(false));
    this.socket.on('cashbox.opened', (cashbox: any) => {
      this._caja.set(cashbox);
      this._listeners.forEach(fn => fn());
    });

    this.socket.on('cashbox.closed', () => {
      this._caja.set(null);
      this._listeners.forEach(fn => fn());
    });
  }

  checkActiveSession(id_sede: number): Promise<any> {
    return new Promise((resolve) => {
      const doCheck = () => {
        this.socket.emit('checkActiveSession', { id_sede }, (data: any) => {
          const abierta = data && (data.estado === 'ABIERTA' || data.active === true);
          this._caja.set(abierta ? data : null);
          resolve(data);
        });
      };

      if (this.socket.connected) {
        doCheck();
      } else {
        this.socket.once('connect', doCheck);
      }
    });
  }
  onCashboxEvent(callback: () => void): void {
    this._listeners.add(callback);
  }
  offCashboxEvent(callback: () => void): void {
    this._listeners.delete(callback);
  }
}
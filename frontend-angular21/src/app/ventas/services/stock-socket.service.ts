import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class StockSocketService {
  private socket: Socket;
  private readonly _connected = signal<boolean>(false);

  readonly connected = this._connected.asReadonly();

  constructor() {
    this.socket = io(`${environment.apiUrlSocket}/stock`, {
      path: '/sales/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: false,
    });

    this.socket.on('connect', () => {
      this._connected.set(true);
      console.log('📦 [Stock Socket] Conectado exitosamente al backend!');
    });

    this.socket.on('disconnect', () => this._connected.set(false));
  }
  
  onStockActualizado(callback: (data: any) => void): void {
    this.socket.on('stock.devolucion_exitosa', callback);
  }

  offStockActualizado(callback: (data: any) => void): void {
    this.socket.off('stock.devolucion_exitosa', callback);
  }
}

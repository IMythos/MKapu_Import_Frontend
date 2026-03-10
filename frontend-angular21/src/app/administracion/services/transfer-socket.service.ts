import { Injectable, NgZone, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../enviroments/enviroment';
import type { TransferSocketEventDto } from '../interfaces/transferencia.interface';

type TransferSocketConnectionState = 'disconnected' | 'connecting' | 'connected';

@Injectable({ providedIn: 'root' })
export class TransferSocketService {
  private readonly zone = inject(NgZone);
  private socket: Socket | null = null;
  private connectedHeadquarterId: string | null = null;

  readonly connectionState = signal<TransferSocketConnectionState>('disconnected');
  readonly lastNewRequest = signal<TransferSocketEventDto | null>(null);
  readonly lastStatusUpdate = signal<TransferSocketEventDto | null>(null);
  readonly lastError = signal<string | null>(null);

  connect(headquartersId: string | number | null | undefined): void {
    const normalizedHeadquarterId = String(headquartersId ?? '').trim();
    if (!normalizedHeadquarterId) {
      this.disconnect();
      return;
    }

    if (this.socket && this.connectedHeadquarterId === normalizedHeadquarterId) {
      return;
    }

    this.disconnect(false);
    this.connectedHeadquarterId = normalizedHeadquarterId;
    this.connectionState.set('connecting');
    this.lastError.set(null);

    const socket = io(`${environment.apiUrl}/transfers`, {
      path: '/logistics/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: false,
      query: {
        headquartersId: normalizedHeadquarterId,
      },
    });

    this.socket = socket;

    socket.on('connect', () =>
      this.runInZone(() => {
        this.connectionState.set('connected');
        this.lastError.set(null);
      }),
    );

    socket.on('disconnect', () =>
      this.runInZone(() => {
        this.connectionState.set('disconnected');
      }),
    );

    socket.on('connect_error', (error: Error) =>
      this.runInZone(() => {
        this.connectionState.set('disconnected');
        this.lastError.set(
          error.message || 'No se pudo conectar al canal en tiempo real de transferencias.',
        );
      }),
    );

    socket.on('new_transfer_request', (payload: TransferSocketEventDto) =>
      this.runInZone(() => {
        this.lastNewRequest.set(this.normalizeEvent(payload));
      }),
    );

    socket.on('transfer_status_updated', (payload: TransferSocketEventDto) =>
      this.runInZone(() => {
        this.lastStatusUpdate.set(this.normalizeEvent(payload));
      }),
    );
  }

  disconnect(resetEvents: boolean = true): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectedHeadquarterId = null;
    this.connectionState.set('disconnected');
    this.lastError.set(null);

    if (resetEvents) {
      this.lastNewRequest.set(null);
      this.lastStatusUpdate.set(null);
    }
  }

  private normalizeEvent(
    payload: TransferSocketEventDto | null | undefined,
  ): TransferSocketEventDto {
    return {
      message: String(payload?.message ?? '').trim(),
      emittedAt: String(payload?.emittedAt ?? new Date().toISOString()),
      transfer: {
        ...(payload?.transfer ?? {}),
      },
    };
  }

  private runInZone(callback: () => void): void {
    this.zone.run(callback);
  }
}

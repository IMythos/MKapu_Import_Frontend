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
  private readonly consumerHeadquarters = new Map<string, string>();

  readonly connectionState = signal<TransferSocketConnectionState>('disconnected');
  readonly lastNewRequest = signal<TransferSocketEventDto | null>(null);
  readonly lastStatusUpdate = signal<TransferSocketEventDto | null>(null);
  readonly lastError = signal<string | null>(null);

  connect(
    headquartersId: string | number | null | undefined,
    owner: string = 'default',
  ): void {
    const normalizedHeadquarterId = String(headquartersId ?? '').trim();
    if (!normalizedHeadquarterId) {
      this.disconnect(owner);
      return;
    }

    this.consumerHeadquarters.set(owner, normalizedHeadquarterId);
    this.ensureConnection();
  }

  disconnect(owner: string = 'default'): void {
    this.consumerHeadquarters.delete(owner);
    this.ensureConnection();
  }

  private ensureConnection(): void {
    const targetHeadquarterId = this.resolveTargetHeadquarterId();
    if (!targetHeadquarterId) {
      this.teardownSocket(true);
      return;
    }

    if (this.socket && this.connectedHeadquarterId === targetHeadquarterId) {
      return;
    }

    this.teardownSocket(false);
    this.createSocket(targetHeadquarterId);
  }

  private resolveTargetHeadquarterId(): string | null {
    const requestedHeadquarters = Array.from(
      new Set(this.consumerHeadquarters.values()),
    );

    if (requestedHeadquarters.length === 0) {
      return null;
    }

    if (requestedHeadquarters.length > 1) {
      console.warn(
        '[TransferSocketService] Se detectaron multiples sedes consumidoras del mismo socket. Se usara la primera.',
        requestedHeadquarters,
      );
    }

    return requestedHeadquarters[0] ?? null;
  }

  private createSocket(headquartersId: string): void {
    this.connectedHeadquarterId = headquartersId;
    this.connectionState.set('connecting');
    this.lastError.set(null);

    const socket = io(`${environment.apiUrlSocket}/transfers`, {
      path: '/logistics/socket.io',
      //path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: false,
      query: {
        headquartersId,
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
          error.message ||
            'No se pudo conectar al canal en tiempo real de transferencias.',
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

  private teardownSocket(resetEvents: boolean): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectedHeadquarterId = null;
    this.connectionState.set('disconnected');

    if (this.consumerHeadquarters.size === 0) {
      this.lastError.set(null);
      if (resetEvents) {
        this.lastNewRequest.set(null);
        this.lastStatusUpdate.set(null);
      }
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

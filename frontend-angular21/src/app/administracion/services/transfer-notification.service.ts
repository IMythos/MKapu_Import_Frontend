import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  StoredTransferNotification,
  TransferApiError,
  TransferNotificationStatus,
  TransferSocketEventDto,
  TransferRole,
  TransferNotificationResponseDto,
} from '../interfaces/transferencia.interface';
import { TransferSocketService } from './transfer-socket.service';
import { TransferUserContextService } from './transfer-user-context.service';
import { TransferApiService } from './transferencia.service';

const STORAGE_PREFIX = 'transfer_notifications';
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
const RELEVANT_STATUSES: ReadonlySet<TransferNotificationStatus> = new Set([
  'SOLICITADA',
  'APROBADA',
  'RECHAZADA',
]);

@Injectable({ providedIn: 'root' })
export class TransferNotificationService {
  private readonly transferApi = inject(TransferApiService);
  private readonly transferSocket = inject(TransferSocketService);
  private readonly userContext = inject(TransferUserContextService);
  private readonly active = signal(false);
  private readonly currentHeadquartersId = signal<string | null>(null);
  private readonly currentRole = signal<TransferRole>('JEFE DE ALMACEN');
  private readonly storageKey = signal<string | null>(null);
  private readonly socketFingerprints = new Set<string>();

  readonly notifications = signal<StoredTransferNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly canConsume = computed(
    () => this.currentRole() === 'ADMINISTRADOR' && !!this.currentHeadquartersId(),
  );

  constructor() {
    effect(() => {
      const event = this.transferSocket.lastNewRequest();
      if (!event || !this.active() || !this.canConsume() || !this.isRelevantSocketEvent(event)) {
        return;
      }

      void this.refreshFromSocket(event);
    });

    effect(() => {
      const event = this.transferSocket.lastStatusUpdate();
      if (!event || !this.active() || !this.canConsume() || !this.isRelevantSocketEvent(event)) {
        return;
      }

      void this.refreshFromSocket(event);
    });
  }

  start(): void {
    const headquartersId = this.userContext.getCurrentHeadquarterId();
    const role = this.userContext.getCurrentRole();
    const storageKey = this.buildStorageKey(headquartersId, role);

    this.currentHeadquartersId.set(headquartersId);
    this.currentRole.set(role);
    this.storageKey.set(storageKey);
    this.error.set(null);
    this.socketFingerprints.clear();

    const storedNotifications = this.pruneExpired(
      storageKey ? this.readFromStorage(storageKey) : [],
    );
    this.notifications.set(this.sortNotifications(storedNotifications));
    this.persistCurrentState();

    if (role !== 'ADMINISTRADOR' || !headquartersId) {
      this.active.set(false);
      this.transferSocket.disconnect();
      return;
    }

    this.active.set(true);
    this.transferSocket.connect(headquartersId);
    void this.refresh();
  }

  stop(): void {
    this.active.set(false);
    this.loading.set(false);
    this.error.set(null);
    this.socketFingerprints.clear();
    this.transferSocket.disconnect();
  }

  async refresh(): Promise<void> {
    const headquartersId = this.currentHeadquartersId();
    const role = this.currentRole();
    if (!this.canConsume() || !headquartersId) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.transferApi.listNotifications({ headquartersId, role }),
      );
      const merged = this.mergeNotifications(response);
      this.notifications.set(merged);
      this.persistCurrentState();
    } catch (error: unknown) {
      this.error.set(this.resolveErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  markAsRead(transferId: number): void {
    this.notifications.update((items) =>
      this.sortNotifications(
        items.map((item) =>
          item.transferId === transferId ? { ...item, read: true } : item,
        ),
      ),
    );
    this.persistCurrentState();
  }

  markAllAsRead(): void {
    this.notifications.update((items) =>
      this.sortNotifications(items.map((item) => ({ ...item, read: true }))),
    );
    this.persistCurrentState();
  }

  removeNotification(transferId: number): void {
    const now = new Date().toISOString();
    this.notifications.update((items) =>
      items.map((item) =>
        item.transferId === transferId
          ? { ...item, deletedAt: now, updatedAt: now }
          : item,
      ),
    );
    this.persistCurrentState();
  }

  removeAll(): void {
    const now = new Date().toISOString();
    this.notifications.update((items) =>
      items.map((item) => ({ ...item, deletedAt: now, updatedAt: now })),
    );
    this.persistCurrentState();
  }

  private async refreshFromSocket(event: TransferSocketEventDto): Promise<void> {
    const transferId = Number(event.transfer?.id ?? 0);
    const status = String(event.transfer?.status ?? '').trim().toUpperCase();
    const emittedAt = String(event.emittedAt ?? '');
    const fingerprint = `${transferId}:${status}:${emittedAt}`;

    if (this.socketFingerprints.has(fingerprint)) {
      return;
    }

    this.socketFingerprints.add(fingerprint);

    try {
      await this.refresh();
    } finally {
      queueMicrotask(() => {
        this.socketFingerprints.delete(fingerprint);
      });
    }
  }

  private mergeNotifications(
    incoming: TransferNotificationResponseDto[],
  ): StoredTransferNotification[] {
    const existingMap = new Map(
      this.pruneExpired(this.notifications()).map((item) => [item.transferId, item]),
    );

    for (const notification of incoming) {
      if (!this.isRelevantNotificationStatus(notification.status)) {
        continue;
      }

      const existing = existingMap.get(notification.transferId);
      if (!existing) {
        existingMap.set(
          notification.transferId,
          this.createStoredNotification(notification),
        );
        continue;
      }

      const samePayload =
        existing.status === notification.status &&
        existing.title === notification.title &&
        existing.message === notification.message;

      if (samePayload) {
        existingMap.set(notification.transferId, {
          ...existing,
          title: notification.title,
          message: notification.message,
          status: notification.status,
        });
        continue;
      }

      const now = new Date().toISOString();
      existingMap.set(notification.transferId, {
        ...existing,
        ...notification,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        read: false,
      });
    }

    return this.sortNotifications(Array.from(existingMap.values()));
  }

  private createStoredNotification(
    notification: TransferNotificationResponseDto,
  ): StoredTransferNotification {
    const now = new Date().toISOString();
    return {
      ...notification,
      createdAt: now,
      updatedAt: now,
      read: false,
      deletedAt: null,
    };
  }

  private pruneExpired(
    notifications: StoredTransferNotification[],
  ): StoredTransferNotification[] {
    const now = Date.now();
    return notifications.filter((notification) => {
      const createdAt = Date.parse(notification.createdAt);
      if (Number.isNaN(createdAt)) {
        return false;
      }

      return now - createdAt <= SEVEN_DAYS_IN_MS;
    });
  }

  private sortNotifications(
    notifications: StoredTransferNotification[],
  ): StoredTransferNotification[] {
    return [...notifications].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
  }

  private buildStorageKey(
    headquartersId: string | null,
    role: TransferRole,
  ): string | null {
    const normalizedHeadquartersId = String(headquartersId ?? '').trim();
    if (!normalizedHeadquartersId) {
      return null;
    }

    return `${STORAGE_PREFIX}:${normalizedHeadquartersId}:${role}`;
  }

  private readFromStorage(storageKey: string): StoredTransferNotification[] {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item): item is StoredTransferNotification =>
        this.isStoredNotification(item),
      );
    } catch {
      return [];
    }
  }

  private persistCurrentState(): void {
    const storageKey = this.storageKey();
    if (!storageKey) {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(this.pruneExpired(this.notifications())),
    );
  }

  private isStoredNotification(
    value: unknown,
  ): value is StoredTransferNotification {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<StoredTransferNotification>;
    return (
      typeof candidate.transferId === 'number' &&
      typeof candidate.title === 'string' &&
      typeof candidate.message === 'string' &&
      typeof candidate.createdAt === 'string' &&
      typeof candidate.updatedAt === 'string' &&
      typeof candidate.read === 'boolean' &&
      (candidate.deletedAt === null || typeof candidate.deletedAt === 'string') &&
      this.isRelevantNotificationStatus(candidate.status)
    );
  }

  private isRelevantSocketEvent(
    event: TransferSocketEventDto | null,
  ): boolean {
    if (!event) {
      return false;
    }

    return this.isRelevantNotificationStatus(
      String(event.transfer?.status ?? '').trim().toUpperCase(),
    );
  }

  private isRelevantNotificationStatus(
    value: unknown,
  ): value is TransferNotificationStatus {
    return (
      typeof value === 'string' &&
      RELEVANT_STATUSES.has(value as TransferNotificationStatus)
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as TransferApiError).message === 'string'
    ) {
      return (error as TransferApiError).message;
    }

    return 'No se pudo actualizar la bandeja de transferencias.';
  }
}


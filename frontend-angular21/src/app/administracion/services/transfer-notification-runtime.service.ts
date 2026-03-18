import { Injectable, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { TransferNotificationService } from './transfer-notification.service';

@Injectable({ providedIn: 'root' })
export class TransferNotificationRuntimeService {
  private readonly notificationService = inject(TransferNotificationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly started = signal(false);
  private readonly lastToastFingerprint = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.started()) {
        return;
      }

      const notification = this.notificationService.lastRealtimeNotification();
      if (!notification) {
        return;
      }

      const fingerprint = `${notification.transferId}:${notification.status}:${notification.updatedAt}`;
      if (this.lastToastFingerprint() === fingerprint) {
        return;
      }
      this.lastToastFingerprint.set(fingerprint);

      if (!this.shouldShowToastForCurrentRoute(this.router.url)) {
        return;
      }

      this.messageService.add({
        key: 'global-transfer-notifications',
        severity: 'info',
        summary: 'Nueva notificacion',
        detail: 'Tienes una nueva notificacion de transferencia.',
        life: 4500,
      });
    });
  }

  start(): void {
    const bootstrap = () => {
      try {
        if (this.started()) {
          this.notificationService.start();
          return;
        }

        this.started.set(true);
        this.notificationService.start();

        this.router.events
          .pipe(filter((event) => event instanceof NavigationEnd))
          .subscribe(() => {
            try {
              this.notificationService.start();
            } catch (error) {
              console.error(
                '[TransferNotificationRuntimeService] No se pudo refrescar el runtime global de notificaciones.',
                error,
              );
            }
          });
      } catch (error) {
        console.error(
          '[TransferNotificationRuntimeService] No se pudo iniciar el runtime global de notificaciones.',
          error,
        );
      }
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(bootstrap);
      return;
    }

    setTimeout(bootstrap, 0);
  }

  private shouldShowToastForCurrentRoute(url: string): boolean {
    const normalizedUrl = String(url ?? '').toLowerCase();
    return (
      !normalizedUrl.includes('/transferencia') &&
      !normalizedUrl.includes('/notificaciones')
    );
  }
}

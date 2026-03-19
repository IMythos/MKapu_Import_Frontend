import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import type {
  StoredTransferNotification,
  TransferNotificationStatus,
} from '../../interfaces/transferencia.interface';
import { TransferNotificationService } from '../../services/transfer-notification.service';
import { TransferUserContextService } from '../../services/transfer-user-context.service';

type NotificationView = 'all' | 'unread' | 'read';
type NotificationPalette = 'amber' | 'emerald' | 'rose';
type NotificationStatusFilter = 'all' | TransferNotificationStatus;

interface NotificationOption<T> {
  label: string;
  value: T;
}

interface SummaryCard {
  label: string;
  value: number;
  description: string;
  icon: string;
  tone: NotificationPalette;
}

interface NotificationListItem {
  transferId: number;
  title: string;
  message: string;
  status: TransferNotificationStatus;
  read: boolean;
  createdAt: string;
  timeLabel: string;
  detail: string;
  site: string;
  icon: string;
  palette: NotificationPalette;
}

const STATUS_LABELS: Record<NotificationStatusFilter, string> = {
  all: 'Todas',
  SOLICITADA: 'Solicitadas',
  APROBADA: 'Aprobadas',
  RECHAZADA: 'Rechazadas',
};

const STATUS_OPTIONS: NotificationOption<NotificationStatusFilter>[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Solicitadas', value: 'SOLICITADA' },
  { label: 'Aprobadas', value: 'APROBADA' },
  { label: 'Rechazadas', value: 'RECHAZADA' },
];

@Component({
  selector: 'app-notificacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule],
  templateUrl: './notificacion-admin.html',
  styleUrl: './notificacion-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionAdmin implements OnInit {
  private readonly router = inject(Router);
  private readonly notificationService = inject(TransferNotificationService);
  private readonly userContext = inject(TransferUserContextService);

  readonly statusOptions = STATUS_OPTIONS;
  readonly role = this.userContext.getCurrentRole();
  readonly headquartersId = this.userContext.getCurrentHeadquarterId();
  readonly canViewNotifications =
    this.role === 'ADMINISTRADOR' && !!this.headquartersId;
  readonly notifications = this.notificationService.notifications;
  readonly loading = this.notificationService.loading;
  readonly backendError = this.notificationService.error;
  readonly view = signal<NotificationView>('all');
  readonly selectedStatus = signal<NotificationStatusFilter>('all');
  readonly searchTerm = signal('');

  readonly visibleNotifications = computed(() =>
    this.notifications().filter((item) => item.deletedAt === null),
  );

  readonly unreadCount = computed(() =>
    this.visibleNotifications().filter((item) => !item.read).length,
  );

  readonly requestedCount = computed(() =>
    this.visibleNotifications().filter((item) => item.status === 'SOLICITADA').length,
  );

  readonly resolvedCount = computed(() =>
    this.visibleNotifications().filter(
      (item) => item.status === 'APROBADA' || item.status === 'RECHAZADA',
    ).length,
  );

  readonly statusCounts = computed(() => ({
    all: this.visibleNotifications().length,
    unread: this.visibleNotifications().filter((item) => !item.read).length,
    read: this.visibleNotifications().filter((item) => item.read).length,
  }));

  readonly hasActiveFilters = computed(
    () =>
      this.view() !== 'all' ||
      this.selectedStatus() !== 'all' ||
      this.searchTerm().trim().length > 0,
  );

  readonly summaryCards = computed<SummaryCard[]>(() => [
    {
      label: 'Sin leer',
      value: this.unreadCount(),
      description: 'Alertas pendientes del modulo de transferencias',
      icon: 'pi pi-bell',
      tone: 'amber',
    },
    {
      label: 'Solicitadas',
      value: this.requestedCount(),
      description: 'Solicitudes que requieren respuesta en la sede asignada',
      icon: 'pi pi-send',
      tone: 'amber',
    },
    {
      label: 'Respondidas',
      value: this.resolvedCount(),
      description: 'Transferencias aprobadas o rechazadas recientemente',
      icon: 'pi pi-check-circle',
      tone: 'emerald',
    },
  ]);

  readonly filteredNotifications = computed(() => {
    const currentView = this.view();
    const currentStatus = this.selectedStatus();
    const normalizedTerm = this.searchTerm().trim().toLowerCase();

    return this.visibleNotifications()
      .map((item) => this.toListItem(item))
      .filter((item) =>
        currentView === 'all'
          ? true
          : currentView === 'unread'
            ? !item.read
            : item.read,
      )
      .filter((item) =>
        currentStatus === 'all' ? true : item.status === currentStatus,
      )
      .filter((item) =>
        normalizedTerm ? this.matchesSearch(item, normalizedTerm) : true,
      )
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt),
      );
  });

  readonly listTitle = computed(() => {
    switch (this.view()) {
      case 'unread':
        return 'Pendientes de lectura';
      case 'read':
        return 'Historial local';
      default:
        return 'Actividad de transferencias';
    }
  });

  readonly listDescription = computed(() => {
    if (!this.canViewNotifications) {
      return 'Disponible solo para administradores con una sede asignada.';
    }

    if (this.selectedStatus() === 'all') {
      return 'Bandeja derivada de transferencias solicitadas, aprobadas o rechazadas.';
    }

    return `Bandeja filtrada por ${STATUS_LABELS[this.selectedStatus()].toLowerCase()}.`;
  });

  readonly collectionStatus = computed(() => {
    const visible = this.filteredNotifications().length;
    const total = this.visibleNotifications().length;
    const label = total === 1 ? 'notificacion' : 'notificaciones';
    return `${visible} de ${total} ${label}`;
  });

  ngOnInit(): void {
    this.notificationService.start();
  }


  setView(view: NotificationView): void {
    this.view.set(view);
  }

  setStatus(status: NotificationStatusFilter | null | undefined): void {
    this.selectedStatus.set(status ?? 'all');
  }

  updateSearch(term: string | null | undefined): void {
    this.searchTerm.set(term ?? '');
  }

  clearFilters(): void {
    this.view.set('all');
    this.selectedStatus.set('all');
    this.searchTerm.set('');
  }

  async refreshNotifications(): Promise<void> {
    await this.notificationService.refresh();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  removeAll(): void {
    this.notificationService.removeAll();
  }

  markAsRead(transferId: number): void {
    this.notificationService.markAsRead(transferId);
  }

  removeNotification(transferId: number): void {
    this.notificationService.removeNotification(transferId);
  }

  async openNotification(item: NotificationListItem): Promise<void> {
    this.notificationService.markAsRead(item.transferId);
    await this.router.navigate(['/admin/transferencia'], {
      queryParams: { notificationTransferId: item.transferId },
    });
  }

  statusLabel(status: TransferNotificationStatus): string {
    return STATUS_LABELS[status];
  }

  statusChipClass(status: TransferNotificationStatus): string {
    switch (status) {
      case 'SOLICITADA':
        return 'notification-chip notification-chip--status-requested';
      case 'APROBADA':
        return 'notification-chip notification-chip--status-approved';
      case 'RECHAZADA':
        return 'notification-chip notification-chip--status-rejected';
    }
  }

  emptyTitle(): string {
    if (!this.canViewNotifications) {
      return 'Notificaciones no disponibles';
    }

    if (this.backendError()) {
      return 'No se pudo cargar la bandeja';
    }

    return 'No hay notificaciones activas';
  }

  emptyDescription(): string {
    if (!this.canViewNotifications) {
      return 'La bandeja de transferencias solo esta disponible para usuarios administradores con una sede asignada.';
    }

    if (this.backendError()) {
      return this.backendError() ?? 'Intenta actualizar nuevamente.';
    }

    if (this.hasActiveFilters()) {
      return 'Ajusta la busqueda o limpia los filtros para recuperar eventos visibles.';
    }

    return 'No hay alertas de transferencias para mostrar en esta sede.';
  }

  private toListItem(notification: StoredTransferNotification): NotificationListItem {
    const statusPresentation = this.getStatusPresentation(notification.status);
    return {
      transferId: notification.transferId,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      read: notification.read,
      createdAt: notification.createdAt,
      timeLabel: this.formatRelativeTime(notification.createdAt),
      detail: `Transferencia #${notification.transferId}`,
      site: 'Gestion de transferencias',
      icon: statusPresentation.icon,
      palette: statusPresentation.palette,
    };
  }

  private getStatusPresentation(
    status: TransferNotificationStatus,
  ): { icon: string; palette: NotificationPalette } {
    switch (status) {
      case 'SOLICITADA':
        return { icon: 'pi pi-send', palette: 'amber' };
      case 'APROBADA':
        return { icon: 'pi pi-check-circle', palette: 'emerald' };
      case 'RECHAZADA':
        return { icon: 'pi pi-times-circle', palette: 'rose' };
    }
  }

  private formatRelativeTime(value: string): string {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return 'Ahora';
    }

    const diffInMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (diffInMinutes < 1) {
      return 'Ahora';
    }
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes === 1 ? '' : 's'}`;
    }
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours} hora${hours === 1 ? '' : 's'}`;
    }

    const days = Math.floor(diffInMinutes / 1440);
    return `Hace ${days} dia${days === 1 ? '' : 's'}`;
  }

  private matchesSearch(item: NotificationListItem, term: string): boolean {
    const source = [
      item.title,
      item.message,
      item.detail,
      item.site,
      this.statusLabel(item.status),
    ]
      .join(' ')
      .toLowerCase();

    return source.includes(term);
  }
}

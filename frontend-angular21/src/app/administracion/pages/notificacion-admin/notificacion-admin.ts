import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

type NotificationView = 'all' | 'nuevo' | 'anterior';
type NotificationCategory =
  | 'all'
  | 'transferencia'
  | 'reposicion'
  | 'venta'
  | 'incidencia'
  | 'sistema';
type NotificationPalette = 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';

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

interface NotificationItem {
  id: number;
  view: Exclude<NotificationView, 'all'>;
  category: Exclude<NotificationCategory, 'all'>;
  read: boolean;
  title: string;
  subject: string;
  description: string;
  detail: string;
  site: string;
  timeLabel: string;
  ageMinutes: number;
  icon: string;
  palette: NotificationPalette;
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  all: 'Todas',
  transferencia: 'Transferencias',
  reposicion: 'Reposiciones',
  venta: 'Ventas',
  incidencia: 'Incidencias',
  sistema: 'Sistema',
};

const CATEGORY_OPTIONS: NotificationOption<NotificationCategory>[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Transferencias', value: 'transferencia' },
  { label: 'Reposiciones', value: 'reposicion' },
  { label: 'Ventas', value: 'venta' },
  { label: 'Incidencias', value: 'incidencia' },
  { label: 'Sistema', value: 'sistema' },
];

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 101,
    view: 'nuevo',
    category: 'transferencia',
    read: false,
    title: 'Transferencia completada',
    subject: 'Tarjeta de Video NVIDIA RTX2060',
    description:
      'La mercaderia llego a destino y el stock ya quedo disponible para despacho.',
    detail: 'Ruta: Sede Miraflores -> Sede San Juan de Lurigancho',
    site: 'Operacion de logistica',
    timeLabel: 'Hace 5 minutos',
    ageMinutes: 5,
    icon: 'pi pi-send',
    palette: 'amber',
  },
  {
    id: 102,
    view: 'nuevo',
    category: 'reposicion',
    read: false,
    title: 'Reposicion realizada',
    subject: 'Monitor LG 27" LED',
    description:
      'Se agregaron 10 unidades al almacen operativo y el nuevo saldo ya esta visible en ventas.',
    detail: 'Destino: Sede Miraflores / Almacen Central',
    site: 'Reposicion aprobada por compras',
    timeLabel: 'Hace 20 minutos',
    ageMinutes: 20,
    icon: 'pi pi-box',
    palette: 'emerald',
  },
  {
    id: 103,
    view: 'nuevo',
    category: 'venta',
    read: false,
    title: 'Venta completada',
    subject: 'Cooler Master Fuente 750W MWE Gold',
    description:
      'El comprobante fue emitido y la salida del inventario quedo cerrada sin diferencias.',
    detail: 'Canal: Tienda online',
    site: 'Documento asociado: F001-00018452',
    timeLabel: 'Hace 1 hora',
    ageMinutes: 60,
    icon: 'pi pi-shopping-cart',
    palette: 'sky',
  },
  {
    id: 104,
    view: 'anterior',
    category: 'incidencia',
    read: true,
    title: 'Incidencia rechazada',
    subject: 'Solicitud de traslado de 5 SSD Samsung 970 EVO Plus 1TB',
    description:
      'La validacion operativa detecto una diferencia entre stock teorico y stock disponible.',
    detail: 'Observacion: faltan series registradas en la salida',
    site: 'Sede Miraflores',
    timeLabel: 'Hace 3 horas',
    ageMinutes: 180,
    icon: 'pi pi-exclamation-triangle',
    palette: 'rose',
  },
  {
    id: 105,
    view: 'anterior',
    category: 'transferencia',
    read: true,
    title: 'Transferencia programada',
    subject: 'Procesador 3L',
    description:
      'La solicitud fue aprobada y paso a cola de despacho para la ruta intersedes del cierre de turno.',
    detail: 'Ruta: Sede SJL -> Sede Comas',
    site: 'Pendiente de confirmacion fisica',
    timeLabel: 'Hace 5 horas',
    ageMinutes: 300,
    icon: 'pi pi-send',
    palette: 'amber',
  },
  {
    id: 106,
    view: 'anterior',
    category: 'sistema',
    read: true,
    title: 'Sincronizacion estable',
    subject: 'Canal de inventario',
    description:
      'La replica entre administracion y logistica respondio sin errores durante la ultima verificacion.',
    detail: 'Latencia media: 142 ms',
    site: 'Monitoreo automatico',
    timeLabel: 'Hace 6 horas',
    ageMinutes: 360,
    icon: 'pi pi-cog',
    palette: 'violet',
  },
  {
    id: 107,
    view: 'anterior',
    category: 'incidencia',
    read: false,
    title: 'Revision manual requerida',
    subject: 'Lote de cafeteras RAF R110',
    description:
      'Se detectaron movimientos pendientes de conciliacion entre almacen origen y almacen destino.',
    detail: 'Accion sugerida: revisar detalle de movimiento 3028',
    site: 'Sede Principal',
    timeLabel: 'Ayer, 09:14',
    ageMinutes: 1994,
    icon: 'pi pi-exclamation-triangle',
    palette: 'rose',
  },
  {
    id: 108,
    view: 'anterior',
    category: 'reposicion',
    read: true,
    title: 'Reposicion cerrada',
    subject: 'Batidora pedestal 8L',
    description:
      'El reabastecimiento concluyo con ingreso completo y stock alineado en el almacen secundario.',
    detail: 'Destino: Sede SJL / Almacen Secundario',
    site: 'Orden interna RP-204',
    timeLabel: 'Ayer, 08:20',
    ageMinutes: 1940,
    icon: 'pi pi-box',
    palette: 'emerald',
  },
  {
    id: 109,
    view: 'anterior',
    category: 'venta',
    read: true,
    title: 'Venta anulada',
    subject: 'Laptop HP Pavilion 15 Intel Core i5',
    description:
      'La reserva fue revertida y las unidades regresaron al stock disponible de tienda.',
    detail: 'Motivo: pago no confirmado por pasarela',
    site: 'Caja virtual',
    timeLabel: 'Ayer, 07:48',
    ageMinutes: 1908,
    icon: 'pi pi-shopping-cart',
    palette: 'sky',
  },
  {
    id: 110,
    view: 'anterior',
    category: 'sistema',
    read: true,
    title: 'Recordatorio operativo',
    subject: 'Cierre de notificaciones',
    description:
      'Los eventos con mas de 48 horas sin accion seran archivados automaticamente en el historial.',
    detail: 'Ventana de limpieza: 22:00',
    site: 'Politica del modulo administrativo',
    timeLabel: 'Ayer, 06:05',
    ageMinutes: 1865,
    icon: 'pi pi-cog',
    palette: 'violet',
  },
];

@Component({
  selector: 'app-notificacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule],
  templateUrl: './notificacion-admin.html',
  styleUrl: './notificacion-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionAdmin {
  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly notifications = signal<NotificationItem[]>([...DEMO_NOTIFICATIONS]);
  readonly view = signal<NotificationView>('all');
  readonly selectedCategory = signal<NotificationCategory>('all');
  readonly searchTerm = signal('');

  readonly unreadCount = computed(() =>
    this.notifications().filter((item) => !item.read).length,
  );

  readonly newCount = computed(() =>
    this.notifications().filter((item) => item.view === 'nuevo').length,
  );

  readonly previousCount = computed(() =>
    this.notifications().filter((item) => item.view === 'anterior').length,
  );

  readonly attentionCount = computed(() =>
    this.notifications().filter(
      (item) => !item.read || item.category === 'incidencia',
    ).length,
  );

  readonly viewCounts = computed(() => ({
    all: this.notifications().length,
    nuevo: this.newCount(),
    anterior: this.previousCount(),
  }));

  readonly hasActiveFilters = computed(
    () =>
      this.view() !== 'all' ||
      this.selectedCategory() !== 'all' ||
      this.searchTerm().trim().length > 0,
  );

  readonly summaryCards = computed<SummaryCard[]>(() => [
    {
      label: 'Sin leer',
      value: this.unreadCount(),
      description: 'Alertas pendientes del equipo administrativo',
      icon: 'pi pi-bell',
      tone: 'amber',
    },
    {
      label: 'Nuevas',
      value: this.newCount(),
      description: 'Eventos recientes del turno actual',
      icon: 'pi pi-bolt',
      tone: 'emerald',
    },
    {
      label: 'Atencion',
      value: this.attentionCount(),
      description: 'Incidencias y eventos que requieren seguimiento',
      icon: 'pi pi-exclamation-circle',
      tone: 'rose',
    },
  ]);

  readonly filteredNotifications = computed(() => {
    const currentView = this.view();
    const currentCategory = this.selectedCategory();
    const normalizedTerm = this.searchTerm().trim().toLowerCase();

    return [...this.notifications()]
      .filter((item) =>
        currentView === 'all' ? true : item.view === currentView,
      )
      .filter((item) =>
        currentCategory === 'all' ? true : item.category === currentCategory,
      )
      .filter((item) =>
        normalizedTerm ? this.matchesSearch(item, normalizedTerm) : true,
      )
      .sort((left, right) => left.ageMinutes - right.ageMinutes);
  });

  readonly listTitle = computed(() => {
    switch (this.view()) {
      case 'nuevo':
        return 'Bandeja nueva';
      case 'anterior':
        return 'Historial reciente';
      default:
        return 'Actividad centralizada';
    }
  });

  readonly listDescription = computed(() => {
    const category = this.selectedCategory();

    if (this.view() === 'nuevo') {
      return category === 'all'
        ? 'Eventos recientes con foco en operaciones, stock y ventas.'
        : `Eventos recientes filtrados por ${CATEGORY_LABELS[category].toLowerCase()}.`;
    }

    if (this.view() === 'anterior') {
      return category === 'all'
        ? 'Historial consolidado de las alertas mas relevantes.'
        : `Historial filtrado por ${CATEGORY_LABELS[category].toLowerCase()}.`;
    }

    return category === 'all'
      ? 'Vista general con transferencias, incidencias, reposiciones y sistema.'
      : `Vista general enfocada en ${CATEGORY_LABELS[category].toLowerCase()}.`;
  });

  readonly collectionStatus = computed(() => {
    const visible = this.filteredNotifications().length;
    const total = this.notifications().length;
    const label = total === 1 ? 'notificacion' : 'notificaciones';

    return `${visible} de ${total} ${label}`;
  });

  setView(view: NotificationView): void {
    this.view.set(view);
  }

  setCategory(category: NotificationCategory | null | undefined): void {
    this.selectedCategory.set(category ?? 'all');
  }

  updateSearch(term: string | null | undefined): void {
    this.searchTerm.set(term ?? '');
  }

  clearFilters(): void {
    this.view.set('all');
    this.selectedCategory.set('all');
    this.searchTerm.set('');
  }

  markAllAsRead(): void {
    this.notifications.update((items) =>
      items.map((item) => (item.read ? item : { ...item, read: true })),
    );
  }

  removeAll(): void {
    this.notifications.set([]);
  }

  restoreDemoState(): void {
    this.notifications.set([...DEMO_NOTIFICATIONS]);
    this.clearFilters();
  }

  markAsRead(id: number): void {
    this.notifications.update((items) =>
      items.map((item) =>
        item.id === id && !item.read ? { ...item, read: true } : item,
      ),
    );
  }

  removeNotification(id: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  categoryLabel(category: NotificationCategory): string {
    return CATEGORY_LABELS[category];
  }

  private matchesSearch(item: NotificationItem, term: string): boolean {
    const source = [
      item.title,
      item.subject,
      item.description,
      item.detail,
      item.site,
      this.categoryLabel(item.category),
    ]
      .join(' ')
      .toLowerCase();

    return source.includes(term);
  }
}
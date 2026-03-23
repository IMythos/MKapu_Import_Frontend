import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { Customer } from '../../../../services/cliente.service';
import {
  CustomerTrackingData,
  CustomerTrackingQuote,
  CustomerTrackingSale,
  CustomerTrackingService,
} from '../../../../services/customer-tracking.service';

interface ClientePerfil {
  nombre: string;
  apellidos: string;
  documento: string;
  email: string;
  telefono: string;
  segmento: string;
  activo: boolean;
}

interface CompraCliente {
  id: number;
  codigo: string;
  fecha: Date;
  total: number;
  estado: string;
}

interface CotizacionCliente {
  id: number;
  codigo: string;
  fecha: Date;
  total: number;
  estado: string;
}

@Component({
  selector: 'app-cliente-seguimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TabsModule,
    DatePickerModule,
    ChartModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './cliente-seguimiento.html',
  styleUrl: './cliente-seguimiento.css',
})
export class ClienteSeguimiento implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly customerTrackingService = inject(CustomerTrackingService);

  private readonly emptyProfile: ClientePerfil = {
    nombre: '',
    apellidos: '',
    documento: '?',
    email: '?',
    telefono: '?',
    segmento: 'NATURAL',
    activo: false,
  };

  private routeSubscription?: Subscription;
  private trackingSubscription?: Subscription;
  private currentCustomerId: string | null = null;

  readonly cliente = signal<ClientePerfil>(this.emptyProfile);
  readonly compras = signal<CompraCliente[]>([]);
  readonly cotizaciones = signal<CotizacionCliente[]>([]);
  readonly fechaInicio = signal<Date | null>(null);
  readonly fechaFin = signal<Date | null>(null);
  readonly loading = signal(false);
  readonly exportando = signal(false);
  readonly chartData = signal(
    this.buildChartData(new Map<string, number>(), new Map<string, number>()),
  );
  readonly chartOptions = signal(this.buildChartOptions());

  readonly nombreCompleto = computed(() => {
    const nombre = this.cliente().nombre.trim();
    const apellidos = this.cliente().apellidos.trim();
    return [nombre, apellidos].filter(Boolean).join(' ') || 'Cliente';
  });

  readonly inicialesCliente = computed(() => {
    const nombre = this.cliente().nombre.trim().charAt(0);
    const apellido = this.cliente().apellidos.trim().charAt(0);
    const iniciales = `${nombre}${apellido}`.trim();
    return iniciales || 'CL';
  });

  readonly estadoClienteLabel = computed(() =>
    this.cliente().activo ? 'Activo' : 'Inactivo',
  );

  readonly estadoClienteSeverity = computed(() =>
    this.cliente().activo ? 'success' : 'danger',
  );

  readonly totalMontoCompras = computed(() =>
    this.compras().reduce((sum, compra) => sum + compra.total, 0),
  );

  readonly totalMontoCotizaciones = computed(() =>
    this.cotizaciones().reduce((sum, cotizacion) => sum + cotizacion.total, 0),
  );

  readonly cotizacionesAprobadas = computed(
    () => this.cotizaciones().filter((item) => item.estado === 'APROBADA').length,
  );

  readonly rangoFechaLabel = computed(() => {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();

    if (!inicio && !fin) return 'Todo el historial';

    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    if (inicio && fin) return `${formatDate(inicio)} - ${formatDate(fin)}`;
    if (inicio) return `Desde ${formatDate(inicio)}`;
    return `Hasta ${formatDate(fin!)}`;
  });

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const customerId = params.get('id');

      if (!customerId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Cliente invalido',
          detail: 'No se encontro el cliente solicitado.',
          life: 3000,
        });
        this.volver();
        return;
      }

      this.currentCustomerId = customerId;
      this.loadTracking();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.trackingSubscription?.unsubscribe();
  }

  aplicarFiltroFechas(): void {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();

    if (inicio && fin && inicio > fin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango invalido',
        detail: 'La fecha de inicio no puede ser mayor que la fecha fin.',
        life: 3000,
      });
      return;
    }

    this.loadTracking();
  }

  limpiarFiltros(): void {
    this.fechaInicio.set(null);
    this.fechaFin.set(null);
    this.loadTracking();
  }

  exportarPDF(): void {
    this.exportando.set(true);

    setTimeout(() => {
      this.exportando.set(false);
      this.messageService.add({
        severity: 'info',
        summary: 'PDF pendiente',
        detail: `La exportacion del reporte de ${this.nombreCompleto()} aun no esta conectada.`,
        life: 3000,
      });
    }, 700);
  }

  getCompraSeverity(
    estado: string,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch ((estado ?? '').toUpperCase()) {
      case 'EMITIDO':
      case 'ENTREGADO':
        return 'success';
      case 'PENDIENTE':
      case 'EN_CAMINO':
        return 'warn';
      case 'ANULADO':
      case 'RECHAZADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getCotizacionSeverity(
    estado: string,
  ): 'success' | 'warn' | 'danger' | 'secondary' {
    switch ((estado ?? '').toUpperCase()) {
      case 'APROBADA':
        return 'success';
      case 'PENDIENTE':
        return 'warn';
      case 'RECHAZADA':
        return 'danger';
      case 'VENCIDA':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  volver(): void {
    this.router.navigate(['/admin/clientes']);
  }

  private loadTracking(): void {
    if (!this.currentCustomerId) {
      return;
    }

    this.trackingSubscription?.unsubscribe();
    this.loading.set(true);

    this.trackingSubscription = this.customerTrackingService
      .getTracking(this.currentCustomerId, this.buildFilters())
      .subscribe({
        next: (data) => {
          this.applyTrackingData(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.compras.set([]);
          this.cotizaciones.set([]);
          this.chartData.set(
            this.buildChartData(
              new Map<string, number>(),
              new Map<string, number>(),
            ),
          );
          this.messageService.add({
            severity: 'error',
            summary: 'Error de carga',
            detail: 'No se pudo cargar el seguimiento del cliente.',
            life: 3000,
          });
        },
      });
  }

  private applyTrackingData(data: CustomerTrackingData): void {
    const cliente = this.mapCustomerProfile(data.customer);
    const compras = this.mapSales(data.sales);
    const cotizaciones = this.mapQuotes(data.quotes);

    this.cliente.set(cliente);
    this.compras.set(compras);
    this.cotizaciones.set(cotizaciones);
    this.chartData.set(
      this.buildChartData(
        this.aggregateMonthly(compras),
        this.aggregateMonthly(cotizaciones),
      ),
    );
  }

  private buildFilters(): { dateFrom?: string; dateTo?: string } {
    return {
      dateFrom: this.formatDateForApi(this.fechaInicio()),
      dateTo: this.formatDateForApi(this.fechaFin()),
    };
  }

  private formatDateForApi(date: Date | null): string | undefined {
    if (!date) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mapCustomerProfile(customer: Customer): ClientePerfil {
    const businessName = customer.businessName?.trim() ?? '';
    const lastName = customer.lastName?.trim() || customer.apellido?.trim() || '';
    const isBusiness = customer.documentTypeSunatCode === '06' || businessName.length > 0;

    return {
      nombre: isBusiness ? businessName : customer.name?.trim() || 'Cliente',
      apellidos: isBusiness ? '' : lastName,
      documento: customer.documentValue || '?',
      email: customer.email?.trim() || '?',
      telefono: customer.phone?.trim() || '?',
      segmento: isBusiness ? 'JURIDICA' : 'NATURAL',
      activo: customer.status,
    };
  }

  private mapSales(items: CustomerTrackingSale[]): CompraCliente[] {
    return items.map((item, index) => ({
      id: index + 1,
      codigo: item.nroComprobante,
      fecha: item.fecha,
      total: item.total,
      estado: item.estado,
    }));
  }

  private mapQuotes(items: CustomerTrackingQuote[]): CotizacionCliente[] {
    return items.map((item, index) => ({
      id: index + 1,
      codigo: item.codigo,
      fecha: item.fecha,
      total: item.total,
      estado: item.estado,
    }));
  }

  private aggregateMonthly(
    items: Array<{ fecha: Date; total: number }>,
  ): Map<string, number> {
    const formatter = new Intl.DateTimeFormat('es-PE', {
      month: 'short',
      year: '2-digit',
    });

    return items.reduce((acc, item) => {
      const label = formatter.format(item.fecha);
      acc.set(label, Number((acc.get(label) ?? 0) + item.total));
      return acc;
    }, new Map<string, number>());
  }

  private buildChartData(
    comprasPorMes: Map<string, number>,
    cotizacionesPorMes: Map<string, number>,
  ) {
    const labels = [...new Set([...comprasPorMes.keys(), ...cotizacionesPorMes.keys()])];

    return {
      labels,
      datasets: [
        {
          label: 'Compras (S/)',
          data: labels.map((label) => comprasPorMes.get(label) ?? 0),
          backgroundColor: 'rgba(246,175,51,0.12)',
          borderColor: '#f6af33',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f6af33',
          pointRadius: 4,
        },
        {
          label: 'Cotizaciones (S/)',
          data: labels.map((label) => cotizacionesPorMes.get(label) ?? 0),
          backgroundColor: 'rgba(99,179,237,0.08)',
          borderColor: '#63b3ed',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#63b3ed',
          pointRadius: 4,
        },
      ],
    };
  }

  private buildChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#888' },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          ticks: { color: '#888' },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
      },
    };
  }
}

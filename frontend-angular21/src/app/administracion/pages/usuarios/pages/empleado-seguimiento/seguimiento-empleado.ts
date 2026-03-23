import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, Subject, catchError, finalize, switchMap, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EmployeeTrackedSale, EmployeeTrackingData, EmployeeTrackingEmployee, EmployeeTrackingService } from '../../../../services/employee-tracking.service';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';

interface KpiEmpleado {
  totalVentas: number;
  montoVentas: number;
  totalCotizaciones: number;
  cotizacionesAprobadas: number;
  totalComisiones: number;
  montoComisiones: number;
}

interface CotizacionEmpleado {
  id: number;
  codigo: string;
  cliente: string;
  fecha: Date;
  total: number;
  estado: string;
}

interface ComisionEmpleado {
  id: number;
  producto: string;
  cantidad: number;
  monto: number;
  fecha: Date;
  tipo: string;
}

@Component({
  selector: 'app-seguimiento-empleado',
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
    DividerModule,
    LoadingOverlayComponent,
  ],
  providers: [MessageService],
  templateUrl: './seguimiento-empleado.html',
  styleUrl: './seguimiento-empleado.css',
})
export class SeguimientoEmpleado implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trackingService = inject(EmployeeTrackingService);
  private readonly reload$ = new Subject<void>();

  readonly totalMontoVentas = computed(() =>
    this.ventas().reduce((sum, sale) => sum + sale.total, 0),
  );

  readonly totalMontoCotizaciones = computed(() =>
    this.cotizaciones().reduce((sum, quote) => sum + quote.total, 0),
  );

  readonly totalMontoComisiones = computed(() =>
    this.comisiones().reduce((sum, commission) => sum + commission.monto, 0),
  );

  readonly tasaAprobacion = computed(() => {
    const kpis = this.kpis();
    if (!kpis.totalCotizaciones) return 0;
    return Math.round(
      (kpis.cotizacionesAprobadas / kpis.totalCotizaciones) * 100,
    );
  });

  readonly nombreCompleto = computed(() =>
    `${this.empleado().nombre} ${this.empleado().apellidos}`.trim(),
  );

  readonly inicialesEmpleado = computed(() => {
    const nombre = this.empleado().nombre.trim().charAt(0);
    const apellido = this.empleado().apellidos.trim().charAt(0);
    return `${nombre}${apellido}`.trim() || '--';
  });

  readonly estadoEmpleadoLabel = computed(() =>
    this.empleado().activo ? 'Activo' : 'Inactivo',
  );

  readonly estadoEmpleadoSeverity = computed(() =>
    this.empleado().activo ? 'success' : 'danger',
  );

  readonly rangoFechaLabel = computed(() => {
    const fechaInicio = this.fechaInicio();
    const fechaFin = this.fechaFin();

    if (!fechaInicio && !fechaFin) return 'Todo el historial';

    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    if (fechaInicio && fechaFin) {
      return `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`;
    }

    if (fechaInicio) {
      return `Desde ${formatDate(fechaInicio)}`;
    }

    return `Hasta ${formatDate(fechaFin!)}`;
  });

  loading = signal(true);
  exportando = signal(false);
  empleadoId = signal(0);

  empleado = signal<EmployeeTrackingEmployee>({
    nombre: '',
    apellidos: '',
    dni: '',
    rol: '',
    sede: '',
    activo: false,
  });

  kpis = signal<KpiEmpleado>({
    totalVentas: 0,
    montoVentas: 0,
    totalCotizaciones: 0,
    cotizacionesAprobadas: 0,
    totalComisiones: 0,
    montoComisiones: 0,
  });

  ventas = signal<EmployeeTrackedSale[]>([]);
  cotizaciones = signal<CotizacionEmpleado[]>([]);
  comisiones = signal<ComisionEmpleado[]>([]);

  chartData = signal(this.buildChartData([]));
  chartOptions = signal(this.buildChartOptions());

  fechaInicio = signal<Date | null>(null);
  fechaFin = signal<Date | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Empleado invalido',
        detail: 'No se pudo identificar al empleado solicitado.',
        life: 3000,
      });
      this.volver();
      return;
    }

    this.empleadoId.set(id);
    this.setupDataLoading();
    this.reload$.next();
  }

  aplicarFiltroFechas(): void {
    const fechaInicio = this.fechaInicio();
    const fechaFin = this.fechaFin();

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango invalido',
        detail: 'La fecha de inicio no puede ser mayor que la fecha fin.',
        life: 3000,
      });
      return;
    }

    this.reload$.next();
  }

  limpiarFiltros(): void {
    this.fechaInicio.set(null);
    this.fechaFin.set(null);
    this.reload$.next();
  }

  exportarPDF(): void {
    this.exportando.set(true);

    setTimeout(() => {
      this.exportando.set(false);
      this.messageService.add({
        severity: 'info',
        summary: 'PDF generado',
        detail: `Reporte de ${this.nombreCompleto()} listo para descargar.`,
        life: 3000,
      });
    }, 1200);
  }

  getVentasSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const normalizedStatus = (estado ?? '').toUpperCase();

    switch (normalizedStatus) {
      case 'EMITIDO':
      case 'PAGADO':
        return 'success';
      case 'PENDIENTE':
      case 'RECHAZADO':
        return 'warn';
      case 'ANULADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getCotizacionSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const normalizedStatus = (estado ?? '').toUpperCase();

    switch (normalizedStatus) {
      case 'APROBADA':
        return 'success';
      case 'PENDIENTE':
        return 'warn';
      case 'RECHAZADA':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  volver(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  private setupDataLoading(): void {
    this.reload$
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.trackingService
            .getEmployeeTracking(this.empleadoId(), this.buildFilters())
            .pipe(
              tap((data) => this.applyTrackingData(data)),
              catchError((error) => {
                this.handleLoadError(error);
                return EMPTY;
              }),
              finalize(() => this.loading.set(false)),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private buildFilters(): { dateFrom?: string; dateTo?: string } {
    const dateFrom = this.formatDateParam(this.fechaInicio());
    const dateTo = this.formatDateParam(this.fechaFin());

    return {
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
  }

  private formatDateParam(date: Date | null): string | undefined {
    if (!date) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private applyTrackingData(data: EmployeeTrackingData): void {
    this.empleado.set(data.employee);
    this.ventas.set(data.sales);
    this.cotizaciones.set([]);
    this.comisiones.set([]);
    this.kpis.set({
      totalVentas: data.totalSales,
      montoVentas: data.salesAmount,
      totalCotizaciones: 0,
      cotizacionesAprobadas: 0,
      totalComisiones: 0,
      montoComisiones: 0,
    });
    this.chartData.set(this.buildChartData(data.monthlySales));
  }

  private handleLoadError(error: unknown): void {
    const detail =
      (error as any)?.error?.message ??
      'No se pudo cargar el seguimiento del empleado.';

    this.messageService.add({
      severity: 'error',
      summary: 'Error al cargar',
      detail,
      life: 3500,
    });
  }

  private buildChartData(
    monthlySales: Array<{ label: string; total: number }>,
  ) {
    const labels = monthlySales.map((item) => item.label);
    const salesSeries = monthlySales.map((item) => item.total);
    const commissionSeries = monthlySales.map(() => 0);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas (S/)',
          data: salesSeries,
          backgroundColor: 'rgba(246,175,51,0.12)',
          borderColor: '#f6af33',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f6af33',
          pointRadius: 4,
        },
        {
          label: 'Comisiones (S/)',
          data: commissionSeries,
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

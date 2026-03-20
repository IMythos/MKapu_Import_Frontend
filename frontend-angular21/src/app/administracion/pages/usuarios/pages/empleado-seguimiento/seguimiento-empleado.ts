import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';

export interface KpiEmpleado {
  totalVentas:           number;
  montoVentas:           number;
  totalCotizaciones:     number;
  cotizacionesAprobadas: number;
  totalComisiones:       number;
  montoComisiones:       number;
}

export interface VentaEmpleado {
  id: number; codigo: string; cliente: string;
  fecha: Date; total: number; estado: string;
}

export interface CotizacionEmpleado {
  id: number; codigo: string; cliente: string;
  fecha: Date; total: number; estado: string;
}

export interface ComisionEmpleado {
  id: number; producto: string; cantidad: number;
  monto: number; fecha: Date; tipo: string;
}

@Component({
  selector: 'app-seguimiento-empleado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, ButtonModule, TableModule,
    TagModule, ToastModule, TabsModule,
    DatePickerModule, ChartModule, TooltipModule,
    DividerModule, LoadingOverlayComponent,
  ],
  providers: [MessageService],
  templateUrl: './seguimiento-empleado.html',
  styleUrl:    './seguimiento-empleado.css',
})
export class SeguimientoEmpleado implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly messageService = inject(MessageService);

    readonly totalMontoVentas = computed(() =>
    this.ventas().reduce((sum, v) => sum + v.total, 0)
    );

    readonly totalMontoCotizaciones = computed(() =>
    this.cotizaciones().reduce((sum, c) => sum + c.total, 0)
    );

    readonly totalMontoComisiones = computed(() =>
    this.comisiones().reduce((sum, c) => sum + c.monto, 0)
);

  loading      = signal(true);
  exportando   = signal(false);
  empleadoId   = signal<number>(0);
  tabActivo    = signal<number>(0);

  empleado = signal({
    nombre: '', apellidos: '', dni: '',
    rol: '', sede: '', activo: true,
  });

  kpis = signal<KpiEmpleado>({
    totalVentas: 0, montoVentas: 0,
    totalCotizaciones: 0, cotizacionesAprobadas: 0,
    totalComisiones: 0, montoComisiones: 0,
  });

  // Datos originales (sin filtrar)
  private _ventas:       VentaEmpleado[]       = [];
  private _cotizaciones: CotizacionEmpleado[]  = [];
  private _comisiones:   ComisionEmpleado[]    = [];

  ventas       = signal<VentaEmpleado[]>([]);
  cotizaciones = signal<CotizacionEmpleado[]>([]);
  comisiones   = signal<ComisionEmpleado[]>([]);

  chartData    = signal<any>(null);
  chartOptions = signal<any>(null);

  // Filtro de fechas
  fechaInicio = signal<Date | null>(null);
  fechaFin    = signal<Date | null>(null);

  readonly tasaAprobacion = computed(() => {
    const k = this.kpis();
    if (!k.totalCotizaciones) return 0;
    return Math.round((k.cotizacionesAprobadas / k.totalCotizaciones) * 100);
  });

  readonly nombreCompleto = computed(() =>
    `${this.empleado().nombre} ${this.empleado().apellidos}`.trim()
  );

  readonly rangoFechaLabel = computed(() => {
    const ini = this.fechaInicio();
    const fin = this.fechaFin();
    if (!ini && !fin) return 'Todo el historial';
    const fmt = (d: Date) => d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    if (ini && fin) return `${fmt(ini)} — ${fmt(fin)}`;
    if (ini) return `Desde ${fmt(ini)}`;
    return `Hasta ${fmt(fin!)}`;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.empleadoId.set(id);
    this.cargarDatos(id);
    this.configurarGrafica();
  }

  private cargarDatos(id: number): void {
    this.loading.set(true);
    setTimeout(() => {
      this.empleado.set({
        nombre: 'Carlos', apellidos: 'Muñoz López',
        dni: '45678901', rol: 'VENTAS', sede: 'Sede SJL', activo: true,
      });
      this.kpis.set({
        totalVentas: 48, montoVentas: 34850.50,
        totalCotizaciones: 62, cotizacionesAprobadas: 41,
        totalComisiones: 23, montoComisiones: 1240.00,
      });

      this._ventas = [
        { id:1, codigo:'VTA-001', cliente:'Empresa ABC',     fecha:new Date('2026-03-10'), total:1200.00, estado:'PAGADO'    },
        { id:2, codigo:'VTA-002', cliente:'Juan Pérez',      fecha:new Date('2026-03-08'), total: 850.50, estado:'PAGADO'    },
        { id:3, codigo:'VTA-003', cliente:'María García',    fecha:new Date('2026-03-05'), total:2300.00, estado:'PENDIENTE' },
        { id:4, codigo:'VTA-004', cliente:'Distribuidora X', fecha:new Date('2026-02-28'), total: 640.00, estado:'PAGADO'    },
        { id:5, codigo:'VTA-005', cliente:'Comercial Sur',   fecha:new Date('2026-02-20'), total:3100.00, estado:'ANULADO'   },
      ];
      this._cotizaciones = [
        { id:1, codigo:'COT-001', cliente:'Empresa ABC',   fecha:new Date('2026-03-12'), total:1500.00, estado:'APROBADA'  },
        { id:2, codigo:'COT-002', cliente:'Tech Lima',     fecha:new Date('2026-03-10'), total: 980.00, estado:'PENDIENTE' },
        { id:3, codigo:'COT-003', cliente:'Inversiones Z', fecha:new Date('2026-03-01'), total:4200.00, estado:'RECHAZADA' },
        { id:4, codigo:'COT-004', cliente:'Juan Pérez',    fecha:new Date('2026-02-25'), total: 750.00, estado:'APROBADA'  },
      ];
      this._comisiones = [
        { id:1, producto:'Laptop Dell XPS',   cantidad:2, monto:120.00, fecha:new Date('2026-03-10'), tipo:'PORCENTAJE' },
        { id:2, producto:'Monitor LG 27"',    cantidad:5, monto: 75.00, fecha:new Date('2026-03-08'), tipo:'MONTO_FIJO' },
        { id:3, producto:'Teclado Mecánico',  cantidad:3, monto: 45.00, fecha:new Date('2026-03-01'), tipo:'MONTO_FIJO' },
        { id:4, producto:'Mouse Inalámbrico', cantidad:8, monto: 80.00, fecha:new Date('2026-02-28'), tipo:'PORCENTAJE' },
      ];

      this.ventas.set([...this._ventas]);
      this.cotizaciones.set([...this._cotizaciones]);
      this.comisiones.set([...this._comisiones]);
      this.loading.set(false);
    }, 700);
  }

  aplicarFiltroFechas(): void {
    const ini = this.fechaInicio();
    const fin = this.fechaFin();

    const enRango = (fecha: Date) => {
      if (ini && fecha < ini) return false;
      if (fin) {
        const finDia = new Date(fin); finDia.setHours(23,59,59,999);
        if (fecha > finDia) return false;
      }
      return true;
    };

    this.ventas.set(this._ventas.filter(v => enRango(v.fecha)));
    this.cotizaciones.set(this._cotizaciones.filter(c => enRango(c.fecha)));
    this.comisiones.set(this._comisiones.filter(c => enRango(c.fecha)));
  }

  limpiarFiltros(): void {
    this.fechaInicio.set(null);
    this.fechaFin.set(null);
    this.ventas.set([...this._ventas]);
    this.cotizaciones.set([...this._cotizaciones]);
    this.comisiones.set([...this._comisiones]);
  }

  exportarPDF(): void {
    this.exportando.set(true);
    // TODO: conectar con servicio real de PDF
    setTimeout(() => {
      this.exportando.set(false);
      this.messageService.add({
        severity: 'info', summary: 'PDF generado',
        detail: `Reporte de ${this.nombreCompleto()} listo para descargar.`,
        life: 3000,
      });
    }, 1200);
  }

  private configurarGrafica(): void {
    this.chartData.set({
      labels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
      datasets: [
        {
          label: 'Ventas (S/)',
          data: [8200, 11400, 9800, 14200, 12600, 15800],
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
          data: [320, 480, 390, 560, 420, 640],
          backgroundColor: 'rgba(99,179,237,0.08)',
          borderColor: '#63b3ed',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#63b3ed',
          pointRadius: 4,
        },
      ],
    });

    this.chartOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.06)' } },
      },
    });
  }

  getVentasSeverity(estado: string): any {
    return ({ PAGADO:'success', PENDIENTE:'warn', ANULADO:'danger' } as any)[estado] ?? 'secondary';
  }

  getCotizacionSeverity(estado: string): any {
    return ({ APROBADA:'success', PENDIENTE:'warn', RECHAZADA:'danger' } as any)[estado] ?? 'secondary';
  }

  volver(): void { this.router.navigate(['/admin/usuarios']); }
}
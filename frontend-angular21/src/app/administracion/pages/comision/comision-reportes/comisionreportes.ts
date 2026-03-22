import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommissionService, CommissionReport } from '../../../services/commission.service';
import { SedeService } from '../../../services/sede.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { SharedTableContainerComponent } from '../../../../shared/components/table.componente/shared-table-container.component';
import {
  getLunesSemanaActualPeru,
  getDomingoSemanaActualPeru,
} from '../../../../shared/utils/date-peru.utils';

@Component({
  selector: 'app-comision-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    RouterModule,
    DatePickerModule,
    ToastModule,
    SharedTableContainerComponent,
  ],
  templateUrl: './comisionreportes.html',
  styleUrls: ['./comisionreportes.css'],
  providers: [MessageService],
})
export class ComisionReportes implements OnInit {
  private readonly commissionService = inject(CommissionService);
  private readonly sedeService       = inject(SedeService);
  private readonly authService       = inject(AuthService);
  private readonly messageService    = inject(MessageService);

  readonly loading = this.commissionService.loading;
  readonly error   = this.commissionService.error;
  readonly report  = this.commissionService.report;

  // ── Filtros ────────────────────────────────────────────────────────
  readonly filtroBusqueda = signal('');
  readonly filtroEstado   = signal<string | null>(null);
  readonly filtroSede     = signal(
    String(this.authService.getCurrentUser()?.idSede ?? '')
  );

  fechaInicio = signal<Date | null>(getLunesSemanaActualPeru());
  fechaFin    = signal<Date | null>(getDomingoSemanaActualPeru());

  readonly sedesOpciones = computed(() => [
    { label: 'Todas las sedes', value: '' },
    ...this.sedeService.sedes().map(s => ({
      label: s.nombre,
      value: String(s.id_sede),
    })),
  ]);

  estadosOpciones = [
    { label: 'Todos',     value: null        },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Liquidada', value: 'LIQUIDADA' },
    { label: 'Anulada',   value: 'ANULADA'   },
  ];

  // ── Estado botón atender ───────────────────────────────────────────
  readonly atendiendo = signal<number | null>(null);

  // ── Reportes filtrados ─────────────────────────────────────────────
  readonly reportesFiltrados = computed(() => {
    let data     = this.report();
    const q      = this.filtroBusqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const sede   = this.filtroSede();

    if (q) {
      data = data.filter(r =>
        r.nombre_vendedor?.toLowerCase().includes(q) ||
        r.id_vendedor_ref.toLowerCase().includes(q)  ||
        String(r.id_comprobante).includes(q),
      );
    }
    if (estado) data = data.filter(r => r.estado === estado);
    if (sede)   data = data.filter(r => String(r.id_sede) === sede);

    return data;
  });

  // ── KPIs ───────────────────────────────────────────────────────────
  readonly totalPagar = computed(() =>
    this.reportesFiltrados()
      .filter(r => r.estado === 'PENDIENTE')
      .reduce((acc, r) => acc + Number(r.monto), 0),
  );

  readonly totalComisiones = computed(() =>
    this.reportesFiltrados().reduce((acc, r) => acc + Number(r.monto), 0),
  );

  readonly vendedorTop = computed(() => {
    const data = this.reportesFiltrados();
    if (!data.length) return { nombre: '—', comision: 0 };
    const grouped = data.reduce((acc, r) => {
      const key = r.nombre_vendedor || r.id_vendedor_ref;
      acc[key] = (acc[key] ?? 0) + Number(r.monto);
      return acc;
    }, {} as Record<string, number>);
    const top = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
    return { nombre: top[0], comision: top[1] };
  });

  readonly totalVendedores = computed(() =>
    new Set(this.reportesFiltrados().map(r => r.id_vendedor_ref)).size,
  );

  // ── Paginación ─────────────────────────────────────────────────────
  readonly paginaActual = signal(1);
  readonly limitePagina = signal(10);

  readonly totalPaginas = computed(() =>
    Math.ceil(this.reportesFiltrados().length / this.limitePagina()),
  );

  readonly reportesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limitePagina();
    return this.reportesFiltrados().slice(inicio, inicio + this.limitePagina());
  });

  onPageChange(page: number)   { this.paginaActual.set(page); }
  onLimitChange(limit: number) { this.limitePagina.set(limit); this.paginaActual.set(1); }

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit() {
    this.sedeService.loadSedes().subscribe();
    this.cargar();
  }

  onFechaChange() {
    this.paginaActual.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.filtroBusqueda.set('');
    this.filtroEstado.set(null);
    this.filtroSede.set(String(''));
    this.fechaInicio.set(null);
    this.fechaFin.set(null);
    this.paginaActual.set(1);
    this.cargar();
  }

  private cargar() {
    const desde = this.fechaInicio() ?? getLunesSemanaActualPeru()!;
    const hasta = this.fechaFin()    ?? getDomingoSemanaActualPeru()!;
    const d = new Date(desde); d.setHours(0, 0, 0, 0);
    const h = new Date(hasta); h.setHours(23, 59, 59, 999);
    this.commissionService.loadReport(d, h).subscribe();
  }

  // ── Atender ────────────────────────────────────────────────────────
  atender(r: CommissionReport): void {
    this.atendiendo.set(r.id_comision);
    this.commissionService.atender(r.id_comision).subscribe({
      next: () => {
        this.atendiendo.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Liquidada',
          detail: `Comisión #${r.id_comision} marcada como LIQUIDADA`,
          life: 3000,
        });
      },
      error: () => {
        this.atendiendo.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo liquidar la comisión',
          life: 3000,
        });
      },
    });
  }

  getSeverity(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      PENDIENTE: 'warn',
      LIQUIDADA: 'success',
      ANULADA:   'danger',
    };
    return map[estado] ?? 'info';
  }
}
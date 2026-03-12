import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MovimientoInventario } from '../../interfaces/movimiento-inventario.interface';
import { TransferUserContextService } from '../../../administracion/services/transfer-user-context.service';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { PaginadorComponent } from '../../../shared/components/paginador/Paginador.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { getLunesSemanaActualPeru, getDomingoSemanaActualPeru } from '../../../shared/utils/date-peru.utils';

@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    TooltipModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    ButtonModule,
    DialogModule,
    CardModule,
    LoadingOverlayComponent,
    PaginadorComponent,
  ],
  templateUrl: './movimientos-inventario.html',
  styleUrl: './movimientos-inventario.css',
})
export class MovimientosInventario implements OnInit {
  private router = inject(Router);
  private movimientosService = inject(MovimientosInventarioService);
  private transferContextService = inject(TransferUserContextService);

  movimientos = signal<MovimientoInventario[]>([]);
  cargando = signal<boolean>(false);
  totalItems = signal<number>(0);
  paginaActual = signal<number>(1);
  limitePagina = signal<number>(10);

  totalPaginas = computed(() => Math.ceil(this.totalItems() / this.limitePagina()) || 1);

  filtroEstado = signal<number>(0);
  filtroTexto = signal<string>('');
  
  filtroFechas = signal<Date[] | undefined>([
    getLunesSemanaActualPeru(), 
    getDomingoSemanaActualPeru()
  ]);
  
  sedeId = signal<string>('');

  opcionesEstado = [
    { label: 'Todos', value: 0 },
    { label: 'Ingresos', value: 1 },
    { label: 'Salidas', value: 2 },
    { label: 'Transferencias', value: 3 },
  ];

  ngOnInit() {
    this.obtenerFiltroSede();
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.cargando.set(true);

    const fechas = this.filtroFechas();
    const filtros = {
      texto: this.filtroTexto(),
      estado: this.filtroEstado() === 0 ? null : this.filtroEstado(),
      fechaInicio: fechas?.[0] ? this.formatearFechaInicio(fechas[0]) : null,
      fechaFin: fechas?.[1] ? this.formatearFechaFin(fechas[1]) : null,
      sedeId: this.sedeId(),
      page: this.paginaActual(),
      limit: this.limitePagina(),
    };

    this.movimientosService.getMovimientos(filtros).subscribe({
      next: (res) => {
        this.movimientos.set(res.data || res);
        this.totalItems.set(res.total ?? res.data?.length ?? 0);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al recuperar los movimientos', err);
        this.cargando.set(false);
      },
    });
  }

  obtenerFiltroSede(): void {
    const id = this.transferContextService.getCurrentHeadquarterId();
    if (id) this.sedeId.set(id);
  }

  aplicarFiltros() {
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  limpiarFiltros() {
    this.filtroEstado.set(0);
    this.filtroTexto.set('');
    this.filtroFechas.set([getLunesSemanaActualPeru(), getDomingoSemanaActualPeru()]);
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  onPageChange(page: number) {
    this.paginaActual.set(page);
    this.cargarMovimientos();
  }

  onLimitChange(limit: number) {
    this.limitePagina.set(limit);
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  verDetalles(movimiento: any) {
    this.router.navigate(['/logistica/movimientos-inventario/detalle', movimiento.id]);
  }

  getSeverity(tipo: string): 'success' | 'danger' | 'info' | 'warn' {
    switch (tipo?.toUpperCase()) {
      case 'INGRESO':
        return 'success';
      case 'SALIDA':
        return 'danger';
      case 'TRANSFERENCIA':
        return 'info';
      default:
        return 'warn';
    }
  }

  private formatearFechaInicio(fecha: Date): string {
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return f.toISOString();
  }

  private formatearFechaFin(fecha: Date): string {
    const f = new Date(fecha);
    f.setHours(23, 59, 59, 999);
    return f.toISOString();
  }
}
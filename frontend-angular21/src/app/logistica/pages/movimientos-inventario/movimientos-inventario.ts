import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MovimientoInventario } from '../../interfaces/movimiento-inventario.interface';
import { TransferUserContextService } from '../../../administracion/services/transfer-user-context.service';
@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [
    CommonModule,
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
  ],
  templateUrl: './movimientos-inventario.html',
  styleUrl: './movimientos-inventario.css',
})
export class MovimientosInventario {
  private movimientosService = inject(MovimientosInventarioService);

  movimientos = signal<MovimientoInventario[]>([]);
  cargando = signal<boolean>(false);

  filtroEstado = signal<number>(0);
  filtroTexto = signal<string>('');
  filtroFechas = signal<Date[] | undefined>(undefined);
  private transferContextService = inject(TransferUserContextService);
  sedeId = signal<String>('');
  private readonly currentSedeId: string | null = localStorage.getItem('current_sede_id');
  opcionesEstado = [
    { label: 'Todos', value: 0 },
    { label: 'Ingresos', value: 1 },
    { label: 'Salidas', value: 2 },
    { label: 'Transferencias', value: 3 },
  ];

  movimientoSeleccionado = signal<MovimientoInventario | null>(null);
  mostrarDetalles = signal<boolean>(false);
  ngOnInit() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.cargando.set(true);
    this.obtenerFiltroSede();
    const fechas = this.filtroFechas();
    const filtros = {
      texto: this.filtroTexto(),
      estado: this.filtroEstado(),
      fechaInicio: fechas?.[0] ? new Date(fechas[0]).toISOString() : null,
      fechaFin: fechas?.[1] ? new Date(fechas[1]).toISOString() : null,
      sedeId: this.sedeId(),
    };
    this.movimientosService.getMovimientos(filtros).subscribe({
      next: (res) => {
        console.log('Data recibida:', res.data);
        this.movimientos.set(res.data || res);
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
    if (id) {
      this.sedeId.set(id);
      console.log('Sede asignada al filtro:', this.sedeId);
    }
  }


  aplicarFiltros() {
    this.cargarMovimientos();
  }

  limpiarFiltros() {
    this.filtroEstado.set(0);
    this.filtroTexto.set('');
    this.filtroFechas.set(undefined);
    this.cargarMovimientos();
  }

  abrirDetalles(movimiento: any) {
    this.movimientoSeleccionado.set(movimiento);
    this.mostrarDetalles.set(true);
  }

  cerrarDetalles() {
    this.mostrarDetalles.set(false);
    this.movimientoSeleccionado.set(null);
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
}

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';

import { AuctionService, AuctionResponseDto } from '../../../../services/auction.service';
import { SharedTableContainerComponent } from '../../../../../shared/components/table.componente/shared-table-container.component';

interface RemateUI {
  id_remate: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioRemate: number;
  precioOriginal: number;
  responsable: string;
  fechaRegistro: Date;
  fechaFin: Date;
  estado: string;
  observacion?: string;
  descuento: number;
}

type EstadoFiltro = 'TODOS' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';
type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-remates-pr',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    ToastModule,
    TableModule,
    TooltipModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
    SelectModule,
    CommonModule,
    SharedTableContainerComponent
  ],
  templateUrl: './remates-pr.html',
  styleUrl: './remates-pr.css',
  providers: [MessageService, ConfirmationService]
})
export class RematesPr implements OnInit {

  private readonly auctionService      = inject(AuctionService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router              = inject(Router);

  cargando = this.auctionService.loading;

  /** FILTROS */
  busqueda     = signal('');
  estadoFiltro = signal<EstadoFiltro>('TODOS');

  /** PAGINACIÓN */
  page  = signal(1);
  limit = signal(5);

  /** MODAL */
  dialogVisible        = false;
  remateSeleccionado   = signal<RemateUI | null>(null);

  /** OPCIONES DE ESTADO */
  readonly estadoOptions: { label: string; value: EstadoFiltro }[] = [
    { label: 'Todos',      value: 'TODOS'      },
    { label: 'Activo',     value: 'ACTIVO'     },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Cancelado',  value: 'CANCELADO'  },
  ];

  /** REMATES DESDE API */
  remates = computed(() =>
    this.auctionService.auctions().map(a => this.mapToUI(a))
  );

  /** FILTRO POR ESTADO */
  private rematesPorEstado = computed(() => {
    const estado = this.estadoFiltro();
    const todos  = this.remates();
    if (estado === 'TODOS') return todos;
    return todos.filter(r => r.estado === estado);
  });

  /** FILTRO POR BÚSQUEDA */
  productosFiltrados = computed(() => {
    const busquedaStr = this.busqueda().toLowerCase().trim();
    if (!busquedaStr) return this.rematesPorEstado();
    return this.rematesPorEstado().filter(r =>
      r.codigo.toLowerCase().includes(busquedaStr)     ||
      r.nombre.toLowerCase().includes(busquedaStr)     ||
      r.responsable.toLowerCase().includes(busquedaStr)
    );
  });

  /** PAGINACIÓN LOCAL */
  rematesPaginados = computed(() => {
    const data  = this.productosFiltrados();
    const start = (this.page() - 1) * this.limit();
    return data.slice(start, start + this.limit());
  });

  totalPages = computed(() =>
    Math.ceil(this.productosFiltrados().length / this.limit())
  );

  /** MÉTRICAS */
  totalRemates = computed(() => this.remates().length);

  valorTotalRemates = computed(() =>
    this.remates().reduce((sum, r) => sum + (r.precioRemate * r.cantidad), 0)
  );

  ngOnInit(): void {
    this.cargarRemates();
  }

  /** MAPEO DTO → UI */
  private mapToUI(auction: AuctionResponseDto): RemateUI {
    const detalle       = auction.detalles?.[0];
    const cantidad      = detalle?.stock_remate  ?? 0;
    const precioOriginal = detalle?.pre_original ?? 0;
    const precioRemate  = detalle?.pre_remate    ?? 0;
    const descuento     = precioOriginal > 0
      ? Math.round(((precioOriginal - precioRemate) / precioOriginal) * 100) : 0;

    return {
      id_remate: auction.id_remate,
      codigo: auction.cod_remate,
      nombre: auction.descripcion,
      cantidad,
      precioRemate,
      precioOriginal,
      responsable: 'Sin asignar',
      fechaRegistro: auction.fec_inicio ? new Date(auction.fec_inicio) : new Date(),
      fechaFin:      auction.fec_fin    ? new Date(auction.fec_fin)    : new Date(),
      estado:        auction.estado ?? 'ACTIVO',
      observacion:   '',
      descuento
    };
  }

  /** CARGA */
  cargarRemates(): void {
    this.auctionService.loadAuctions(1, 50).subscribe({
      next: () => console.log(`✅ ${this.remates().length} remates cargados`),
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudieron cargar los remates', life: 3000
        });
      }
    });
  }

  /** FILTROS */
  onBusquedaChange(value: string): void { this.busqueda.set(value);    this.page.set(1); }
  onEstadoChange(value: EstadoFiltro):  void { this.estadoFiltro.set(value); this.page.set(1); }
  limpiarFiltros(): void { this.busqueda.set(''); this.estadoFiltro.set('TODOS'); this.page.set(1); }

  /** PAGINADOR */
  onPageChange(page: number):   void { this.page.set(page); }
  onLimitChange(limit: number): void { this.limit.set(limit); this.page.set(1); }

  /** MODAL */
  verDetalle(remate: RemateUI): void {
    this.remateSeleccionado.set({ ...remate });
    this.dialogVisible = true;
  }

  cerrarModalDetalle(): void {
    this.dialogVisible = false;
    this.remateSeleccionado.set(null);
  }

  /** EDITAR → navegar a ruta de edición */
  editarRemate(remate: RemateUI): void {
    this.cerrarModalDetalle();
    this.router.navigate(['/admin', 'remates', 'editar-remate', remate.id_remate]);
  }

  /** CONFIRMAR CAMBIO DE ESTADO */
  confirmarCambioEstado(remate: RemateUI): void {
    const esActivo = remate.estado === 'ACTIVO';
    this.confirmationService.confirm({
      header:      'Confirmación',
      message:     `¿Deseas ${esActivo ? 'finalizar' : 'reactivar'} el remate <strong>${remate.codigo}</strong>?`,
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: esActivo ? 'Finalizar' : 'Reactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: (esActivo ? 'danger' : 'success') as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.cambiarEstado(remate)
    });
  }

  private cambiarEstado(remate: RemateUI): void {
    // Si el servicio sólo tiene finalizar, se invoca directamente.
    // Amplía este método cuando el backend soporte más transiciones.
    this.auctionService.finalizeAuction(remate.id_remate).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Estado actualizado',
          detail: `El remate ${remate.codigo} fue finalizado.`, life: 3000
        });
        this.cerrarModalDetalle();
        this.cargarRemates();
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cambiar el estado del remate.', life: 3000
        });
      }
    });
  }

  /** NAVEGACIÓN RÁPIDA */
  abrirRegistro(): void {
    this.router.navigate(['/admin', 'remates', 'registro-remate']);
  }

  /** COLOR DE ESTADO */
  getEstadoSeverity(estado: string): Severity {
    const map: { [key: string]: Severity } = {
      ACTIVO:     'success',
      FINALIZADO: 'secondary',
      CANCELADO:  'danger'
    };
    return map[estado] || 'info';
  }
}
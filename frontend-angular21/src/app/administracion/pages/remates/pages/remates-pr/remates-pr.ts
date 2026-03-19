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
  id_remate:      number;
  codigo:         string;
  nombre:         string;
  cantidad:       number;
  precioRemate:   number;
  precioOriginal: number;
  responsable:    string;
  estado:         string;
  observacion?:   string;
  descuento:      number;
}

type EstadoFiltro = 'TODOS' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';
type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-remates-pr',
  standalone: true,
  imports: [
    CardModule, ButtonModule, RouterModule, FormsModule,
    InputTextModule, ToastModule, TableModule, TooltipModule,
    TagModule, DialogModule, ConfirmDialogModule, SelectModule,
    CommonModule, SharedTableContainerComponent,
  ],
  templateUrl: './remates-pr.html',
  styleUrl: './remates-pr.css',
  providers: [MessageService, ConfirmationService],
})
export class RematesPr implements OnInit {

  private readonly auctionService      = inject(AuctionService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router              = inject(Router);

  cargando = this.auctionService.loading;

  busqueda     = signal('');
  estadoFiltro = signal<EstadoFiltro>('ACTIVO');
  page         = signal(1);
  limit        = signal(5);

  dialogVisible      = false;
  remateSeleccionado = signal<RemateUI | null>(null);

  readonly estadoOptions: { label: string; value: EstadoFiltro }[] = [
    { label: 'Todos',      value: 'TODOS'      },
    { label: 'Activo',     value: 'ACTIVO'     },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Cancelado',  value: 'CANCELADO'  },
  ];

  remates = computed(() => this.auctionService.auctions().map(a => this.mapToUI(a)));

  private rematesPorEstado = computed(() => {
    const estado = this.estadoFiltro();
    const todos  = this.remates();
    return estado === 'TODOS' ? todos : todos.filter(r => r.estado === estado);
  });

  productosFiltrados = computed(() => {
    const str = this.busqueda().toLowerCase().trim();
    if (!str) return this.rematesPorEstado();
    return this.rematesPorEstado().filter(r =>
      r.codigo.toLowerCase().includes(str) ||
      r.nombre.toLowerCase().includes(str) ||
      r.responsable.toLowerCase().includes(str)
    );
  });

  rematesPaginados = computed(() => {
    const data  = this.productosFiltrados();
    const start = (this.page() - 1) * this.limit();
    return data.slice(start, start + this.limit());
  });

  totalPages = computed(() => Math.ceil(this.productosFiltrados().length / this.limit()));

  totalRemates      = computed(() => this.remates().length);
  valorTotalRemates = computed(() => this.remates().reduce((s, r) => s + r.precioRemate * r.cantidad, 0));

  ngOnInit(): void { this.cargarRemates(); }

  private mapToUI(a: AuctionResponseDto): RemateUI {
    const d              = a.detalles?.[0];
    const precioOriginal = d?.pre_original ?? 0;
    const precioRemate   = d?.pre_remate   ?? 0;
    const descuento      = precioOriginal > 0
      ? Math.round(((precioOriginal - precioRemate) / precioOriginal) * 100) : 0;
    return {
      id_remate:      a.id_remate,
      codigo:         a.cod_remate,
      nombre:         a.descripcion,
      cantidad:       d?.stock_remate ?? 0,
      precioRemate,
      precioOriginal,
      responsable:    'Sin asignar',
      estado:         a.estado ?? 'ACTIVO',
      observacion:    '',
      descuento,
    };
  }

  cargarRemates(): void {
    this.auctionService.loadAuctions(1, 50).subscribe({
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los remates', life: 3000 }),
    });
  }

  onBusquedaChange(v: string):      void { this.busqueda.set(v);     this.page.set(1); }
  onEstadoChange(v: EstadoFiltro):  void { this.estadoFiltro.set(v); this.page.set(1); }
  limpiarFiltros():                 void { this.busqueda.set(''); this.estadoFiltro.set('TODOS'); this.page.set(1); }
  onPageChange(p: number):          void { this.page.set(p); }
  onLimitChange(l: number):         void { this.limit.set(l); this.page.set(1); }

  verDetalle(remate: RemateUI): void {
    this.remateSeleccionado.set({ ...remate });
    this.dialogVisible = true;
  }

  cerrarModalDetalle(): void {
    this.dialogVisible = false;
    this.remateSeleccionado.set(null);
  }

  editarRemate(remate: RemateUI): void {
    this.cerrarModalDetalle();
    this.router.navigate(['/admin', 'remates', 'editar-remate', remate.id_remate]);
  }

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
      accept: () => this.cambiarEstado(remate),
    });
  }

  private cambiarEstado(remate: RemateUI): void {
    this.auctionService.finalizeAuction(remate.id_remate).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `El remate ${remate.codigo} fue finalizado.`, life: 3000 });
        this.cerrarModalDetalle();
        this.cargarRemates();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del remate.', life: 3000 }),
    });
  }

  abrirRegistro(): void { this.router.navigate(['/admin', 'remates', 'registro-remate']); }

  getEstadoSeverity(estado: string): Severity {
    const map: Record<string, Severity> = { ACTIVO: 'success', FINALIZADO: 'secondary', CANCELADO: 'danger' };
    return map[estado] || 'info';
  }
}
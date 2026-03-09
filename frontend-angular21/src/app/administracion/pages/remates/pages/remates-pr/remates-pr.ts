import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';

import { AuctionService, AuctionResponseDto } from '../../../../services/auction.service';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../../shared/components/paginador/Paginador.component';

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
    CommonModule,
    LoadingOverlayComponent,
    PaginadorComponent
  ],
  templateUrl: './remates-pr.html',
  styleUrl: './remates-pr.css',
  providers: [MessageService]
})
export class RematesPr implements OnInit {

  private readonly auctionService = inject(AuctionService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  cargando = this.auctionService.loading;

  busqueda = signal('');

  /** PAGINACIÓN */
  page = signal(1);
  limit = signal(5);

  /** MODAL */
  mostrarModalDetalle = signal(false);
  remateSeleccionado = signal<RemateUI | null>(null);

  /** REMATES DESDE API */
  remates = computed(() =>
    this.auctionService.auctions().map(a => this.mapToUI(a))
  );

  /** FILTRO DE BÚSQUEDA */
  productosFiltrados = computed(() => {

    const busquedaStr = this.busqueda().toLowerCase().trim();

    if (!busquedaStr) return this.remates();

    return this.remates().filter(r =>
      r.codigo.toLowerCase().includes(busquedaStr) ||
      r.nombre.toLowerCase().includes(busquedaStr) ||
      r.responsable.toLowerCase().includes(busquedaStr)
    );
  });

  /** PAGINACIÓN LOCAL */
  rematesPaginados = computed(() => {

    const data = this.productosFiltrados();

    const start = (this.page() - 1) * this.limit();
    const end = start + this.limit();

    return data.slice(start, end);
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

    const detalle = auction.detalles?.[0];

    const cantidad = detalle?.stock_remate ?? 0;
    const precioOriginal = detalle?.pre_original ?? 0;
    const precioRemate = detalle?.pre_remate ?? 0;

    const descuento =
      precioOriginal > 0
        ? Math.round(((precioOriginal - precioRemate) / precioOriginal) * 100)
        : 0;

    return {
      id_remate: auction.id_remate,
      codigo: auction.cod_remate,
      nombre: auction.descripcion,
      cantidad,
      precioRemate,
      precioOriginal,
      responsable: 'Sin asignar',
      fechaRegistro: auction.fec_inicio ? new Date(auction.fec_inicio) : new Date(),
      fechaFin: auction.fec_fin ? new Date(auction.fec_fin) : new Date(),
      estado: auction.estado ?? 'ACTIVO',
      observacion: '',
      descuento
    };
  }

  /** CARGA DE REMATES */
  cargarRemates(): void {

    this.auctionService.loadAuctions(1, 50).subscribe({

      next: () => {
        console.log(`✅ ${this.remates().length} remates cargados`);
      },

      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los remates',
          life: 3000
        });
      }

    });
  }

  /** PAGINADOR */
  onPageChange(page: number) {
    this.page.set(page);
  }

  onLimitChange(limit: number) {
    this.limit.set(limit);
    this.page.set(1);
  }

  /** ACCIONES */
  abrirRegistro(): void {
    this.router.navigate(['/admin', 'remates', 'registro-remate']);
  }

  editarProducto(remate: RemateUI): void {
    this.remateSeleccionado.set({ ...remate });
    this.mostrarModalDetalle.set(true);
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle.set(false);
    this.remateSeleccionado.set(null);
  }

  finalizarRemate(id: number): void {

    this.auctionService.finalizeAuction(id).subscribe({

      next: () => {

        this.messageService.add({
          severity: 'success',
          summary: 'Remate finalizado',
          detail: 'El remate ha sido finalizado exitosamente',
          life: 3000
        });

        this.cerrarModalDetalle();
        this.cargarRemates();
      },

      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo finalizar el remate',
          life: 3000
        });
      }

    });
  }

  /** COLOR DE ESTADO */
  getEstadoSeverity(estado: string): Severity {

    const map: { [key: string]: Severity } = {
      ACTIVO: 'success',
      FINALIZADO: 'secondary',
      CANCELADO: 'danger'
    };

    return map[estado] || 'info';
  }
}
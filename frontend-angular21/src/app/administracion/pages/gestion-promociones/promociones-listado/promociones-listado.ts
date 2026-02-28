import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CardModule }          from 'primeng/card';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { SelectModule }        from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule }         from 'primeng/toast';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { TooltipModule }       from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PromotionsService, Promotion } from '../../../services/promotions.service';

interface Filtros {
  busqueda:       string;
  tipo:           string;
  estado:         string;
  rangoDescuento: string;
}

@Component({
  selector: 'app-promociones-listado',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, SelectModule,
    ConfirmDialogModule, ToastModule, TableModule, TagModule, TooltipModule,
  ],
  templateUrl: './promociones-listado.html',
  styleUrl:    './promociones-listado.css',
  providers: [ConfirmationService, MessageService],
})
export class PromocionesListado implements OnInit, OnDestroy {
  private readonly promotionsService  = inject(PromotionsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService     = inject(MessageService);
  private readonly router             = inject(Router);
  private destroy$ = new Subject<void>();

  filtros: Filtros = { busqueda: '', tipo: '', estado: '', rangoDescuento: '' };

  tiposPromocion = [
    { label: 'Porcentaje', value: 'PORCENTAJE' },
    { label: 'Monto fijo', value: 'MONTO' },
  ];

  estadosPromocion = [
    { label: 'Activa',   value: 'Activa' },
    { label: 'Inactiva', value: 'Inactiva' },
  ];

  rangosDescuento = [
    { label: 'Hasta 10%',    value: '0-10' },
    { label: 'De 10% a 25%', value: '10-25' },
    { label: 'De 25% a 50%', value: '25-50' },
    { label: 'Más de 50%',   value: '50-100' },
  ];

  itemsPorPagina = signal(10);
  paginaActual   = signal(0);

  readonly promociones = this.promotionsService.promociones;
  readonly loading     = this.promotionsService.loading;
  readonly totalItems  = this.promotionsService.total;

  readonly filteredPromociones = computed(() => {
    let filtradas = this.promociones();

    if (this.filtros.busqueda) {
      const t = this.filtros.busqueda.trim().toLowerCase();
      filtradas = filtradas.filter(p =>
        p.concepto.toLowerCase().includes(t) ||
        p.tipo.toLowerCase().includes(t) ||
        String(p.valor).includes(t)
      );
    }

    if (this.filtros.tipo) {
      filtradas = filtradas.filter(p => p.tipo === this.filtros.tipo);
    }

    if (this.filtros.estado) {
      filtradas = filtradas.filter(p => this.obtenerEstado(p) === this.filtros.estado);
    }

    if (this.filtros.rangoDescuento) {
      const [min, max] = this.filtros.rangoDescuento.split('-').map(Number);
      filtradas = filtradas.filter(p => p.valor >= min && p.valor <= max);
    }

    return filtradas;
  });

  // ─── KPIs ────────────────────────────────────────────────────────────────────

  readonly kpiActivas  = computed(() => this.promociones().filter(p => p.activo).length);
  readonly kpiTotal    = computed(() => this.promociones().length);
  readonly kpiInactivas = computed(() => this.promociones().filter(p => !p.activo).length);

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void { this.cargarPromociones(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ─── Acciones ────────────────────────────────────────────────────────────────

  cargarPromociones(): void {
    this.promotionsService
      .loadPromotions(this.paginaActual() + 1, this.itemsPorPagina())
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  aplicarFiltros(): void { /* computed reacciona automático */ }

  limpiarFiltros(): void {
    this.filtros = { busqueda: '', tipo: '', estado: '', rangoDescuento: '' };
    this.messageService.add({ severity: 'info', summary: 'Filtros limpiados', detail: 'Se han limpiado todos los filtros' });
  }

  onPageChange(event: any): void {
    this.paginaActual.set(event.first / event.rows);
    this.itemsPorPagina.set(event.rows);
    this.cargarPromociones();
  }

  irANueva():              void { this.router.navigate(['/admin/promociones/crear']); }
  verPromocion(id: number): void { if (id) this.router.navigate(['/admin/promociones/ver-detalle', id]); }
  editarPromocion(id: number): void { if (id) this.router.navigate(['/admin/promociones/editar', id]); }

  eliminarPromocion(id: number, concepto: string): void {
    this.confirmationService.confirm({
      message: `¿Deseas eliminar la promoción "${concepto}"?`,
      header:  'Confirmar eliminación',
      icon:    'pi pi-exclamation-triangle',
      accept:  () => {
        this.promotionsService.deletePromotion(id).subscribe({
          next:  () => this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Promoción eliminada' }),
          error: () => this.messageService.add({ severity: 'error',   summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      },
    });
  }

  // ─── Helpers de vista ────────────────────────────────────────────────────────

  obtenerEstado(p: Promotion): 'Activa' | 'Inactiva' {
    return p.activo ? 'Activa' : 'Inactiva';
  }

  severidadEstado(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    return estado === 'Activa' ? 'success' : 'warn';
  }

  formatearDescuento(p: Promotion): string {
    return p.tipo === 'PORCENTAJE' ? `${p.valor}%` : `S/. ${p.valor.toFixed(2)}`;
  }

  getFirstRecord(): number {
    return this.paginaActual() * this.itemsPorPagina() + 1;
  }

  getLastRecord(): number {
    const last = (this.paginaActual() + 1) * this.itemsPorPagina();
    return last > this.totalItems() ? this.totalItems() : last;
  }
}
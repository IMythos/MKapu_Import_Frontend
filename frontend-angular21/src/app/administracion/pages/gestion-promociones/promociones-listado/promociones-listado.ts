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
import { SharedTableContainerComponent } from '../../../../shared/components/table.componente/shared-table-container.component';

import { PromotionsService, Promotion } from '../../../services/promotions.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.components';

interface Filtros {
  busqueda: string;
  tipo: string;
  estado: string;
  rangoDescuento: string;
}

@Component({
  selector: 'app-promociones-listado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ConfirmDialogModule,
    ToastModule,
    TableModule,
    TagModule,
    TooltipModule,
    SharedTableContainerComponent
  ],
  templateUrl: './promociones-listado.html',
  styleUrl: './promociones-listado.css',
  providers: [ConfirmationService, MessageService],
})
export class PromocionesListado implements OnInit, OnDestroy {

  private readonly promotionsService   = inject(PromotionsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService      = inject(MessageService);
  private readonly router              = inject(Router);

  private destroy$ = new Subject<void>();

  filtros = signal<Filtros>({
    busqueda: '',
    tipo: '',
    estado: 'Activa',
    rangoDescuento: ''
  });

  tiposPromocion = [
    { label: 'Porcentaje', value: 'PORCENTAJE' },
    { label: 'Monto fijo', value: 'MONTO' }
  ];

  estadosPromocion = [
    { label: 'Activa', value: 'Activa' },
    { label: 'Inactiva', value: 'Inactiva' }
  ];

  rangosDescuento = [
    { label: 'Hasta 10%', value: '0-10' },
    { label: 'De 10% a 25%', value: '10-25' },
    { label: 'De 25% a 50%', value: '25-50' },
    { label: 'Más de 50%', value: '50-100' }
  ];

  itemsPorPagina = signal(5);
  paginaActual = signal(1);

  readonly promociones = this.promotionsService.promociones;
  readonly loading     = this.promotionsService.loading;

  readonly filteredPromociones = computed(() => {

    const f = this.filtros();
    let filtradas = this.promociones();

    if (f.busqueda) {
      const t = f.busqueda.trim().toLowerCase();
      filtradas = filtradas.filter(p =>
        p.concepto.toLowerCase().includes(t) ||
        p.tipo.toLowerCase().includes(t) ||
        String(p.valor).includes(t)
      );
    }

    if (f.tipo)
      filtradas = filtradas.filter(p => p.tipo === f.tipo);

    if (f.estado)
      filtradas = filtradas.filter(p => this.obtenerEstado(p) === f.estado);

    if (f.rangoDescuento) {
      const [min, max] = f.rangoDescuento.split('-').map(Number);
      filtradas = filtradas.filter(p => p.valor >= min && p.valor <= max);
    }

    return [...filtradas].sort((a, b) => {
      if (a.activo === b.activo) return 0;
      return a.activo ? -1 : 1;
    });

  });

  readonly promocionesPaginadas = computed(() => {

    const data = this.filteredPromociones();

    const start = (this.paginaActual() - 1) * this.itemsPorPagina();
    const end   = start + this.itemsPorPagina();

    return data.slice(start, end);

  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredPromociones().length / this.itemsPorPagina())
  );

  readonly kpiActivas   = computed(() => this.promociones().filter(p => p.activo).length);
  readonly kpiTotal     = computed(() => this.promociones().length);
  readonly kpiInactivas = computed(() => this.promociones().filter(p => !p.activo).length);
  readonly kpiConReglas = computed(() => this.promociones().filter(p => p.reglas.length > 0).length);

  ngOnInit(): void {
    this.cargarPromociones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPromociones(): void {

    this.promotionsService
      .loadPromotions(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe();

  }

  setBusqueda(valor: string) {
    this.filtros.update(f => ({ ...f, busqueda: valor }));
  }

  setTipo(valor: string) {
    this.filtros.update(f => ({ ...f, tipo: valor ?? '' }));
  }

  setEstado(valor: string) {
    this.filtros.update(f => ({ ...f, estado: valor ?? '' }));
  }

  setRangoDescuento(valor: string) {
    this.filtros.update(f => ({ ...f, rangoDescuento: valor ?? '' }));
  }

  limpiarFiltros(): void {

    this.filtros.set({
      busqueda: '',
      tipo: '',
      estado: '',
      rangoDescuento: ''
    });

    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han limpiado todos los filtros'
    });

  }

  onPageChange(page: number) {
    this.paginaActual.set(page);
  }

  onLimitChange(limit: number) {
    this.itemsPorPagina.set(limit);
    this.paginaActual.set(1);
  }

  irANueva() {
    this.router.navigate(['/admin/promociones/crear']);
  }

  verPromocion(id: number) {
    this.router.navigate(['/admin/promociones/ver-detalle', id]);
  }

  editarPromocion(id: number) {
    this.router.navigate(['/admin/promociones/editar', id]);
  }

  toggleEstado(promo: Promotion): void {

    const accion = promo.activo ? 'desactivar' : 'activar';

    this.confirmationService.confirm({
      message: `¿Deseas ${accion} la promoción "${promo.concepto}"?`,
      header: 'Confirmar cambio de estado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {

        this.promotionsService
          .updatePromotionStatus(promo.idPromocion, !promo.activo)
          .subscribe(() => {

            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Promoción ${promo.activo ? 'desactivada' : 'activada'} correctamente`
            });

            this.cargarPromociones();

          });

      }
    });

  }

  eliminarPromocion(id: number, concepto: string): void {

    this.confirmationService.confirm({
      message: `¿Deseas eliminar permanentemente la promoción "${concepto}"?`,
      header: 'Eliminar permanentemente',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {

        this.promotionsService
          .hardDeletePromotion(id)
          .subscribe(() => {

            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Promoción eliminada permanentemente'
            });

            this.cargarPromociones();

          });

      }
    });

  }

  obtenerEstado(p: Promotion): 'Activa' | 'Inactiva' {
    return p.activo ? 'Activa' : 'Inactiva';
  }

  severidadEstado(estado: string): 'success' | 'warn' {
    return estado === 'Activa' ? 'success' : 'warn';
  }

  formatearDescuento(p: Promotion): string {
    return p.tipo === 'PORCENTAJE'
      ? `${p.valor}%`
      : `S/. ${p.valor.toFixed(2)}`;
  }

}
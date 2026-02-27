import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';

import { ConfirmationService, MessageService } from 'primeng/api';
import { PromocionesService, Promocion } from '../../../services/promociones.service';

interface Filtros {
  busqueda: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
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
    DatePickerModule,
  ],
  templateUrl: './promociones-listado.html',
  styleUrl: './promociones-listado.css',
  providers: [ConfirmationService, MessageService],
})
export class PromocionesListado implements OnInit, OnDestroy {
  // Signals
  promocionesSignal = signal<Promocion[]>([]);
  filteredPromociones = signal<Promocion[]>([]);
  loading = signal(false);
  itemsPorPagina = signal(10);
  paginaActual = signal(0);
  totalItems = signal(0);

  // Filtros
  filtros: Filtros = {
    busqueda: '',
    fechaInicio: null,
    fechaFin: null,
    tipo: '',
    estado: '',
    rangoDescuento: '',
  };

  tiposPromocion = [
    { label: 'Porcentaje', value: 'Porcentaje' },
    { label: 'Monto', value: 'Monto' },
  ];

  estadosPromocion = [
    { label: 'Activa', value: 'Activa' },
    { label: 'Inactiva', value: 'Inactiva' },
    { label: 'Expirada', value: 'Expirada' },
  ];

  rangosDescuento = [
    { label: 'Hasta 10%', value: '0-10' },
    { label: 'De 10% a 25%', value: '10-25' },
    { label: 'De 25% a 50%', value: '25-50' },
    { label: 'Más de 50%', value: '50-100' },
  ];

  private destroy$ = new Subject<void>();

  // Computed KPIs
  kpiPromocionesActivas = computed(() => {
    return this.promocionesSignal().filter((p) => p.estado === 'Activa').length;
  });

  kpiTotalPromociones = computed(() => this.promocionesSignal().length);

  kpiProximasExpirar = computed(() => {
    const hoy = new Date();
    const proximosMeses = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.promocionesSignal().filter(
      (p) =>
        p.estado === 'Activa' &&
        new Date(p.fechaFin) <= proximosMeses &&
        new Date(p.fechaFin) > hoy,
    ).length;
  });

  kpiExpiradas = computed(() => {
    const hoy = new Date();
    return this.promocionesSignal().filter((p) => new Date(p.fechaFin) < hoy).length;
  });

  constructor(
    private promocionesService: PromocionesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarPromociones();
  }

  cargarPromociones(): void {
    this.loading.set(true);
    const pagina = this.paginaActual() + 1;

    this.promocionesService
      .getPromociones(pagina, this.itemsPorPagina())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.promocionesSignal.set(data.promociones);
          this.totalItems.set(data.total);
          this.aplicarFiltros();
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar promociones' });
          this.loading.set(false);
        },
      });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.promocionesSignal()];

    if (this.filtros.busqueda) {
      const termino = this.filtros.busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termino) ||
          p.codigo.toLowerCase().includes(termino)
      );
    }

    if (this.filtros.tipo) {
      filtradas = filtradas.filter((p) => p.tipo === this.filtros.tipo);
    }

    if (this.filtros.estado) {
      filtradas = filtradas.filter((p) => p.estado === this.filtros.estado);
    }

    this.filteredPromociones.set(filtradas);
  }

  limpiarFiltros(): void {
    this.filtros = {
      busqueda: '',
      fechaInicio: null,
      fechaFin: null,
      tipo: '',
      estado: '',
      rangoDescuento: '',
    };
    this.paginaActual.set(0);
    this.aplicarFiltros();
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han limpiado todos los filtros',
    });
  }

  onPageChange(event: any): void {
    this.paginaActual.set(event.first / event.rows);
    this.itemsPorPagina.set(event.rows);
    this.cargarPromociones();
  }

  verPromocion(id: number): void {
    if (!id) return;
    this.router.navigate(['/admin/promociones/ver-detalle', id]);
  }

  editarPromocion(id: number): void {
    if (!id) return;
    this.router.navigate(['/admin/promociones/editar', id]);
  }

  irANueva(): void {
    this.router.navigate(['/admin/promociones/crear']);
  }

  eliminarPromocion(id: number, nombre: string): void {
    this.confirmationService.confirm({
      message: `¿Deseas eliminar la promoción "${nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading.set(true);
        this.promocionesService.deletePromocion(id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Promoción eliminada' });
          this.cargarPromociones();
        });
      },
    });
  }

  obtenerSeveridadEstado(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (estado) {
      case 'Activa': return 'success';
      case 'Inactiva': return 'warn';
      case 'Expirada': return 'danger';
      default: return 'info';
    }
  }

  getFirstRecord(): number {
    return this.paginaActual() * this.itemsPorPagina() + 1;
  }

  getLastRecord(): number {
    const last = (this.paginaActual() + 1) * this.itemsPorPagina();
    return last > this.totalItems() ? this.totalItems() : last;
  }

  obtenerValorDescuento(promo: Promocion): number {
    return promo.porcentaje || promo.monto || 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
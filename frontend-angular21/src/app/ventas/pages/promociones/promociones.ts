import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import {
  Promocion,
  FiltrosPromociones,
  PromocionesVentasService,
} from '../../services/promociones-ventas.service';

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    DialogModule,
    ProgressBarModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './promociones.html',
  styleUrl: './promociones.css',
})
export class Promociones implements OnInit {
  private readonly promoService = inject(PromocionesVentasService);
  private readonly messageService = inject(MessageService);

  // ── Estado ──
  readonly loading = signal(false);
  private readonly _promociones = signal<Promocion[]>([]);

  // ── Dialog ──
  dialogVisible = false;
  promocionSeleccionada: Promocion | null = null;

  // ── Filtros ──
  filtros: FiltrosPromociones & { rangoDescuento?: string } = {
    busqueda: '',
    tipo: undefined,
    rangoDescuento: undefined,
  };

  readonly tiposPromocion = [
    { label: 'Porcentaje', value: 'Porcentaje' },
    { label: 'Monto fijo', value: 'Monto' },
  ];

  readonly rangosDescuento = [
    { label: 'Hasta 10%', value: 'bajo' },
    { label: '10% - 20%', value: 'medio' },
    { label: 'Más de 20%', value: 'alto' },
  ];

  // ── Computed: promociones filtradas ──
  readonly filteredPromociones = computed(() => {
    let lista = this._promociones().filter((p) => p.estado === 'Activa' || p.estado === 'Próxima');

    const busqueda = this.filtros.busqueda?.trim().toLowerCase();
    if (busqueda) {
      lista = lista.filter(
        (p) =>
          p.codigo.toLowerCase().includes(busqueda) ||
          p.nombre.toLowerCase().includes(busqueda) ||
          p.descripcion.toLowerCase().includes(busqueda)
      );
    }

    if (this.filtros.tipo) {
      lista = lista.filter((p) => p.tipo === this.filtros.tipo);
    }

    if (this.filtros.rangoDescuento) {
      lista = lista.filter((p) => {
        const val = p.tipo === 'Porcentaje' ? (p.porcentaje ?? 0) : (p.monto ?? 0);
        if (this.filtros.rangoDescuento === 'bajo') return val <= 10;
        if (this.filtros.rangoDescuento === 'medio') return val > 10 && val <= 20;
        if (this.filtros.rangoDescuento === 'alto') return val > 20;
        return true;
      });
    }

    return lista;
  });

  // ── KPIs ──
  readonly kpiActivas = computed(
    () => this._promociones().filter((p) => p.estado === 'Activa').length
  );

  readonly kpiPorcentaje = computed(
    () =>
      this._promociones().filter(
        (p) => p.estado === 'Activa' && p.tipo === 'Porcentaje'
      ).length
  );

  readonly kpiMonto = computed(
    () =>
      this._promociones().filter(
        (p) => p.estado === 'Activa' && p.tipo === 'Monto'
      ).length
  );

  readonly kpiProximasExpirar = computed(() => {
    const en7dias = new Date();
    en7dias.setDate(en7dias.getDate() + 7);
    return this._promociones().filter((p) => {
      if (p.estado !== 'Activa') return false;
      const fin = new Date(p.fechaFin);
      return fin <= en7dias;
    }).length;
  });

  // ── Lifecycle ──
  ngOnInit(): void {
    this.cargarPromociones();
  }

  private cargarPromociones(): void {
    this.loading.set(true);
    this.promoService.getPromociones().subscribe({
      next: (data) => {
        this._promociones.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las promociones',
        });
        this.loading.set(false);
      },
    });
  }

  // ── Filtros ──
  aplicarFiltros(): void {
    // computed se recalcula automáticamente; este método existe
    // por si se necesita disparar lógica adicional en el futuro.
  }

  limpiarFiltros(): void {
    this.filtros = { busqueda: '', tipo: undefined, rangoDescuento: undefined };
  }

  // ── Dialog ──
  verDetalle(promo: Promocion): void {
    this.promocionSeleccionada = promo;
    this.dialogVisible = true;
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.promocionSeleccionada = null;
  }

  // ── Helpers de UI ──
  getSeveridadEstado(estado: string) {
    return this.promoService.getEstadoSeverity(estado);
  }

  getDiasRestantes(promo: Promocion): string {
    const dias = this.promoService.calcularDiasRestantes(promo.fechaFin);
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return '1 día restante';
    return `${dias} días restantes`;
  }

  getProgresoVigencia(promo: Promocion): number {
    return this.promoService.calcularProgresoVigencia(promo.fechaInicio, promo.fechaFin);
  }
}
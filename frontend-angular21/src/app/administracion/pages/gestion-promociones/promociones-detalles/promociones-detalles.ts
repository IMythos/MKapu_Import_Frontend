import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule }        from 'primeng/button';
import { CardModule }          from 'primeng/card';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PromotionsService, Promotion } from '../../../services/promotions.service';

@Component({
  selector: 'app-promociones-detalles',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    ButtonModule, CardModule, TagModule,
    ToastModule, ConfirmDialogModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './promociones-detalles.html',
  styleUrl:    './promociones-detalles.css',
})
export class PromocionesDetalles implements OnInit {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private promotionsService   = inject(PromotionsService);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  cargando  = signal<boolean>(true);
  promocion = signal<Promotion | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────────

  estadoActual = computed((): 'Activa' | 'Inactiva' => {
    return this.promocion()?.activo ? 'Activa' : 'Inactiva';
  });

  severidadEstado = computed((): 'success' | 'warn' => {
    return this.estadoActual() === 'Activa' ? 'success' : 'warn';
  });

  valorFormateado = computed((): string => {
    const p = this.promocion();
    if (!p) return '—';
    return p.tipo === 'PORCENTAJE' ? `${p.valor}%` : `S/. ${p.valor.toFixed(2)}`;
  });

  totalDescuentosAplicados = computed((): number => {
    return (this.promocion()?.descuentosAplicados ?? [])
      .reduce((acc, d) => acc + d.monto, 0);
  });

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/admin/promociones']);
      return;
    }

    this.promotionsService.getPromotionById(id).subscribe({
      next: promo => {
        this.promocion.set(promo);
        this.cargando.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la promoción.' });
        this.cargando.set(false);
      },
    });
  }

  // ─── Acciones ────────────────────────────────────────────────────────────────

  irEditar(): void {
    const id = this.promocion()?.idPromocion;
    if (id) this.router.navigate(['/admin/promociones/editar', id]);
  }

  volver(): void {
    this.router.navigate(['/admin/promociones']);
  }

  confirmarEliminar(): void {
    const p = this.promocion();
    if (!p) return;
    this.confirmationService.confirm({
      message:  `¿Estás seguro de eliminar <b>${p.concepto}</b>? Esta acción no se puede deshacer.`,
      header:   'Confirmar Eliminación',
      icon:     'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => this.eliminar(p.idPromocion),
    });
  }

  private eliminar(id: number): void {
    this.promotionsService.deletePromotion(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Promoción eliminada con éxito' });
        setTimeout(() => this.volver(), 1200);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la promoción.' });
      },
    });
  }
}
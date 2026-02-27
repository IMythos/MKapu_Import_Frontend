import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services & Interfaces
import { PromocionesService, Promocion } from '../../../services/promociones.service';

@Component({
  selector: 'app-promociones-detalles',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
    ButtonModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './promociones-detalles.html',
  styleUrl: './promociones-detalles.css',
})
export class PromocionesDetalles implements OnInit {
  // Inyecciones mediante inject()
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private promocionesService  = inject(PromocionesService);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Signals de estado
  cargando  = signal<boolean>(true);
  promocion = signal<Promocion | null>(null);

  /**
   * Determina el color del Tag basado en el estado de la promoción
   */
  severidadEstado = computed((): 'success' | 'warn' | 'danger' | 'secondary' => {
    const estado = this.promocion()?.estado;
    switch (estado) {
      case 'Activa':   return 'success';
      case 'Inactiva': return 'warn';
      case 'Expirada': return 'danger';
      default:         return 'secondary';
    }
  });

  /**
   * Calcula el texto amigable para el tiempo restante
   */
  diasRestantes = computed((): string => {
    const promo = this.promocion();
    if (!promo || !promo.fechaFin) return '-';
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(promo.fechaFin);
    fin.setHours(0, 0, 0, 0);

    const diffTime = fin.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)   return 'Expirada';
    if (diffDays === 0) return 'Vence hoy';
    return `${diffDays} día${diffDays === 1 ? '' : 's'}`;
  });

  /**
   * Calcula el porcentaje de avance entre la fecha inicio y fin
   */
  progresoVigencia = computed((): number => {
    const promo = this.promocion();
    if (!promo || !promo.fechaInicio || !promo.fechaFin) return 0;

    const inicio = new Date(promo.fechaInicio).getTime();
    const fin    = new Date(promo.fechaFin).getTime();
    const hoy    = Date.now();

    if (hoy <= inicio) return 0;
    if (hoy >= fin)    return 100;

    const total = fin - inicio;
    const transcurrido = hoy - inicio;
    return Math.round((transcurrido / total) * 100);
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.cargando.set(false);
      this.router.navigate(['/administracion/gestion-promociones']);
      return;
    }

    this.promocionesService.getPromocionById(Number(id)).subscribe({
      next: (promo: Promocion | undefined) => {
        if (promo) {
          this.promocion.set(promo);
        } else {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'No encontrada', 
            detail: 'La promoción solicitada no existe.' 
          });
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando promoción:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Error de conexión con el servidor.' 
        });
        this.cargando.set(false);
      },
    });
  }

  irEditar(): void {
    const id = this.promocion()?.id;
    if (id) {
      this.router.navigate(['/administracion/gestion-promociones/editar', id]);
    }
  }

  volver(): void {
    this.router.navigate(['/administracion/gestion-promociones']);
  }

  confirmarEliminar(): void {
    const promo = this.promocion();
    if (!promo) return;

    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la promoción <b>${promo.nombre}</b>? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => this.eliminar(promo.id),
    });
  }

  private eliminar(id: number): void {
    this.promocionesService.deletePromocion(id).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Eliminado', 
          detail: 'Promoción eliminada con éxito' 
        });
        // Pequeña pausa para que el usuario vea el Toast antes de redirigir
        setTimeout(() => this.volver(), 1200);
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo eliminar la promoción.' 
        });
      }
    });
  }
}
import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmacionDespachoStateService, ConfirmacionDespachoData } from '../../../../services/confirmacion-despacho.state.service';

@Component({
  selector: 'app-confirmar-despacho',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  templateUrl: './confirmar-despacho.html',
  styleUrl: './confirmar-despacho.css',
})
export class ConfirmarDespacho implements OnInit, OnDestroy {
  private readonly router        = inject(Router);
  private readonly stateService  = inject(ConfirmacionDespachoStateService);

  state = signal<ConfirmacionDespachoData | null>(null);
  animating = signal(true);

  readonly totalUnidades = computed(() =>
    this.state()?.productos.reduce((acc, p) => acc + p.cantidad_solicitada, 0) ?? 0
  );

  readonly estadoLabel = computed(() => {
    const labels: Record<string, string> = {
      GENERADO: 'Generado', EN_PREPARACION: 'En Preparación',
      EN_TRANSITO: 'En Tránsito', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
    };
    return labels[this.state()?.estado ?? ''] ?? this.state()?.estado ?? '—';
  });

  readonly fechaFormateada = computed(() => {
    const f = this.state()?.fechaEmision;
    const d = f ? new Date(f) : new Date();
    return d.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  });

  readonly mapUrl = computed(() => {
    const dir = this.state()?.direccionEntrega;
    if (!dir) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ', Lima, Perú')}`;
  });

  readonly tipoComprobante = computed(() => {
    const num = this.state()?.numeroComprobante ?? '';
    return num.startsWith('F') ? 'Factura Electrónica' : 'Boleta Electrónica';
  });

  ngOnInit(): void {
    const raw = sessionStorage.getItem('confirmar_despacho_data');
    if (raw) {
      const data = JSON.parse(raw);
      this.state.set(data);
      sessionStorage.removeItem('confirmar_despacho_data');
      setTimeout(() => this.animating.set(false), 100);
    } else {
      this.router.navigate(['/admin/despacho-productos']);
    }
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('confirmar_despacho_data');
  }

  getDetalleEstadoClass(estado: string): string {
    switch (estado) {
      case 'PREPARADO':  return 'cd-badge-preparado';
      case 'DESPACHADO': return 'cd-badge-despachado';
      case 'FALTANTE':   return 'cd-badge-faltante';
      default:           return 'cd-badge-pendiente';
    }
  }

  imprimirGuia(): void {
    window.print();
  }

  verHistorial(): void {
    this.router.navigate(['/admin/despacho-productos']);
  }
}
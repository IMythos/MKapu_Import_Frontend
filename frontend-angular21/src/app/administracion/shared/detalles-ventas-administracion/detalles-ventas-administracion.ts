import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { VentasAdminService } from '../../services/ventas.service';
import {
  SalesReceiptDetalleCompletoDto,
  ProductoDetalleAdmin,
} from '../../interfaces/ventas.interface';

import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-detalles-ventas-administracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Card,
    Button,
    Divider,
    Tag,
    TableModule,
    Tooltip,
    Toast,
    LoadingOverlayComponent,
  ],
  providers: [MessageService],
  templateUrl: './detalles-ventas-administracion.html',
  styleUrls: ['./detalles-ventas-administracion.css'],
})
export class DetallesVentasAdministracion implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly ventasService = inject(VentasAdminService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly tituloKicker = 'VENTAS - HISTORIAL DE VENTAS - DETALLE';
  readonly subtituloKicker = 'DETALLE DE VENTA';
  readonly iconoCabecera = 'pi pi-file-edit';

  detalle: SalesReceiptDetalleCompletoDto | null = null;
  loading = true;
  historialPage = 1;
  loadingHistorial = false;

  private subs = new Subscription();

  ngOnInit(): void {
    const sub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      id ? this.cargarDetalle(+id) : this.volver();
    });
    this.subs.add(sub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargarDetalle(id: number, histPage = 1): void {
    this.loading = true;
    this.historialPage = histPage;
    this.cdr.markForCheck();

    const sub = this.ventasService.getDetalleCompleto(id, histPage).subscribe({
      next: (data) => {
        this.detalle = data;
        this.loading = false;
        this.loadingHistorial = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.loadingHistorial = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la venta',
          life: 3000,
        });
        this.cdr.markForCheck();
        setTimeout(() => this.volver(), 2500);
      },
    });
    this.subs.add(sub);
  }

  cambiarPaginaHistorial(page: number): void {
    if (!this.detalle || this.loadingHistorial) return;
    this.loadingHistorial = true;
    this.historialPage = page;
    this.cdr.markForCheck();

    const id = this.detalle.id_comprobante;
    const sub = this.ventasService.getDetalleCompleto(id, page).subscribe({
      next: (data) => {
        this.detalle!.historial_cliente = data.historial_cliente;
        this.detalle!.historial_pagination = data.historial_pagination;
        this.loadingHistorial = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingHistorial = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el historial',
          life: 3000,
        });
        this.cdr.markForCheck();
      },
    });
    this.subs.add(sub);
  }

  // Determina si el item califica para la promo según las reglas
  itemCalificaPromocion(item: ProductoDetalleAdmin): boolean {
    const promo = this.detalle?.promocion;
    if (!promo) return false;

    // Si el backend ya lo marcó, respetamos eso
    if (item.promocion_aplicada) return true;

    const reglaProducto = promo.reglas?.find(
      (r: any) => r.tipoCondicion === 'PRODUCTO',
    );
    if (!reglaProducto) return false;

    return (
      item.cod_prod === reglaProducto.valorCondicion ||
      item.id_prod_ref === reglaProducto.valorCondicion
    );
  }

  // Qué mostrar en la columna "Descuento" por cada item
  getDescuentoItemDisplay(item: ProductoDetalleAdmin): {
    tipo: 'item' | 'promo' | 'none';
    label: string;
    monto: number;
  } {
    // 1) Descuento propio del ítem
    if (this.tieneDescuentoReal(item.descuento_nombre, item.descuento_porcentaje)) {
      return {
        tipo: 'item',
        label: `${item.descuento_nombre} (${item.descuento_porcentaje}%)`,
        monto: 0,
      };
    }

    const promo = this.detalle?.promocion;
    if (!promo) return { tipo: 'none', label: '', monto: 0 };

    // 2) Si el backend calculó monto de promo por ítem, usarlo
    if (item.promocion_aplicada && (item.descuento_promo_monto ?? 0) > 0) {
      const porcentaje =
        item.descuento_promo_porcentaje ??
        promo.descuento_porcentaje ??
        0;

      const label =
        porcentaje > 0
          ? `${promo.nombre} (${porcentaje}%)`
          : promo.nombre;

      return {
        tipo: 'promo',
        label,
        monto: item.descuento_promo_monto!,
      };
    }

    // 3) Si no hay monto por ítem, usar solo la regla para marcar el producto correcto
    if (this.itemCalificaPromocion(item)) {
      const porcentaje = promo.descuento_porcentaje ?? 0;
      const label =
        porcentaje > 0
          ? `${promo.nombre} (${porcentaje}%)`
          : promo.nombre;

      return {
        tipo: 'promo',
        label,
        monto: 0,
      };
    }

    return { tipo: 'none', label: '', monto: 0 };
  }

  calcularTotalItem(item: ProductoDetalleAdmin): number {
    // Usamos el total que viene del backend
    return item.total;
  }

  volver(): void {
    const state = history.state as { rutaRetorno?: string };
    state?.rutaRetorno
      ? this.router.navigateByUrl(state.rutaRetorno)
      : this.location.back();
  }

  irHistorialVentas(): void {
    this.router.navigate(['/admin/historial-ventas-administracion']);
  }

  verDetalleHistorial(idComprobante: number): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(
      ['/admin/detalles-ventas-administracion', idComprobante],
      {
        state: {
          rutaRetorno: `/admin/detalles-ventas-administracion/${this.detalle?.id_comprobante}`,
        },
      },
    );
  }

  imprimirComprobante(): void {
    if (!this.detalle) return;
    this.router.navigate(
      ['/admin/imprimir-comprobante-administracion'],
      {
        state: {
          comprobante: this.detalle,
          rutaRetorno: `/admin/detalles-ventas-administracion/${this.detalle.id_comprobante}`,
        },
      },
    );
  }

  imprimirHistorial(item: any): void {
    this.router.navigate(
      ['/admin/imprimir-comprobante-administracion'],
      {
        state: {
          comprobante: item,
          rutaRetorno: `/admin/detalles-ventas-administracion/${this.detalle?.id_comprobante}`,
        },
      },
    );
  }

  getTipoComprobanteLabel(): string {
    const tipo = this.detalle?.tipo_comprobante ?? '';
    return tipo.toUpperCase().includes('BOLETA') || tipo === '03'
      ? 'BOLETA'
      : 'FACTURA';
  }

  getTipoComprobanteIcon(): string {
    return this.getTipoComprobanteLabel() === 'BOLETA'
      ? 'pi pi-file'
      : 'pi pi-file-edit';
  }

  getSeverityEstado(estado: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (estado) {
      case 'EMITIDO':
        return 'success';
      case 'ANULADO':
        return 'danger';
      case 'RECHAZADO':
        return 'warn';
      default:
        return 'info';
    }
  }

  getSeverityTipoPago(metodo: string): 'success' | 'info' | 'warn' | 'secondary' {
    if (!metodo) return 'secondary';
    const m = metodo.toLowerCase();
    if (m.includes('efectivo')) return 'success';
    if (m.includes('yape') || m.includes('plin')) return 'info';
    if (m.includes('tarjeta')) return 'warn';
    return 'secondary';
  }

  getIconoMedioPago(medio: string): string {
    const m = (medio ?? '').toUpperCase();
    const map: Record<string, string> = {
      EFECTIVO: 'pi pi-money-bill',
      TARJETA: 'pi pi-credit-card',
      YAPE: 'pi pi-mobile',
      PLIN: 'pi pi-mobile',
      TRANSFERENCIA: 'pi pi-arrow-right-arrow-left',
    };
    return Object.entries(map).find(([k]) => m.includes(k))?.[1] ?? 'pi pi-wallet';
  }

  getTipoDocumentoLabel(): string {
    const tipo = this.detalle?.cliente?.tipo_documento ?? '';
    if (tipo.includes('RUC')) return 'RUC';
    if (tipo.includes('DNI')) return 'DNI';
    if (tipo.includes('PASAPORTE')) return 'PASAPORTE';
    return tipo || 'DOC';
  }

  getTipoPromocionLabel(tipo: string): string {
    const map: Record<string, string> = {
      PORCENTAJE: 'Descuento porcentual',
      MONTO_FIJO: 'Descuento monto fijo',
      '2X1': 'Promoción 2x1',
      ENVIO_GRATIS: 'Envío gratis',
      DESCUENTO: 'Descuento',
    };
    return map[tipo] ?? tipo;
  }

  getTipoPromocionIcon(tipo: string): string {
    const map: Record<string, string> = {
      PORCENTAJE: 'pi pi-percentage',
      MONTO_FIJO: 'pi pi-tag',
      '2X1': 'pi pi-gift',
      ENVIO_GRATIS: 'pi pi-truck',
      DESCUENTO: 'pi pi-tag',
    };
    return map[tipo] ?? 'pi pi-tag';
  }

  tieneDescuentoReal(nombre: string | null, porcentaje: number | null): boolean {
    if (!nombre || nombre.trim() === '' || nombre === 'SIN DESCUENTO') return false;
    if (!porcentaje || porcentaje <= 0) return false;
    return true;
  }

  get paginasHistorialVisibles(): number[] {
    const total = this.detalle?.historial_pagination?.total_pages ?? 1;
    const current = this.historialPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  get totalPaginasHistorial(): number {
    return this.detalle?.historial_pagination?.total_pages ?? 1;
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';

import { VentasService, ComprobanteVenta } from '../../../core/services/ventas.service';
import { PosService, Pago } from '../../../core/services/pos.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { SedeService, Sede } from '../../../core/services/sede.service';
import { PromocionesService, Promocion } from '../../../core/services/promociones.service';

@Component({
  selector: 'app-detalles-ventas-administracion',
  standalone: true,
  imports: [CommonModule, Card, Button, Divider, Tag, TableModule, Skeleton, Tooltip],
  templateUrl: './detalles-ventas-administracion.html',
  styleUrls: ['./detalles-ventas-administracion.css'],
})
export class DetallesVentasAdministracion implements OnInit, OnDestroy {
  comprobante: ComprobanteVenta | null = null;
  cliente: Cliente | null = null;
  pagos: Pago[] = [];
  sedes: Sede[] = [];
  promocion: Promocion | null = null;

  historialCompras: ComprobanteVenta[] = [];
  totalComprasCliente: number = 0;
  cantidadComprasCliente: number = 0;
  sedesVisitadas: string[] = [];

  loading: boolean = true;
  loadingHistorial: boolean = true;
  returnUrl: string = '/administracion/historial-ventas-administracion';

  tituloKicker = 'VENTAS - HISTORIAL DE VENTAS - DETALLE DE VENTA';
  subtituloKicker = 'DETALLE DE VENTA';
  iconoCabecera = 'pi pi-file-edit';

  private routeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private ventasService: VentasService,
    private posService: PosService,
    private clientesService: ClientesService,
    private sedeService: SedeService,
    private promocionesService: PromocionesService,
  ) {}

  ngOnInit(): void {
    this.cargarSedes();

    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.cargarDetalle(+id);
      } else {
        this.volver();
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  cargarSedes(): void {
    this.sedeService.getSedes().subscribe({
      next: (sedes: Sede[]) => {
        this.sedes = sedes;
      },
      error: (err: any) => {
        console.error('Error al cargar sedes:', err);
      },
    });
  }

  cargarDetalle(id: number): void {
    this.loading = true;

    this.comprobante = null;
    this.cliente = null;
    this.pagos = [];
    this.historialCompras = [];
    this.promocion = null;

    const resultado = this.ventasService.getComprobantePorIdNumerico(id);
    this.comprobante = resultado || null;

    if (!this.comprobante) {
      console.error('Comprobante no encontrado');
      this.loading = false;
      this.volver();
      return;
    }

    this.cliente = this.clientesService.getClientePorId(this.comprobante.id_cliente) || null;

    this.pagos = this.posService.getPagosPorComprobante(this.comprobante.id_comprobante);

    if (this.comprobante.id_promocion) {
      this.promocion = this.promocionesService.getPromocionPorId(this.comprobante.id_promocion);
    } else if (this.comprobante.codigo_promocion) {
      this.promocion = this.promocionesService.buscarPorCodigo(this.comprobante.codigo_promocion);
    }

    this.cargarHistorialCliente();

    this.loading = false;
  }

  cargarHistorialCliente(): void {
    if (!this.comprobante) return;

    this.loadingHistorial = true;

    this.historialCompras = this.ventasService
      .getComprobantesPorCliente(this.comprobante.id_cliente)
      .filter((c) => c.id !== this.comprobante!.id && c.estado === true)
      .sort((a, b) => new Date(b.fec_emision).getTime() - new Date(a.fec_emision).getTime());

    this.cantidadComprasCliente = this.historialCompras.length;
    this.totalComprasCliente = this.historialCompras.reduce((sum, c) => sum + c.total, 0);

    const sedesIds = [...new Set(this.historialCompras.map((c) => c.id_sede))];

    this.sedesVisitadas = sedesIds
      .map((id) => this.sedes.find((s) => s.id_sede === id))
      .filter((sede): sede is Sede => sede !== undefined)
      .map((sede) => sede.nombre);

    this.loadingHistorial = false;
  }

  volver(): void {
    this.location.back();
  }

  irHistorialVentas(): void {
    this.router.navigate(['/admin/historial-ventas-administracion']);
  }

  verDetalleHistorial(idComprobante: number): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/admin/detalles-ventas-administracion', idComprobante]);
  }

  imprimirComprobante(): void {
    if (!this.comprobante) return;

    this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
      state: {
        comprobante: this.comprobante,
        rutaRetorno: `/admin/detalles-ventas-administracion/${this.comprobante.id}`,
      },
    });
  }

  imprimirComprobanteHistorial(venta: ComprobanteVenta): void {
    this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
      state: {
        comprobante: venta,
        rutaRetorno: `/admin/detalles-ventas-administracion/${this.comprobante?.id}`,
      },
    });
  }

  descargarPDFHistorial(venta: ComprobanteVenta): void {
    this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
      state: {
        comprobante: venta,
        rutaRetorno: `/admin/detalles-ventas-administracion/${this.comprobante?.id}`,
      },
    });
  }

  enviarEmailHistorial(venta: ComprobanteVenta): void {
    if (!this.cliente?.email) {
      console.warn('Cliente no tiene email registrado');
      alert('El cliente no tiene un correo electrónico registrado.');
      return;
    }

    console.log('Enviando comprobante a:', this.cliente.email);
    console.log('Comprobante:', venta.id_comprobante);

    alert(`Email enviado a: ${this.cliente.email}\nComprobante: ${venta.serie}-${venta.numero}`);
  }

  getSede(comprobante: ComprobanteVenta): string {
    const sede = this.sedes.find((s) => s.id_sede === comprobante.id_sede);
    return sede ? sede.nombre : 'N/A';
  }

  getTipoComprobanteLabel(): string {
    return this.comprobante?.tipo_comprobante === '03' ? 'BOLETA' : 'FACTURA';
  }

  getTipoComprobanteIcon(): string {
    return this.comprobante?.tipo_comprobante === '03' ? 'pi pi-file' : 'pi pi-file-edit';
  }

  getEstadoSeverity(): 'success' | 'danger' {
    return this.comprobante?.estado ? 'success' : 'danger';
  }

  getEstadoLabel(): string {
    return this.comprobante?.estado ? 'ACTIVO' : 'ANULADO';
  }

  getTipoDocumento(): string {
    return this.cliente?.tipo_doc || (this.comprobante?.tipo_comprobante === '03' ? 'DNI' : 'RUC');
  }

  getIconoMedioPago(medio: string): string {
    const iconos: { [key: string]: string } = {
      EFECTIVO: 'pi pi-money-bill',
      TARJETA: 'pi pi-credit-card',
      YAPE: 'pi pi-mobile',
      PLIN: 'pi pi-mobile',
      TRANSFERENCIA: 'pi pi-arrow-right-arrow-left',
    };
    return iconos[medio] || 'pi pi-wallet';
  }

  formatearSerieNumero(serie: string, numero: number): string {
    return `${serie}-${numero.toString().padStart(8, '0')}`;
  }

  calcularTotalItem(cantidad: number, precio: number): number {
    return cantidad * precio;
  }

  tienePromocion(): boolean {
    return !!(
      this.comprobante?.codigo_promocion &&
      this.comprobante?.descuento_promocion &&
      this.comprobante.descuento_promocion > 0
    );
  }

  getDescripcionPromocion(): string {
    if (this.comprobante?.descripcion_promocion) {
      return this.comprobante.descripcion_promocion;
    }
    
    if (this.promocion?.descripcion) {
      return this.promocion.descripcion;
    }

    return 'Descuento especial';
  }

  getCodigoPromocion(): string {
    return this.comprobante?.codigo_promocion || '';
  }

  getDescuentoPromocion(): number {
    return this.comprobante?.descuento_promocion || 0;
  }

  getSubtotalAntesDescuento(): number {
    if (!this.comprobante) return 0;
    
    if (this.tienePromocion()) {
      return this.comprobante.subtotal + (this.comprobante.descuento_promocion || 0);
    }
    
    return this.comprobante.subtotal;
  }
}

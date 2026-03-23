import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductoDetalle, ProductoStockDetalle } from '../../../interfaces/producto.interface';
import { ProductoService } from '../../../services/producto.service';
import { SharedTableContainerComponent } from '../../../../shared/components/table.componente/shared-table-container.component';

@Component({
  selector: 'app-productos-detalles',
  standalone: true,
  imports: [
    CommonModule, CardModule, ButtonModule, TagModule,
    DividerModule, ToastModule, ConfirmDialog, ConfirmDialogModule,
    TableModule,
  ],
  templateUrl: './productos-detalles.html',
  styleUrl: './productos-detalles.css',
  providers: [ConfirmationService, MessageService],
})
export class ProductosDetalles implements OnInit {
  private router          = inject(Router);
  private route           = inject(ActivatedRoute);
  private productoService = inject(ProductoService);
  private messageService  = inject(MessageService);

  readonly productoDetalle = signal<ProductoDetalle | null>(null);
  readonly stockDetalle    = signal<ProductoStockDetalle | null>(null);
  readonly loading         = signal(true);
  readonly errorMsg        = signal<string | null>(null);

  /** Prioridad: queryParam → localStorage.idSede */
  private resolverSede(qParams: any): number | null {
    const fromQuery = Number(qParams.get('idSede'));
    if (fromQuery) return fromQuery;
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      return user.idSede ?? null;
    } catch { return null; }
  }

  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ]).subscribe(([params, qParams]) => {
      const idProducto = Number(params.get('id'));
      const idSede     = this.resolverSede(qParams);

      if (!idProducto) {
        this.loading.set(false);
        this.errorMsg.set('ID de producto inválido.');
        return;
      }

      if (!idSede) {
        this.loading.set(false);
        this.errorMsg.set('No se pudo determinar la sede. Abre el producto desde el listado seleccionando una sede primero.');
        return;
      }

      this.cargarDetalle(idProducto, idSede);
    });
  }

  cargarDetalle(idProducto: number, idSede: number) {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.productoService.getProductoDetalleStock(idProducto, idSede).subscribe({
      next: (resp) => {
        this.productoDetalle.set(resp.producto);
        this.stockDetalle.set(resp.stock ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        // 404 = este producto no tiene stock en la sede solicitada
        // Mostrar igual la info del producto sin stock si el backend la retorna parcialmente
        if (err?.status === 404) {
          this.errorMsg.set(
            'Este producto no tiene stock en la sede seleccionada. ' +
            'Cambia la sede en el listado para ver el stock correcto.'
          );
        } else {
          this.errorMsg.set('No se pudo conectar con el servidor. Intenta nuevamente.');
        }
      },
    });
  }

  getStockSeverity(stock: number): 'success' | 'warn' | 'danger' {
    if (stock >= 10) return 'success';
    if (stock > 0)   return 'warn';
    return 'danger';
  }

  getEstadoAlmacen(estado: any): string {
    if (estado === 1 || estado === true)  return 'Activo';
    if (estado === 0 || estado === false) return 'Inactivo';
    return String(estado);
  }

  volver() { this.router.navigate(['/admin/gestion-productos']); }

  irEditar() {
    const idSede     = this.resolverSede(this.route.snapshot.queryParamMap);
    const idProducto = Number(this.route.snapshot.paramMap.get('id'));
    this.router.navigate(
      ['/admin/gestion-productos/editar-producto', idProducto],
      { queryParams: { idSede } },
    );
  }
}
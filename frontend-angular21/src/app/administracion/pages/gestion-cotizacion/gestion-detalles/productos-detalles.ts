import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { CardModule } from 'primeng/card';
import { Button } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ProductosService, Producto } from '../../../../core/services/productos.service';
import { ProductoDetalle, ProductoStockDetalle } from '../../../interfaces/producto.interface';
import { ProductoService } from '../../../services/producto.service';

@Component({
  selector: 'app-productos-detalles',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Button,
    TagModule,
    DividerModule,
    ToastModule,
    ConfirmDialog
  ],
  templateUrl: './productos-detalles.html',
  styleUrl: './productos-detalles.css',
  providers: [ConfirmationService, MessageService]
})
export class ProductosDetalles implements OnInit {
  producto: Producto | null = null;
  productoId: number | null = null;
  loading = true;

  productoDetalle!: ProductoDetalle;
  stockDetalle!: ProductoStockDetalle;
  idProducto!: number;
  idSede: number = 1; // puedes traerlo dinámico si quieres
  //loading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productosService: ProductosService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private productoService: ProductoService
  ) {}

  ngOnInit() {
    console.log(123)
    this.route.paramMap.subscribe(params => {
    this.idProducto = Number(params.get('id'));

    if (this.idProducto) {
      this.getDetalleProducto();
    }
  });
  }

    getDetalleProducto() {
    this.loading = true;

    this.productoService
      .getProductoDetalleStock(this.idProducto, this.idSede)
      .subscribe({
        next: (resp) => {
          this.productoDetalle = resp.producto;
          this.stockDetalle = resp.stock;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }


  cargarProducto(id: number) {
    this.loading = true;
    this.producto = this.productosService.getProductoPorId(id);
    
    if (!this.producto) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Producto no encontrado',
        life: 3000
      });
      setTimeout(() => this.volver(), 2000);
    }
    
    this.loading = false;
  }

  volver() {
    this.router.navigate(['/admin/gestion-productos']);
  }

  irEditar() {
    if (this.productoId) {
      this.router.navigate(['/admin/gestion-productos/editar-producto', this.productoId], {
        queryParams: { returnUrl: `/admin/gestion-productos/ver-detalle-producto/${this.productoId}` }
      });
    }
  }

  eliminarProducto(event: Event) {
    if (!this.producto || !this.producto.id) return;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Seguro que deseas eliminar el producto "${this.producto.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Eliminar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        const exito = this.productosService.eliminarProducto(this.producto!.id!);
        if (exito) {
          this.messageService.add({
            severity: 'success',
            summary: 'Producto Eliminado',
            detail: `"${this.producto!.nombre}" movido a eliminados`,
            life: 3000
          });
          setTimeout(() => this.volver(), 1500);
        }
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Eliminación cancelada',
          life: 2000
        });
      }
    });
  }

  restaurarProducto(event: Event) {
    if (!this.producto || !this.producto.id) return;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Restaurar <strong>${this.producto.nombre}</strong>?`,
      header: 'Confirmar Restauración',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Restaurar',
      acceptButtonProps: { severity: 'warning' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        const exito = this.productosService.restaurarProducto(this.producto!.id!);
        if (exito) {
          this.messageService.add({
            severity: 'success',
            summary: 'Producto Restaurado',
            detail: `"${this.producto!.nombre}" restaurado exitosamente`,
            life: 3000
          });
          this.cargarProducto(this.productoId!);
        }
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Restauración cancelada',
          life: 2000
        });
      }
    });
  }

  get esProductoEliminado(): boolean {
    return this.producto?.estado === 'Eliminado';
  }

  get margenGanancia(): number {
    if (!this.producto) return 0;
    return this.productosService.getMargenGanancia(this.producto);
  }

  get porcentajeMargen(): number {
    if (!this.producto) return 0;
    return this.productosService.getPorcentajeMargen(this.producto);
  }

  get tieneVariasSedes(): boolean {
    return (this.producto?.variantes?.length || 0) > 1;
  }

  formatearNombreSede(sede: string): string {
    return sede
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  }

  getStockSeverity(stock: number): 'success' | 'warn' | 'danger' {
    if (stock > 30) return 'success';
    if (stock > 10) return 'warn';
    return 'danger';
  }

  getStockPorSede(sede: string): number {
    return this.producto?.variantes?.find(v => v.sede === sede)?.stock || 0;
  }

  irTransferirProducto() {
  if (this.productoId) {
    this.router.navigate(['/admin/transferencia'], {
      queryParams: { productoId: this.productoId }
    });
  }
}
}

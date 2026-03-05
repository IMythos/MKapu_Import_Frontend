import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';

@Component({
  selector: 'app-detalle-movimiento-inventario',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TableModule],
  templateUrl: './movimientos-inventario-detalle.html'
})
export class DetalleMovimientoInventario implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movimientosService = inject(MovimientosInventarioService);

  movimiento = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    }
  }

  cargarDetalle(id: string) {
    const listado = this.movimientosService.movimientosListado();
    const movEnMemoria = listado.find(m => m.id === Number(id));
    
    if (movEnMemoria) {
      this.movimiento.set(movEnMemoria);
    } else {
      this.movimientosService.getMovimientoById(id).subscribe({
        next: (res) => this.movimiento.set(res.data || res),
        error: (err) => {
          console.error('Error cargando detalle', err);
          this.volver(); // Lo sacamos de ahí si no existe
        }
      });
    }
  }

  getSeverity(tipo: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    switch (tipo?.toUpperCase()) {
      case 'INGRESO':
      case 'COMPRA':
        return 'success';
      case 'SALIDA':
      case 'VENTA':
        return 'danger';
      case 'TRANSFERENCIA':
        return 'info';
      case 'AJUSTE':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  volver() {
    this.router.navigate(['/logistica/movimiento-inventario']);
  }
}

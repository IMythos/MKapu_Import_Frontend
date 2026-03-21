import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';
import { MovimientoInventario } from '../../interfaces/movimiento-inventario.interface';

@Component({
  selector: 'app-detalle-movimiento-inventario',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TableModule],
  templateUrl: './movimientos-inventario-detalle.html',
  styleUrl: './movimientos-inventario-detalle.css'
})
export class DetalleMovimientoInventario implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movimientosService = inject(MovimientosInventarioService);

  movimiento = signal<MovimientoInventario | null>(null);
  movimientoId = signal<number | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.movimientoId.set(Number(id));
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
    const state = history.state as { rutaRetorno?: string };

    if (state?.rutaRetorno) {
      this.router.navigateByUrl(state.rutaRetorno);
      return;
    }

    const moduloBase = this.router.url.startsWith('/ventas') ? '/ventas' : '/logistica';
    this.router.navigate([moduloBase, 'movimiento-inventario']);
  }
}

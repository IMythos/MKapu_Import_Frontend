// src/app/ventas/pages/cotizaciones/detalle-cotizacion/detalle-cotizacion.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

import {
  MockDataService,
  CotizacionMock,
  CotizacionMockDetalle,
} from '../../../../core/services/mock-data.service';

@Component({
  selector: 'app-detalle-cotizacion',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, DividerModule, TooltipModule],
  templateUrl: './detalle-cotizacion.html',
  styleUrl: './detalle-cotizacion.css',
})
export class DetalleCotizacion implements OnInit {
  cotizacion: CotizacionMock | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mockData: MockDataService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.cotizacion = this.mockData.getCotizacionById(id) ?? null;
    this.loading = false;
  }

  get subtotal(): number {
    if (!this.cotizacion) return 0;
    return this.cotizacion.detalles.reduce(
      (acc: number, d: CotizacionMockDetalle) => acc + d.subtotal,
      0,
    );
  }

  get igv(): number {
    return this.cotizacion ? this.cotizacion.total - this.subtotal : 0;
  }

  mapEstadoSeverity(
    estado: CotizacionMock['estado'],
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (estado) {
      case 'ACEPTADA': return 'success';
      case 'RECHAZADA': return 'danger';
      case 'ENVIADA':   return 'info';
      default:          return 'warn';
    }
  }

  irEditar(): void {
    if (this.cotizacion) {
      this.router.navigate(['/ventas/cotizaciones/editar', this.cotizacion.id_cotizacion]);
    }
  }

  volver(): void {
    this.router.navigate(['/ventas/cotizaciones']);
  }

  getUnidad(det: CotizacionMockDetalle): string {
    return det.producto.unidad ?? 'UND';
  }
}

// src/app/core/services/mock-data.service.ts

import { Injectable } from '@angular/core';

export interface ClienteMock {
  id_cliente: number;
  razon_social: string;
  ruc: string;
  direccion?: string;
}

export interface ProductoMock {
  id_producto: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  precio_unitario: number;
}

export interface CotizacionMockDetalle {
  id_detalle: number;
  producto: ProductoMock;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CotizacionMock {
  id_cotizacion: number;
  numero: string;
  fecha: string;
  cliente: ClienteMock;
  observaciones?: string;
  estado: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA';
  detalles: CotizacionMockDetalle[];
  total: number;
  revision?: number; // undefined en creación, definido en revisiones
}

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private clientes: ClienteMock[] = [
    {
      id_cliente: 1,
      razon_social: 'PERUVIAN STEAM',
      ruc: '10767700992',
      direccion: 'Av. Los Olivos 1200, Lima',
    },
    {
      id_cliente: 2,
      razon_social: 'DISTRIBUIDORA ANDINA SAC',
      ruc: '20456789123',
      direccion: 'Av. Argentina 2850, Lima',
    },
    {
      id_cliente: 3,
      razon_social: 'TEXTILES GAMARRA SAC',
      ruc: '20789123456',
      direccion: 'Jr. Gamarra 567, La Victoria',
    },
  ];

  private productos: ProductoMock[] = [
    {
      id_producto: 1,
      codigo: 'PRD-0001',
      descripcion: 'Caja de cartón reforzada 50x40x30',
      unidad: 'UND',
      precio_unitario: 8.5,
    },
    {
      id_producto: 2,
      codigo: 'PRD-0002',
      descripcion: 'Bolsa plástica biodegradables 40x50',
      unidad: 'PAQ',
      precio_unitario: 15.9,
    },
    {
      id_producto: 3,
      codigo: 'PRD-0003',
      descripcion: 'Cinta de embalaje 48mm x 100m',
      unidad: 'ROLLO',
      precio_unitario: 4.2,
    },
  ];

  private cotizaciones: CotizacionMock[] = [];

  constructor() {
    this.initCotizacionesMock();
  }

  private initCotizacionesMock(): void {
    if (this.cotizaciones.length > 0) return;

    const cliente1 = this.clientes[0];
    const cliente2 = this.clientes[1];

    const det1: CotizacionMockDetalle = {
      id_detalle: 1,
      producto: this.productos[0],
      cantidad: 100,
      precio_unitario: this.productos[0].precio_unitario,
      subtotal: 100 * this.productos[0].precio_unitario,
    };

    const det2: CotizacionMockDetalle = {
      id_detalle: 2,
      producto: this.productos[1],
      cantidad: 50,
      precio_unitario: this.productos[1].precio_unitario,
      subtotal: 50 * this.productos[1].precio_unitario,
    };

    const det3: CotizacionMockDetalle = {
      id_detalle: 3,
      producto: this.productos[2],
      cantidad: 30,
      precio_unitario: this.productos[2].precio_unitario,
      subtotal: 30 * this.productos[2].precio_unitario,
    };

    this.cotizaciones = [
      {
        id_cotizacion: 1,
        numero: 'COT-0001',
        fecha: '2026-02-15',
        cliente: cliente1,
        observaciones: 'Entrega en 7 días hábiles.',
        estado: 'BORRADOR',
        detalles: [det1, det3],
        total: det1.subtotal + det3.subtotal,
        revision: undefined, // creado, sin revisión
      },
      {
        id_cotizacion: 2,
        numero: 'COT-0002',
        fecha: '2026-02-10',
        cliente: cliente2,
        observaciones: 'Precios válidos por 15 días.',
        estado: 'ENVIADA',
        detalles: [det2],
        total: det2.subtotal,
        revision: undefined, // enviado una sola vez, aún sin revisión
      },
    ];
  }

  getClientes(): ClienteMock[] {
    return [...this.clientes];
  }

  getProductos(): ProductoMock[] {
    return [...this.productos];
  }

  getCotizaciones(): CotizacionMock[] {
    return [...this.cotizaciones];
  }

  getCotizacionById(id: number): CotizacionMock | undefined {
    return this.cotizaciones.find(c => c.id_cotizacion === id);
  }

  crearCotizacion(cotizacion: CotizacionMock): void {
    this.cotizaciones = [...this.cotizaciones, cotizacion];
  }

  actualizarCotizacion(cotizacion: CotizacionMock): void {
    this.cotizaciones = this.cotizaciones.map(c =>
      c.id_cotizacion === cotizacion.id_cotizacion ? cotizacion : c,
    );
  }
}

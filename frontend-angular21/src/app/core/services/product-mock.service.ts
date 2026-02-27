// src/app/core/services/product-mock.service.ts

import { Injectable } from '@angular/core';

export interface ProductoSugerido {
  id: number;
  nombre: string;
  codigo: string;
  precio: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductMockService {
  private productos: ProductoSugerido[] = [
    { id: 1, nombre: 'Laptop HP 15"', codigo: 'LAP-001', precio: 2500 },
    { id: 2, nombre: 'Monitor LG 24"', codigo: 'MON-002', precio: 850 },
    { id: 3, nombre: 'Teclado Mecánico Redragon', codigo: 'TEC-003', precio: 180 },
    { id: 4, nombre: 'Mouse Logitech MX Master', codigo: 'MOU-004', precio: 320 },
    { id: 5, nombre: 'Silla Ergonómica Premium', codigo: 'SIL-005', precio: 1200 },
    { id: 6, nombre: 'Webcam Full HD 1080p', codigo: 'WEB-006', precio: 250 },
    { id: 7, nombre: 'Auriculares Sony WH-1000XM5', codigo: 'AUR-007', precio: 980 },
    { id: 8, nombre: 'SSD Samsung 1TB', codigo: 'SSD-008', precio: 420 },
  ];

  getProductos(): ProductoSugerido[] {
    return [...this.productos];
  }
}

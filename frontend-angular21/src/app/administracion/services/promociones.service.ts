import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Promocion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  porcentaje?: number;
  monto?: number;
  tipo: 'Porcentaje' | 'Monto';
  fechaInicio: Date;
  fechaFin: Date;
  estado: 'Activa' | 'Inactiva' | 'Expirada';
  condiciones?: string;
  productosCantidad?: number;
}

export interface PromocionResponse {
  promociones: Promocion[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PromocionesService {
  private dataMock: Promocion[] = [
    {
      id: 1,
      codigo: 'PROM-001',
      nombre: 'Descuento Verano',
      descripcion: 'Descuento especial para los productos de temporada de verano',
      porcentaje: 20,
      tipo: 'Porcentaje',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2026-03-31'),
      estado: 'Activa',
      productosCantidad: 45
    },
    {
      id: 2,
      codigo: 'PROM-002',
      nombre: 'Black Friday',
      descripcion: 'Gran descuento en toda la tienda durante Black Friday',
      porcentaje: 50,
      tipo: 'Porcentaje',
      fechaInicio: new Date('2026-11-25'),
      fechaFin: new Date('2026-12-01'),
      estado: 'Inactiva',
      productosCantidad: 120
    },
    {
      id: 3,
      codigo: 'PROM-003',
      nombre: 'Compre 2 Lleve 3',
      descripcion: 'Promoción especial: Compra 2 productos y lleva 3',
      porcentaje: 33,
      tipo: 'Porcentaje',
      fechaInicio: new Date('2025-12-01'),
      fechaFin: new Date('2026-01-15'),
      estado: 'Expirada',
      productosCantidad: 80
    },
    {
      id: 4,
      codigo: 'PROM-004',
      nombre: 'Envío Gratis',
      descripcion: 'Envío gratuito en compras mayores a $100',
      monto: 100,
      tipo: 'Monto',
      fechaInicio: new Date('2026-02-01'),
      fechaFin: new Date('2026-12-31'),
      estado: 'Activa',
      productosCantidad: 200
    }
  ];

  constructor() {}

  getPromociones(pagina: number = 1, limite: number = 10, estado?: string): Observable<PromocionResponse> {
    let promociones = [...this.dataMock];
    if (estado && estado !== '') {
      promociones = promociones.filter(p => p.estado === estado);
    }
    const inicio = (pagina - 1) * limite;
    const fin = inicio + limite;
    const paginadas = promociones.slice(inicio, fin);

    return of({
      promociones: paginadas,
      total: promociones.length
    }).pipe(delay(500));
  }

getPromocionById(id: number): Observable<Promocion | undefined> {
    const promocion = this.dataMock.find(p => p.id === id);
    return of(promocion).pipe(delay(300));
  }

  createPromocion(promocion: Omit<Promocion, 'id'>): Observable<Promocion> {
    const nuevoId = Math.max(...this.dataMock.map(p => p.id), 0) + 1;
    const nueva: Promocion = { ...promocion, id: nuevoId };
    this.dataMock.push(nueva);
    return of(nueva).pipe(delay(500));
  }

  updatePromocion(id: number, promocion: Partial<Promocion>): Observable<Promocion> {
    const index = this.dataMock.findIndex(p => p.id === id);
    if (index !== -1) {
      this.dataMock[index] = { ...this.dataMock[index], ...promocion };
      return of(this.dataMock[index]).pipe(delay(500));
    }
    return of({} as Promocion).pipe(delay(500));
  }

  deletePromocion(id: number): Observable<void> {
    const index = this.dataMock.findIndex(p => p.id === id);
    if (index !== -1) {
      this.dataMock.splice(index, 1);
    }
    return of(void 0).pipe(delay(500));
  }
}
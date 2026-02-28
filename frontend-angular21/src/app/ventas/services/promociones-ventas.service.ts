import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

export interface Promocion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: 'Porcentaje' | 'Monto';
  porcentaje?: number;
  monto?: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Activa' | 'Expirada' | 'Próxima' | 'Inactiva';
  montoMinimo?: number;
  usoMaximo?: number;
  usoActual?: number;
  tipoComprobante?: string;
  productosCantidad?: number;
  condiciones?: string;
}

export interface PromocionesResponse {
  data: Promocion[];
  total: number;
}

export interface FiltrosPromociones {
  busqueda?: string;
  tipo?: string;
  rangoDescuento?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PromocionesVentasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/promociones`;

  // ── Obtener solo promociones activas/vigentes (vista de ventas) ──
  getPromocionesActivas(): Observable<Promocion[]> {
    return this.http
      .get<PromocionesResponse>(`${this.baseUrl}/activas`)
      .pipe(
        map((res) => res.data ?? res as unknown as Promocion[]),
        catchError(() => of(MOCK_PROMOCIONES))
      );
  }

  // ── Obtener todas las promociones (con filtros opcionales) ──
  getPromociones(filtros?: FiltrosPromociones): Observable<Promocion[]> {
    return this.http
      .get<PromocionesResponse>(this.baseUrl, { params: filtros as Record<string, string> })
      .pipe(
        map((res) => res.data ?? res as unknown as Promocion[]),
        catchError(() => of(MOCK_PROMOCIONES))
      );
  }

  // ── Obtener detalle de una promoción ──
  getPromocionById(id: number): Observable<Promocion | null> {
    return this.http
      .get<Promocion>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(() => {
          const promo = MOCK_PROMOCIONES.find((p) => p.id === id) ?? null;
          return of(promo);
        })
      );
  }

  // ── Utilidades de dominio ──

  calcularDiasRestantes(fechaFin: string): number {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diff = fin.getTime() - hoy.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  calcularProgresoVigencia(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio).getTime();
    const fin = new Date(fechaFin).getTime();
    const hoy = Date.now();

    if (hoy <= inicio) return 0;
    if (hoy >= fin) return 100;

    const progreso = ((hoy - inicio) / (fin - inicio)) * 100;
    return Math.round(progreso);
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary' | 'info'> = {
      Activa: 'success',
      Próxima: 'info',
      Expirada: 'danger',
      Inactiva: 'secondary',
    };
    return map[estado] ?? 'secondary';
  }
}

// ── Mock data (mientras no exista el endpoint real) ──
const MOCK_PROMOCIONES: Promocion[] = [
  {
    id: 1,
    codigo: 'VERANO2026',
    nombre: 'Promo Verano',
    descripcion: 'Descuento especial para la temporada de verano en todos los productos seleccionados.',
    tipo: 'Porcentaje',
    porcentaje: 15,
    fechaInicio: '2026-01-01',
    fechaFin: '2026-03-31',
    estado: 'Activa',
    montoMinimo: 100,
    productosCantidad: 42,
  },
  {
    id: 2,
    codigo: 'BIENVENIDA10',
    nombre: 'Bienvenida Nuevos Clientes',
    descripcion: 'Cupón exclusivo para primeras compras de clientes nuevos registrados en la plataforma.',
    tipo: 'Porcentaje',
    porcentaje: 10,
    fechaInicio: '2026-02-01',
    fechaFin: '2026-12-31',
    estado: 'Activa',
    productosCantidad: 0,
  },
  {
    id: 3,
    codigo: 'DESC50SOL',
    nombre: 'Descuento Fijo S/50',
    descripcion: 'Descuento fijo de S/50 en compras mayores a S/300 en productos importados.',
    tipo: 'Monto',
    monto: 50,
    fechaInicio: '2026-01-15',
    fechaFin: '2026-04-30',
    estado: 'Activa',
    montoMinimo: 300,
    productosCantidad: 18,
  },
  {
    id: 4,
    codigo: 'LIQUIDACION25',
    nombre: 'Liquidación de Temporada',
    descripcion: 'Gran liquidación con 25% de descuento en stock disponible de temporada anterior.',
    tipo: 'Porcentaje',
    porcentaje: 25,
    fechaInicio: '2026-03-01',
    fechaFin: '2026-05-31',
    estado: 'Próxima',
    productosCantidad: 76,
  },
  {
    id: 5,
    codigo: 'NAVIDAD2025',
    nombre: 'Promoción Navideña 2025',
    descripcion: 'Descuento navideño del 20% en artículos seleccionados durante diciembre.',
    tipo: 'Porcentaje',
    porcentaje: 20,
    fechaInicio: '2025-12-01',
    fechaFin: '2025-12-31',
    estado: 'Expirada',
    productosCantidad: 30,
  },
];
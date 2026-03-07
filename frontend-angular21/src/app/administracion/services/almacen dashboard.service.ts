import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

// ── Interfaces de respuesta ───────────────────────────────────────────

export interface AlmacenKpisDto {
  valorInventario:   number;
  itemsBajoStock:    number;
  exactitudInventario: number;
  rotacionPromedio:  number;
  tendencias: {
    valorInventario:    string;
    itemsBajoStock:     string;
    exactitudInventario: string;
    rotacionPromedio:   string;
  };
}

export interface RendimientoDataPoint {
  label:    string;
  cantidad: number;
}

export interface RendimientoChartDto {
  labels: string[];
  datos:  number[];
}

export interface SaludStockDto {
  optimo:     number;
  bajoStock:  number;
  sobreStock: number;
}

export interface MovimientoRecienteDto {
  fecha:      string;
  tipo:       'INGRESO' | 'SALIDA' | 'AJUSTE';
  referencia: string;
  producto:   string;
  cantidad:   number;
  usuario:    string;
}

export interface ProductoCriticoDto {
  codigo:      string;
  descripcion: string;
  stock:       number;
  stockMinimo: number;
  rotacion:    number;
}

@Injectable({ providedIn: 'root' })
export class AlmacenDashboardService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/logistics/warehouse/reports`;

  private buildParams(periodo: string, sedeId?: string | null): HttpParams {
    let params = new HttpParams().set('periodo', periodo);
    if (sedeId != null && sedeId !== '') params = params.set('sedeId', sedeId);
    return params;
  }

  getKpis(periodo = 'mes', sedeId?: string | null): Observable<AlmacenKpisDto> {
    const params = this.buildParams(periodo, sedeId);
    console.log('🚀 Llamando kpis con params:', params.toString()); // ← agregar
    return this.http.get<AlmacenKpisDto>(`${this.baseUrl}/kpis`, { params });
  }

  getRendimientoChart(periodo = 'mes', sedeId?: string | null): Observable<RendimientoChartDto> {
    return this.http.get<RendimientoChartDto>(`${this.baseUrl}/rendimiento-chart`, {
      params: this.buildParams(periodo, sedeId),
    });
  }

  getSaludStock(anio: string, sedeId?: string | null): Observable<SaludStockDto> {
    let params = new HttpParams().set('anio', anio);
    if (sedeId != null && sedeId !== '') params = params.set('sedeId', sedeId);
    return this.http.get<SaludStockDto>(`${this.baseUrl}/salud-stock`, { params });
  }

  getMovimientosRecientes(sedeId?: string | null): Observable<MovimientoRecienteDto[]> {
    let params = new HttpParams();
    if (sedeId != null && sedeId !== '') params = params.set('sedeId', sedeId);
    return this.http.get<MovimientoRecienteDto[]>(`${this.baseUrl}/movimientos-recientes`, { params });
  }

  getProductosCriticos(sedeId?: string | null): Observable<ProductoCriticoDto[]> {
    let params = new HttpParams();
    if (sedeId != null && sedeId !== '') params = params.set('sedeId', sedeId);
    return this.http.get<ProductoCriticoDto[]>(`${this.baseUrl}/productos-criticos`, { params });
  }
}
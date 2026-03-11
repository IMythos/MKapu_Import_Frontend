import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import { catchError, Observable, tap } from 'rxjs';

export interface FiltrosConteo {
  id_sede: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ConteoInventarioService {
  private apiUrl = `${environment.apiUrl}/logistics/conteo-inventario`;
  private http = inject(HttpClient);

  public loading = signal<boolean>(false);
  public conteosListado = signal<any[]>([]);
  public conteoOperacion = signal<any | null>(null);
  totalRegistros = signal<number>(0);
  public totalDiferenciasCalculado = computed(() => {
    const detalles = this.conteoOperacion()?.detalles || [];
    return detalles.reduce((acc: number, det: any) => acc + Math.abs(det.diferencia || 0), 0);
  });
  listarConteos(filtros: FiltrosConteo) {
    this.loading.set(true);

    let params = new HttpParams();

    if (filtros.id_sede !== null && filtros.id_sede !== undefined) {
      params = params.set('id_sede', filtros.id_sede.toString());
    }

    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());

    this.http.get<any>(this.apiUrl, { params }).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.conteosListado.set(Array.isArray(data) ? data : []);
        this.totalRegistros.set(res.meta?.total || data.length || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  obtenerDetalle(idConteo: number): Observable<any> {
    this.loading.set(true);

    return this.http.get<any>(`${this.apiUrl}/${idConteo}`).pipe(
      tap((res) => {
        const dataPura = res.data ? res.data : res;
        this.conteoOperacion.set(dataPura);
        this.loading.set(false);
      }),
      catchError((err) => {
        console.error('Error obteniendo detalle fresco:', err);
        this.loading.set(false);
        throw err;
      }),
    );
  }
  iniciarNuevoConteo(payload: {
    idSede: number;
    nomSede: string;
    idUsuario: number;
    idCategoria?: number;
    nomCategoria?: string;
  }) {
    this.loading.set(true);
    return this.http.post<any>(this.apiUrl, payload);
  }
  finalizarYajustar(idConteo: number, estado: 'AJUSTADO' | 'ANULADO', data: any[]) {
  return this.http.patch(`${this.apiUrl}/${idConteo}/finalizar`, {
    estado,
    data, // Este array ya trae id_detalle y stock_conteo
    totalDiferencias: data.length > 0 ? 1 : 0, // Un valor por defecto para que no falle la validación general
    totalItems: data.length
  });
}
  obtenerSedes() {
    return this.http.get<any[]>(`${this.apiUrl.replace('/conteo-inventario', '')}/sedes`);
  }

  obtenerFamilias() {
    return this.http.get<any[]>(`${this.apiUrl.replace('/conteo-inventario', '')}/categorias`);
  }
  exportarExcel(idConteo: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idConteo}/exportar/excel`, {
      responseType: 'blob',
    });
  }

  exportarPdf(idConteo: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idConteo}/exportar/pdf`, {
      responseType: 'blob',
    });
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, tap, catchError, of, map } from 'rxjs';

import { ConteoInventario, DetalleConteo } from '../interfaces/conteo.interface';
import { environment } from '../../../enviroments/enviroment';

// Interfaz local para manejar los filtros
export interface FiltrosConteo {
  id_sede: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

@Injectable({ providedIn: 'root' })
export class ConteoInventarioService {
  private apiUrl = `${environment.apiUrl}/logistics/conteo-inventario`;
  private http = inject(HttpClient);
  
  private filtrosBusqueda = signal<FiltrosConteo | null>(null);

  public loading = signal<boolean>(false);
  public conteoActual = signal<ConteoInventario | null>(null);

  public conteos = toSignal(
    toObservable(this.filtrosBusqueda).pipe(
      filter(filtros => filtros !== null),
      tap(() => this.loading.set(true)),
      switchMap(filtros => {
        let params = new HttpParams().set('id_sede', filtros!.id_sede);
        if (filtros!.fecha_inicio) params = params.set('fecha_inicio', filtros!.fecha_inicio);
        if (filtros!.fecha_fin) params = params.set('fecha_fin', filtros!.fecha_fin);

        return this.http.get<{ status: number, data: ConteoInventario[] }>(this.apiUrl, { params }).pipe(
          map(res => res.data),
          catchError((err) => {
            console.error('Error al cargar conteos:', err);
            return of([]); 
          })
        );
      }),
      tap(() => this.loading.set(false))
    ),
    { initialValue: [] }
  );

  public totalDiferencias = computed(() => {
    const detalles = this.conteoActual()?.detalles || [];
    return detalles.reduce((acc, det) => acc + Math.abs(det.diferencia || 0), 0);
  });
  listarConteos(filtros: FiltrosConteo) {
    this.filtrosBusqueda.set(filtros);
  }

  iniciarNuevoConteo(idSede: number, nomSede: string, idUsuario: number) {
    return this.http.post<ConteoInventario>(this.apiUrl, { idSede, nomSede, idUsuario });
  }

  actualizarDetalleFisico(idDetalle: number, stockConteo: number, observacion: string) {
    return this.http.patch(`${this.apiUrl}/detalle/${idDetalle}`, { stockConteo, observacion });
  }

  finalizarYajustar(idConteo: number, estado: string) {
    const detalles = this.conteoActual()?.detalles || [];
    
    const payloadData = detalles.map(det => ({
      id_detalle: det.idDetalle,
      stock_conteo: det.stockConteo || 0
    }));

    return this.http.patch(`${this.apiUrl}/${idConteo}/finalizar`, { 
      estado, 
      totalDiferencias: this.totalDiferencias(),
      totalItems: detalles.length,
      data: payloadData
    });
  }
}

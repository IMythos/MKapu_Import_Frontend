import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class MovimientosInventarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/logistics/inventory-movements`;

  // 👇 1. Añadimos Signals para compartir la data entre el listado y el detalle
  movimientosListado = signal<any[]>([]);
  cargando = signal<boolean>(false);

  getMovimientos(filtros: any): Observable<any> {
    this.cargando.set(true);
    let params = new HttpParams();
    
    if (filtros.texto) params = params.set('search', filtros.texto);
    if (filtros.estado > 0) params = params.set('tipoId', filtros.estado);
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.sedeId) params = params.set('sedeId', filtros.sedeId);
    
    return this.http.get<any>(this.apiUrl + "/movements", { params }).pipe(
      tap({
        next: (res) => {
          const data = res.data || res; 
          this.movimientosListado.set(Array.isArray(data) ? data : []);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      })
    );
  }

  getMovimientoById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}

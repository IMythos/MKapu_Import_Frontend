import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class MovimientosInventarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/logistics/inventory-movements`;

  getMovimientos(filtros: any): Observable<any> {
    let params = new HttpParams();
    
    if (filtros.texto) params = params.set('search', filtros.texto);
    if (filtros.estado > 0) params = params.set('tipoId', filtros.estado);
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

    return this.http.get<any>(this.apiUrl + "/movements", { params });
  }
}

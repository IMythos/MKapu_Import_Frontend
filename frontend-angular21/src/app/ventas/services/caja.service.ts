import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment'; 

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getActiveCashbox(idSede: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cashbox/active/${idSede}`);
  }

  openCashbox(idSede: number, montoInicial: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cashbox/open`, {
      id_sede_ref: idSede,
      monto_inicial: montoInicial,
    });
  }

    getResumenDia(idSede: number) {
    return this.http.get<any>(`${this.apiUrl}/cashbox/resumen/${idSede}`);
    }

  closeCashbox(idCaja: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/cashbox/close`, { id_caja: idCaja });
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export interface ReniecDniResponse {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  tipoDocumento: 'DNI' | 'RUC';
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SunatService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/sales/reniec`; 

  consultarRuc(ruc: string): Observable<ReniecDniResponse> {
    return this.http.get<ReniecDniResponse>(`${this.baseUrl}/ruc/${ruc}`);
  }

  consultarDni(dni: string): Observable<ReniecDniResponse> {
    return this.http.get<ReniecDniResponse>(`${this.baseUrl}/dni/${dni}`);
  }

  consultarDocumento(numero: string): Observable<ReniecDniResponse> {
    return this.http.get<ReniecDniResponse>(`${this.baseUrl}/consultar/${numero}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

import {
  // IN
  CrearClienteRequest,
  ActualizarClienteRequest,
  // OUT
  ClienteBusquedaResponse,
  ClienteResponse,          
  ListarClientesResponse,
  TipoDocumento,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private readonly http: HttpClient) {}

  buscarCliente(
    documento: string,
    tipoComprobante?: number,
  ): Observable<ClienteBusquedaResponse> {
    return this.http.get<ClienteBusquedaResponse>(
      `${this.apiUrl}/customers/document/${documento}`,
    );
  }

  crearCliente(data: CrearClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(
      `${this.apiUrl}/customers`,
      data,
    );
  }

  obtenerClientePorId(customerId: string): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(
      `${this.apiUrl}/customers/${customerId}`,
    );
  }

  actualizarCliente(
    customerId: string,
    data: ActualizarClienteRequest,
  ): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(
      `${this.apiUrl}/customers/${customerId}`,
      data,
    );
  }

  obtenerTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(
      `${this.apiUrl}/customers/document-types`,
    );
  }

  listarClientes(params?: {
    page?:   number;
    size?:   number;
    search?: string;
  }): Observable<ListarClientesResponse> {
    let httpParams = new HttpParams()
      .set('page',   String(params?.page   ?? 1))
      .set('size',   String(params?.size   ?? 10))
      .set('search', params?.search ?? '');

    return this.http.get<ListarClientesResponse>(
      `${this.apiUrl}/customers`,
      { params: httpParams },
    );
  }
}

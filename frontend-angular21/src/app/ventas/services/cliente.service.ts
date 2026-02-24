import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

import {
  ClienteBusquedaResponse,
  CrearClienteRequest,
  CrearClienteResponse,
  ActualizarClienteRequest,
  ListarClientesResponse,
  TipoDocumento,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Buscar cliente por documento.
   * El componente decide qué hacer si no lo encuentra (mostrar form de alta, etc.).
   */
  buscarCliente(
    documento: string,
    tipoComprobante?: number, // lo dejas por si luego necesitas filtrar BOLETA/FACTURA
  ): Observable<ClienteBusquedaResponse> {
    return this.http.get<ClienteBusquedaResponse>(
      `${this.apiUrl}/customers/document/${documento}`,
    );
  }

  /**
   * Crear nuevo cliente (se usa cuando no se encontró y el usuario completa el formulario).
   */
  crearCliente(data: CrearClienteRequest): Observable<CrearClienteResponse> {
    return this.http.post<CrearClienteResponse>(
      `${this.apiUrl}/customers`,
      data,
    );
  }

  /**
   * Obtener cliente por ID (útil si luego quieres recargar datos completos).
   */
  obtenerClientePorId(customerId: string): Observable<CrearClienteResponse> {
    return this.http.get<CrearClienteResponse>(
      `${this.apiUrl}/customers/${customerId}`,
    );
  }

  /**
   * Actualizar cliente existente.
   * La idea es usarlo cuando el cliente ya existe pero el usuario quiere agregar más datos
   * (teléfono, email, dirección) desde la vista de venta.
   */
  actualizarCliente(
    customerId: string,
    data: ActualizarClienteRequest,
  ): Observable<CrearClienteResponse> {
    return this.http.put<CrearClienteResponse>(
      `${this.apiUrl}/customers/${customerId}`,
      data,
    );
  }

  /**
   * Tipos de documento para poblar el select.
   */
  obtenerTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(
      `${this.apiUrl}/customers/document-types`,
    );
  }

  /**
   * Listado paginado de clientes (por si lo necesitas en otra pantalla).
   */
  listarClientes(params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Observable<ListarClientesResponse> {
    const page = params?.page ?? 1;
    const size = params?.size ?? 10;
    const search = params?.search ?? '';

    return this.http.get<ListarClientesResponse>(
      `${this.apiUrl}/customers`,
      {
        params: {
          page,
          size,
          search,
        } as any,
      },
    );
  }
}

/* ============================================
   sales/src/core/customer/infrastructure/services/cliente.service.ts
   ============================================ */

import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment'; // Ajusta la ruta según tu proyecto
import { Observable, throwError } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';

// Interfaces basadas en tu JSON y DTOs
export interface Customer {
  customerId: string;
  documentTypeId: number;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  documentValue: string;
  name: string;
  lastName: string | null;
  businessName: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  status: boolean;
  displayName: string;
  invoiceType: string;
}

export interface CustomerResponse {
  customers: Customer[];
  total: number;
}

export type CreateCustomerRequest = Omit<Customer, 'customerId' | 'status' | 'displayName' | 'invoiceType' | 'documentTypeDescription' | 'documentTypeSunatCode'>;
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface LoadCustomersFilters {
  search?: string;
  page?: number;
  limit?: number;
  // 'tipo' puede ser 'ALL' | 'JURIDICA' | 'NATURAL' u otro valor que tu backend espere
  tipo?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/sales/customers`;

  // --- Signals de Estado Interno ---
  private readonly _customerResponse = signal<CustomerResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- Computed Signals Públicos ---
  readonly customerResponse = computed(() => this._customerResponse());
  readonly customers = computed(() => this._customerResponse()?.customers ?? []);
  readonly total = computed(() => this._customerResponse()?.total ?? 0);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

  /**
   * Carga la lista de clientes con soporte para filtros y paginación
   * Ahora acepta filters.tipo para filtrar por tipo (ej. 'JURIDICA' | 'NATURAL' | 'ALL')
   */
  loadCustomers(filters?: LoadCustomersFilters, role: string = 'Administrador'): Observable<CustomerResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    // Añadimos el parámetro tipo si viene
    // Nota: asegúrate que el backend espera el parámetro 'tipo' con estos valores,
    // o transforma aquí el valor para lo que el backend requiere (por ejemplo cod_sunat).
    if (filters?.tipo && filters.tipo !== 'ALL') {
      params = params.set('tipo', filters.tipo);
    }

    return this.http
      .get<CustomerResponse>(this.api, {
        headers: this.buildHeaders(role),
        params
      })
      .pipe(
        tap((res) => this._customerResponse.set(res)),
        catchError((err) => {
          this._error.set('No se pudo cargar la lista de clientes.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // para autocomplete server-side -->
  suggestCustomers(query: string, limit = 5, role: string = 'Administrador'): Observable<Customer[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (query) params = params.set('q', query);
    return this.http
      .get<Customer[]>(`${this.api}/suggest`, { headers: this.buildHeaders(role), params })
      .pipe(
        catchError((err) => {
          // No seteo _error global aquí para no interferir con la lista; simplemente retorno vacío
          return throwError(() => err);
        })
      );
  }


  /**
   * Crea un nuevo cliente
   */
  createCustomer(payload: CreateCustomerRequest, role: string = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Customer>(this.api, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((created) => {
          const prev = this._customerResponse();
          if (!prev) return;
          // Actualizamos el cache local
          this._customerResponse.set({
            customers: [created, ...prev.customers],
            total: prev.total + 1,
          });
        }),
        catchError((err) => {
          this._error.set('No se pudo registrar al cliente.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualiza datos generales del cliente
   */
  updateCustomer(id: string, payload: UpdateCustomerRequest, role: string = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Customer>(`${this.api}/${id}`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedCustomer(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar los datos del cliente.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualiza solo el estado (activo/inactivo)
   */
  updateCustomerStatus(id: string, status: boolean, role: string = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Customer>(`${this.api}/${id}/status`, { status }, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedCustomer(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo cambiar el estado del cliente.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Elimina un cliente
   */
  deleteCustomer(id: string, role: string = 'Administrador'): Observable<any> {
    this._loading.set(true);
    return this.http
      .delete(`${this.api}/${id}`, { headers: this.buildHeaders(role) })
      .pipe(
        tap(() => {
          const prev = this._customerResponse();
          if (!prev) return;
          this._customerResponse.set({
            customers: prev.customers.filter(c => c.customerId !== id),
            total: prev.total - 1
          });
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene un cliente específico por su ID
   */
  getCustomerById(id: string, role: string = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Customer>(`${this.api}/${id}`, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo obtener la información del cliente.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Helper para actualizar un cliente específico dentro del cache de la lista
   */
  private patchCachedCustomer(id: string, updated: Customer): void {
    const prev = this._customerResponse();
    if (!prev) return;

    this._customerResponse.set({
      ...prev,
      customers: prev.customers.map((c) => (c.customerId === id ? updated : c)),
    });
  }
}
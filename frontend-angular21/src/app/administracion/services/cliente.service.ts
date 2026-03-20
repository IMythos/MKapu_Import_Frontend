import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import { Observable, throwError, of } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';

export interface Customer {
  customerId: string;
  documentTypeId: number;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  documentValue: string;
  name: string;
  lastName: string | null;
  apellido?: string | null;
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

export type CreateCustomerRequest = Omit<
  Customer,
  | 'customerId'
  | 'status'
  | 'displayName'
  | 'invoiceType'
  | 'documentTypeDescription'
  | 'documentTypeSunatCode'
>;
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface LoadCustomersFilters {
  search?: string;
  page?: number;
  limit?: number;
  tipo?: string;
  status?: boolean;
}

export interface ConsultaDocumentoResponse {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  tipoDocumento: string;
  razonSocial?: string;
  direccion?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/sales/customers`;
  private readonly salesUrl = `${environment.apiUrl}/sales`;

  private readonly _customers = signal<Customer[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly customers = computed(() => this._customers());
  readonly total = computed(() => this._total());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // Mantener compatibilidad con código que use customerResponse
  readonly customerResponse = computed(() => ({
    customers: this._customers(),
    total: this._total(),
  }));

  private buildHeaders(role = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

  loadCustomers(
    filters?: LoadCustomersFilters,
    role = 'Administrador',
  ): Observable<CustomerResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.tipo && filters.tipo !== 'todas') params = params.set('tipo', filters.tipo);
    if (filters?.status !== undefined) params = params.set('status', String(filters.status));

    return this.http
      .get<CustomerResponse>(this.api, { headers: this.buildHeaders(role), params })
      .pipe(
        tap((res) => {
          this._customers.set(res.customers ?? []);
          this._total.set(res.total ?? 0);
        }),
        catchError((err) => {
          this._error.set('No se pudo cargar la lista de clientes.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  suggestCustomers(query: string, limit = 5, role = 'Administrador'): Observable<Customer[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (query) params = params.set('q', query);
    return this.http
      .get<Customer[]>(`${this.api}/suggest`, { headers: this.buildHeaders(role), params })
      .pipe(catchError((err) => throwError(() => err)));
  }

  obtenerTiposDocumento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/document-types`);
  }

  createCustomer(payload: CreateCustomerRequest, role = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<Customer>(this.api, payload, { headers: this.buildHeaders(role) }).pipe(
      catchError((err) => {
        this._error.set('No se pudo registrar al cliente.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  updateCustomer(
    id: string,
    payload: UpdateCustomerRequest,
    role = 'Administrador',
  ): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Customer>(`${this.api}/${id}`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo actualizar los datos del cliente.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  updateCustomerStatus(id: string, status: boolean, role = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Customer>(`${this.api}/${id}/status`, { status }, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cambiar el estado del cliente.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  deleteCustomer(id: string, role = 'Administrador'): Observable<any> {
    this._loading.set(true);
    return this.http
      .delete(`${this.api}/${id}`, { headers: this.buildHeaders(role) })
      .pipe(finalize(() => this._loading.set(false)));
  }

  getCustomerById(id: string, role = 'Administrador'): Observable<Customer> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Customer>(`${this.api}/${id}`, { headers: this.buildHeaders(role) }).pipe(
      catchError((err) => {
        this._error.set('No se pudo obtener la información del cliente.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  consultarDocumentoIdentidad(numero: string): Observable<ConsultaDocumentoResponse> {
    return this.http
      .get<ConsultaDocumentoResponse>(`${this.salesUrl}/reniec/consultar/${numero}`)
      .pipe(
        catchError(() =>
          of({
            nombres: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            nombreCompleto: '',
            tipoDocumento: '',
          }),
        ),
      );
  }
}
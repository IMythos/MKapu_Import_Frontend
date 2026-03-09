import { computed, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';

import { environment } from '../../../enviroments/enviroment';
import {
  Dispatch,
  DispatchListResponse,
  CreateDispatchRequest,
  IniciarTransitoRequest,
  ConfirmarEntregaRequest,
  CancelarDespachoRequest,
  MarcarDetallePreparadoRequest,
} from '../interfaces/dispatch.interfaces';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  /**
   * El gateway en :3000 enruta /logistics → microservicio logistics (:3005)
   * Controller NestJS: @Controller('despachos')
   */
  private readonly baseUrl = `${environment.apiUrl}/logistics/despachos`;


  private readonly _dispatchResponse = signal<DispatchListResponse | null>(null);
  private readonly _loading          = signal<boolean>(false);
  private readonly _error            = signal<string | null>(null);

  readonly dispatchResponse = computed(() => this._dispatchResponse());
  readonly dispatches       = computed(() => this._dispatchResponse()?.dispatches ?? []);
  readonly loading          = computed(() => this._loading());
  readonly error            = computed(() => this._error());

  constructor(private http: HttpClient) {}

  /**
   * Helper para construir headers dinámicos
   */
  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

  // -------------------------------------------------------------------------
  // 📦 MÉTODOS DE CONSULTA (GET)
  // -------------------------------------------------------------------------

  /** Obtiene todos los despachos y actualiza el estado global */
  loadDispatches(role = 'Administrador'): Observable<Dispatch[]> {
    this.setLoadingState();

    return this.http
      .get<Dispatch[]>(this.baseUrl, { headers: this.buildHeaders(role) })
      .pipe(
        tap((res) => this._dispatchResponse.set({ dispatches: res })),
        catchError((err) => this.handleError('No se pudo cargar los despachos.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  getDispatchById(id: number, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .get<Dispatch>(`${this.baseUrl}/${id}`, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => this.handleError('No se pudo cargar el despacho.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  getDispatchByVenta(id_venta: number, role = 'Administrador'): Observable<Dispatch[]> {
    this.setLoadingState();
    return this.http
      .get<Dispatch[]>(`${this.baseUrl}/venta/${id_venta}`, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => this.handleError('No se pudo cargar despachos de la venta.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  // -------------------------------------------------------------------------
  // 🚀 MÉTODOS DE ACCIÓN (POST / PATCH)
  // -------------------------------------------------------------------------

  createDispatch(payload: CreateDispatchRequest, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .post<Dispatch>(this.baseUrl, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((created) => {
          const prev = this._dispatchResponse();
          if (prev) {
            this._dispatchResponse.set({ dispatches: [created, ...prev.dispatches] });
          }
        }),
        catchError((err) => this.handleError('No se pudo registrar el despacho.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  cancelarDespacho(id: number, payload: CancelarDespachoRequest = {}, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/cancelar`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => this.handleError('No se pudo cancelar el despacho.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  iniciarPreparacion(id: number, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/preparacion`, {}, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => this.handleError('No se pudo iniciar preparación.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  iniciarTransito(id: number, payload: IniciarTransitoRequest, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/transito`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => this.handleError('No se pudo iniciar tránsito.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  confirmarEntrega(id: number, payload: ConfirmarEntregaRequest, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/entrega`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => this.handleError('No se pudo confirmar entrega.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  // -------------------------------------------------------------------------
  // 🔍 DETALLES ESPECÍFICOS
  // -------------------------------------------------------------------------

  marcarDetallePreparado(id_detalle: number, payload: MarcarDetallePreparadoRequest, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .patch<Dispatch>(`${this.baseUrl}/detalle/${id_detalle}/preparado`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => updated.id_despacho && this.patchCachedDispatch(updated.id_despacho, updated)),
        catchError((err) => this.handleError('No se pudo marcar detalle como preparado.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  marcarDetalleDespachado(id_detalle: number, role = 'Administrador'): Observable<Dispatch> {
    this.setLoadingState();
    return this.http
      .patch<Dispatch>(`${this.baseUrl}/detalle/${id_detalle}/despachado`, {}, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => updated.id_despacho && this.patchCachedDispatch(updated.id_despacho, updated)),
        catchError((err) => this.handleError('No se pudo marcar detalle como despachado.', err)),
        finalize(() => this._loading.set(false))
      );
  }

  // -------------------------------------------------------------------------
  // 🛠 HELPERS PRIVADOS
  // -------------------------------------------------------------------------

  /** Actualiza un despacho específico en la lista local sin recargar todo */
  private patchCachedDispatch(id: number, updated: Dispatch): void {
    const prev = this._dispatchResponse();
    if (!prev) return;

    const newDispatches = prev.dispatches.map((d) => 
      Number(d.id_despacho) === Number(id) ? updated : d
    );

    this._dispatchResponse.set({ dispatches: newDispatches });
  }

  private setLoadingState(): void {
    this._loading.set(true);
    this._error.set(null);
  }

  private handleError(message: string, error: any): Observable<never> {
    this._error.set(message);
    return throwError(() => error);
  }
}
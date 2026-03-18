import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
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

  // ✅ CORRECCIÓN CLAVE:
  // El gateway en :3000 enruta /logistics → microservicio logistics (:3005)
  // El controller NestJS es @Controller('despachos')
  // → URL final: http://localhost:3000/logistics/despachos
  private readonly baseUrl = `${environment.apiUrl}/logistics/despachos`;

  // =========================
  // 🔥 SIGNALS INTERNAS
  // =========================
  private readonly _dispatchResponse = signal<DispatchListResponse | null>(null);
  private readonly _loading          = signal(false);
  private readonly _error            = signal<string | null>(null);

  // =========================
  // ✅ EXPOSICIÓN PÚBLICA
  // =========================
  readonly dispatchResponse = computed(() => this._dispatchResponse());
  readonly dispatches       = computed(() => this._dispatchResponse()?.dispatches ?? []);
  readonly loading          = computed(() => this._loading());
  readonly error            = computed(() => this._error());

  constructor(private http: HttpClient) {}

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

  /* =========================
     GET ALL  →  GET /logistics/despachos
  ========================= */
  loadDispatches(role = 'Administrador'): Observable<Dispatch[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Dispatch[]>(this.baseUrl, { headers: this.buildHeaders(role) })
      .pipe(
        tap((res) => this._dispatchResponse.set({ dispatches: res })),
        catchError((err) => {
          this._error.set('No se pudo cargar los despachos.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     GET BY ID  →  GET /logistics/despachos/:id
  ========================= */
  getDispatchById(id: number, role = 'Administrador'): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Dispatch>(`${this.baseUrl}/${id}`, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     GET BY VENTA  →  GET /logistics/despachos/venta/:id_venta
  ========================= */
  getDispatchByVenta(id_venta: number, role = 'Administrador'): Observable<Dispatch[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Dispatch[]>(`${this.baseUrl}/venta/${id_venta}`, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar despachos de la venta.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     CREATE  →  POST /logistics/despachos
  ========================= */
  createDispatch(payload: CreateDispatchRequest, role = 'Administrador'): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Dispatch>(this.baseUrl, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((created) => {
          const prev = this._dispatchResponse();
          if (!prev) return;
          this._dispatchResponse.set({ dispatches: [created, ...prev.dispatches] });
        }),
        catchError((err) => {
          this._error.set('No se pudo registrar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     CANCELAR  →  PATCH /logistics/despachos/:id/cancelar
     (no existe DELETE en el backend)
  ========================= */
  cancelarDespacho(
    id: number | null,
    payload: CancelarDespachoRequest = {},
    role = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/cancelar`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(Number(id), updated)),
        catchError((err) => {
          this._error.set('No se pudo cancelar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     INICIAR PREPARACIÓN  →  PATCH /logistics/despachos/:id/preparacion
  ========================= */
  iniciarPreparacion(id: number, role = 'Administrador'): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/preparacion`, {}, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo iniciar preparación.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     INICIAR TRÁNSITO  →  PATCH /logistics/despachos/:id/transito
  ========================= */
  iniciarTransito(
    id: number,
    payload: IniciarTransitoRequest,
    role = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/transito`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo iniciar tránsito.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     CONFIRMAR ENTREGA  →  PATCH /logistics/despachos/:id/entrega
  ========================= */
  confirmarEntrega(
    id: number,
    payload: ConfirmarEntregaRequest,
    role = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(`${this.baseUrl}/${id}/entrega`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo confirmar entrega.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     MARCAR DETALLE PREPARADO  →  PATCH /logistics/despachos/detalle/:id/preparado
  ========================= */
  marcarDetallePreparado(
    id_detalle: number,
    payload: MarcarDetallePreparadoRequest,
    role = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(
        `${this.baseUrl}/detalle/${id_detalle}/preparado`,
        payload,
        { headers: this.buildHeaders(role) }
      )
      .pipe(
        tap((updated) => {
          if (updated.id_despacho != null)
            this.patchCachedDispatch(updated.id_despacho, updated);
        }),
        catchError((err) => {
          this._error.set('No se pudo marcar el detalle como preparado.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     MARCAR DETALLE DESPACHADO  →  PATCH /logistics/despachos/detalle/:id/despachado
  ========================= */
  marcarDetalleDespachado(id_detalle: number, role = 'Administrador'): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(
        `${this.baseUrl}/detalle/${id_detalle}/despachado`,
        {},
        { headers: this.buildHeaders(role) }
      )
      .pipe(
        tap((updated) => {
          if (updated.id_despacho != null)
            this.patchCachedDispatch(updated.id_despacho, updated);
        }),
        catchError((err) => {
          this._error.set('No se pudo marcar el detalle como despachado.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     PATCH CACHE INTERNO
  ========================= */
  private patchCachedDispatch(id: number, updated: Dispatch): void {
    const prev = this._dispatchResponse();
    if (!prev) return;

    const normalizedId = Number(id);
    let found = false;

    const newDispatches = prev.dispatches.map((d) => {
      if (Number(d.id_despacho) === normalizedId) {
        found = true;
        return updated;
      }
      return d;
    });

    if (found) {
      this._dispatchResponse.set({ dispatches: newDispatches });
    } else {
      this.loadDispatches().subscribe({ next: () => {}, error: () => {} });
    }
  }
}
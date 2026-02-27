import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Dispatch } from '../interfaces/dispatch.interfaces';

/**
 * Respuesta esperada del backend para listado de despachos.
 * (Si tu backend solo devuelve array simple, ajustamos esto)
 */
export interface DispatchListResponse {
  dispatches: Dispatch[];
}

export type CreateDispatchRequest = Omit<Dispatch, 'id_despacho'>;
export type UpdateDispatchRequest = Partial<Omit<Dispatch, 'id_despacho'>>;

@Injectable({ providedIn: 'root' })
export class DispatchService {

  private readonly api = environment.apiUrl;

  // =========================
  // 🔥 SIGNALS INTERNAS
  // =========================
  private readonly _dispatchResponse = signal<DispatchListResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // =========================
  // ✅ EXPOSICIÓN PÚBLICA
  // =========================
  readonly dispatchResponse = computed(() => this._dispatchResponse());
  readonly dispatches = computed(() => this._dispatchResponse()?.dispatches ?? []);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor(private http: HttpClient) {}

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }

  /* =========================
     READ / LIST
  ========================= */
  loadDispatches(role: string = 'Administrador'): Observable<Dispatch[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Dispatch[]>(`${this.api}/logistics/dispatch`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((res) => {
          this._dispatchResponse.set({ dispatches: res });
        }),
        catchError((err) => {
          this._error.set('No se pudo cargar los despachos.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     CREATE
  ========================= */
  createDispatch(
    payload: CreateDispatchRequest,
    role: string = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Dispatch>(`${this.api}/logistics/dispatch`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((created) => {
          const prev = this._dispatchResponse();
          if (!prev) return;

          this._dispatchResponse.set({
            dispatches: [created, ...prev.dispatches],
          });
        }),
        catchError((err: any) => {
          this._error.set('No se pudo registrar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     READ BY ID
  ========================= */
  getDispatchById(
    id: number,
    role: string = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Dispatch>(`${this.api}/logistics/dispatch/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     UPDATE
  ========================= */
  updateDispatch(
    id: number,
    payload: UpdateDispatchRequest,
    role: string = 'Administrador'
  ): Observable<Dispatch> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<Dispatch>(`${this.api}/logistics/dispatch/${id}`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((updated) => this.patchCachedDispatch(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     DELETE
  ========================= */
  deleteDispatch(
    id: number,
    role: string = 'Administrador'
  ): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<void>(`${this.api}/logistics/dispatch/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(() => {
          const prev = this._dispatchResponse();
          if (!prev) return;

          this._dispatchResponse.set({
            dispatches: prev.dispatches.filter(
              (d) => Number(d.id_despacho) !== Number(id)
            ),
          });
        }),
        catchError((err) => {
          this._error.set('No se pudo eliminar el despacho.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* =========================
     PATCH CACHE (como tu almacén)
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
      this._dispatchResponse.set({
        dispatches: newDispatches,
      });
      return;
    }

    // fallback: si no está en cache, recargamos
    this.loadDispatches().subscribe({ next: () => {}, error: () => {} });
  }
}
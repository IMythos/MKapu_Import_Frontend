import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Headquarter } from '../interfaces/almacen.interface';

/**
 * Respuesta esperada del backend para el listado de almacenes.
 */
export interface WarehouseListResponse {
  warehouses: Headquarter[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateWarehouseRequest = Omit<Headquarter, 'id' | 'id_almacen' | 'activo'>;
export type UpdateWarehouseRequest = Partial<Omit<Headquarter, 'id' | 'id_almacen'>>;

@Injectable({ providedIn: 'root' })
export class AlmacenService {
  private readonly api = environment.apiUrl;

  // Señales internas
  private readonly _almacenResponse = signal<WarehouseListResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Exposición pública
  readonly sedesResponse = computed(() => this._almacenResponse());
  readonly sedes = computed(() => this._almacenResponse()?.warehouses ?? []);
  readonly total = computed(() => this._almacenResponse()?.total ?? 0);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor(private http: HttpClient) {}

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }

  /* --------------------
     READ / LIST
  ---------------------*/
  loadAlmacen(role: string = 'Administrador'): Observable<WarehouseListResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<WarehouseListResponse>(`${this.api}/logistics/warehouses`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((res) => this._almacenResponse.set(res)),
        catchError((err) => {
          this._error.set('No se pudo cargar almacenes.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* --------------------
     CREATE
  ---------------------*/
  createAlmacen(payload: CreateWarehouseRequest, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Headquarter>(`${this.api}/logistics/warehouses`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((created) => {
          const prev = this._almacenResponse();
          if (!prev) return;
          this._almacenResponse.set({
            ...prev,
            warehouses: [created, ...prev.warehouses],
            total: prev.total + 1,
          });
        }),
        catchError((err: any) => {
          let serverMsg = 'No se pudo registrar el almacén.';
          try {
            if (err?.error) {
              if (typeof err.error === 'string' && err.error.trim()) {
                serverMsg = err.error;
              } else if (typeof err.error === 'object') {
                serverMsg = err.error.message ?? err.error.error ?? JSON.stringify(err.error);
              }
            } else if (err?.message) {
              serverMsg = err.message;
            }
          } catch {
            serverMsg = 'Error desconocido del servidor';
          }

          this._error.set(serverMsg);
          console.error('[AlmacenService] createSede error:', err, '=> msg:', serverMsg);
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* --------------------
     READ BY ID
  ---------------------*/
  getAlmacenById(id: number, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Headquarter>(`${this.api}/logistics/warehouses/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar el almacén.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* --------------------
     UPDATE
     (se mantiene el método existente para actualizar datos)
  ---------------------*/
  updateAlmacen(id: number, payload: UpdateWarehouseRequest, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Headquarter>(`${this.api}/logistics/warehouses/${id}`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((updated) => this.patchCachedHeadquarter(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el almacén.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /* --------------------
     UPDATE STATUS (soft deactivate/activate)
     Endpoint: PUT /logistics/warehouses/:id/status
     - Forzamos booleano en el payload
     - Añadimos Content-Type explícito
     - Log de debugging para verificar lo enviado desde el navegador
  ---------------------*/
  updateAlmacenStatus(id: number, activo: boolean, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    const payload = { activo: !!activo }; // forzar booleano
    const url = `${this.api}/logistics/warehouses/${id}/status`;
    const headers = this.buildHeaders(role).set('Content-Type', 'application/json');

    // Debug log (se verá en la consola del navegador)
    try {
      // eslint-disable-next-line no-console
      console.log('[AlmacenService] PUT status ->', url, payload, { headers: headers.keys() });
    } catch (e) {
      /* ignore logging errors */
    }

    return this.http
      .put<Headquarter>(url, payload, { headers })
      .pipe(
        tap((updated) => this.patchCachedHeadquarter(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el estado del almacén.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * DELETE /logistics/warehouses/:id
   * -> implementado como soft-delete (desactivación)
   * Devuelve el Headquarter actualizado (con activo=false).
   */
  deleteAlmacen(id: number, role: string = 'Administrador'): Observable<Headquarter> {
    // Log para debugging
    try {
      // eslint-disable-next-line no-console
      console.log('[AlmacenService] deleteAlmacen (soft) ->', id);
    } catch (e) {
      /* ignore */
    }
    // Reutiliza updateSedeStatus para hacer soft-delete
    return this.updateAlmacenStatus(id, false, role);
  }

  /* --------------------
     Raw fetch (sin signals)
  ---------------------*/
  getSedes(role: string = 'Administrador'): Observable<WarehouseListResponse> {
    return this.http.get<WarehouseListResponse>(`${this.api}/logistics/warehouses`, {
      headers: this.buildHeaders(role),
    });
  }

  private patchCachedHeadquarter(id: number, updated: Headquarter): void {
    const prev = this._almacenResponse();
    if (!prev) {
      console.debug('[AlmacenService] patchCachedHeadquarter: no cache present');
      return;
    }

    const normalizedId = Number(id);
    let found = false;

    const newWarehouses = prev.warehouses.map((h: Headquarter) => {
      const hId = Number((h as any).id ?? (h as any).id_almacen);
      if (hId === normalizedId) {
        found = true;
        console.debug('[AlmacenService] patchCachedHeadquarter: replacing id=', normalizedId);
        return updated;
      }
      return h;
    });

    if (found) {
      this._almacenResponse.set({
        ...prev,
        warehouses: newWarehouses,
      });
      return;
    }

    // Fallback: si no está en cache (p. ej. pagina distinta) recargamos la lista
    console.debug('[AlmacenService] patchCachedHeadquarter: id not found in cache, reloading list id=', normalizedId);
    this.loadAlmacen('Administrador').subscribe({ next: () => {}, error: () => {} });
  }

}
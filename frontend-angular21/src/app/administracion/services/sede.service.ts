import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import {
  Headquarter,
  HeadquarterResponse,
  SedeAlmacenRelacion,
} from '../interfaces/sedes.interface';

export type CreateHeadquarterRequest = Omit<Headquarter, 'id_sede' | 'activo' | 'almacenes'>;
export type UpdateHeadquarterRequest = Partial<Omit<Headquarter, 'id_sede' | 'almacenes'>>;

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly api = environment.apiUrl;

  private readonly _sedesResponse = signal<HeadquarterResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loadingAlmacenes = signal(false);

  readonly sedesResponse = computed(() => this._sedesResponse());
  readonly sedes = computed(() => this._sedesResponse()?.headquarters ?? []);
  readonly total = computed(() => this._sedesResponse()?.total ?? 0);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly loadingAlmacenes = computed(() => this._loadingAlmacenes()); 

  constructor(private http: HttpClient) {}

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
   }

  loadSedes(role: string = 'Administrador'): Observable<HeadquarterResponse> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .get<HeadquarterResponse>(`${this.api}/admin/headquarters`, {
        headers: this.buildHeaders(role),
        params: { page: '1', pageSize: '1000' }, 
      })
      .pipe(
        tap((res) => this._sedesResponse.set(res)),
        catchError((err) => {
          this._error.set('No se pudo cargar sedes.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // ── NUEVO: carga almacenes de una sede y enriquece el objeto ─────────────────
  loadAlmacenesParaSede(
    id_sede: number,
    role: string = 'Administrador'
  ): Observable<SedeAlmacenRelacion> {
    this._loadingAlmacenes.set(true);
    return this.http
      .get<SedeAlmacenRelacion>(
        `${this.api}/admin/sede-almacen/sede/${id_sede}`,
        { headers: this.buildHeaders(role) }
      )
      .pipe(
        tap((rel) => {
          // Enriquece la sede en caché con sus almacenes
          const prev = this._sedesResponse();
          if (!prev) return;
          const almacenes = rel.almacenes.map((a) => a.almacen);
          this._sedesResponse.set({
            ...prev,
            headquarters: prev.headquarters.map((h) =>
              h.id_sede === id_sede ? { ...h, almacenes } : h
            ),
          });
        }),
        catchError((err) => {
          console.error('Error cargando almacenes de sede', err);
          return throwError(() => err);
        }),
        finalize(() => this._loadingAlmacenes.set(false))
      );
  }

  createSede(payload: CreateHeadquarterRequest, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .post<Headquarter>(`${this.api}/admin/headquarters`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((created) => {
          const prev = this._sedesResponse();
          if (!prev) return;
          this._sedesResponse.set({ headquarters: [created, ...prev.headquarters], total: prev.total + 1 });
        }),
        catchError((err) => { this._error.set('No se pudo registrar la sede.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false))
      );
  }

  getSedeById(id: number, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .get<Headquarter>(`${this.api}/admin/headquarters/${id}`, { headers: this.buildHeaders(role) })
      .pipe(
        catchError((err) => { this._error.set('No se pudo cargar la sede.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false))
      );
  }

  updateSede(id: number, payload: UpdateHeadquarterRequest, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .put<Headquarter>(`${this.api}/admin/headquarters/${id}`, payload, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedHeadquarter(id, updated)),
        catchError((err) => { this._error.set('No se pudo actualizar la sede.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false))
      );
  }

  updateSedeStatus(id: number, status: boolean, role: string = 'Administrador'): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .put<Headquarter>(`${this.api}/admin/headquarters/${id}/status`, { status }, { headers: this.buildHeaders(role) })
      .pipe(
        tap((updated) => this.patchCachedHeadquarter(id, updated)),
        catchError((err) => { this._error.set('No se pudo actualizar el estado de la sede.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false))
      );
  }
  getSedes(role: string = 'Administrador'): Observable<HeadquarterResponse> {
    return this.http.get<HeadquarterResponse>(`${this.api}/admin/headquarters`, {
      headers: this.buildHeaders(role),
    });
  }

  private patchCachedHeadquarter(id: number, updated: Headquarter): void {
    const prev = this._sedesResponse();
    if (!prev) return;
    this._sedesResponse.set({
      ...prev,
      headquarters: prev.headquarters.map((h) =>
        h.id_sede === id ? { ...updated, almacenes: h.almacenes } : h 
      ),
    });
  }
}
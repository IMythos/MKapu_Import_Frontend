import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Headquarter, HeadquarterResponse } from '../interfaces/sedes.interface';

export type CreateHeadquarterRequest = Omit<Headquarter, 'id_sede' | 'activo'>;
export type UpdateHeadquarterRequest = Partial<Omit<Headquarter, 'id_sede'>>;

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly api = environment.apiUrl;

  private readonly _sedesResponse = signal<HeadquarterResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly sedesResponse = computed(() => this._sedesResponse());
  readonly sedes = computed(() => this._sedesResponse()?.headquarters ?? []);
  readonly total = computed(() => this._sedesResponse()?.total ?? 0);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

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

  createSede(
    payload: CreateHeadquarterRequest,
    role: string = 'Administrador'
  ): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Headquarter>(`${this.api}/admin/headquarters`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((created) => {
          const prev = this._sedesResponse();
          if (!prev) return;

          this._sedesResponse.set({
            headquarters: [created, ...prev.headquarters],
            total: prev.total + 1,
          });
        }),
        catchError((err) => {
          this._error.set('No se pudo registrar la sede.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // GET /admin/headquarters/:id
  getSedeById(
    id: number,
    role: string = 'Administrador'
  ): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Headquarter>(`${this.api}/admin/headquarters/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar la sede.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // PUT /admin/headquarters/:id  (actualiza datos generales)
  updateSede(
    id: number,
    payload: UpdateHeadquarterRequest,
    role: string = 'Administrador'
  ): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Headquarter>(`${this.api}/admin/headquarters/${id}`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((updated) => this.patchCachedHeadquarter(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar la sede.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // PUT /admin/headquarters/:id/status (actualiza SOLO el estado activo/inactivo)
  updateSedeStatus(
    id: number,
    status: boolean,
    role: string = 'Administrador'
  ): Observable<Headquarter> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Headquarter>(
        `${this.api}/admin/headquarters/${id}/status`,
        { status },
        { headers: this.buildHeaders(role) }
      )
      .pipe(
        tap((updated) => this.patchCachedHeadquarter(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el estado de la sede.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // opcional: solo observable, sin tocar signals
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
      headquarters: prev.headquarters.map((h) => (h.id_sede === id ? updated : h)),
    });
  }
}
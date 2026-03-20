import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

export interface CreateWastageDto {
  id_usuario_ref: number;
  id_sede_ref:    number;
  id_almacen_ref: number;
  motivo:         string;
  id_tipo_merma:  number;
  detalles:       WastageDetail[];
}

export interface WastageDetail {
  id_detalle?:   number;
  id_producto:   number;
  cod_prod:      string;
  desc_prod:     string;
  cantidad:      number;
  pre_unit:      number;
  id_tipo_merma: number;
  observacion?:  string;
}

export interface WastageResponseDto {
  id_merma:         number;
  fec_merma:        string;
  motivo:           string;
  total_items:      number;
  estado:           boolean;
  detalles:         WastageDetail[];
  responsable:      string;
  tipo_merma_id:    number;
  tipo_merma_label: string;
  id_sede_ref:      number;   
}
export interface WastagePaginatedResponse {
  data:       WastageResponseDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ── DTO que devuelve GET /catalog/wastage/tipos ───────────────────────────────
export interface WastageTypeDto {
  id_tipo:      number;
  tipo:         string;
  motivo_merma: string;
  estado:       boolean;
}

@Injectable({ providedIn: 'root' })
export class WastageService {
  private readonly api = environment.apiUrl;

  private readonly _loading      = signal(false);
  private readonly _error        = signal<string | null>(null);
  private readonly _wastages     = signal<WastageResponseDto[]>([]);
  private readonly _totalPages   = signal(1);
  private readonly _currentPage  = signal(1);
  private readonly _tiposMerma   = signal<WastageTypeDto[]>([]); 


  readonly loading     = computed(() => this._loading());
  readonly error       = computed(() => this._error());
  readonly wastages    = computed(() => this._wastages());
  readonly totalPages  = computed(() => this._totalPages());
  readonly currentPage = computed(() => this._currentPage());
  readonly tiposMerma  = computed(() => this._tiposMerma());       

  constructor(private http: HttpClient) {}

  private buildHeaders(role = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }

  // ── Crear merma ───────────────────────────────────────────────────────────
  createWastage(dto: CreateWastageDto, role = 'Administrador'): Observable<WastageResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<WastageResponseDto>(`${this.api}/logistics/catalog/wastage`, dto, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(created => this._wastages.update(prev => [created, ...prev])),
        catchError(err => {
          this._error.set('No se pudo registrar la merma.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Listar mermas paginadas ───────────────────────────────────────────────
  loadWastages(
    page    = 1,
    limit   = 10,
    id_sede = 0,
    role    = 'Administrador',
  ): Observable<WastagePaginatedResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams()
      .set('page',  page.toString())
      .set('limit', limit.toString());

    if (id_sede > 0) {
      params = params.set('id_sede', id_sede.toString());
    }

    return this.http
      .get<WastagePaginatedResponse>(`${this.api}/logistics/catalog/wastage`, {
        headers: this.buildHeaders(role),
        params,
      })
      .pipe(
        tap(response => {
          this._wastages.set(response.data ?? []);
          this._totalPages.set(response.totalPages);
          this._currentPage.set(response.page);
        }),
        catchError(err => {
          this._error.set('No se pudo cargar mermas.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Obtener merma por ID ──────────────────────────────────────────────────
  getWastageById(id: number, role = 'Administrador'): Observable<WastageResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<WastageResponseDto>(`${this.api}/logistics/catalog/wastage/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError(err => {
          this._error.set('No se pudo cargar la merma.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Actualizar merma (solo datos descriptivos, sin tocar stock) ───────────
  updateWastage(
    id:      number,
    payload: { motivo?: string; id_tipo_merma?: number; observacion?: string },
    role = 'Administrador',
  ): Observable<WastageResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<WastageResponseDto>(
        `${this.api}/logistics/catalog/wastage/${id}`,
        payload,
        { headers: this.buildHeaders(role) },
      )
      .pipe(
        tap(updated => {
          // Actualiza el registro en caché si existe
          this._wastages.update(prev =>
            prev.map(w => w.id_merma === id ? { ...w, ...updated } : w)
          );
        }),
        catchError(err => {
          this._error.set('No se pudo actualizar la merma.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }
  
  // ── Obtener tipos de merma desde la BD ───────────────────────────────────
  loadTiposMerma(role = 'Administrador'): Observable<WastageTypeDto[]> {
    return this.http
      .get<WastageTypeDto[]>(`${this.api}/logistics/catalog/wastage/tipos`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(tipos => this._tiposMerma.set(tipos)),
        catchError(err => {
          this._error.set('No se pudo cargar los tipos de merma.');
          return throwError(() => err);
        }),
      );
  }
}
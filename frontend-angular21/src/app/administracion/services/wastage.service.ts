// wastage.service.ts

import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';


export interface CreateWastageDto {
  id_usuario_ref: number;
  id_sede_ref: number;
  id_almacen_ref: number;
  motivo: string;
  id_tipo_merma: number;
  detalles: WastageDetail[];
}

export interface WastageDetail {
  id_detalle?: number;
  id_producto: number;
  cod_prod: string;
  desc_prod: string;
  cantidad: number;
  pre_unit: number;
  id_tipo_merma: number;
  observacion?: string;
}

export interface WastageResponseDto {
  id_merma: number;
  fec_merma: string;
  motivo: string;
  total_items: number;
  estado: boolean;
  detalles: WastageDetail[];
  responsable: string; 
  tipo_merma_id: number;
  tipo_merma_label: string; 
}

export interface WastagePaginatedResponse {
  data: WastageResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class WastageService {
  private readonly api = environment.apiUrl;

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _wastages = signal<WastageResponseDto[]>([]);
  private readonly _totalPages = signal(1);
  private readonly _currentPage = signal(1);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly wastages = computed(() => this._wastages());
  readonly totalPages = computed(() => this._totalPages());
  readonly currentPage = computed(() => this._currentPage());

  constructor(private http: HttpClient) {}

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }

  createWastage(
    dto: CreateWastageDto,
    role: string = 'Administrador'
  ): Observable<WastageResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<WastageResponseDto>(`${this.api}/logistics/catalog/wastage`, dto, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((created) => {
          const prev = this._wastages();
          this._wastages.set([created, ...prev]);
        }),
        catchError((err) => {
          this._error.set('No se pudo registrar la merma.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  loadWastages(
    page: number = 1,
    limit: number = 10,
    role: string = 'Administrador'
  ): Observable<WastagePaginatedResponse> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<WastagePaginatedResponse>(`${this.api}/logistics/catalog/wastage`, {
        headers: this.buildHeaders(role),
        params
      })
      .pipe(
        tap((response) => {
          this._wastages.set(response.data ?? []);
          this._totalPages.set(response.totalPages);
          this._currentPage.set(response.page);
        }),
        catchError((err) => {
          this._error.set('No se pudo cargar mermas.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  getWastageById(
    id: number,
    role: string = 'Administrador'
  ): Observable<WastageResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<WastageResponseDto>(`${this.api}/logistics/catalog/wastage/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar la merma.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }
}
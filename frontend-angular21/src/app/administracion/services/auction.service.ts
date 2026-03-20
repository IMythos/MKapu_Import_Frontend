import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, switchMap } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { AuthService } from '../../auth/services/auth.service';

export interface AuctionDetailDto {
  id_producto:  number;
  pre_original: number;
  pre_remate:   number;
  stock_remate: number;
  observacion?: string;
}

export interface CreateAuctionDto {
  cod_remate?:    string;
  descripcion:    string;
  estado?:        string;
  id_almacen_ref: number;
  detalles:       AuctionDetailDto[];
}

export interface PatchAuctionDto {
  descripcion?: string;
  estado?:      'ACTIVO' | 'FINALIZADO';
  detalles?:    { id_detalle_remate?: number; pre_remate: number; stock_remate: number }[];
}

export interface AuctionDetailResponse {
  id_detalle_remate?: number;
  pre_original?:      number;
  pre_remate?:        number;
  stock_remate?:      number;
  id_producto?:       number;
}

export interface AuctionResponseDto {
  id_remate:      number;
  cod_remate:     string;
  descripcion:    string;
  estado?:        string;
  id_almacen_ref?: number;
  id_sede_ref?:   number; 
  detalles?:      AuctionDetailResponse[];
  total_items?:   number;
}

export interface PaginatedAuctions {
  items: AuctionResponseDto[];
  total: number;
  page:  number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly api         = environment.apiUrl;
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService, { optional: true });

  private readonly _loading     = signal(false);
  private readonly _error       = signal<string | null>(null);
  private readonly _auctions    = signal<AuctionResponseDto[]>([]);
  private readonly _totalPages  = signal(1);
  private readonly _currentPage = signal(1);

  readonly loading     = computed(() => this._loading());
  readonly error       = computed(() => this._error());
  readonly auctions    = computed(() => this._auctions());
  readonly totalPages  = computed(() => this._totalPages());
  readonly currentPage = computed(() => this._currentPage());

  private buildHeaders(role = 'Administrador'): HttpHeaders {
    let headers = new HttpHeaders({ 'x-role': role });
    const token = this.authService?.getToken?.();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
  createAuction(dto: CreateAuctionDto, role = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .post<AuctionResponseDto>(`${this.api}/logistics/auctions`, dto, { headers: this.buildHeaders(role) })
      .pipe(
        tap(created => this._auctions.update(prev => [created, ...prev])),
        catchError(err => { this._error.set('No se pudo crear el remate.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Actualización parcial ─────────────────────────────────────────────────
  patchAuction(id: number, dto: PatchAuctionDto, role = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);
    return this.getAuctionById(id, role).pipe(
      switchMap((actual) => {
        const detallesActuales = actual.detalles ?? [];
        const detallesCambiaron = dto.detalles && dto.detalles.length > 0 && (
          dto.detalles[0].pre_remate   !== detallesActuales[0]?.pre_remate ||
          dto.detalles[0].stock_remate !== detallesActuales[0]?.stock_remate
        );
        const detallesPayload = detallesCambiaron && dto.detalles
          ? dto.detalles.map((d, i) => ({
              id_detalle_remate: detallesActuales[i]?.id_detalle_remate,
              id_producto:       detallesActuales[i]?.id_producto  ?? 0,
              pre_original:      detallesActuales[i]?.pre_original ?? 0,
              pre_remate:        d.pre_remate,
              stock_remate:      d.stock_remate,
            }))
          : detallesActuales.map(d => ({
              id_detalle_remate: d.id_detalle_remate,
              id_producto:       d.id_producto  ?? 0,
              pre_original:      d.pre_original ?? 0,
              pre_remate:        d.pre_remate   ?? 0,
              stock_remate:      d.stock_remate ?? 0,
            }));
        const payload = {
          descripcion: dto.descripcion ?? actual.descripcion,
          estado:      dto.estado      ?? actual.estado,
          detalles:    detallesPayload,
        };
        return this.http
          .put<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}`, payload, { headers: this.buildHeaders(role) })
          .pipe(tap(updated => this._auctions.update(list => list.map(a => a.id_remate === updated.id_remate ? updated : a))));
      }),
      catchError(err => { this._error.set('No se pudo actualizar el remate.'); return throwError(() => err); }),
      finalize(() => this._loading.set(false)),
    );
  }

  // ── Listar ────────────────────────────────────────────────────────────────
  loadAuctions(
    page    = 1,
    limit   = 10,
    id_sede = 0,          
    role    = 'Administrador',
  ): Observable<PaginatedAuctions> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams()
      .set('page',  page.toString())
      .set('limit', limit.toString());

    if (id_sede > 0) {
      params = params.set('id_sede', id_sede.toString());
    }

    return this.http
      .get<PaginatedAuctions>(`${this.api}/logistics/auctions`, { headers: this.buildHeaders(role), params })
      .pipe(
        tap(response => {
          this._auctions.set(response.items ?? []);
          this._totalPages.set(Math.max(1, Math.ceil((response.total ?? response.items?.length ?? 0) / (limit || 1))));
          this._currentPage.set(response.page ?? page);
        }),
        catchError(err => { this._error.set('No se pudo cargar remates.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Obtener por ID ────────────────────────────────────────────────────────
  getAuctionById(id: number, role = 'Administrador'): Observable<AuctionResponseDto> {
    return this.http
      .get<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}`, { headers: this.buildHeaders(role) })
      .pipe(catchError(err => { this._error.set('No se pudo cargar el remate.'); return throwError(() => err); }));
  }

  // ── PUT completo ──────────────────────────────────────────────────────────
  updateAuction(id: number, dto: CreateAuctionDto, role = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .put<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}`, dto, { headers: this.buildHeaders(role) })
      .pipe(
        tap(updated => this._auctions.update(list => list.map(a => a.id_remate === updated.id_remate ? updated : a))),
        catchError(err => { this._error.set('No se pudo actualizar el remate.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────
  finalizeAuction(id: number, role = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .post<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}/finalize`, {}, { headers: this.buildHeaders(role) })
      .pipe(
        tap(updated => this._auctions.update(list => list.map(a => a.id_remate === updated.id_remate ? updated : a))),
        catchError(err => { this._error.set('No se pudo finalizar el remate.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  deleteAuction(id: number, role = 'Administrador', pageSize = 10): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .delete<void>(`${this.api}/logistics/auctions/${id}`, { headers: this.buildHeaders(role) })
      .pipe(
        tap(() => {
          this._auctions.update(list => list.filter(a => a.id_remate !== id));
          this._totalPages.set(Math.max(1, Math.ceil(this._auctions().length / (pageSize || 1))));
        }),
        catchError(err => { this._error.set('No se pudo eliminar el remate.'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }
}
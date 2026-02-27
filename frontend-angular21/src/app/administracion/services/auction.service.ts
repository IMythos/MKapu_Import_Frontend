import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { AuthService } from '../../auth/services/auth.service';

export interface AuctionDetailDto {
  id_producto: number;
  pre_original: number;
  pre_remate: number;
  stock_remate: number;
  observacion?: string;
}

export interface CreateAuctionDto {
  cod_remate?: string; 
  descripcion: string;
  fec_inicio?: string; 
  fec_fin: string;
  estado?: string;
  id_almacen_ref: number;
  detalles: AuctionDetailDto[];
}

export interface AuctionDetailResponse {
  id_detalle_remate?: number;
  pre_original?: number;
  pre_remate?: number;
  stock_remate?: number;
  id_producto?: number;
}

export interface AuctionResponseDto {
  id_remate: number;
  cod_remate: string;
  descripcion: string;
  fec_inicio?: string;
  fec_fin?: string;
  estado?: string;
  detalles?: AuctionDetailResponse[];
  total_items?: number;
}

export interface PaginatedAuctions {
  items: AuctionResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly api = environment.apiUrl;

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService, { optional: true });

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _auctions = signal<AuctionResponseDto[]>([]);
  private readonly _totalPages = signal(1);
  private readonly _currentPage = signal(1);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly auctions = computed(() => this._auctions());
  readonly totalPages = computed(() => this._totalPages());
  readonly currentPage = computed(() => this._currentPage());

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    let headers = new HttpHeaders({ 'x-role': role ?? '' });
    const token = this.authService?.getToken?.();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  createAuction(dto: CreateAuctionDto, role: string = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AuctionResponseDto>(`${this.api}/logistics/auctions`, dto, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((created) => {
          const prev = this._auctions();
          this._auctions.set([created, ...prev]);
        }),
        catchError((err) => {
          this._error.set('No se pudo crear el remate.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  loadAuctions(page: number = 1, limit: number = 10, role: string = 'Administrador'): Observable<PaginatedAuctions> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<PaginatedAuctions>(`${this.api}/logistics/auctions`, {
        headers: this.buildHeaders(role),
        params,
      })
      .pipe(
        tap((response) => {
          this._auctions.set(response.items ?? []);
          const totalItems = response.total ?? (response.items?.length ?? 0);
          const computedTotalPages = Math.max(1, Math.ceil(totalItems / (limit || 1)));
          this._totalPages.set(computedTotalPages);
          this._currentPage.set(response.page ?? page);
        }),
        catchError((err) => {
          this._error.set('No se pudo cargar remates.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  getAuctionById(id: number, role: string = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar el remate.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  updateAuction(id: number, dto: CreateAuctionDto, role: string = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}`, dto, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((updated) => {
          this._auctions.update(list => list.map(a => a.id_remate === updated.id_remate ? updated : a));
        }),
        catchError((err) => {
          this._error.set('No se pudo actualizar el remate.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  finalizeAuction(id: number, role: string = 'Administrador'): Observable<AuctionResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AuctionResponseDto>(`${this.api}/logistics/auctions/${id}/finalize`, {}, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((updated) => {
          this._auctions.update(list => list.map(a => a.id_remate === updated.id_remate ? updated : a));
        }),
        catchError((err) => {
          this._error.set('No se pudo finalizar el remate.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  deleteAuction(id: number, role: string = 'Administrador', pageSize: number = 10): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<void>(`${this.api}/logistics/auctions/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(() => {
          this._auctions.update(list => list.filter(a => a.id_remate !== id));
          const newTotalItems = this._auctions().length;
          const newTotalPages = Math.max(1, Math.ceil(newTotalItems / (pageSize || 1)));
          this._totalPages.set(newTotalPages);
        }),
        catchError((err) => {
          this._error.set('No se pudo eliminar el remate.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }
}
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap, map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export interface Promotion {
  idPromocion: number;
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
  reglas: ReglaPromo[];
  descuentosAplicados: DescuentoAplicado[];
}

export interface ReglaPromo {
  idRegla: number;
  tipoCondicion: string;
  valorCondicion: string;
}

export interface DescuentoAplicado {
  idDescuento: number;
  monto: number;
}

export interface PromotionResponse {
  promociones: Promotion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private readonly api = environment.apiUrl;

  private readonly _response = signal<PromotionResponse | null>(null);
  private readonly _loading  = signal(false);
  private readonly _error    = signal<string | null>(null);

  readonly promociones = computed(() => this._response()?.promociones ?? []);
  readonly total       = computed(() => this._response()?.total ?? 0);
  readonly loading     = computed(() => this._loading());
  readonly error       = computed(() => this._error());

  constructor(private http: HttpClient) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private normalizeActivo(field: unknown): boolean {
    if (typeof field === 'boolean') return field;
    if (field && typeof field === 'object' && Array.isArray((field as any).data)) {
      return (field as any).data[0] === 1;
    }
    if (typeof field === 'number') return field === 1;
    return !!field;
  }

  private mapPromo(p: any): Promotion {
    return {
      idPromocion: p.idPromocion,
      concepto:    p.concepto ?? '—',
      tipo:        p.tipo     ?? '—',
      valor:       Number(p.valor) || 0,
      activo:      this.normalizeActivo(p.activo),
      reglas: (p.reglas ?? []).map((r: any) => ({
        idRegla:        r.idRegla,
        tipoCondicion:  r.tipoCondicion,
        valorCondicion: r.valorCondicion,
      })),
      descuentosAplicados: (p.descuentosAplicados ?? []).map((d: any) => ({
        idDescuento: d.idDescuento,
        monto:       Number(d.monto) || 0,
      })),
    };
  }

  private snapshot(): PromotionResponse | null {
    return this._response();
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  loadPromotions(page = 1, limit = 10): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<any>(`${this.api}/sales/promotions?page=${page}&limit=${limit}`)
      .pipe(
        tap(res => {
          const promociones = (res.data ?? []).map((p: any) => this.mapPromo(p));
          const pag = res.pagination ?? {};
          this._response.set({
            promociones,
            total:      pag.total      ?? promociones.length,
            page:       pag.page       ?? page,
            limit:      pag.limit      ?? limit,
            totalPages: pag.totalPages ?? 1,
          });
        }),
        catchError(err => {
          this._error.set('No se pudo cargar las promociones.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  getPromotionById(id: number): Observable<Promotion> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<any>(`${this.api}/sales/promotions/${id}`)
      .pipe(
        map(p => this.mapPromo(p)),
        catchError(err => {
          this._error.set('No se pudo cargar la promoción.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  createPromotion(payload: Partial<Promotion>): Observable<Promotion> {
    this._loading.set(true);
    this._error.set(null);
    const prev = this.snapshot();

    return this.http
      .post<any>(`${this.api}/sales/promotions`, payload)
      .pipe(
        tap(created => {
          const mapped = this.mapPromo(created);
          if (!prev) return;
          this._response.set({
            ...prev,
            promociones: [mapped, ...prev.promociones],
            total: prev.total + 1,
            totalPages: Math.ceil((prev.total + 1) / prev.limit),
          });
        }),
        catchError(err => {
          this._response.set(prev);
          this._error.set('No se pudo registrar la promoción.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  updatePromotion(id: number, payload: Partial<Promotion>): Observable<Promotion> {
    this._loading.set(true);
    this._error.set(null);
    const prev = this.snapshot();

    return this.http
      .put<any>(`${this.api}/sales/promotions/${id}`, payload)
      .pipe(
        tap(updated => this.patchCached(id, this.mapPromo(updated))),
        catchError(err => {
          this._response.set(prev);
          this._error.set('No se pudo actualizar la promoción.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Cambia solo el estado activo/inactivo via endpoint dedicado
  updatePromotionStatus(id: number, activo: boolean): Observable<Promotion> {
    this._loading.set(true);
    this._error.set(null);
    const prev = this.snapshot();

    return this.http
      .patch<any>(`${this.api}/sales/promotions/${id}/status`, { activo })
      .pipe(
        tap(updated => this.patchCached(id, this.mapPromo(updated))),
        catchError(err => {
          this._response.set(prev);
          this._error.set('No se pudo actualizar el estado.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Borrado físico — solo para promociones inactivas
  hardDeletePromotion(id: number): Observable<any> {
    this._loading.set(true);
    this._error.set(null);
    const prev = this.snapshot();

    return this.http
      .delete<any>(`${this.api}/sales/promotions/${id}/hard`)
      .pipe(
        tap(() => {
          if (!prev) return;
          const newTotal = prev.total - 1;
          this._response.set({
            ...prev,
            promociones: prev.promociones.filter(p => p.idPromocion !== id),
            total: newTotal,
            totalPages: Math.ceil(newTotal / prev.limit),
          });
        }),
        catchError(err => {
          this._response.set(prev);
          this._error.set('No se pudo eliminar la promoción.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Soft delete (desactiva) — mantener por compatibilidad
  deletePromotion(id: number): Observable<any> {
    this._loading.set(true);
    this._error.set(null);
    const prev = this.snapshot();

    return this.http
      .delete<any>(`${this.api}/sales/promotions/${id}`)
      .pipe(
        tap(()  => this.loadPromotions(prev?.page ?? 1, prev?.limit ?? 10).subscribe()),
        catchError(err => {
          this._response.set(prev);
          this._error.set('No se pudo eliminar la promoción.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  private patchCached(id: number, updated: Promotion): void {
    const prev = this._response();
    if (!prev) return;
    this._response.set({
      ...prev,
      promociones: prev.promociones.map(p => p.idPromocion === id ? updated : p),
    });
  }
}
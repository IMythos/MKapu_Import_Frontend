import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Discount, DiscountResponse } from '../interfaces/discount.interface';

export type CreateDiscountRequest = Omit<Discount, 'idDescuento' | 'activo'>;
export type UpdateDiscountRequest = Partial<Omit<Discount, 'idDescuento'>>;

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private readonly api = environment.apiUrl;

  private readonly _response = signal<DiscountResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly discountsResponse = computed(() => this._response());
  readonly descuentos = computed(() => this._response()?.data ?? []);
  readonly total = computed(() => this._response()?.pagination.total ?? 0);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor(private http: HttpClient) {}

  // Obtener todos los descuentos
  loadDescuentos(): Observable<DiscountResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<DiscountResponse>(`${this.api}/sales/discounts`)
      .pipe(
        tap((res) => this._response.set(res)),
        catchError((err) => {
          this._error.set('No se pudo cargar descuentos.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Crear nuevo descuento
  createDescuento(payload: CreateDiscountRequest): Observable<Discount> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Discount>(`${this.api}/sales/discounts`, payload)
      .pipe(
        tap((created) => {
          const prev = this._response();
          if (!prev) return;
          this._response.set({
            ...prev,
            data: [created, ...prev.data],
            pagination: { ...prev.pagination, total: prev.pagination.total + 1 }
          });
        }),
        catchError((err) => {
          this._error.set('No se pudo registrar el descuento.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Obtener descuento por ID
  getDescuentoById(id: number): Observable<Discount> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Discount>(`${this.api}/sales/discounts/${id}`)
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar el descuento.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Actualizar descuento
  updateDescuento(id: number, payload: UpdateDiscountRequest): Observable<Discount> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Discount>(`${this.api}/sales/discounts/${id}`, payload)
      .pipe(
        tap((updated) => this.patchCachedDiscount(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el descuento.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // Actualizar estado (activo/inactivo)
  updateDescuentoStatus(id: number, activo: boolean): Observable<Discount> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Discount>(
        `${this.api}/sales/discounts/${id}/status`,
        { activo }
      )
      .pipe(
        tap((updated) => this.patchCachedDiscount(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el estado del descuento.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // opcional: solo observable, sin tocar signals
  getDescuentos(): Observable<DiscountResponse> {
    return this.http.get<DiscountResponse>(`${this.api}/sales/discounts`);
  }

  private patchCachedDiscount(id: number, updated: Discount): void {
    const prev = this._response();
    if (!prev) return;

    this._response.set({
      ...prev,
      data: prev.data.map((d) => (d.idDescuento === id ? updated : d)),
    });
  }
}
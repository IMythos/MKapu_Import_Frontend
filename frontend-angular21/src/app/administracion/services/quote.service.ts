import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import { Observable, throwError } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Quote, QuoteListItem, QuotePagedResponse } from '../interfaces/quote.interface';

export type CreateQuoteRequest = Omit<Quote, 'id_cotizacion' | 'cliente' | 'sede'>;

export interface LoadQuotesFilters {
  search?: string;
  estado?: string | null;
  id_sede?: number | null;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/sales/quote`;

  private readonly _quoteList = signal<QuoteListItem[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _page = signal<number>(1);
  private readonly _totalPages = signal<number>(1);
  private readonly _quote = signal<Quote | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly quotes = computed(() => this._quoteList());
  readonly total = computed(() => this._total());
  readonly page = computed(() => this._page());
  readonly totalPages = computed(() => this._totalPages());
  readonly quote = computed(() => this._quote());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  loadQuotes(filters?: LoadQuotesFilters): Observable<QuotePagedResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters?.search)  params = params.set('search', filters.search);
    if (filters?.estado)  params = params.set('estado', filters.estado);
    if (filters?.id_sede) params = params.set('id_sede', filters.id_sede.toString());
    if (filters?.page)    params = params.set('page', filters.page.toString());
    if (filters?.limit)   params = params.set('limit', filters.limit.toString());

    return this.http.get<QuotePagedResponse>(this.api, { params }).pipe(
      tap((res) => {
        this._quoteList.set(res.data);
        this._total.set(res.total);
        this._page.set(res.page);
        this._totalPages.set(res.totalPages);
      }),
      catchError((err) => {
        this._error.set('No se pudo cargar cotizaciones.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  getQuoteById(id: number): Observable<Quote> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<Quote>(`${this.api}/${id}`).pipe(
      tap((resp) => this._quote.set(resp)),
      catchError((err) => {
        this._error.set('No se pudo obtener la cotización.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createQuote(payload: CreateQuoteRequest): Observable<Quote> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post<Quote>(this.api, payload).pipe(
      tap((created) => this._quote.set(created)),
      catchError((err) => {
        this._error.set('No se pudo crear la cotización.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  approveQuote(id: number): Observable<Quote> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.patch<Quote>(`${this.api}/${id}/approve`, {}).pipe(
      tap((approved) => this._quote.set(approved)),
      catchError((err) => {
        this._error.set('No se pudo aprobar la cotización.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  getQuotesByCustomerDocument(document: string): Observable<Quote[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<Quote[]>(`${this.api}/customer/${document}`).pipe(
      tap((resp) => this._quoteList.set([])),
      catchError((err) => {
        this._error.set('No se pudo obtener cotizaciones del cliente.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  reset() {
    this._quoteList.set([]);
    this._total.set(0);
    this._page.set(1);
    this._totalPages.set(1);
    this._quote.set(null);
    this._error.set(null);
    this._loading.set(false);
  }
}
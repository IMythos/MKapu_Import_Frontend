import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import { Observable, throwError, firstValueFrom } from 'rxjs';
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

  private readonly _quoteList  = signal<QuoteListItem[]>([]);
  private readonly _total      = signal<number>(0);
  private readonly _page       = signal<number>(1);
  private readonly _totalPages = signal<number>(1);
  private readonly _quote      = signal<Quote | null>(null);
  private readonly _loading    = signal(false);
  private readonly _error      = signal<string | null>(null);

  // ── KPI globales ──────────────────────────────────────────────────
  readonly kpiTotal      = signal<number>(0);
  readonly kpiAprobadas  = signal<number>(0);
  readonly kpiPendientes = signal<number>(0);

  readonly quotes     = computed(() => this._quoteList());
  readonly total      = computed(() => this._total());
  readonly page       = computed(() => this._page());
  readonly totalPages = computed(() => this._totalPages());
  readonly quote      = computed(() => this._quote());
  readonly loading    = computed(() => this._loading());
  readonly error      = computed(() => this._error());

  // ── Listar cotizaciones paginadas ─────────────────────────────────
  loadQuotes(filters?: LoadQuotesFilters): Observable<QuotePagedResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters?.search)  params = params.set('search',  filters.search);
    if (filters?.estado)  params = params.set('estado',  filters.estado);
    if (filters?.id_sede) params = params.set('id_sede', filters.id_sede.toString());
    if (filters?.page)    params = params.set('page',    filters.page.toString());
    if (filters?.limit)   params = params.set('limit',   filters.limit.toString());

    // KPIs en paralelo — sin await para no bloquear el Observable principal
    this._loadKpis();

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

  private _loadKpis(): void {
    const base = new HttpParams().set('page', '1').set('limit', '1');

    Promise.all([
      firstValueFrom(this.http.get<QuotePagedResponse>(this.api, { params: base })),
      firstValueFrom(this.http.get<QuotePagedResponse>(this.api, { params: base.set('estado', 'APROBADA') })),
      firstValueFrom(this.http.get<QuotePagedResponse>(this.api, { params: base.set('estado', 'PENDIENTE') })),
    ]).then(([totalRes, aprobRes, pendRes]) => {
      this.kpiTotal.set(totalRes.total);
      this.kpiAprobadas.set(aprobRes.total);
      this.kpiPendientes.set(pendRes.total);
    }).catch(() => { /* silencioso — los KPIs no son críticos */ });
  }

  // ── Obtener por ID ────────────────────────────────────────────────
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

  // ── Crear ─────────────────────────────────────────────────────────
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

  // ── Aprobar ───────────────────────────────────────────────────────
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

  // ── Cambiar estado ────────────────────────────────────────────────
  updateQuoteStatus(id: number, estado: 'RECHAZADA' | 'APROBADA' | 'PENDIENTE'): Observable<Quote> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.patch<Quote>(`${this.api}/${id}/status`, { estado }).pipe(
      tap((updated) => this._quote.set(updated)),
      catchError((err) => {
        this._error.set('No se pudo actualizar el estado.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  // ── Eliminar permanentemente ──────────────────────────────────────
  deleteQuote(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      catchError((err) => {
        this._error.set('No se pudo eliminar la cotización.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  // ── Por documento de cliente ──────────────────────────────────────
  getQuotesByCustomerDocument(document: string): Observable<Quote[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<Quote[]>(`${this.api}/customer/${document}`).pipe(
      tap(() => this._quoteList.set([])),
      catchError((err) => {
        this._error.set('No se pudo obtener cotizaciones del cliente.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  // ── Voucher térmico ───────────────────────────────────────────────
  printThermalVoucher(id: number): Observable<void> {
    return new Observable((observer) => {
      this.http.get(`${this.api}/${id}/export/thermal`, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          const win = window.open(url, '_blank');
          if (win) {
            win.onload = () => { win.focus(); win.print(); };
            setTimeout(() => { try { win.focus(); win.print(); } catch { } }, 1500);
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
          observer.next();
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  downloadThermalVoucher(id: number): Observable<void> {
    return new Observable((observer) => {
      const link    = document.createElement('a');
      link.href     = `${this.api}/${id}/export/thermal`;
      link.download = `voucher-${id}.pdf`;
      link.target   = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      observer.next();
      observer.complete();
    });
  }

  // ── Exportar PDF ──────────────────────────────────────────────────
  exportPdf(id: number): void {
    window.open(`${this.api}/${id}/export/pdf`, '_blank');
  }

  printPdf(id: number): Observable<void> {
    return new Observable((observer) => {
      this.http.get(`${this.api}/${id}/export/pdf`, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          const win = window.open(blobUrl, '_blank');
          if (win) {
            win.onload = () => { win.focus(); win.print(); };
            setTimeout(() => { try { win.focus(); win.print(); } catch { } }, 1500);
          }
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
          observer.next();
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  downloadPdf(id: number): Observable<void> {
    return new Observable((observer) => {
      const link    = document.createElement('a');
      link.href     = `${this.api}/${id}/export/pdf`;
      link.download = `cotizacion-${id}.pdf`;
      link.target   = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      observer.next();
      observer.complete();
    });
  }

  // ── Email ─────────────────────────────────────────────────────────
  sendByEmail(id: number): Observable<{ message: string; sentTo: string }> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post<{ message: string; sentTo: string }>(
      `${this.api}/${id}/send-email`, {}
    ).pipe(
      catchError((err) => {
        this._error.set('No se pudo enviar el email.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  // ── WhatsApp ──────────────────────────────────────────────────────
  getWhatsAppStatus(): Observable<{ ready: boolean; qr: string | null }> {
    return this.http.get<{ ready: boolean; qr: string | null }>(
      `${this.api}/whatsapp/status`
    );
  }

  sendByWhatsApp(id: number): Observable<{ message: string; sentTo: string }> {
    return this.http.post<{ message: string; sentTo: string }>(
      `${this.api}/${id}/send-whatsapp`, {}
    );
  }

  // ── Reset ─────────────────────────────────────────────────────────
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
import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export type AccountReceivableStatus =
  | 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';

export interface AccountReceivableResponse {
  id:             number;
  salesReceiptId: number;
  userRef:        string;
  totalAmount:    number;
  paidAmount:     number;
  pendingBalance: number;
  issueDate:      string;
  dueDate:        string;
  updatedAt:      string | null;
  status:         AccountReceivableStatus;
  paymentTypeId:  number;
  currencyCode:   string;
  observation:    string | null;
}

export interface AccountReceivablePaginatedResponse {
  data:       AccountReceivableResponse[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface CreateAccountReceivablePayload {
  salesReceiptId: number;
  userRef:        string;
  totalAmount:    number;
  dueDate:        string;
  paymentTypeId:  number;
  currencyCode:   string;
  observation?:   string | null;
}

export interface ApplyPaymentPayload {
  accountReceivableId: number;
  amount:              number;
  currencyCode:        string;
  paymentTypeId:       number;
}

export interface CancelAccountReceivablePayload {
  accountReceivableId: number;
  reason?:             string;
}

export interface UpdateDueDatePayload {
  accountReceivableId: number;
  newDueDate:          string;
}

@Injectable({ providedIn: 'root' })
export class AccountReceivableService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales/account-receivables`;

  readonly list         = signal<AccountReceivableResponse[]>([]);
  readonly selected     = signal<AccountReceivableResponse | null>(null);
  readonly total        = signal<number>(0);
  readonly page         = signal<number>(1);
  readonly totalPages   = signal<number>(1);
  readonly loading      = signal<boolean>(false);
  readonly error        = signal<string | null>(null);
  readonly accounts     = this.list.asReadonly();
  readonly totalRecords = this.total.asReadonly();

  // ── KPI globales (independientes de filtros y paginado) ───────────
  readonly kpiTotal      = signal<number>(0);
  readonly kpiPendientes = signal<number>(0);
  readonly kpiVencidos   = signal<number>(0);
  readonly kpiCancelados = signal<number>(0);

  private _lastSedeId?: number;
  private _lastStatus?: AccountReceivableStatus;
  private _lastLimit = 10;

  readonly pendientes = computed(() => this.list().filter(a => a.status === 'PENDIENTE'));
  readonly vencidos   = computed(() => this.list().filter(a => a.status === 'VENCIDO'));

  // ── Queries ───────────────────────────────────────────────────────

  async getAll(
    page    = 1,
    limit   = 10,
    sedeId? : number,
    status? : AccountReceivableStatus | null,
  ): Promise<void> {
    this._lastSedeId = sedeId;
    this._lastStatus = (status === null || status === undefined) ? undefined : status;
    this._lastLimit  = limit;
    const statusParaQuery = status === null ? undefined : status;

    this.loading.set(true);
    this.error.set(null);

    try {
      let httpParams = new HttpParams()
        .set('page',  String(page))
        .set('limit', String(limit));
      if (sedeId != null)          httpParams = httpParams.set('sedeId', String(sedeId));
      if (statusParaQuery != null) httpParams = httpParams.set('status', statusParaQuery);

      const kpiBase = new HttpParams().set('page', '1').set('limit', '1');

      const [res, totalRes, pendRes, vencRes, cancelRes] = await Promise.all([
        // página actual con filtros aplicados
        firstValueFrom(this.http.get<AccountReceivablePaginatedResponse>(
          this.baseUrl, { params: httpParams }
        )),
        // total global sin filtro de estado
        firstValueFrom(this.http.get<AccountReceivablePaginatedResponse>(
          this.baseUrl, { params: kpiBase }
        )),
        // total PENDIENTE global
        firstValueFrom(this.http.get<AccountReceivablePaginatedResponse>(
          this.baseUrl, { params: kpiBase.set('status', 'PENDIENTE') }
        )),
        // total VENCIDO global
        firstValueFrom(this.http.get<AccountReceivablePaginatedResponse>(
          this.baseUrl, { params: kpiBase.set('status', 'VENCIDO') }
        )),
        // total CANCELADO global
        firstValueFrom(this.http.get<AccountReceivablePaginatedResponse>(
          this.baseUrl, { params: kpiBase.set('status', 'CANCELADO') }
        )),
      ]);

      // página actual
      this.list.set(res.data);
      this.total.set(res.total);
      this.page.set(res.page);
      this.totalPages.set(res.totalPages);

      // KPIs globales
      this.kpiTotal.set(totalRes.total);
      this.kpiPendientes.set(pendRes.total);
      this.kpiVencidos.set(vencRes.total);
      this.kpiCancelados.set(cancelRes.total);

    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cargar cuentas por cobrar');
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number): void {
    this.getAll(page, this._lastLimit, this._lastSedeId, this._lastStatus);
  }

  async loadAll(params: { page?: number; limit?: number } = {}): Promise<void> {
    await this.getAll(params.page ?? 1, params.limit ?? 10);
  }

  async getById(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<AccountReceivableResponse>(`${this.baseUrl}/${id}`),
      );
      this.selected.set(res);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? `No se encontró la cuenta #${id}`);
      this.selected.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────

  async create(payload: CreateAccountReceivablePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true); this.error.set(null);
    try {
      return await firstValueFrom(this.http.post<AccountReceivableResponse>(this.baseUrl, payload));
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al crear cuenta por cobrar'); return null;
    } finally { this.loading.set(false); }
  }

  async applyPayment(payload: ApplyPaymentPayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true); this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/payment`, payload)
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al registrar el pago'); return null;
    } finally { this.loading.set(false); }
  }

  async cancel(payload: CancelAccountReceivablePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true); this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/cancel`, payload)
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cancelar la cuenta'); return null;
    } finally { this.loading.set(false); }
  }

  async updateDueDate(payload: UpdateDueDatePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true); this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/due-date`, payload)
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al actualizar la fecha de vencimiento'); return null;
    } finally { this.loading.set(false); }
  }

  // ── Voucher térmico ───────────────────────────────────────────────

  printVoucher(id: number): Observable<void> {
    return new Observable((observer) => {
      this.http.get(`${this.baseUrl}/${id}/export/thermal`, { responseType: 'blob' }).subscribe({
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

  downloadVoucher(id: number): Observable<void> {
    return new Observable((observer) => {
      const link    = document.createElement('a');
      link.href     = `${this.baseUrl}/${id}/export/thermal`;
      link.download = `voucher-cxc-${id}.pdf`;
      link.target   = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      observer.next();
      observer.complete();
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────

  exportPdf(id: number): void {
    window.open(`${this.baseUrl}/${id}/export/pdf`, '_blank');
  }

  printPdf(id: number): Observable<void> {
    return new Observable((observer) => {
      this.http.get(`${this.baseUrl}/${id}/export/pdf`, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const blobUrl = window.URL.createObjectURL(
            new Blob([blob], { type: 'application/pdf' })
          );
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
      link.href     = `${this.baseUrl}/${id}/export/pdf`;
      link.download = `cuenta-por-cobrar-${id}.pdf`;
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
    return this.http.post<{ message: string; sentTo: string }>(
      `${this.baseUrl}/${id}/send-email`, {}
    );
  }

  // ── WhatsApp ──────────────────────────────────────────────────────

  getWhatsAppStatus(): Observable<{ ready: boolean; qr: string | null }> {
    return this.http.get<{ ready: boolean; qr: string | null }>(
      `${this.baseUrl}/whatsapp/status`
    );
  }

  sendByWhatsApp(id: number): Observable<{ message: string; sentTo: string }> {
    return this.http.post<{ message: string; sentTo: string }>(
      `${this.baseUrl}/${id}/send-whatsapp`, {}
    );
  }
}
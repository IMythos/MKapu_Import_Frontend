/* ============================================
   src/app/services/account-receivable.service.ts
   ============================================ */

import { Injectable, signal, inject, computed  } from '@angular/core';
import { HttpClient, HttpParams }      from '@angular/common/http';
import { firstValueFrom }              from 'rxjs';
import { environment }                 from '../../../enviroments/enviroment';

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

// ── Payloads ──────────────────────────────────────────────────────────────────

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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AccountReceivableService {

  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = `${environment.apiUrl}/sales/account-receivables`;

  // ── Signals ────────────────────────────────────────────────────────
  readonly list       = signal<AccountReceivableResponse[]>([]);
  readonly selected   = signal<AccountReceivableResponse | null>(null);
  readonly total      = signal<number>(0);
  readonly page       = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly loading    = signal<boolean>(false);
  readonly error      = signal<string | null>(null);
  readonly accounts   = this.list.asReadonly();

  readonly totalRecords = this.total.asReadonly();

  // ── Filtros activos (para re-usar en goToPage) ─────────────────────
  private _lastSedeId?: number;
  private _lastStatus?: AccountReceivableStatus;   // nunca null — undefined = sin filtro
  private _lastLimit = 10;

  readonly pendientes = computed(() =>
    this.list().filter(a => a.status === 'PENDIENTE')
  );

  readonly vencidos = computed(() =>
    this.list().filter(a => a.status === 'VENCIDO')
  );

  // ── GET principal con filtros opcionales ───────────────────────────
  async getAll(
    page    = 1,
    limit   = 10,
    sedeId? : number,
    status? : AccountReceivableStatus | null,
  ): Promise<void> {
    // Guardar para reusar en goToPage — null → undefined (sin filtro)
    this._lastSedeId = sedeId;
    this._lastStatus = status ?? undefined;
    this._lastLimit  = limit;

    this.loading.set(true);
    this.error.set(null);
    try {
      let httpParams = new HttpParams()
        .set('page',  String(page))
        .set('limit', String(limit));

      if (sedeId != null)            httpParams = httpParams.set('sedeId', String(sedeId));
      if (this._lastStatus != null)  httpParams = httpParams.set('status', this._lastStatus);

      const res = await firstValueFrom(
        this.http.get<AccountReceivablePaginatedResponse>(this.baseUrl, { params: httpParams }),
      );
      this.list.set(res.data);
      this.total.set(res.total);
      this.page.set(res.page);
      this.totalPages.set(res.totalPages);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cargar cuentas por cobrar');
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number): void {
    this.getAll(page, this._lastLimit, this._lastSedeId, this._lastStatus);
  }

  // ── GET paginado (alias legacy) ────────────────────────────────────
  async loadAll(params: { page?: number; limit?: number } = {}): Promise<void> {
    await this.getAll(params.page ?? 1, params.limit ?? 10);
  }

  // ── GET por id ─────────────────────────────────────────────────────
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

  // ── POST crear ─────────────────────────────────────────────────────
  async create(payload: CreateAccountReceivablePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.post<AccountReceivableResponse>(this.baseUrl, payload),
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al crear cuenta por cobrar');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH registrar abono ──────────────────────────────────────────
  async applyPayment(payload: ApplyPaymentPayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/payment`, payload),
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al registrar el pago');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH cancelar ─────────────────────────────────────────────────
  async cancel(payload: CancelAccountReceivablePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/cancel`, payload),
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cancelar la cuenta');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH actualizar vencimiento ───────────────────────────────────
  async updateDueDate(payload: UpdateDueDatePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/due-date`, payload),
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al actualizar la fecha de vencimiento');
      return null;
    } finally {
      this.loading.set(false);
    }
  }
}
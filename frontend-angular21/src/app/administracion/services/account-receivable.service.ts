/* ============================================
   src/app/core/account-receivable/account-receivable.service.ts
   ============================================ */

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

// ── Interfaces ────────────────────────────────────────────────────────

export type AccountReceivableStatus =
  | 'PENDIENTE'
  | 'PARCIAL'
  | 'PAGADO'
  | 'VENCIDO'
  | 'CANCELADO';

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
  observation?:   string;
}

export interface ApplyPaymentPayload {
  accountReceivableId: number;
  amount:              number;
  currencyCode:        string;
}

export interface CancelPayload {
  accountReceivableId: number;
  reason:              string;
}

export interface UpdateDueDatePayload {
  accountReceivableId: number;
  newDueDate:          string;  // 'YYYY-MM-DD'
}

// ── Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AccountReceivableService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales/account-receivables`;

  // ── State (signals) ──────────────────────────────────────────────

  readonly accounts      = signal<AccountReceivableResponse[]>([]);
  readonly selected      = signal<AccountReceivableResponse | null>(null);
  readonly loading       = signal<boolean>(false);
  readonly error         = signal<string | null>(null);
  readonly currentPage   = signal<number>(1);
  readonly totalPages    = signal<number>(1);
  readonly totalRecords  = signal<number>(0);
  readonly pageSize      = signal<number>(10);

  // ── Computed ─────────────────────────────────────────────────────

  readonly hasPendientes = computed(() =>
    this.accounts().some(a => a.status === 'PENDIENTE'),
  );

  readonly totalPendingBalance = computed(() =>
    this.accounts().reduce((sum, a) => sum + a.pendingBalance, 0),
  );

  readonly pendientes = computed(() =>
    this.accounts().filter(a => a.status === 'PENDIENTE'),
  );

  readonly vencidos = computed(() =>
    this.accounts().filter(a => a.status === 'VENCIDO'),
  );

  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly isLastPage  = computed(() => this.currentPage() === this.totalPages());
  

  // ── GET /account-receivables?page=&limit= ────────────────────────

// ── State adicional ──────────────────────────────────────────────
readonly sedeActual = signal<number | null>(null);

async getAll(page = 1, limit = 10, sedeId?: number): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  // Persistir sede para paginación
  if (sedeId !== undefined) this.sedeActual.set(sedeId);

  try {
    let params = new HttpParams()
      .set('page',  page)
      .set('limit', limit);

    if (this.sedeActual() != null) {
      params = params.set('sedeId', String(this.sedeActual()));
    }

    const res = await firstValueFrom(
      this.http.get<AccountReceivablePaginatedResponse>(this.baseUrl, { params }),
    );

    this.accounts.set(res.data);
    this.currentPage.set(res.page);
    this.totalPages.set(res.totalPages);
    this.totalRecords.set(res.total);
    this.pageSize.set(res.limit);
  } catch (err: any) {
    this.error.set(err?.error?.message ?? 'Error al cargar cuentas por cobrar');
  } finally {
    this.loading.set(false);
  }
}

async goToPage(page: number): Promise<void> {
  if (page >= 1 && page <= this.totalPages()) {
    await this.getAll(page, this.pageSize()); // usa sedeActual internamente
  }
}
  // ── GET /account-receivables/:id ─────────────────────────────────

  async getById(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<AccountReceivableResponse>(`${this.baseUrl}/${id}`),
      );
      this.selected.set(res);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? `Error al cargar cuenta #${id}`);
    } finally {
      this.loading.set(false);
    }
  }

  // ── POST /account-receivables ────────────────────────────────────

  async create(payload: CreateAccountReceivablePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<AccountReceivableResponse>(this.baseUrl, payload),
      );
      // Agregar al listado local sin recargar
      this.accounts.update(list => [res, ...list]);
      this.totalRecords.update(n => n + 1);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al crear cuenta por cobrar');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH /account-receivables/payment ───────────────────────────

  async applyPayment(payload: ApplyPaymentPayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/payment`, payload),
      );
      this._updateInList(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al aplicar pago');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH /account-receivables/cancel ────────────────────────────

  async cancel(payload: CancelPayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/cancel`, payload),
      );
      this._updateInList(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cancelar cuenta');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH /account-receivables/due-date ──────────────────────────

  async updateDueDate(payload: UpdateDueDatePayload): Promise<AccountReceivableResponse | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.patch<AccountReceivableResponse>(`${this.baseUrl}/due-date`, payload),
      );
      this._updateInList(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al actualizar fecha de vencimiento');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Paginación helpers ────────────────────────────────────────────

  async nextPage(): Promise<void> {
    if (!this.isLastPage()) {
      await this.getAll(this.currentPage() + 1, this.pageSize());
    }
  }

  async prevPage(): Promise<void> {
    if (!this.isFirstPage()) {
      await this.getAll(this.currentPage() - 1, this.pageSize());
    }
  }

  // ── Utilidades ────────────────────────────────────────────────────

  clearError():    void { this.error.set(null); }
  clearSelected(): void { this.selected.set(null); }

  // ── Privado: actualiza un item en el listado local ────────────────

  private _updateInList(updated: AccountReceivableResponse): void {
    this.accounts.update(list =>
      list.map(a => a.id === updated.id ? updated : a),
    );
    if (this.selected()?.id === updated.id) {
      this.selected.set(updated);
    }
  }
}
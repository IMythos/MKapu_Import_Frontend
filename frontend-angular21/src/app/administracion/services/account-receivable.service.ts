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

  private _lastSedeId?: number;
  private _lastStatus?: AccountReceivableStatus;
  private _lastLimit = 10;

  readonly pendientes = computed(() =>
    this.list().filter(a => a.status === 'PENDIENTE')
  );

  readonly vencidos = computed(() =>
    this.list().filter(a => a.status === 'VENCIDO')
  );

  async getAll(
    page    = 1,
    limit   = 10,
    sedeId? : number,
    status? : AccountReceivableStatus | null,
  ): Promise<void> {
    this._lastSedeId = sedeId;
    // null = limpiar filtro de estado | undefined = conservar | valor = aplicar
    this._lastStatus = (status === null || status === undefined) ? undefined : status;
    // Si se pasó null explícitamente, forzamos undefined para no enviar el param
    const statusParaQuery = status === null ? undefined : status;
    this._lastLimit  = limit;

    this.loading.set(true);
    this.error.set(null);
    try {
      let httpParams = new HttpParams()
        .set('page',  String(page))
        .set('limit', String(limit));

      if (sedeId != null)          httpParams = httpParams.set('sedeId', String(sedeId));
      if (statusParaQuery != null) httpParams = httpParams.set('status', statusParaQuery);

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

  exportPdf(id: number): void {
    window.open(`${this.baseUrl}/${id}/export/pdf`, '_blank');
  }

  sendByEmail(id: number): Observable<{ message: string; sentTo: string }> {
    return this.http.post<{ message: string; sentTo: string }>(
      `${this.baseUrl}/${id}/send-email`, {}
    );
  }
}
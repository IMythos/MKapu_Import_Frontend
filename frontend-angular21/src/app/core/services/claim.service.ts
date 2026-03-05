// core/services/claim.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { AuthService } from '../../auth/services/auth.service'; 

// ── Enums ─────────────────────────────────────────────────────────────
export enum ClaimStatus {
  REGISTRADO  = 'REGISTRADO',
  EN_PROCESO  = 'EN_PROCESO',
  RESUELTO    = 'RESUELTO',
  RECHAZADO   = 'RECHAZADO',
}

// ── Interfaces (alineadas con el backend) ─────────────────────────────
export interface ClaimResponseDto {
  claimId:      number;
  receiptId:    number;
  sellerId:     string;
  reason:       string;
  description:  string;
  status:       ClaimStatus;
  registeredAt: string;
  resolvedAt?:  string | null;
}

export interface ClaimListResponse {
  data:  ClaimResponseDto[];
  total: number;
  page:  number;
  limit: number;
}

export interface RegisterClaimPayload {
  id_comprobante:  number;
  id_vendedor_ref: string;
  motivo:          string;
  descripcion:     string;
}

export interface AttendClaimPayload {
  respuesta: string;
}

export interface ResolveClaimPayload {
  respuesta: string;
}

// ── Estadísticas (calculadas en frontend) ────────────────────────────
export interface ClaimStats {
  total:       number;
  registrados: number;
  en_proceso:  number;
  resueltos:   number;
  rechazados:  number;
}

// ── Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ClaimService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/claims`;

  // ── State signals ────────────────────────────────────────────────
  readonly claims   = signal<ClaimResponseDto[]>([]);
  readonly selected = signal<ClaimResponseDto | null>(null);
  readonly loading  = signal<boolean>(false);
  readonly error    = signal<string | null>(null);

  // ── Computed ─────────────────────────────────────────────────────
  readonly stats = computed<ClaimStats>(() => {
    const list = this.claims();
    return {
      total:       list.length,
      registrados: list.filter(c => c.status === ClaimStatus.REGISTRADO).length,
      en_proceso:  list.filter(c => c.status === ClaimStatus.EN_PROCESO).length,
      resueltos:   list.filter(c => c.status === ClaimStatus.RESUELTO).length,
      rechazados:  list.filter(c => c.status === ClaimStatus.RECHAZADO).length,
    };
  });

  // ── GET /claims/receipt/:receiptId ───────────────────────────────
  async getByReceipt(receiptId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<ClaimListResponse>(`${this.baseUrl}/receipt/${receiptId}`)
      );
      this.claims.set(res.data);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cargar reclamos');
    } finally {
      this.loading.set(false);
    }
  }

  // ── GET /claims/:id ──────────────────────────────────────────────
  async getById(id: number): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<ClaimResponseDto>(`${this.baseUrl}/${id}`)
      );
      this.selected.set(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? `Error al cargar reclamo #${id}`);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── POST /claims ─────────────────────────────────────────────────
  async register(payload: RegisterClaimPayload): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<ClaimResponseDto>(this.baseUrl, payload)
      );
      this.claims.update(list => [res, ...list]);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al registrar reclamo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH /claims/:id/attend ─────────────────────────────────────
  async attend(id: number, respuesta: string): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.patch<ClaimResponseDto>(`${this.baseUrl}/${id}/attend`, { respuesta })
      );
      this._updateInList(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al atender reclamo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── PATCH /claims/:id/resolve ────────────────────────────────────
  async resolve(id: number, respuesta: string): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.patch<ClaimResponseDto>(`${this.baseUrl}/${id}/resolve`, { respuesta })
      );
      this._updateInList(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al resolver reclamo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Helpers visuales (equivalentes al ReclamosService mock) ──────
  getStatusLabel(status: ClaimStatus): string {
    switch (status) {
      case ClaimStatus.REGISTRADO: return 'Registrado';
      case ClaimStatus.EN_PROCESO: return 'En Proceso';
      case ClaimStatus.RESUELTO:   return 'Resuelto';
      case ClaimStatus.RECHAZADO:  return 'Rechazado';
      default: return status;
    }
  }

  getStatusSeverity(status: ClaimStatus): 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case ClaimStatus.REGISTRADO: return 'info';
      case ClaimStatus.EN_PROCESO: return 'warn';
      case ClaimStatus.RESUELTO:   return 'success';
      case ClaimStatus.RECHAZADO:  return 'danger';
      default: return 'info';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  }

  calcularDiasDesdeRegistro(iso: string): number {
    return Math.ceil(
      (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // ── Privado ───────────────────────────────────────────────────────
  private _updateInList(updated: ClaimResponseDto): void {
    this.claims.update(list =>
      list.map(c => c.claimId === updated.claimId ? updated : c)
    );
    if (this.selected()?.claimId === updated.claimId) {
      this.selected.set(updated);
    }
  }
}
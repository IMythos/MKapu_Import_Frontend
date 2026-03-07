import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { AuthService } from '../../auth/services/auth.service'; 

export enum ClaimStatus {
  REGISTRADO = 'REGISTRADO',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTO   = 'RESUELTO',
  RECHAZADO  = 'RECHAZADO',
}

export interface ClaimResponseDto {
  id: string;
  saleReceiptId: string;
  customerId: string;
  reason: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt?: string;
  customerName: string;
  productDescription:string;
  registerDate: Date
}

export interface ClaimListResponse {
  data: ClaimResponseDto[];
  total: number;
}

export interface RegisterClaimPayload {
  id_comprobante: number;
  id_vendedor_ref: string;
  motivo: string;
  descripcion: string; 
  detalles?: ClaimDetailDto[];
}
export interface ClaimDetailDto {
  tipo: string;
  descripcion: string;
}
export interface ChangeClaimStatusDto {
  status: ClaimStatus;
}

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales/claims`;
  private readonly DIAS_GARANTIA = 60;
  readonly claims   = signal<ClaimResponseDto[]>([]);
  readonly selected = signal<ClaimResponseDto | null>(null);
  readonly loading  = signal<boolean>(false);
  readonly error    = signal<string | null>(null);
  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'x-role': 'Administrador' }); 
  }
  readonly stats = computed(() => {
    const list = this.claims();
    return {
      total:       list.length,
      registrados: list.filter(c => c.status === ClaimStatus.REGISTRADO).length,
      en_proceso:  list.filter(c => c.status === ClaimStatus.EN_PROCESO).length,
      resueltos:   list.filter(c => c.status === ClaimStatus.RESUELTO).length,
      rechazados:  list.filter(c => c.status === ClaimStatus.RECHAZADO).length,
    };
  });

  calcularDiasRestantes(fechaEmision: Date | string): number {
    const diasTranscurridos = this.calcularDiasTranscurridos(fechaEmision);
    const restantes = this.DIAS_GARANTIA - diasTranscurridos;
    return restantes > 0 ? restantes : 0;
  }

  validarGarantia(fechaEmision: Date | string): boolean {
    const diasTranscurridos = this.calcularDiasTranscurridos(fechaEmision);
    return diasTranscurridos <= this.DIAS_GARANTIA;
  }

  private calcularDiasTranscurridos(fecha: Date | string): number {
    const inicio = new Date(fecha).getTime();
    const hoy = new Date().getTime();
    const diff = hoy - inicio;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async loadClaims(sedeId: string, filters: any = {}): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      let params = new HttpParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
      const url = `${this.baseUrl}/sede/${sedeId}`;
      const res = await firstValueFrom(
        this.http.get<ClaimListResponse | ClaimResponseDto[]>(url, { params })
      );
      const claimsData = (res as ClaimListResponse).data || (res as ClaimResponseDto[]);
      this.claims.set(claimsData);
    } catch (err: any) {
      console.error('Error fetching claims:', err);
      this.error.set(err?.error?.message ?? 'Error al cargar los reclamos de la sede');
    } finally {
      this.loading.set(false);
    }
  }

  async getById(id: string): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<ClaimResponseDto>(`${this.baseUrl}/${id}`)
      );
      this.selected.set(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'No se encontró el reclamo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async register(payload: RegisterClaimPayload): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<ClaimResponseDto>(this.baseUrl, payload)
      );
      this.claims.update(list => [res, ...list]);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al registrar el reclamo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async changeStatus(id: string, status: ClaimStatus): Promise<ClaimResponseDto | null> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.patch<ClaimResponseDto>(`${this.baseUrl}/${id}/status`, { status })
      );
      this._updateInList(res);
      return res;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al actualizar el estado');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: ClaimStatus): string {
    const labels: Record<ClaimStatus, string> = {
      [ClaimStatus.REGISTRADO]: 'Registrado',
      [ClaimStatus.EN_PROCESO]: 'En Proceso',
      [ClaimStatus.RESUELTO]:   'Resuelto',
      [ClaimStatus.RECHAZADO]:  'Rechazado',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: ClaimStatus): 'info' | 'warn' | 'success' | 'danger' {
    const severities: Record<ClaimStatus, 'info' | 'warn' | 'success' | 'danger'> = {
      [ClaimStatus.REGISTRADO]: 'info',
      [ClaimStatus.EN_PROCESO]: 'warn',
      [ClaimStatus.RESUELTO]:   'success',
      [ClaimStatus.RECHAZADO]:  'danger',
    };
    return severities[status] || 'info';
  }

  formatDate(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  calcularDiasDesdeRegistro(iso: string): number {
    const diff = Date.now() - new Date(iso).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private _updateInList(updated: ClaimResponseDto): void {
    this.claims.update(list => list.map(c => c.id === updated.id ? updated : c));
    if (this.selected()?.id === updated.id) this.selected.set(updated);
  }
  getReclamoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  atenderReclamo(id: number, respuesta: string): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/${id}/attend`, 
      { respuesta: respuesta },
      { headers: this.headers }
    );
  }

  resolverReclamo(id: number, respuesta: string): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/${id}/resolve`, 
      { respuesta: respuesta },
      { headers: this.headers }
    );
  }
}

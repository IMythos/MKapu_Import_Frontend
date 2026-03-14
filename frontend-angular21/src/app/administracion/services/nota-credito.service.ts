import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

// ============================================================================
// ── INTERFACES BASADAS EN LOS DTOs DEL BACKEND ─────────────────────────────
// ============================================================================

/**
 * Equivalente a ListCreditNoteFilterDto
 */
export interface CreditNoteFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  customerDocument?: string;
  serie?: string;
  status?: string; // EMITIDA, ACEPTADA, OBSERVADA, RECHAZADA, REVERTIDA
}

/**
 * Equivalente a CreditNoteSummaryDto
 */
export interface CreditNoteSummary {
  noteSummaryId: number;
  correlative: string;       // Ej: FN01-0001
  customerName: string;
  customerDocument: string;
  currency: string;
  totalAmount: number;
  emissionDate: Date | string;
  status: string;
}

/**
 * Equivalente a CreditNoteListResponseDto
 */
export interface CreditNoteListResponse {
  data: CreditNoteSummary[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Equivalente a CreditNoteDetailItemDto
 */
export interface CreditNoteItem {
  itemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  igv: number;
  total: number;
}

/**
 * Equivalente a CreditNoteDetailDto
 */
export interface CreditNoteDetail {
  noteDetailId: number;
  correlative: string;
  serieRef: string;
  numberDocRef: string;
  issueDate: Date | string;
  customerName: string;
  customerDocument: string;
  businessType: string; // Tipo de Nota de Crédito (Catálogo 09 SUNAT)
  currency: string;
  saleValue: number;
  igv: number;
  isc: number;
  totalAmount: number;
  status: string;
  items: CreditNoteItem[];
}

/**
 * Equivalente a RegisterCreditNoteItemDto
 */
export interface RegisterCreditNoteItemDto {
  salesReceiptItemId: number; // ID del ítem en la venta original
  quantity: number;           // Cantidad a devolver
}

/**
 * Equivalente a RegisterCreditNoteDto
 */
export interface RegisterCreditNoteDto {
  salesReceiptId: number;     // ID de la venta/comprobante a afectar
  reasonCode: string;         // Código SUNAT (Ej: "01", "07", etc.)
  reasonDescription: string;  // Sustento de la emisión
  items: RegisterCreditNoteItemDto[];
}

/**
 * Equivalente a AnnulCreditNoteDto
 */
export interface AnnulCreditNoteDto {
  reason: string;
}


// ============================================================================
// ── SERVICIO ANGULAR ────────────────────────────────────────────────────────
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class CreditNoteService {
  private readonly http = inject(HttpClient);

  // Asumiendo que tu gateway apunta aquí según la arquitectura mostrada
  private readonly apiUrl = `${environment.apiUrl}/sales/credit-note`;

  /**
   * Obtiene el listado de Notas de Crédito paginado y filtrado.
   * [GET] /sales/credit-note
   */
  listar(filtros: CreditNoteFilter): Observable<CreditNoteListResponse> {
    let params = new HttpParams();

    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.startDate) params = params.set('startDate', filtros.startDate);
    if (filtros.endDate) params = params.set('endDate', filtros.endDate);
    if (filtros.customerDocument) params = params.set('customerDocument', filtros.customerDocument);
    if (filtros.serie) params = params.set('serie', filtros.serie);
    if (filtros.status) params = params.set('status', filtros.status);

    return this.http.get<CreditNoteListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene el detalle completo de una Nota de Crédito.
   * [GET] /sales/credit-note/:id
   */
  detalle(id: number): Observable<CreditNoteDetail> {
    return this.http.get<CreditNoteDetail>(`${this.apiUrl}/${id}`);
  }

  /**
   * Registra y emite una nueva Nota de Crédito hacia SUNAT.
   * [POST] /sales/credit-note
   */
  registrar(payload: RegisterCreditNoteDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  /**
   * Anula una Nota de Crédito existente (comunicando la baja a SUNAT).
   * [POST] /sales/credit-note/:id/annul
   */
  anular(id: number, payload: AnnulCreditNoteDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/annul`, payload);
  }

  // Nota: Si en el futuro añades exportación a Excel directa desde el back:
  /*
  exportarExcel(filtros: CreditNoteFilter): Observable<Blob> {
     let params = new HttpParams();
     // ... seteo de parámetros
     return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }
  */
}

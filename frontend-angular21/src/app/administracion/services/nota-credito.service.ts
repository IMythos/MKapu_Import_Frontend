import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export interface CreditNoteFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  customerDocument?: string;
  serie?: string;
  status?: string;
}

export interface CreditNoteSummary {
  noteSummaryId: number;
  correlative: string;
  customerName: string;
  customerDocument: string;
  currency: string;
  totalAmount: number;
  emissionDate: Date | string;
  status: string;
}

export interface CreditNoteListResponse {
  data: CreditNoteSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CreditNoteItem {
  itemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  igv: number;
  total: number;
}

export interface CreditNoteDetail {
  noteDetailId: number;
  correlative: string;
  serieRef: string;
  numberDocRef: string;
  issueDate: Date | string;
  customerName: string;
  customerDocument: string;
  businessType: string;
  currency: string;
  saleValue: number;
  igv: number;
  isc: number;
  totalAmount: number;
  status: string;
  items: CreditNoteItem[];
}

export interface RegisterCreditNoteItemDto {
  itemId: number; 
  quantity: number;
}
export interface RegisterCreditNoteDto {
  salesReceiptId: number;
  reasonCode: string;
  reasonDescription: string;
  items: RegisterCreditNoteItemDto[];
}

export interface AnnulCreditNoteDto {
  reason: string;
}
@Injectable({
  providedIn: 'root'
})
export class CreditNoteService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/sales/credit-note`;

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

  detalle(id: number): Observable<CreditNoteDetail> {
    return this.http.get<CreditNoteDetail>(`${this.apiUrl}/${id}`);
  }

  registrar(payload: RegisterCreditNoteDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  anular(id: number, payload: AnnulCreditNoteDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/annul`, payload);
  }

  exportarExcel(filtros: CreditNoteFilter): Observable<Blob> {
     let params = new HttpParams();
     return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }
}

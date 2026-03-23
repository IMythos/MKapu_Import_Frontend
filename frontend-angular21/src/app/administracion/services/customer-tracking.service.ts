import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { Customer } from './cliente.service';

export interface CustomerTrackingFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomerTrackingSale {
  nroComprobante: string;
  fecha: Date;
  total: number;
  estado: string;
}

export interface CustomerTrackingQuote {
  codigo: string;
  fecha: Date;
  total: number;
  estado: string;
}

interface CustomerSalesResponse {
  ventas: Array<{
    nroComprobante: string;
    fecha: string | Date;
    total: number;
    estado: string;
  }>;
  totalVentas: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CustomerQuotesResponse {
  cotizaciones: Array<{
    codigo: string;
    fecha: string | Date;
    total: number;
    estado: string;
  }>;
  totalCotizaciones: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerTrackingData {
  customer: Customer;
  sales: CustomerTrackingSale[];
  quotes: CustomerTrackingQuote[];
}

@Injectable({ providedIn: 'root' })
export class CustomerTrackingService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/sales/customers`;

  getTracking(
    customerId: string,
    filters: CustomerTrackingFilters = {},
    role = 'Administrador',
  ): Observable<CustomerTrackingData> {
    return forkJoin({
      customer: this.getCustomerById(customerId, role),
      sales: this.getAllSales(customerId, filters, role),
      quotes: this.getAllQuotes(customerId, filters, role),
    });
  }

  private getCustomerById(id: string, role: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.api}/${id}`, {
      headers: this.buildHeaders(role),
    });
  }

  private getAllSales(
    customerId: string,
    filters: CustomerTrackingFilters,
    role: string,
  ): Observable<CustomerTrackingSale[]> {
    return this.fetchSalesPage(customerId, filters, 1, 100, role).pipe(
      switchMap((firstPage) => {
        const firstItems = this.mapSales(firstPage.ventas ?? []);
        const totalPages = Math.max(firstPage.totalPages ?? 1, 1);

        if (totalPages === 1) {
          return of(firstItems);
        }

        const requests = Array.from({ length: totalPages - 1 }, (_, index) =>
          this.fetchSalesPage(customerId, filters, index + 2, 100, role),
        );

        return forkJoin(requests).pipe(
          map((responses) => {
            const remaining = responses.flatMap((response) =>
              this.mapSales(response.ventas ?? []),
            );
            return [...firstItems, ...remaining];
          }),
        );
      }),
      map((items) =>
        [...items].sort(
          (left, right) => right.fecha.getTime() - left.fecha.getTime(),
        ),
      ),
    );
  }

  private getAllQuotes(
    customerId: string,
    filters: CustomerTrackingFilters,
    role: string,
  ): Observable<CustomerTrackingQuote[]> {
    return this.fetchQuotesPage(customerId, filters, 1, 100, role).pipe(
      switchMap((firstPage) => {
        const firstItems = this.mapQuotes(firstPage.cotizaciones ?? []);
        const totalPages = Math.max(firstPage.totalPages ?? 1, 1);

        if (totalPages === 1) {
          return of(firstItems);
        }

        const requests = Array.from({ length: totalPages - 1 }, (_, index) =>
          this.fetchQuotesPage(customerId, filters, index + 2, 100, role),
        );

        return forkJoin(requests).pipe(
          map((responses) => {
            const remaining = responses.flatMap((response) =>
              this.mapQuotes(response.cotizaciones ?? []),
            );
            return [...firstItems, ...remaining];
          }),
        );
      }),
      map((items) =>
        [...items].sort(
          (left, right) => right.fecha.getTime() - left.fecha.getTime(),
        ),
      ),
    );
  }

  private fetchSalesPage(
    customerId: string,
    filters: CustomerTrackingFilters,
    page: number,
    limit: number,
    role: string,
  ): Observable<CustomerSalesResponse> {
    return this.http.get<CustomerSalesResponse>(`${this.api}/${customerId}/sales`, {
      headers: this.buildHeaders(role),
      params: this.buildParams(filters, page, limit),
    });
  }

  private fetchQuotesPage(
    customerId: string,
    filters: CustomerTrackingFilters,
    page: number,
    limit: number,
    role: string,
  ): Observable<CustomerQuotesResponse> {
    return this.http.get<CustomerQuotesResponse>(`${this.api}/${customerId}/quotes`, {
      headers: this.buildHeaders(role),
      params: this.buildParams(filters, page, limit),
    });
  }

  private mapSales(
    items: CustomerSalesResponse['ventas'],
  ): CustomerTrackingSale[] {
    return items.map((item) => ({
      nroComprobante: item.nroComprobante,
      fecha: new Date(item.fecha),
      total: Number(item.total),
      estado: item.estado,
    }));
  }

  private mapQuotes(
    items: CustomerQuotesResponse['cotizaciones'],
  ): CustomerTrackingQuote[] {
    return items.map((item) => ({
      codigo: item.codigo,
      fecha: new Date(item.fecha),
      total: Number(item.total),
      estado: item.estado,
    }));
  }

  private buildParams(
    filters: CustomerTrackingFilters,
    page: number,
    limit: number,
  ): HttpParams {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }

    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    return params;
  }

  private buildHeaders(role: string): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }
}

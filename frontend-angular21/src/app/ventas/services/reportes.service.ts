import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetSalesReportFilters, SalesReportRow } from '../interfaces/reportes.interface';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ReportesVentasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`; 

  getSalesDashboard(filters: GetSalesReportFilters): Observable<SalesReportRow[]> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.sedeId) {
      params = params.set('sedeId', filters.sedeId.toString());
    }
    if (filters.vendedorId) {
      params = params.set('vendedorId', filters.vendedorId.toString());
    }

    return this.http.get<SalesReportRow[]>(`${this.apiUrl}/sales-dashboard`, { params });
  }
}

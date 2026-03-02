import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/sales/reports`;

  private buildParams(periodo: string, idSede?: string | null): HttpParams {
    let params = new HttpParams().set('periodo', periodo);
    if (idSede && idSede !== '' && idSede !== 'null') {
      params = params.set('id_sede', idSede);
    }
    return params;
  }

  getKpis(periodo: string = 'anio', idSede?: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/kpis`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getSalesChart(periodo: string = 'anio', idSede?: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/sales-chart`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getTopProducts(periodo: string = 'anio', idSede?: string | null): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/top-products`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getTopSellers(periodo: string = 'anio', idSede?: string | null): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/top-sellers`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getPaymentMethods(periodo: string = 'anio', idSede?: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/payment-methods`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getSalesByDistrict(periodo: string = 'anio', idSede?: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/sales-by-district`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getSalesByCategory(periodo: string = 'anio', idSede?: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/sales-by-category`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getSalesByHeadquarter(periodo: string = 'anio', idSede?: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/sales-by-headquarter`, {
      params: this.buildParams(periodo, idSede),
    });
  }

  getRecentSales(periodo: string = 'anio', idSede?: string | null): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/recent-sales`, {
      params: this.buildParams(periodo, idSede),
    });
  }
}

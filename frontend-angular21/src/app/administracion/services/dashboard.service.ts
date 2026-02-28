import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/sales/reports`;

  private buildParams(periodo: string, idSede?: string): HttpParams {
    let params = new HttpParams().set('periodo', periodo);
    if (idSede) {
      params = params.set('id_sede', idSede);
    }
    return params;
  }

  // Coincide con @Get('dashboard/kpis')
  getKpis(periodo: string = 'anio', idSede?: string): Observable<any> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get(`${this.apiUrl}/dashboard/kpis`, { params });
  }

  // Coincide con @Get('dashboard/sales-chart')
  getSalesChart(periodo: string = 'anio', idSede?: string): Observable<any> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get(`${this.apiUrl}/dashboard/sales-chart`, { params });
  }

  // Coincide con @Get('dashboard/top-products')
  getTopProducts(periodo: string = 'anio', idSede?: string): Observable<any[]> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/top-products`, { params });
  }

  // Coincide con @Get('dashboard/top-sellers')
  getTopSellers(periodo: string = 'anio', idSede?: string): Observable<any[]> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/top-sellers`, { params });
  }

  // Coincide con @Get('dashboard/payment-methods')
  getPaymentMethods(periodo: string = 'anio', idSede?: string): Observable<any> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get(`${this.apiUrl}/dashboard/payment-methods`, { params });
  }

  // Coincide con @Get('dashboard/sales-by-district')
  getSalesByDistrict(periodo: string = 'anio', idSede?: string): Observable<any> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get(`${this.apiUrl}/dashboard/sales-by-district`, { params });
  }

  // Coincide con @Get('dashboard/sales-by-category')
  getSalesByCategory(periodo: string = 'anio', idSede?: string): Observable<any> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get(`${this.apiUrl}/dashboard/sales-by-category`, { params });
  }

  // Coincide con @Get('dashboard/sales-by-headquarter')
  getSalesByHeadquarter(periodo: string = 'anio', idSede?: string): Observable<any> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get(`${this.apiUrl}/dashboard/sales-by-headquarter`, { params });
  }

  // Coincide con @Get('sales-dashboard')
  // Nota: Si usas la tabla de "Actividad Reciente" o "Ventas Recientes", debes llamar a este método
  getRecentSales(periodo: string = 'anio', idSede?: string): Observable<any[]> {
    const params = this.buildParams(periodo, idSede);
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/recent-sales`, { params });
  }
}

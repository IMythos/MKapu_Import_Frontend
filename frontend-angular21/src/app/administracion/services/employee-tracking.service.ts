import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export interface EmployeeTrackingFilters {
  dateFrom?: string;
  dateTo?: string;
}

interface UserWithAccountResponse {
  usuario: {
    id_usuario: number;
    usu_nom: string;
    ape_pat: string;
    ape_mat: string;
    dni: string;
    activo: boolean;
    sedeNombre?: string;
    rolNombre?: string;
  };
  cuenta_usuario: {
    rolNombre?: string;
  } | null;
}

interface EmployeeSalesPageResponse {
  ventas: EmployeeSaleResponse[];
  totalVentas: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface EmployeeSaleResponse {
  nroComprobante: string;
  cliente: string;
  fecha: string;
  total: number;
  estado: string;
}

export interface EmployeeTrackedSale {
  nroComprobante: string;
  cliente: string;
  fecha: Date;
  total: number;
  estado: string;
}

export interface EmployeeTrackingEmployee {
  nombre: string;
  apellidos: string;
  dni: string;
  rol: string;
  sede: string;
  activo: boolean;
}

export interface EmployeeMonthlySales {
  label: string;
  total: number;
}

export interface EmployeeTrackingData {
  employee: EmployeeTrackingEmployee;
  sales: EmployeeTrackedSale[];
  totalSales: number;
  salesAmount: number;
  monthlySales: EmployeeMonthlySales[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeTrackingService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiUrl}/admin/users`;
  private readonly aggregationLimit = 100;

  getEmployeeTracking(
    userId: number,
    filters: EmployeeTrackingFilters,
  ): Observable<EmployeeTrackingData> {
    return forkJoin({
      user: this.getUserWithAccount(userId),
      firstPage: this.getUserSales(userId, filters, 1),
    }).pipe(
      switchMap(({ user, firstPage }) =>
        this.getRemainingSalesPages(userId, filters, firstPage.totalPages).pipe(
          map((remainingPages) =>
            this.buildTrackingData(user, firstPage, remainingPages),
          ),
        ),
      ),
    );
  }

  private getUserWithAccount(userId: number): Observable<UserWithAccountResponse> {
    return this.http.get<UserWithAccountResponse>(`${this.usersUrl}/${userId}/full`);
  }

  private getUserSales(
    userId: number,
    filters: EmployeeTrackingFilters,
    page: number,
  ): Observable<EmployeeSalesPageResponse> {
    return this.http.get<EmployeeSalesPageResponse>(`${this.usersUrl}/${userId}/sales`, {
      params: this.buildSalesParams(filters, page),
    });
  }

  private buildSalesParams(
    filters: EmployeeTrackingFilters,
    page: number,
  ): HttpParams {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(this.aggregationLimit));

    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }

    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    return params;
  }

  private getRemainingSalesPages(
    userId: number,
    filters: EmployeeTrackingFilters,
    totalPages: number,
  ): Observable<EmployeeSalesPageResponse[]> {
    if (totalPages <= 1) {
      return of([]);
    }

    const requests = Array.from({ length: totalPages - 1 }, (_, index) =>
      this.getUserSales(userId, filters, index + 2),
    );

    return forkJoin(requests);
  }

  private buildTrackingData(
    userResponse: UserWithAccountResponse,
    firstPage: EmployeeSalesPageResponse,
    remainingPages: EmployeeSalesPageResponse[],
  ): EmployeeTrackingData {
    const sales = [firstPage, ...remainingPages]
      .flatMap((page) => page.ventas)
      .map((sale) => this.mapSale(sale));

    const salesAmount = sales.reduce((sum, sale) => sum + sale.total, 0);

    return {
      employee: this.mapEmployee(userResponse),
      sales,
      totalSales: firstPage.totalVentas,
      salesAmount,
      monthlySales: this.buildMonthlySales(sales),
    };
  }

  private mapEmployee(
    response: UserWithAccountResponse,
  ): EmployeeTrackingEmployee {
    const { usuario, cuenta_usuario } = response;

    return {
      nombre: usuario.usu_nom ?? '',
      apellidos: `${usuario.ape_pat ?? ''} ${usuario.ape_mat ?? ''}`.trim(),
      dni: usuario.dni ?? '-',
      rol: cuenta_usuario?.rolNombre ?? usuario.rolNombre ?? 'SIN ROL',
      sede: usuario.sedeNombre ?? 'SIN SEDE',
      activo: Boolean(usuario.activo),
    };
  }

  private mapSale(sale: EmployeeSaleResponse): EmployeeTrackedSale {
    return {
      nroComprobante: sale.nroComprobante,
      cliente: sale.cliente,
      fecha: new Date(sale.fecha),
      total: Number(sale.total ?? 0),
      estado: sale.estado,
    };
  }

  private buildMonthlySales(
    sales: EmployeeTrackedSale[],
  ): EmployeeMonthlySales[] {
    const buckets = new Map<string, { date: Date; total: number }>();

    for (const sale of sales) {
      const bucketDate = new Date(sale.fecha.getFullYear(), sale.fecha.getMonth(), 1);
      const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`;
      const current = buckets.get(key) ?? { date: bucketDate, total: 0 };
      current.total += sale.total;
      buckets.set(key, current);
    }

    return [...buckets.entries()]
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([, value]) => ({
        label: this.formatMonthLabel(value.date),
        total: value.total,
      }));
  }

  private formatMonthLabel(date: Date): string {
    const label = date
      .toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
      .replace('.', '');

    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}

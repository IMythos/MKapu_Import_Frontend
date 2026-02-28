// src/app/administracion/services/proveedor.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map, retry } from 'rxjs/operators';

import { environment } from '../../../enviroments/enviroment';

import { 
  SupplierResponse, 
  SupplierListResponse, 
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ChangeSupplierStatusRequest 
} from '../interfaces/supplier.interface';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/logistics/suppliers`;
  
  private suppliersCache = signal<SupplierResponse[]>([]);
  private lastUpdate = signal<Date | null>(null);
  
  public readonly suppliers = this.suppliersCache.asReadonly();
  public readonly lastUpdateTime = this.lastUpdate.asReadonly();

  constructor() {}

  listSuppliers(filters?: { estado?: boolean; search?: string }): Observable<SupplierListResponse> {
    let params = new HttpParams();
    
    if (filters?.estado !== undefined) {
      params = params.set('estado', filters.estado.toString());
    }
    
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<SupplierListResponse>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.suppliersCache.set(response.suppliers);
        this.lastUpdate.set(new Date());
      }),
      retry(2),
      catchError(this.handleError)
    );
  }

  getSupplierById(id: number): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response === null) {
          throw new Error('Proveedor no encontrado');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  createSupplier(supplier: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.apiUrl, supplier).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  updateSupplier(id: number, supplier: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.apiUrl}/${id}`, supplier).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  changeSupplierStatus(id: number, estado: boolean): Observable<SupplierResponse> {
    const body: ChangeSupplierStatusRequest = { estado };
    return this.http.put<SupplierResponse>(
      `${this.apiUrl}/${id}/status`, 
      body
    ).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  deleteSupplier(id: number): Observable<{ id_proveedor: number; message: string; deletedAt: string }> {
    return this.http.delete<{ id_proveedor: number; message: string; deletedAt: string }>(
      `${this.apiUrl}/${id}`
    ).pipe(
      tap(() => this.invalidateCache()),
      catchError(this.handleError)
    );
  }

  private invalidateCache(): void {
    this.suppliersCache.set([]);
    this.lastUpdate.set(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error en el servidor';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Datos inválidos';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Error en ProveedorService:', error);
    return throwError(() => new Error(errorMessage));
  }
}

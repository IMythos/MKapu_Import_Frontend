import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { CreateRemissionDto } from '../interfaces/remision.interface';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RemissionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logistics/remission`;
  create(dto: CreateRemissionDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  findById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  annul(id: string, motivo: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/annul`, { motivo });
  }

  findSaleForRemission(correlativo: string): Observable<any> {
    // Asumiendo que el backend tiene un endpoint para validar la venta antes de remitir
    return this.http.get<any>(`${this.apiUrl}/sale/${correlativo}`);
  }
}

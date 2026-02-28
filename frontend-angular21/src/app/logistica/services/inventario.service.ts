import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import { ManualAdjustmentDto } from '../interfaces/ajuste-inventario.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/logistics`;

  realizarAjusteManual(dto: ManualAdjustmentDto) {
    return this.http.post(`${this.apiUrl}/inventory-movements/adjustment`, dto);
  }
  realizarAjusteManualMasivo(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/inventory-movements/adjustment/bulk`, data);
  }
}

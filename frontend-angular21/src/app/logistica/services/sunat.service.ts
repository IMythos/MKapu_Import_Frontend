import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class SunatService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/consultas`; 

  consultarRuc(ruc: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/ruc/${ruc}`);
  }
}

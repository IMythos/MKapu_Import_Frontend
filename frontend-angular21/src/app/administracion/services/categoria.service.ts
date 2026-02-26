import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaResponse } from '../interfaces/categoria.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}
    getCategorias(activo?: boolean, search?: string): Observable<CategoriaResponse> {
    let params = new HttpParams();

    if (activo !== undefined) {
      params = params.set('activo', activo);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<CategoriaResponse>(
      `${this.api}/logistics/categories`,
      { params }
    );
  }
}

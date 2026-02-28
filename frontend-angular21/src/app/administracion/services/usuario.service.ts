import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import {
  CuentaUsuarioRequest,
  CuentaUsuarioResponse,
  UsuarioInterfaceResponse,
  UsuarioRequest,
  UsuarioResponse,
  UsuarioStatusUpdateRequest,
  UsuarioUpdateRequest
} from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Para AdministracionCrearUsuario (paginado)
  getUsuarios(page: number = 1, pageSize: number = 20): Observable<UsuarioResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<UsuarioResponse>(`${this.api}/admin/users`, { params });
  }

  // Para Administracion (todos de una vez)
  getAllUsuarios(): Observable<UsuarioInterfaceResponse[]> {
    return this.http.get<UsuarioInterfaceResponse[]>(`${this.api}/admin/users/all`);
  }

  getUsuariosPorEstado(activo: boolean): Observable<UsuarioResponse> {
    const params = new HttpParams().set('activo', String(activo));
    return this.http.get<UsuarioResponse>(`${this.api}/admin/users`, { params });
  }

  getUsuarioById(id: number): Observable<UsuarioInterfaceResponse> {
    return this.http.get<UsuarioInterfaceResponse>(`${this.api}/admin/users/${id}`);
  }

  postUsuarios(body: UsuarioRequest): Observable<UsuarioResponse> {
    const headers = new HttpHeaders({ 'x-role': 'Administrador' });
    return this.http.post<UsuarioResponse>(`${this.api}/admin/users`, body, { headers });
  }

  postCuentaUsuario(body: CuentaUsuarioRequest): Observable<CuentaUsuarioResponse> {
    return this.http.post<CuentaUsuarioResponse>(`${this.api}/auth/create-account`, body);
  }

  updateUsuarioStatus(id: number, body: UsuarioStatusUpdateRequest): Observable<UsuarioInterfaceResponse> {
    return this.http.put<UsuarioInterfaceResponse>(`${this.api}/admin/users/${id}/status`, body);
  }

  updateUsuario(id: number, body: UsuarioUpdateRequest): Observable<UsuarioInterfaceResponse> {
    return this.http.put<UsuarioInterfaceResponse>(`${this.api}/admin/users/${id}`, body);
  }
}
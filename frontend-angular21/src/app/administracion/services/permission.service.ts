import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders }      from '@angular/common/http';
import { Observable, throwError }       from 'rxjs';
import { tap, catchError, finalize }    from 'rxjs/operators';
import { environment }                  from '../../../enviroments/enviroment';
import {
  Permission,
  RegisterPermissionRequest,
  UpdatePermissionRequest,
} from '../interfaces/role-permission.interface';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly api     = `${environment.apiUrl}/admin/permissions`;

  private readonly _permissions = signal<Permission[]>([]);
  private readonly _loading     = signal(false);
  private readonly _error       = signal<string | null>(null);

  readonly permissions = computed(() => this._permissions());
  readonly loading     = computed(() => this._loading());
  readonly error       = computed(() => this._error());

  constructor(private readonly http: HttpClient) {}

  private headers(role = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

    loadPermissions(role = 'Administrador'): Observable<Permission[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<any>(`${this.api}`, { headers: this.headers(role) }).pipe(
        tap(res => {
        const list: Permission[] = Array.isArray(res) ? res : (res.data ?? res.items ?? []);
        this._permissions.set(list);
        }),
        catchError(err => {
        this._error.set('No se pudo cargar los permisos.');
        return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
    );
    }

  getPermissionById(id: number, role = 'Administrador'): Observable<Permission> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<Permission>(`${this.api}/${id}`, { headers: this.headers(role) }).pipe(
      catchError(err => {
        this._error.set('No se pudo cargar el permiso.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  createPermission(payload: RegisterPermissionRequest, role = 'Administrador'): Observable<Permission> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post<Permission>(this.api, payload, { headers: this.headers(role) }).pipe(
      tap(created => this._permissions.set([created, ...this._permissions()])),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo crear el permiso.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  updatePermission(id: number, payload: UpdatePermissionRequest, role = 'Administrador'): Observable<Permission> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.put<Permission>(`${this.api}/${id}`, payload, { headers: this.headers(role) }).pipe(
      tap(updated => this._patchCached(id, updated)),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo actualizar el permiso.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  changeStatus(id: number, activo: boolean, role = 'Administrador'): Observable<Permission> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.put<Permission>(
      `${this.api}/${id}/status`, { activo }, { headers: this.headers(role) },
    ).pipe(
      tap(updated => this._patchCached(id, updated)),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo cambiar el estado.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  deletePermission(id: number, role = 'Administrador'): Observable<any> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.delete(`${this.api}/${id}`, { headers: this.headers(role) }).pipe(
      tap(() => this._permissions.set(this._permissions().filter(p => p.id_permiso !== id))),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo eliminar el permiso.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private _patchCached(id: number, updated: Permission): void {
    this._permissions.set(this._permissions().map(p => p.id_permiso === id ? updated : p));
  }
}
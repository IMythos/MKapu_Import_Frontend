import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders }      from '@angular/common/http';
import { Observable, throwError }       from 'rxjs';
import { tap, catchError, finalize }    from 'rxjs/operators';
import { environment }                  from '../../../enviroments/enviroment';
import { Role, RegisterRoleRequest, UpdateRoleRequest } from '../interfaces/role-permission.interface';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly api     = `${environment.apiUrl}/admin/roles`;

  private readonly _roles   = signal<Role[]>([]);
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly roles   = computed(() => this._roles());
  readonly loading = computed(() => this._loading());
  readonly error   = computed(() => this._error());

  constructor(private readonly http: HttpClient) {}

  private headers(role = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

    loadRoles(role = 'Administrador'): Observable<Role[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<any>(this.api, { headers: this.headers(role) }).pipe(
        tap(res => {
        const list: Role[] = Array.isArray(res) ? res : (res.data ?? res.items ?? []);
        this._roles.set(list);
        }),
        catchError(err => {
        this._error.set('No se pudo cargar los roles.');
        return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
    );
    }



  getRoleById(id: number, role = 'Administrador'): Observable<Role> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.get<Role>(`${this.api}/${id}`, { headers: this.headers(role) }).pipe(
      catchError(err => {
        this._error.set('No se pudo cargar el rol.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  createRole(payload: RegisterRoleRequest, role = 'Administrador'): Observable<Role> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post<Role>(this.api, payload, { headers: this.headers(role) }).pipe(
      tap(created => this._roles.set([created, ...this._roles()])),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo crear el rol.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  updateRole(id: number, payload: UpdateRoleRequest, role = 'Administrador'): Observable<Role> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.put<Role>(`${this.api}/${id}`, payload, { headers: this.headers(role) }).pipe(
      tap(updated => this._patchCached(id, updated)),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo actualizar el rol.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  changeStatus(id: number, activo: boolean, role = 'Administrador'): Observable<Role> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.put<Role>(
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

  deleteRole(id: number, role = 'Administrador'): Observable<any> {
    this._loading.set(true);
    this._error.set(null);
    return this.http.delete(`${this.api}/${id}`, { headers: this.headers(role) }).pipe(
      tap(() => this._roles.set(this._roles().filter(r => r.id_rol !== id))),
      catchError(err => {
        this._error.set(err?.error?.message ?? 'No se pudo eliminar el rol.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private _patchCached(id: number, updated: Role): void {
    this._roles.set(this._roles().map(r => r.id_rol === id ? updated : r));
  }
}
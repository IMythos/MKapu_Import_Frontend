import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError, firstValueFrom } from 'rxjs';

import {
  RoleWithPermissionsResponseDto,
  RolePermissionResponseDto,
  RolePermissionDeletedResponseDto,
} from '../interfaces/role-permission.interface';

export interface AssignPermissionsRequest {
  roleId:        number;
  permissionIds: number[];
}

export interface SyncPermissionsRequest {
  roleId:        number;
  permissionIds: number[];
}

export interface RemovePermissionRequest {
  roleId:       number;
  permissionId: number;
}

@Injectable({ providedIn: 'root' })
export class RolePermissionService {
  private readonly api      = environment.apiUrl;
  private readonly baseUrl  = `${this.api}/admin/role-permissions`;

  // ── Signals privados ──────────────────────────────────────────────
  private readonly _rolesWithPermissions = signal<RoleWithPermissionsResponseDto[]>([]);
  private readonly _selectedRole         = signal<RoleWithPermissionsResponseDto | null>(null);
  private readonly _loading              = signal(false);
  private readonly _error                = signal<string | null>(null);

  // ── Signals públicos (computed) ───────────────────────────────────
  readonly rolesWithPermissions = computed(() => this._rolesWithPermissions());
  readonly selectedRole         = computed(() => this._selectedRole());
  readonly total                = computed(() => this._rolesWithPermissions().length);
  readonly loading              = computed(() => this._loading());
  readonly error                = computed(() => this._error());

  constructor(private readonly http: HttpClient) {}

  // ── Headers ───────────────────────────────────────────────────────
  private buildHeaders(role = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

  // ── QUERIES ───────────────────────────────────────────────────────

  /** Carga todos los roles con sus permisos en el signal */
  loadAllRolesWithPermissions(role = 'Administrador'): Observable<RoleWithPermissionsResponseDto[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<RoleWithPermissionsResponseDto[]>(this.baseUrl, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(res => this._rolesWithPermissions.set(res)),
        catchError(err => {
          this._error.set('No se pudo cargar los roles con permisos.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  /** Carga el detalle de un rol con sus permisos en _selectedRole */
  loadPermissionsByRole(roleId: number, role = 'Administrador'): Observable<RoleWithPermissionsResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<RoleWithPermissionsResponseDto>(`${this.baseUrl}/role/${roleId}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(res => {
          this._selectedRole.set(res);
          // Actualizar también en la lista si ya existe
          this._patchCachedRole(roleId, res);
        }),
        catchError(err => {
          this._error.set('No se pudo cargar los permisos del rol.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  /** Roles que tienen un permiso específico */
  getRolesByPermission(permissionId: number, role = 'Administrador'): Observable<RolePermissionResponseDto[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<RolePermissionResponseDto[]>(`${this.baseUrl}/permission/${permissionId}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError(err => {
          this._error.set('No se pudo cargar los roles del permiso.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── COMMANDS ──────────────────────────────────────────────────────

  /** Asigna permisos a un rol (agrega sin borrar los existentes) */
  assignPermissions(
    payload: AssignPermissionsRequest,
    role = 'Administrador',
  ): Observable<RoleWithPermissionsResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<RoleWithPermissionsResponseDto>(`${this.baseUrl}/assign`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(updated => {
          this._selectedRole.set(updated);
          this._patchCachedRole(payload.roleId, updated);
        }),
        catchError(err => {
          this._error.set(err?.error?.message ?? 'No se pudo asignar los permisos.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  /** Sync completo — reemplaza TODOS los permisos del rol */
  syncPermissions(
    payload: SyncPermissionsRequest,
    role = 'Administrador',
  ): Observable<RoleWithPermissionsResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .patch<RoleWithPermissionsResponseDto>(`${this.baseUrl}/sync`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(updated => {
          this._selectedRole.set(updated);
          this._patchCachedRole(payload.roleId, updated);
        }),
        catchError(err => {
          this._error.set(err?.error?.message ?? 'No se pudo sincronizar los permisos.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  /** Quita un permiso específico de un rol */
  removePermission(
    payload: RemovePermissionRequest,
    role = 'Administrador',
  ): Observable<RolePermissionDeletedResponseDto> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<RolePermissionDeletedResponseDto>(`${this.baseUrl}/remove`, {
        headers: this.buildHeaders(role),
        body:    payload,
      })
      .pipe(
        tap(() => {
          // Actualizar signal local sin recargar
          const current = this._selectedRole();
          if (current && current.id_rol === payload.roleId) {
            this._selectedRole.set({
              ...current,
              permisos: current.permisos.filter(p => p.id_permiso !== payload.permissionId),
            });
          }
          this._patchCachedRoleRemovePermission(payload.roleId, payload.permissionId);
        }),
        catchError(err => {
          this._error.set(err?.error?.message ?? 'No se pudo remover el permiso.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Cache helpers ─────────────────────────────────────────────────

  /** Reemplaza el rol en la lista cacheada con los datos actualizados */
  private _patchCachedRole(roleId: number, updated: RoleWithPermissionsResponseDto): void {
    const prev = this._rolesWithPermissions();
    if (!prev.length) return;
    this._rolesWithPermissions.set(
      prev.map(r => r.id_rol === roleId ? updated : r),
    );
  }

  /** Quita un permiso del rol en la lista cacheada */
  private _patchCachedRoleRemovePermission(roleId: number, permissionId: number): void {
    const prev = this._rolesWithPermissions();
    if (!prev.length) return;
    this._rolesWithPermissions.set(
      prev.map(r =>
        r.id_rol === roleId
          ? { ...r, permisos: r.permisos.filter(p => p.id_permiso !== permissionId) }
          : r
      ),
    );
  }

  /** Limpia el rol seleccionado */
  clearSelectedRole(): void {
    this._selectedRole.set(null);
  }
}
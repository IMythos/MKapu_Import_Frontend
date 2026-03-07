// ── Permiso dentro de un rol ───────────────────────────────────────
export interface PermissionInRoleDto {
  id_permiso:  number;
  nombre:      string;
  descripcion: string;
  activo:      boolean;
}

// ── Rol con sus permisos (respuesta principal) ────────────────────
export interface RoleWithPermissionsResponseDto {
  id_rol:      number;
  nombre:      string;
  descripcion: string | null;
  activo:      boolean;
  permisos:    PermissionInRoleDto[];
}

// ── Relación simple rol-permiso (id_rol + id_permiso) ─────────────
export interface RolePermissionResponseDto {
  id_rol:     number;
  id_permiso: number;
}

// ── Respuesta al eliminar un permiso de un rol ────────────────────
export interface RolePermissionDeletedResponseDto {
  roleId:       number;
  permissionId: number;
  message:      string;
  deletedAt:    Date | string;
}

// ── Requests ──────────────────────────────────────────────────────
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


// ── Role simple (para CRUD independiente) ────────────────────────
export interface Role {
  id_rol:      number;
  nombre:      string;
  descripcion: string | null;
  activo:      boolean;
}

export interface RegisterRoleRequest {
  nombre:       string;
  descripcion?: string;
  activo?:      boolean;
}

export interface UpdateRoleRequest {
  nombre?:      string;
  descripcion?: string;
  activo?:      boolean;
}

// ── Permission simple (para CRUD independiente) ───────────────────
export interface Permission {
  id_permiso:  number;
  nombre:      string;
  descripcion: string;
  activo:      boolean;
}

export interface RegisterPermissionRequest {
  nombre:       string;
  descripcion?: string;
  activo?:      boolean;
}

export interface UpdatePermissionRequest {
  nombre?:      string;
  descripcion?: string;
  activo?:      boolean;
}
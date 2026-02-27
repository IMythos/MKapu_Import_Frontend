export enum UserRole {
  ADMIN = 1,
  ALMACEN = 2,
  VENTAS = 3,
  LOGISTICA = 4
}

export const ROLE_NAMES = {
  [UserRole.ADMIN]: 'ADMIN',
  [UserRole.VENTAS]: 'VENTAS',
  [UserRole.ALMACEN]: 'ALMACEN',
  [UserRole.LOGISTICA]: 'LOGISTICA'
};

export const ROLE_NAME_TO_ID: Record<string, UserRole> = {
  'administrador': UserRole.ADMIN,
  'almacen': UserRole.ALMACEN,
  'ventas': UserRole.VENTAS,
  'logistica': UserRole.LOGISTICA,
};

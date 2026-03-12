
// src/app/core/interfaces/route-config.interface.ts
export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  permiso?: string;
  allowedRoles?: any[];
}
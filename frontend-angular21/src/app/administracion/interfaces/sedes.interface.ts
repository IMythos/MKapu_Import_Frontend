export interface Headquarter {
  id_sede: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  almacenes?: AlmacenBasico[] | null;
}

export interface HeadquarterResponse {
  headquarters: Headquarter[];
  total: number;
}

export interface AlmacenBasico {
  id_almacen: number;
  codigo: string;
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
}

export interface SedeAlmacenRelacion {
  id_sede: number;
  sede: { id_sede: number; codigo: string; nombre: string };
  almacenes: { id_almacen: number; almacen: AlmacenBasico }[];
  total: number;
}
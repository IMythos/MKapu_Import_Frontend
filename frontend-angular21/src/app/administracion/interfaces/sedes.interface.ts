export interface Headquarter {
  id_sede: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  telefono: string;
  activo: boolean;
}

export interface HeadquarterResponse {
  headquarters: Headquarter[];
  total: number;
}


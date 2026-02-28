export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CategoriaResponse {
  categories: Categoria[];
  total: number;
}
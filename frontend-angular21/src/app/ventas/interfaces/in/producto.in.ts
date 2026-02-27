export interface ProductoStockVentasParams {
  sedeId: number;
  page?: number;
  size?: number;
  search?: string;
  categoriaId?: number;
}

export interface ProductoAutocompleteVentasParams {
  sedeId: number;
  search: string;
  categoriaId?: number;
}

export interface ProductoDetalleParams {
  idProducto: number;
  idSede: number;
}

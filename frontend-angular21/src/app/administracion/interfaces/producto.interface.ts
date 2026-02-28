export interface ProductoInterface {
  id_producto: number;
  id_categoria: number;
  categoriaNombre: string;
  codigo: string;
  anexo: string;
  descripcion: string;
  pre_compra: number;
  pre_venta: number;
  pre_unit: number;
  pre_may: number;
  pre_caja: number;
  uni_med: string;
  estado: boolean;
  fec_creacion: string;   // viene como string (YYYY-MM-DD)
  fec_actual: string;     // igual
  profitMargin: number;
}

export interface ProductoMeta {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface ProductoResponse {
  products: ProductoInterface[];
  total: number;
  meta: ProductoMeta;
}

export interface ProductoStock {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  sede: string;
  stock: number;
}

export interface ProductoStockResponse {
  data: ProductoStock[];
  pagination: {
    page: number;
    size: number;
    total_records: number;
    total_pages: number;
  };
}

export interface ProductoAutocomplete {
  id_producto: number;
  codigo: string;
  nombre: string;
  stock: number;
}

export interface ProductoAutocompleteResponse {
  data: ProductoAutocomplete[];
}

export interface ProductoDetalleStockResponse {
  producto: ProductoDetalle;
  stock: ProductoStockDetalle;
}

export interface ProductoDetalle {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: {
    id_categoria: number;
    nombre: string;
  };
  precio_compra: number;
  precio_unitario: number;
  precio_mayor: number;
  precio_caja: number;
  unidad_medida: {
    id: number | null;
    nombre: string;
  };
  estado: number;
  fecha_creacion: string;
  fecha_edicion: string;
}

export interface ProductoStockDetalle {
  id_sede: number;
  sede: string;
  id_almacen: number;
  cantidad: number;
  estado: string;
}

export interface CreateProductoDto {
  id_categoria: number;
  codigo: string;
  anexo?: string;
  descripcion: string;
  pre_compra: number;
  pre_venta: number;
  pre_unit: number;
  pre_may: number;
  pre_caja: number;
  uni_med: string;
}

// ===== INVENTARIO =====

export interface MovimientoInventarioItem {
  productId: number;
  warehouseId: number;
  sedeId: number;      // <--- ¡NUEVO CAMPO AGREGADO AQUÍ!
  quantity: number;
  type: 'INGRESO' | 'SALIDA';
}

export interface MovimientoInventarioDto {
  originType: string;
  refId: number;
  refTable: string;
  observation?: string;
  items: MovimientoInventarioItem[];
}

export interface MovimientoInventarioResponse {
  message: string;
  data: {
    reference: string;
  };
}

// ===== ACTUALIZACIÓN DE PRODUCTOS =====

// 1. DTO para actualizar info básica
export interface UpdateProductoDto {
  id_producto: number;
  id_categoria: number;
  codigo: string;
  anexo: string;
  descripcion: string;
  uni_med: string;
}

// 2. DTO para actualizar solo precios
export interface UpdateProductoPreciosDto {
  id_producto: number;
  pre_compra: number;
  pre_venta: number;
  pre_unit: number;
  pre_may: number;
  pre_caja: number;
}

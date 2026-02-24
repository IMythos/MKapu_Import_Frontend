export interface ProductoConStock {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  sede: string;
  stock: number;
  detalle: ProductoDetalle;  
}

export interface ProductoStockResponse {
  data: ProductoConStock[];
  pagination: {
    page: number;
    size: number;
    total_records: number;
    total_pages: number;
  };
}

export interface ProductoStockVentas {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  id_categoria: number;
  sede: string;
  stock: number;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
}

export interface ProductoStockVentasResponse {
  data: ProductoStockVentas[];
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

export interface ProductoAutocompleteVentas {
  id_producto: number;
  codigo: string;
  nombre: string;
  stock: number;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
  id_categoria: number;
  familia: string;
}

export interface ProductoAutocompleteVentasResponse {
  data: ProductoAutocompleteVentas[];
}

export interface ProductoDetalle {
  producto: {
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
  };
  stock: {
    id_sede: number;
    sede: string;
    id_almacen: number;
    cantidad: number;
    estado: string;
  };
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  familia: string;
  id_categoria: number;
  stock: number;
  precioUnidad: number;
  precioCaja: number;
  precioMayorista: number;
  sede: string;
}

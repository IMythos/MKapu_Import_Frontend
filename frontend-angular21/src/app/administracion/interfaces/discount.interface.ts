export interface Discount {
  idDescuento: number;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

export interface DiscountResponse {
  data: Discount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
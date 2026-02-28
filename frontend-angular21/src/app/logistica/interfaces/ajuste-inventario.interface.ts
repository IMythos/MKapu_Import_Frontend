export interface ManualAdjustmentDto {
  productId: number;
  warehouseId: number;
  idSede: number;
  quantity: number | null;
  reason: string;
  userId: number;
}

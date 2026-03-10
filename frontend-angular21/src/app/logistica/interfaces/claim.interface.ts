export interface Claim {
  id: string;
  code?: string;
  customerId: string;
  saleReceiptId: string;
  reason: string;
  status: ClaimStatus;
  createdAt: string;
}

export enum ClaimStatus {
  PENDING = 'PENDIENTE',
  IN_PROCESS = 'EN_PROCESO',
  RESOLVED = 'RESUELTO',
  REJECTED = 'RECHAZADO'
}

export interface RegisterClaimDto {
  customerId: string;
  saleReceiptId: string;
  reason: string;
  description?: string;
}

export interface ChangeClaimStatusDto {
  status: ClaimStatus;
}
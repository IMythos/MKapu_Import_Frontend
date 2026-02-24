export interface ConteoInventario {
  idConteo: number;
  codSede: number;
  nomSede: string;
  fechaIni: Date;
  fechaFin?: Date;
  estado: 'PENDIENTE' | 'CONTADO' | 'AJUSTADO' | 'ANULADO';
  totalItems: number;
  totalDiferencias: number;
  usuarioCreacionRef: number;
  detalles?: DetalleConteo[];
}

export interface DetalleConteo {
  idDetalle: number;
  idProducto: number;
  codProd: string;
  descripcion: string;
  uniMed: string;
  stockSistema: number;
  stockConteo: number;
  diferencia: number;
  observacion?: string;
}

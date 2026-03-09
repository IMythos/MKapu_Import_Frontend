/* sales/src/app/interfaces/ventas.interface.ts */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

export const IGV_RATE_ADMIN = 0.18;
export const IGVRATEADMIN   = IGV_RATE_ADMIN;


// ─────────────────────────────────────────────────────────────────────────────
// SEDES
// ─────────────────────────────────────────────────────────────────────────────

export interface SedeAdmin {
  id_sede:    number;
  idsede?:    number;
  nombre:     string;
  direccion?: string;
  activo:     boolean;
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPROBANTES — Listado
// ─────────────────────────────────────────────────────────────────────────────

export interface SalesReceiptSummaryAdmin {
  idComprobante:     number;
  numeroCompleto:    string;
  serie:             string;
  numero:            number;
  tipoComprobante:   string;
  fecEmision:        string;
  clienteNombre:     string;
  clienteDocumento:  string;
  idResponsable:     string;
  responsableNombre: string;
  idSede:            number;
  sedeNombre:        string;
  metodoPago:        string;
  total:             number;
  estado:            'EMITIDO' | 'ANULADO' | 'RECHAZADO' | 'PENDIENTE';
}

export interface SalesReceiptSummaryListResponseAdmin {
  receipts:    SalesReceiptSummaryAdmin[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export interface SalesReceiptsQueryAdmin {
  status?:         'EMITIDO' | 'ANULADO' | 'RECHAZADO' | 'PENDIENTE';
  customerId?:     string;
  receiptTypeId?:  number;
  paymentMethodId?:number;
  dateFrom?:       string;
  dateTo?:         string;
  search?:         string;
  sedeId?:         number;
  page?:           number;
  limit?:          number;
  _t?:             number;
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPROBANTES — Detalle completo
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductoDetalleAdmin {
  id_prod_ref:          string;
  cod_prod:             string;
  descripcion:          string;
  cantidad:             number;
  precio_unit:          number;
  igv:                  number;
  total:                number;
  descuento_nombre:     string | null;
  descuento_porcentaje: number | null;
}

export interface PromocionDetalleAdmin {
  id:                   number;
  codigo:               string;
  nombre:               string;
  tipo:                 string;   // PORCENTAJE | MONTO_FIJO | 2X1 | ENVIO_GRATIS
  monto_descuento:      number;
  descuento_nombre:     string;
  descuento_porcentaje: number;
}

export interface ClienteDetalleAdmin {
  id_cliente:            string;
  nombre:                string;
  documento:             string;
  tipo_documento:        string;
  direccion:             string;
  email:                 string;
  telefono:              string;
  total_gastado_cliente: number;
  cantidad_compras:      number;
}

export interface ResponsableDetalleAdmin {
  id:         string;
  nombre:     string;
  sede:       number;
  nombreSede: string;
}

export interface HistorialItemAdmin {
  id_comprobante:  number;
  numero_completo: string;
  fec_emision:     string;
  total:           number;
  estado:          string;
  metodo_pago:     string;
  responsable:     string;
}

export interface SalesReceiptDetalleCompletoDto {
  id_comprobante:  number;
  numero_completo: string;
  serie:           string;
  numero:          number;
  tipo_comprobante:string;
  fec_emision:     string;
  fec_venc:        string | null;
  estado:          string;
  subtotal:        number;
  igv:             number;
  total:           number;
  metodo_pago:     string;
  cliente:         ClienteDetalleAdmin;
  productos:       ProductoDetalleAdmin[];
  promocion:       PromocionDetalleAdmin | null;
  responsable:     ResponsableDetalleAdmin;
  historial_cliente: HistorialItemAdmin[];
  historial_pagination: {
    total:       number;
    page:        number;
    limit:       number;
    total_pages: number;
  };
}

// Mantener por compatibilidad con generar-ventas si aún lo usa
export interface SalesReceiptWithHistoryDtoAdmin extends SalesReceiptDetalleCompletoDto {}


// ─────────────────────────────────────────────────────────────────────────────
// COMPROBANTES — KPI
// ─────────────────────────────────────────────────────────────────────────────

export interface SalesReceiptKpiDto {
  total_ventas:      number;
  cantidad_ventas:   number;
  total_boletas:     number;
  total_facturas:    number;
  cantidad_boletas:  number;
  cantidad_facturas: number;
  semana_desde?:     string;
  semana_hasta?:     string;
}


// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE VENTA — Request
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistroVentaAdminRequest {
  customerId:          string;
  saleTypeId:          number;
  serie:               string;
  receiptTypeId:       number;
  dueDate:             string;
  subtotal:            number;
  operationType?:      string;
  currencyCode?:       string;
  igv:                 number;
  isc:                 number;
  total:               number;
  descuento:           number;
  promotionId?:        number | null;
  responsibleId:       string;
  branchId:            number;
  warehouseId:         number;
  paymentMethodId:     number;
  operationNumber:     string | null;
  esCreditoPendiente?: boolean;
  items: {
    productId:    string;
    quantity:     number;
    unitPrice:    number;
    description:  string;
    total:        number;
    codigo?:      string;   // ← nuevo
    categoriaId?: number;   // ← nuevo
  }[];
}



// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE VENTA — Response
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistroVentaItemResponseAdmin {
  productId:          string;
  productName:        string;
  codigoProducto:     string;
  quantity:           number;
  unitPrice:          number;
  unitValue:          number;
  igv:                number;
  tipoAfectacionIgv:  number;
  total:              number;
}

export interface RegistroVentaAdminResponse {
  idComprobante:     number;
  idCliente:         string;
  numeroCompleto:    string;
  serie:             string;
  numero:            number;
  fecEmision:        string;
  fecVenc?:          string;
  tipoOperacion:     string;
  subtotal:          number;
  igv:               number;
  isc:               number;
  total:             number;
  estado:            string;
  codMoneda:         string;
  idTipoComprobante: number;
  idTipoVenta:       number;
  idSedeRef:         number;
  idResponsableRef:  string;
  items:             RegistroVentaItemResponseAdmin[];
}


// ─────────────────────────────────────────────────────────────────────────────
// ANULAR VENTA
// ─────────────────────────────────────────────────────────────────────────────

export interface AnularVentaAdminRequest {
  receiptId: number;
  reason:    string;
}

export interface AnularVentaAdminResponse {
  id_comprobante: number;
  estado:         string;
  mensaje:        string;
}


// ─────────────────────────────────────────────────────────────────────────────
// TIPOS — dinámicos desde DB
// ─────────────────────────────────────────────────────────────────────────────

export interface TipoVentaAdmin {
  id:          number;
  tipo:        string;
  descripcion: string;
}

export interface TipoComprobanteAdmin {
  id:          number;
  codSunat:    string;
  descripcion: string;
  estado:      boolean;
}

export interface MetodoPagoAdmin {
  id:          number;
  codSunat:    string;
  descripcion: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS CON STOCK
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductoStockAdmin {
  id_producto:     number;
  codigo:          string;
  nombre:          string;
  familia:         string;
  id_categoria:    number;
  stock:           number;
  precio_unitario: number;
  precio_caja:     number;
  precio_mayor:    number;
  sede:            string;
  id_sede:         number;
}

export interface ProductoStockAdminResponse {
  data: ProductoStockAdmin[];
  pagination: {
    total_records: number;
    page:          number;
    size:          number;
    total_pages:   number;
  };
}

export interface ProductoAutocompleteAdmin {
  id_producto:     number;
  codigo:          string;
  nombre:          string;
  familia:         string;
  id_categoria:    number;
  stock:           number;
  precio_unitario: number;
  precio_caja:     number;
  precio_mayor:    number;
  sede:            string;
  id_sede:         number;
}

export interface ProductoAutocompleteAdminResponse {
  data: ProductoAutocompleteAdmin[];
}

export interface ProductoUIAdmin {
  id:              number;
  codigo:          string;
  nombre:          string;
  familia:         string;
  categoriaId?:    number;       // ← nuevo
  precioUnidad:    number;
  precioCaja:      number;
  precioMayorista: number;
  stock:           number;
  sede:            string;
  almacenes:       Array<{ nombre: string; stock: number }>;
}

export interface CategoriaConStockAdmin {
  id_categoria: number;
  nombre:       string;
}


// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

export interface ClienteBusquedaAdminResponse {
  customerId:               string;
  name:                     string;
  documentValue:            string;
  documentTypeDescription:  string;
  documentTypeSunatCode:    string;
  invoiceType:              string;
  status:                   string;
  address?:                 string | null;
  email?:                   string | null;
  phone?:                   string | null;
  displayName?:             string;
}

export interface CrearClienteAdminRequest {
  documentTypeId: number;
  documentValue:  string;
  name:           string;
  address?:       string;
  email?:         string;
  phone?:         string;
}

export interface ActualizarClienteAdminRequest {
  name?:    string;
  address?: string;
  email?:   string;
  phone?:   string;
}

export interface ClienteAdminResponse {
  customerId:              string;
  name:                    string;
  documentValue:           string;
  documentTypeDescription: string;
  documentTypeSunatCode:   string;
  invoiceType:             string;
  status:                  string;
  address?:                string;
  email?:                  string;
  phone?:                  string;
  displayName?:            string;
}

export interface TipoDocumentoAdmin {
  documentTypeId: number;
  description:    string;
  sunatCode:      string;
}


// ─────────────────────────────────────────────────────────────────────────────
// ITEMS DEL CARRITO (uso interno UI)
// ─────────────────────────────────────────────────────────────────────────────

export interface ItemVentaUIAdmin {
  productId:    number;
  codigo:       string;
  quantity:     number;
  unitPrice:    number;
  description:  string;
  total:        number;
  igvUnitario:  number;
  categoriaId?: number;   // ← nuevo
}


// ─────────────────────────────────────────────────────────────────────────────
// PROMOCIONES
// ─────────────────────────────────────────────────────────────────────────────

export interface PromocionAdmin {
  idPromocion: number;
  concepto:    string;
  tipo:        string;
  valor:       number;
  activo:      boolean | { type: 'Buffer'; data: number[] };
  descripcion?: string;
  reglas?: {
    idRegla:        number;
    tipoCondicion:  string;
    valorCondicion: string;
  }[];
  descuentosAplicados?: {
    idDescuento: number;
    monto:       string;
  }[];
  productosIds?: number[];
}


// ─────────────────────────────────────────────────────────────────────────────
// COTIZACIÓN — prefill desde módulo de cotizaciones
// ─────────────────────────────────────────────────────────────────────────────

export interface QuoteDetalleItem {
  idprodref:   number;
  codprod:     string;
  descripcion: string;
  cantidad:    number;
  precio:      number;
}

export interface QuoteCliente {
  idtipodocumento:   number;
  valordoc:          string;
  razonsocial?:      string;
  nombrecliente?:    string;
  apellidoscliente?: string;
  direccion?:        string;
  email?:            string;
  telefono?:         string;
}

export interface Quote {
  idcotizacion: number;
  idsede?:      number;
  idcliente:    number;
  cliente?:     QuoteCliente;
  detalles?:    QuoteDetalleItem[];
}

export interface QuoteDetail {
  id_detalle?: number;
  id_prod_ref: number;
  cod_prod:    string;
  descripcion: string;
  cantidad:    number;
  precio:      number;
  importe?:    number;
}

export interface QuoteCliente {
  nombre_cliente:    string;
  apellidos_cliente: string | null;
  direccion:         string | null;
  razon_social:      string | null;
  email:             string | null;
  telefono:          string;
  id_tipo_documento: number;
  valor_doc:         string;
}

export interface QuoteSede {
  nombre_sede:  string;
  codigo:       string;
  ciudad:       string;
  departamento: string;
  direccion:    string;
  telefono:     string;
}

export type QuoteTipo = 'VENTA' | 'COMPRA';

// Para el detalle completo (GET /quote/:id)
export interface Quote {
  id_cotizacion?:      number;
  id_cliente:          string | null;
  id_proveedor?:       string | null;
  tipo:                QuoteTipo;
  cliente?:            QuoteCliente | null;
  proveedor?:          QuoteProveedor | null;
  id_sede?:            number;
  sede?:               QuoteSede;
  fec_emision:         string;
  fec_venc:            string;
  subtotal:            number;
  igv:                 number;
  total:               number;
  estado:              string;
  activo:              boolean;
  detalles:            QuoteDetail[];
  id_responsable_ref?: string | null; 
}

export interface QuoteProveedor {
  id:           string;
  razon_social: string;
  ruc:          string;
  contacto:     string | null;
  email:        string | null;
  telefono:     string | null;
}
// Para el listado paginado (GET /quote)
export interface QuoteListItem {
  id_cotizacion:       number;
  codigo:              string;
  cliente_nombre:      string;
  proveedor_nombre?:   string;
  id_proveedor?:       number;
  fec_emision:         string;
  fec_venc:            string;
  id_sede:             number;
  sede_nombre:         string;
  estado:              string;
  tipo:                QuoteTipo;
  total:               number;
  activo:              boolean;
  id_responsable_ref?: string | null;
  nombre_responsable?: string | null;  
}


export interface QuotePagedResponse {
  data:       QuoteListItem[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}
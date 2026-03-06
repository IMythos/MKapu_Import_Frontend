import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Card }         from 'primeng/card';
import { Button }       from 'primeng/button';
import { Textarea }     from 'primeng/textarea';
import { Select }       from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Toast }        from 'primeng/toast';
import { Tag }          from 'primeng/tag';
import { Divider }      from 'primeng/divider';
import { Tooltip }      from 'primeng/tooltip';
import { InputNumber }  from 'primeng/inputnumber';
import { InputText }    from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { EmpleadosService, Empleado }   from '../../../../core/services/empleados.service';
import { ProductosService }             from '../../../../core/services/productos.service';
import { VentaService }                 from '../../../../ventas/services/venta.service';
import { ClienteService }               from '../../../../ventas/services/cliente.service';
import { ClaimService, RegisterClaimPayload, ClaimResponseDto } from '../../../../core/services/claim.service';
import { AuthService }                  from '../../../../auth/services/auth.service';
import { ClienteBusquedaResponse }      from '../../../../ventas/interfaces';

// ── Interfaces locales ────────────────────────────────────────────────
export interface DetalleComprobante {
  id_det_com:     number;
  id_comprobante: string;
  id_producto:    string;
  cod_prod:       string;
  descripcion:    string;
  cantidad:       number;
  valor_unit:     number;
  pre_uni:        number;
  igv:            number;
  tipo_afe_igv:   string;
}

export interface ComprobanteVenta {
  id:               number;
  id_comprobante:   string;
  id_cliente:       string;
  tipo_comprobante: '01' | '03';
  serie:            string;
  numero:           number;
  fec_emision:      Date;
  fec_venc:         Date | null;
  moneda:           string;
  tipo_pago:        string;
  subtotal:         number;
  igv:              number;
  total:            number;
  estado:           boolean;
  id_sede:          string;
  detalles:         DetalleComprobante[];
  cliente_nombre?:  string;
  cliente_doc?:     string;
}

interface ComprobanteConProductos extends ComprobanteVenta {
  productosSeleccionados?: DetalleComprobante[];
}

interface ReclamoGenerado {
  id_reclamo:           number;
  cliente_nombre:       string;
  descripcion_producto: string;
  fecha_registro:       Date;
  motivo:               string;
}

@Component({
  selector: 'app-reclamos-crear',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    Textarea,
    Select,
    SelectButton,
    Toast,
    Tag,
    Divider,
    Tooltip,
    InputNumber,
    InputText,
  ],
  providers: [MessageService],
  templateUrl: './reclamos-crear.html',
  styleUrl: './reclamos-crear.css',
})
export class ReclamosCrear implements OnInit, OnDestroy {

  // ── Cabecera ──────────────────────────────────────────────────────
  tituloKicker    = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'REGISTRAR NUEVO RECLAMO';
  iconoCabecera   = 'pi pi-file-plus';

  // ── Services ─────────────────────────────────────────────────────
  private router           = inject(Router);
  private ventaService     = inject(VentaService);
  private clienteService   = inject(ClienteService);
  private claimService     = inject(ClaimService);
  private authService      = inject(AuthService);
  private empleadosService = inject(EmpleadosService);
  private productosService = inject(ProductosService);
  private messageService   = inject(MessageService);

  // ── Estado general ───────────────────────────────────────────────
  private subscriptions = new Subscription();
  empleadoActual: Empleado | null = null;
  Math = Math;

  // ── Wizard ───────────────────────────────────────────────────────
  activeStep = 0;
  steps = [
    'Buscar Cliente',
    'Seleccionar Comprobante',
    'Seleccionar Producto',
    'Datos del Reclamo',
    'Confirmación',
  ];

  // ── Paso 0 — Tipo documento ───────────────────────────────────────
  tipoDocumentoOptions = [
    { label: 'DNI', value: 'DNI', icon: 'pi pi-id-card'   },
    { label: 'RUC', value: 'RUC', icon: 'pi pi-briefcase' },
  ];
  tipoDocumento: 'DNI' | 'RUC' = 'DNI';

  // ── Paso 0 — Signals (mismo patrón que GenerarVenta) ─────────────
  clienteAutoComplete = signal('');
  clienteEncontrado   = signal<ClienteBusquedaResponse | null>(null);
  loading             = signal(false);
  busquedaRealizada   = signal(false);

  // ── Computed ─────────────────────────────────────────────────────
  longitudDocumento = computed(() => this.tipoDocumento === 'DNI' ? 8 : 11);

  botonClienteHabilitado = computed(
    () => (this.clienteAutoComplete()?.length ?? 0) === this.longitudDocumento(),
  );

  textoBotonBuscar = computed(() =>
    this.clienteEncontrado()
      ? 'Cliente Seleccionado'
      : this.loading() ? 'Buscando...' : 'Buscar',
  );

  iconoBotonBuscar = computed(() =>
    this.clienteEncontrado() ? 'pi pi-check' : 'pi pi-search',
  );

  // ── Paso 1 — Comprobantes ────────────────────────────────────────
  comprobantesCliente: ComprobanteVenta[]                 = [];
  comprobanteSeleccionado: ComprobanteConProductos | null = null;

  // ── Paso 2 — Producto ────────────────────────────────────────────
  productoSeleccionado: DetalleComprobante | null = null;
  unidadesAfectadas    = 1;
  identificacionUnidad = '';

  // ── Paso 3 — Datos del reclamo ───────────────────────────────────
  motivosOptions = [
    { label: 'Producto defectuoso',        value: 'Producto defectuoso'        },
    { label: 'No funciona correctamente',  value: 'No funciona correctamente'  },
    { label: 'Producto dañado',            value: 'Producto dañado'            },
    { label: 'No cumple especificaciones', value: 'No cumple especificaciones' },
    { label: 'Piezas faltantes',           value: 'Piezas faltantes'           },
    { label: 'Otro motivo',                value: 'Otro motivo'                },
  ];
  motivoSeleccionado  = '';
  descripcionProblema = '';

  // ── Paso 4 — Resultado ───────────────────────────────────────────
  guardando        = false;
  reclamoGenerado: ReclamoGenerado | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.empleadoActual = this.empleadosService.getEmpleadoActual();
    if (!this.empleadoActual) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Sin autenticación',
        detail:   'No hay empleado logueado',
        life:     3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── Paso 0: cambio tipo documento ────────────────────────────────
  onTipoDocumentoChange(): void {
    this.limpiarCliente();
    this.messageService.add({
      severity: 'info',
      summary:  'Tipo de documento cambiado',
      detail:   `Busque por ${this.tipoDocumento}`,
      life:     2000,
    });
  }

  // ── Paso 0: validar solo números ─────────────────────────────────
  validarSoloNumeros(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, this.longitudDocumento());
    this.clienteAutoComplete.set(input.value);
  }

  onInputCambioDocumento(): void {
    if (this.clienteEncontrado()) this.limpiarCliente();
    this.busquedaRealizada.set(false);
  }

  // ── Paso 0: buscar cliente (mismo patrón que GenerarVenta) ────────
  manejarBuscarComprobante(): void {
    if (!this.botonClienteHabilitado() || this.clienteEncontrado()) return;
    this.buscarCliente();
  }

  private buscarCliente(): void {
    this.loading.set(true);
    this.busquedaRealizada.set(false);

    // 2 = Boleta/DNI  |  1 = Factura/RUC — igual que GenerarVenta
    const tipoComprobante = this.tipoDocumento === 'DNI' ? 2 : 1;

    this.clienteService
      .buscarCliente(this.clienteAutoComplete(), tipoComprobante)
      .subscribe({
        next: (response: ClienteBusquedaResponse) => {
          this.clienteEncontrado.set(response);
          this.busquedaRealizada.set(true);
          this.loading.set(false);
          this.cargarComprobantesCliente();
          this.messageService.add({
            severity: 'success',
            summary:  'Cliente Encontrado',
            detail:   `Cliente: ${response.name}`,
            life:     3000,
          });
        },
        error: () => {
          this.clienteEncontrado.set(null);
          this.busquedaRealizada.set(true);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary:  'No encontrado',
            detail:   `No se encontró cliente con ese ${this.tipoDocumento}`,
            life:     3000,
          });
        },
      });
  }

  getNombreCliente(cliente: ClienteBusquedaResponse): string {
    return cliente.name ?? cliente.displayName ?? 'Sin nombre';
  }

  limpiarCliente(): void {
    this.clienteAutoComplete.set('');
    this.clienteEncontrado.set(null);
    this.busquedaRealizada.set(false);
    this.comprobantesCliente     = [];
    this.comprobanteSeleccionado = null;
    this.productoSeleccionado    = null;
    this.resetearUnidades();
  }

  // ── Paso 1: cargar comprobantes del cliente ───────────────────────
  cargarComprobantesCliente(): void {
    const cliente = this.clienteEncontrado();
    if (!cliente) return;

    const customerId = String(cliente.documentValue ?? cliente.customerId ?? '');

    const sub = this.ventaService.obtenerHistorialCliente(customerId).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res)
          ? res
          : (res.data ?? res.comprobantes ?? res.receipts ?? []);

        this.comprobantesCliente = lista
          .filter((c: any) => c.estado !== false)
          .sort(
            (a: any, b: any) =>
              new Date(b.fec_emision).getTime() - new Date(a.fec_emision).getTime(),
          ) as ComprobanteVenta[];

        if (this.comprobantesCliente.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary:  'Sin compras',
            detail:   'Este cliente no tiene compras registradas',
            life:     3000,
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   'No se pudieron cargar los comprobantes',
          life:     3000,
        });
      },
    });

    this.subscriptions.add(sub);
  }

  // ── Paso 1: seleccionar comprobante ──────────────────────────────
  seleccionarComprobanteDeCliente(comprobante: ComprobanteVenta): void {
    if (this.comprobanteSeleccionado?.id_comprobante === comprobante.id_comprobante) {
      this.comprobanteSeleccionado = null;
      this.productoSeleccionado    = null;
      this.resetearUnidades();
      this.messageService.add({
        severity: 'info',
        summary:  'Comprobante deseleccionado',
        detail:   'Puede seleccionar otro comprobante',
        life:     2000,
      });
      return;
    }

    this.comprobanteSeleccionado = {
      ...comprobante,
      productosSeleccionados: comprobante.detalles || [],
    };

    if (!this.validarGarantia(comprobante.fec_emision)) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Garantía vencida',
        detail:   'Este comprobante ya no tiene garantía vigente (60 días)',
        life:     4000,
      });
    }

    this.messageService.add({
      severity: 'success',
      summary:  'Comprobante seleccionado',
      detail:   this.formatearComprobante(comprobante.serie, comprobante.numero),
      life:     2000,
    });
  }

  // ── Garantía ─────────────────────────────────────────────────────
  validarGarantia(fechaEmision: Date): boolean {
    const diff = (Date.now() - new Date(fechaEmision).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 60;
  }

  calcularDiasRestantesComprobante(fechaEmision: Date): number {
    const diff = (Date.now() - new Date(fechaEmision).getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(60 - diff);
  }

  // ── Paso 2: seleccionar producto ─────────────────────────────────
  seleccionarProducto(producto: DetalleComprobante): void {
    if (this.productoSeleccionado?.id_producto === producto.id_producto) {
      this.productoSeleccionado = null;
      this.resetearUnidades();
      this.messageService.add({ severity: 'info', summary: 'Producto deseleccionado', life: 2000 });
      return;
    }
    this.productoSeleccionado = producto;
    this.resetearUnidades();
    this.messageService.add({
      severity: 'success',
      summary:  'Producto seleccionado',
      detail:   producto.descripcion,
      life:     2000,
    });
  }

  resetearUnidades(): void {
    this.unidadesAfectadas    = 1;
    this.identificacionUnidad = '';
  }

  getPrecioProducto(detalle: DetalleComprobante): number {
    return detalle.pre_uni || detalle.valor_unit || 0;
  }

  // ── Navegación del wizard ────────────────────────────────────────
  nextStep(): void {
    if (this.validarStepActual()) this.activeStep++;
  }

  prevStep(): void {
    if (this.activeStep > 0) this.activeStep--;
  }

  validarStepActual(): boolean {
    switch (this.activeStep) {
      case 0:
        if (!this.clienteEncontrado()) {
          this.messageService.add({ severity: 'warn', summary: 'Cliente requerido', detail: 'Debe buscar un cliente', life: 3000 });
          return false;
        }
        if (this.comprobantesCliente.length === 0) {
          this.messageService.add({ severity: 'warn', summary: 'Sin compras', detail: 'Este cliente no tiene compras para reclamar', life: 3000 });
          return false;
        }
        return true;

      case 1:
        if (!this.comprobanteSeleccionado) {
          this.messageService.add({ severity: 'warn', summary: 'Comprobante requerido', detail: 'Debe seleccionar un comprobante', life: 3000 });
          return false;
        }
        return true;

      case 2:
        if (!this.productoSeleccionado) {
          this.messageService.add({ severity: 'warn', summary: 'Producto requerido', detail: 'Debe seleccionar un producto', life: 3000 });
          return false;
        }
        if (this.productoSeleccionado.cantidad > 1) {
          if (!this.unidadesAfectadas || this.unidadesAfectadas < 1) {
            this.messageService.add({ severity: 'warn', summary: 'Unidades requeridas', detail: 'Indique cuántas unidades tienen el problema', life: 3000 });
            return false;
          }
          if (this.unidadesAfectadas > this.productoSeleccionado.cantidad) {
            this.messageService.add({ severity: 'warn', summary: 'Unidades inválidas', detail: `No puede reclamar más de ${this.productoSeleccionado.cantidad} unidades`, life: 3000 });
            return false;
          }
        }
        return true;

      case 3:
        if (!this.motivoSeleccionado?.trim()) {
          this.messageService.add({ severity: 'error', summary: 'Motivo requerido', detail: 'Debe seleccionar un motivo', life: 3000 });
          return false;
        }
        if (!this.descripcionProblema?.trim()) {
          this.messageService.add({ severity: 'error', summary: 'Descripción requerida', detail: 'Debe describir el problema', life: 3000 });
          return false;
        }
        if (this.descripcionProblema.trim().length < 20) {
          this.messageService.add({ severity: 'error', summary: 'Descripción muy corta', detail: 'La descripción debe tener al menos 20 caracteres', life: 3000 });
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  // ── Paso 4: guardar reclamo ───────────────────────────────────────
  async guardarReclamo(): Promise<void> {
    this.guardando = true;

    let descripcionCompleta = this.descripcionProblema;

    if (this.productoSeleccionado && this.productoSeleccionado.cantidad > 1) {
      descripcionCompleta += `\n\n[UNIDADES AFECTADAS: ${this.unidadesAfectadas} de ${this.productoSeleccionado.cantidad}]`;
      if (this.identificacionUnidad.trim()) {
        descripcionCompleta += `\n[IDENTIFICACIÓN: ${this.identificacionUnidad.trim()}]`;
      }
    }

    const user = this.authService.getCurrentUser();

    const payload: RegisterClaimPayload = {
      id_comprobante:  this.comprobanteSeleccionado!.id,
      id_vendedor_ref: String(user?.userId ?? ''),
      motivo:          this.motivoSeleccionado,
      descripcion:     descripcionCompleta,
    };

    const result: ClaimResponseDto | null = await this.claimService.register(payload);

    if (result) {
      this.reclamoGenerado = {
        id_reclamo:           result.claimId,
        cliente_nombre:       this.getNombreCliente(this.clienteEncontrado()!),
        descripcion_producto: this.productoSeleccionado!.descripcion,
        fecha_registro:       new Date(result.registeredAt),
        motivo:               result.reason,
      };

      this.messageService.add({
        severity: 'success',
        summary:  'Reclamo registrado',
        detail:   `Reclamo #${result.claimId} creado exitosamente`,
        life:     3000,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   this.claimService.error() ?? 'No se pudo registrar el reclamo',
        life:     4000,
      });
    }

    this.guardando = false;
  }

  // ── Navegación post-registro ─────────────────────────────────────
  verDetalle(): void {
    if (!this.reclamoGenerado) return;
    const base = this.router.url.startsWith('/admin')
      ? '/admin/reclamos-listado'
      : '/ventas/reclamos-listado';
    this.router.navigate([`${base}/detalle`, this.reclamoGenerado.id_reclamo]);
  }

  nuevoReclamo(): void {
    this.limpiarFormulario();
  }

  cancelar(): void {
    const base = this.router.url.startsWith('/admin')
      ? '/admin/reclamos-listado'
      : '/ventas/reclamos-listado';
    this.router.navigate([base]);
  }

  limpiarFormulario(): void {
    this.clienteAutoComplete.set('');
    this.clienteEncontrado.set(null);
    this.busquedaRealizada.set(false);
    this.loading.set(false);
    this.comprobantesCliente     = [];
    this.comprobanteSeleccionado = null;
    this.productoSeleccionado    = null;
    this.motivoSeleccionado      = '';
    this.descripcionProblema     = '';
    this.activeStep              = 0;
    this.reclamoGenerado         = null;
    this.tipoDocumento           = 'DNI';
    this.resetearUnidades();

    this.messageService.add({
      severity: 'info',
      summary:  'Formulario limpiado',
      detail:   'Se han restablecido todos los campos',
      life:     2000,
    });
  }

  // ── Helpers visuales ─────────────────────────────────────────────
  formatearComprobante(serie: string, numero: number): string {
    return `${serie}-${numero.toString().padStart(8, '0')}`;
  }

  getTipoComprobanteLabel(tipo: string): string {
    return tipo === '01' ? 'Factura' : tipo === '03' ? 'Boleta' : tipo;
  }
}
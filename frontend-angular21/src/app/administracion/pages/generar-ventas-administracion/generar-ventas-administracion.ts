import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { AutoComplete } from 'primeng/autocomplete';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { StepperModule } from 'primeng/stepper';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {
  VentasService,
  ComprobanteVenta,
  DetalleComprobante,
} from '../../../core/services/ventas.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { ComprobantesService } from '../../../core/services/comprobantes.service';
import { PosService } from '../../../core/services/pos.service';
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { EmpleadosService, Empleado } from '../../../core/services/empleados.service';
import { PromocionesService, Promocion } from '../../../core/services/promociones.service';
import { SedeService, Sede } from '../../../core/services/sede.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-generar-ventas-administracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    SelectButton,
    InputText,
    InputNumber,
    Divider,
    Tag,
    Toast,
    ConfirmDialog,
    AutoComplete,
    Select,
    Tooltip,
    TableModule,
    StepperModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './generar-ventas-administracion.html',
  styleUrl: './generar-ventas-administracion.css',
})
export class GenerarVentasAdministracion implements OnInit, OnDestroy {
  tituloKicker = 'VENTAS - GENERAR VENTAS';
  subtituloKicker = 'GENERAR NUEVA VENTA (ADMIN)';
  iconoCabecera = 'pi pi-shopping-cart';

  private subscriptions = new Subscription();
  private readonly STORAGE_KEY = 'generar_venta_admin_estado';
  private clickEnBotonBuscar = false;
  private seleccionandoDelAutocomplete = false;

  empleadoActual: Empleado | null = null;
  nombreResponsable: string = '';

  // 🔥 NUEVO: Sedes disponibles y selección
  sedesDisponibles: { label: string; value: string }[] = [];
  sedeSeleccionada: string | null = null;

  activeStep = 0;
  steps = ['Comprobante y Cliente', 'Productos', 'Venta y Pago', 'Confirmación'];

  tipoComprobanteOptions = [
    { label: 'Boleta', value: '03', icon: 'pi pi-file' },
    { label: 'Factura', value: '01', icon: 'pi pi-file-edit' },
  ];
  tipoComprobante: '01' | '03' = '03';

  numeroDocumento: string = '';
  clienteAutoComplete: any = null;
  clientesSugeridos: Cliente[] = [];
  clienteEncontrado: Cliente | null = null;
  busquedaRealizada = false;
  mostrarFormulario = false;

  nuevoCliente = {
    tipo_doc: 'DNI' as 'DNI' | 'RUC',
    num_doc: '',
    apellidos: '',
    nombres: '',
    razon_social: '',
    direccion: '',
    email: '',
    telefono: '',
  };

  productosDisponibles: Producto[] = [];
  productosFiltrados: Producto[] = [];
  productosSeleccionados: DetalleComprobante[] = [];
  productoTemp: Producto | null = null;
  cantidadTemp: number = 1;
  tipoPrecioTemp: 'UNIDAD' | 'CAJA' | 'MAYORISTA' = 'UNIDAD';

  productoSeleccionadoBusqueda: string = '';
  productosSugeridos: Producto[] = [];

  familiaSeleccionada: string | null = null;
  familiasDisponibles: { label: string; value: string | null }[] = [];

  sedeIdSeleccionada: string = '';
  sedeNombreSeleccionada: string = '';

  opcionesTipoPrecio = [
    { label: 'Unidad', value: 'UNIDAD' },
    { label: 'Caja', value: 'CAJA' },
    { label: 'Mayorista', value: 'MAYORISTA' },
  ];

  tipoVentaOptions = [
    { label: 'Presencial', value: 'PRESENCIAL', icon: 'pi pi-user' },
    { label: 'Envío', value: 'ENVIO', icon: 'pi pi-send' },
    { label: 'Recojo', value: 'RECOJO', icon: 'pi pi-shopping-bag' },
    { label: 'Delivery', value: 'DELIVERY', icon: 'pi pi-car' },
  ];
  tipoVenta: 'ENVIO' | 'RECOJO' | 'DELIVERY' | 'PRESENCIAL' = 'PRESENCIAL';
  departamento: string = '';

  tipoPagoOptions = [
    { label: 'Efectivo', value: 'EFECTIVO', icon: 'pi pi-money-bill' },
    { label: 'Tarjeta', value: 'TARJETA', icon: 'pi pi-credit-card' },
    { label: 'Yape', value: 'YAPE', icon: 'pi pi-mobile' },
    { label: 'Plin', value: 'PLIN', icon: 'pi pi-mobile' },
  ];
  tipoPago: string = 'EFECTIVO';

  montoRecibido: number = 0;
  bancoSeleccionado: string = '';
  numeroOperacion: string = '';
  bancosDisponibles: string[] = [];
  codigoPromocion: string = '';
  promocionAplicada: Promocion | null = null;
  descuentoPromocion: number = 0;

  comprobanteGenerado: ComprobanteVenta | null = null;
  loading = false;
  tieneSugerencias: boolean = false;

  // GETTERS
  get textoBotonCliente(): string {
    const documentoActual =
      typeof this.clienteAutoComplete === 'string'
        ? this.clienteAutoComplete.trim()
        : this.clienteAutoComplete?.num_doc || '';

    const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;
    const tieneLongitudCorrecta = documentoActual.length === longitudRequerida;

    if (tieneLongitudCorrecta && this.tieneSugerencias) {
      return 'Buscar';
    }

    return 'Registrar Cliente';
  }

  get iconoBotonCliente(): string {
    const documentoActual =
      typeof this.clienteAutoComplete === 'string'
        ? this.clienteAutoComplete.trim()
        : this.clienteAutoComplete?.num_doc || '';

    const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;
    const tieneLongitudCorrecta = documentoActual.length === longitudRequerida;

    return tieneLongitudCorrecta && this.tieneSugerencias ? 'pi pi-search' : 'pi pi-user-plus';
  }

  get severityBotonCliente(): 'primary' {
    return 'primary';
  }

  get botonClienteHabilitado(): boolean {
    const documentoActual =
      typeof this.clienteAutoComplete === 'string'
        ? this.clienteAutoComplete.trim()
        : this.clienteAutoComplete?.num_doc || '';

    const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;

    return documentoActual.length === 0 || documentoActual.length === longitudRequerida;
  }

  constructor(
    private router: Router,
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private comprobantesService: ComprobantesService,
    private posService: PosService,
    private productosService: ProductosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private empleadosService: EmpleadosService,
    private promocionesService: PromocionesService,
    private sedeService: SedeService,
  ) {}

  ngOnInit(): void {
    this.empleadoActual = this.empleadosService.getEmpleadoActual()!;
    this.nombreResponsable = this.empleadosService.getNombreCompletoEmpleadoActual();

    this.sedeIdSeleccionada = this.empleadoActual.id_sede;
    this.sedeNombreSeleccionada = this.empleadoActual.nombre_sede!;

    this.messageService.add({
      severity: 'success',
      summary: `Bienvenido ${this.nombreResponsable}`,
      detail: `Modo: Administración - Sede: ${this.empleadoActual.nombre_sede}`,
      life: 3000,
    });

    this.cargarSedes();
    this.bancosDisponibles = this.posService.getBancosDisponibles();
    this.restaurarEstado();

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          if (event.url === '/admin/generar-ventas-administracion') {
            console.log('🔄 Detectada navegación de retorno a generar-ventas-administracion');
            this.restaurarEstado();
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private cargarSedes(): void {
    this.sedeService.getSedes().subscribe({
      next: (sedes: Sede[]) => {
        this.sedesDisponibles = sedes.map((sede) => ({
          label: sede.nombre,
          value: sede.nombre,
        }));

        this.sedeSeleccionada = this.sedeNombreSeleccionada;

        this.cargarProductos();
        this.cargarFamilias();
      },
      error: (err) => {
        console.error('Error al cargar sedes:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sedes',
          life: 3000,
        });
      },
    });
  }

  onSedeChange(): void {
    if (this.sedeSeleccionada) {
      if (this.productosSeleccionados.length > 0) {
        this.confirmationService.confirm({
          message: 'Al cambiar de sede se vaciará el carrito. ¿Desea continuar?',
          header: 'Confirmar cambio de sede',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Sí, cambiar',
          rejectLabel: 'Cancelar',
          accept: () => {
            this.productosSeleccionados.forEach((item) => {
              this.productosService.devolverStock(Number(item.id_producto), item.cantidad);
            });
            this.productosSeleccionados = [];
            this.productoTemp = null;

            this.sedeNombreSeleccionada = this.sedeSeleccionada!;
            this.cargarProductos();
            this.cargarFamilias();

            this.messageService.add({
              severity: 'info',
              summary: 'Sede cambiada',
              detail: `Ahora mostrando productos de ${this.sedeSeleccionada}`,
              life: 3000,
            });

            this.guardarEstado();
          },
          reject: () => {
            this.sedeSeleccionada = this.sedeNombreSeleccionada;
          },
        });
      } else {
        this.sedeNombreSeleccionada = this.sedeSeleccionada;
        this.cargarProductos();
        this.cargarFamilias();

        this.messageService.add({
          severity: 'info',
          summary: 'Sede cambiada',
          detail: `Ahora mostrando productos de ${this.sedeSeleccionada}`,
          life: 3000,
        });

        this.guardarEstado();
      }
    }
  }

  // MÉTODOS DE ESTADO
  private guardarEstado(): void {
    const estado = {
      activeStep: this.activeStep,
      tipoComprobante: this.tipoComprobante,
      clienteEncontrado: this.clienteEncontrado,
      busquedaRealizada: this.busquedaRealizada,
      mostrarFormulario: this.mostrarFormulario,
      nuevoCliente: this.nuevoCliente,
      productosSeleccionados: this.productosSeleccionados,
      familiaSeleccionada: this.familiaSeleccionada,
      sedeSeleccionada: this.sedeSeleccionada,
      tipoVenta: this.tipoVenta,
      departamento: this.departamento,
      tipoPago: this.tipoPago,
      montoRecibido: this.montoRecibido,
      bancoSeleccionado: this.bancoSeleccionado,
      numeroOperacion: this.numeroOperacion,
      codigoPromocion: this.codigoPromocion,
      promocionAplicada: this.promocionAplicada,
      descuentoPromocion: this.descuentoPromocion,
      comprobanteGenerado: this.comprobanteGenerado,
      sedeIdSeleccionada: this.sedeIdSeleccionada,
      sedeNombreSeleccionada: this.sedeNombreSeleccionada,
    };

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
      console.log('💾 Estado guardado en sessionStorage (Admin)');
    } catch (error) {
      console.error('❌ Error al guardar estado:', error);
    }
  }

  private restaurarEstado(): void {
    try {
      const estadoGuardado = sessionStorage.getItem(this.STORAGE_KEY);

      if (estadoGuardado) {
        const estado = JSON.parse(estadoGuardado);

        console.log('📂 Restaurando estado de generar-ventas-administracion:', estado);

        this.activeStep = estado.activeStep || 0;
        this.tipoComprobante = estado.tipoComprobante || '03';
        this.clienteEncontrado = estado.clienteEncontrado || null;
        this.busquedaRealizada = estado.busquedaRealizada || false;
        this.mostrarFormulario = estado.mostrarFormulario || false;
        this.nuevoCliente = estado.nuevoCliente || this.nuevoCliente;
        this.productosSeleccionados = estado.productosSeleccionados || [];
        this.familiaSeleccionada = estado.familiaSeleccionada || null;
        this.sedeSeleccionada = estado.sedeSeleccionada || this.sedeNombreSeleccionada;
        this.tipoVenta = estado.tipoVenta || 'PRESENCIAL';
        this.departamento = estado.departamento || '';
        this.tipoPago = estado.tipoPago || 'EFECTIVO';
        this.montoRecibido = estado.montoRecibido || 0;
        this.bancoSeleccionado = estado.bancoSeleccionado || '';
        this.numeroOperacion = estado.numeroOperacion || '';
        this.codigoPromocion = estado.codigoPromocion || '';
        this.promocionAplicada = estado.promocionAplicada || null;
        this.descuentoPromocion = estado.descuentoPromocion || 0;
        this.comprobanteGenerado = estado.comprobanteGenerado || null;

        this.sedeIdSeleccionada = estado.sedeIdSeleccionada || this.empleadoActual!.id_sede;
        this.sedeNombreSeleccionada =
          estado.sedeNombreSeleccionada || this.empleadoActual!.nombre_sede!;

        console.log('✅ Estado restaurado correctamente');
        console.log('📍 Step actual:', this.activeStep);
        console.log('📄 Comprobante generado:', this.comprobanteGenerado);

        if (estado.activeStep > 0 || estado.productosSeleccionados?.length > 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Estado restaurado',
            detail: 'Se recuperó la venta en progreso',
            life: 2000,
          });
        }
      } else {
        console.log('ℹ️ No hay estado guardado para restaurar');
      }
    } catch (error) {
      console.error('❌ Error al restaurar estado:', error);
    }
  }

  private limpiarEstado(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Estado limpiado del sessionStorage (Admin)');
  }

  // MÉTODOS DE VALIDACIÓN
  validarSoloNumeros(event: any): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    const valorLimpio = valor.replace(/\D/g, '');

    const longitudMaxima = this.tipoComprobante === '03' ? 8 : 11;
    const valorFinal = valorLimpio.slice(0, longitudMaxima);

    this.clienteAutoComplete = valorFinal;
    input.value = valorFinal;
  }

  validarSoloNumerosFormulario(event: any): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    const valorLimpio = valor.replace(/\D/g, '');

    const longitudMaxima = this.tipoComprobante === '03' ? 8 : 11;
    const valorFinal = valorLimpio.slice(0, longitudMaxima);

    this.nuevoCliente.num_doc = valorFinal;
    input.value = valorFinal;
  }

  // MÉTODOS DE CLIENTE
  buscarClienteAutoComplete(event: any): void {
    let query = event.query.toLowerCase();

    query = query.replace(/\D/g, '');

    const todosClientes = this.clientesService.getClientes();

    const tipoDocRequerido = this.tipoComprobante === '03' ? 'DNI' : 'RUC';

    this.clientesSugeridos = todosClientes
      .filter((cliente) => {
        if (cliente.tipo_doc !== tipoDocRequerido) {
          return false;
        }

        const matchDoc = cliente.num_doc.toLowerCase().includes(query);
        const matchApellidos = cliente.apellidos?.toLowerCase().includes(query);
        const matchNombres = cliente.nombres?.toLowerCase().includes(query);
        const matchRazonSocial = cliente.razon_social?.toLowerCase().includes(query);

        return matchDoc || matchApellidos || matchNombres || matchRazonSocial;
      })
      .slice(0, 10);

    this.tieneSugerencias = this.clientesSugeridos.length > 0;
  }

  manejarAccionCliente(): void {
    const documentoIngresado =
      typeof this.clienteAutoComplete === 'string'
        ? this.clienteAutoComplete.trim()
        : this.clienteAutoComplete?.num_doc || '';

    const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;

    if (documentoIngresado.length === 0) {
      this.abrirFormularioVacio();
      return;
    }

    if (documentoIngresado.length !== longitudRequerida) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documento inválido',
        detail: `El ${this.tipoComprobante === '03' ? 'DNI' : 'RUC'} debe tener ${longitudRequerida} dígitos`,
        life: 3000,
      });
      return;
    }

    if (this.tieneSugerencias) {
      this.buscarCliente();
    } else {
      this.preguntarCrearCliente(documentoIngresado);
    }
  }

  abrirFormularioVacio(): void {
    this.busquedaRealizada = false;
    this.clienteEncontrado = null;
    this.mostrarFormulario = true;

    this.nuevoCliente = {
      tipo_doc: this.tipoComprobante === '03' ? 'DNI' : 'RUC',
      num_doc: '',
      apellidos: '',
      nombres: '',
      razon_social: '',
      direccion: '',
      email: '',
      telefono: '',
    };

    this.messageService.add({
      severity: 'info',
      summary: 'Nuevo cliente',
      detail: 'Complete los datos para registrar',
      life: 3000,
    });
  }

  onTipoComprobanteChange(): void {
    if (this.clienteEncontrado) {
      const tipoDocRequerido = this.tipoComprobante === '03' ? 'DNI' : 'RUC';

      if (this.clienteEncontrado.tipo_doc !== tipoDocRequerido) {
        this.limpiarCliente();
        this.messageService.add({
          severity: 'warn',
          summary: 'Cliente removido',
          detail: `El cliente seleccionado no tiene ${tipoDocRequerido}`,
          life: 3000,
        });
      }
    }

    this.clienteAutoComplete = null;
    this.clientesSugeridos = [];

    this.nuevoCliente.tipo_doc = this.tipoComprobante === '03' ? 'DNI' : 'RUC';
  }

  onNumeroDocumentoChange(): void {
    if (this.clienteEncontrado && this.numeroDocumento !== this.clienteEncontrado.num_doc) {
      this.clienteEncontrado = null;
      this.busquedaRealizada = false;
      this.mostrarFormulario = false;
    }
  }

  onBlurAutoComplete(): void {
    setTimeout(() => {
      if (this.clickEnBotonBuscar) {
        this.clickEnBotonBuscar = false;
        return;
      }

      if (this.seleccionandoDelAutocomplete) {
        this.seleccionandoDelAutocomplete = false;
        return;
      }

      if (this.clienteEncontrado) {
        return;
      }

      if (this.clienteAutoComplete && typeof this.clienteAutoComplete === 'string') {
        const documentoIngresado = this.clienteAutoComplete.trim();

        const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;

        if (documentoIngresado.length === longitudRequerida && /^\d+$/.test(documentoIngresado)) {
          const cliente = this.clientesService.buscarPorDocumento(documentoIngresado);

          if (cliente) {
            this.clienteEncontrado = cliente;
            this.busquedaRealizada = true;
            this.mostrarFormulario = false;

            const nombreCliente =
              this.tipoComprobante === '03'
                ? `${cliente.apellidos || ''} ${cliente.nombres || ''}`.trim()
                : cliente.razon_social || 'Sin nombre';

            this.messageService.add({
              severity: 'success',
              summary: 'Cliente encontrado',
              detail: nombreCliente,
              life: 2000,
            });
          } else {
            this.preguntarCrearCliente(documentoIngresado);
          }
        }
      }
    }, 100);
  }

  preguntarCrearCliente(documento: string): void {
    const tipoDoc = this.tipoComprobante === '03' ? 'DNI' : 'RUC';

    this.confirmationService.confirm({
      message: `El ${tipoDoc} ${documento} no está registrado. ¿Desea registrar un nuevo cliente?`,
      header: 'Cliente no encontrado',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, registrar',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.abrirFormularioNuevoCliente(documento);
      },
      reject: () => {
        this.clienteAutoComplete = null;
        this.numeroDocumento = '';
        this.messageService.add({
          severity: 'info',
          summary: 'Búsqueda cancelada',
          detail: 'Puede buscar otro cliente',
          life: 2000,
        });
      },
    });
  }

  abrirFormularioNuevoCliente(documento?: string): void {
    const documentoIngresado =
      documento ||
      (typeof this.clienteAutoComplete === 'string'
        ? this.clienteAutoComplete
        : this.clienteAutoComplete?.num_doc || '');

    const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;

    if (documentoIngresado.length !== longitudRequerida) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documento inválido',
        detail: `El ${this.tipoComprobante === '03' ? 'DNI' : 'RUC'} debe tener ${longitudRequerida} dígitos`,
        life: 3000,
      });
      return;
    }

    this.busquedaRealizada = true;
    this.clienteEncontrado = null;
    this.mostrarFormulario = true;

    this.nuevoCliente = {
      tipo_doc: this.tipoComprobante === '03' ? 'DNI' : 'RUC',
      num_doc: documentoIngresado,
      apellidos: '',
      nombres: '',
      razon_social: '',
      direccion: '',
      email: '',
      telefono: '',
    };

    this.messageService.add({
      severity: 'info',
      summary: 'Registrar cliente',
      detail: 'Complete los datos para registrar',
      life: 3000,
    });
  }

  onSelectCliente(event: any): void {
    this.seleccionandoDelAutocomplete = true;

    const cliente: Cliente = event.value;

    this.numeroDocumento = cliente.num_doc;

    setTimeout(() => {
      this.clienteAutoComplete = null;
    }, 0);

    this.clienteEncontrado = cliente;
    this.busquedaRealizada = true;
    this.mostrarFormulario = false;

    const nombreCliente =
      this.tipoComprobante === '03'
        ? `${cliente.apellidos || ''} ${cliente.nombres || ''}`.trim()
        : cliente.razon_social || 'Sin nombre';

    this.messageService.add({
      severity: 'success',
      summary: 'Cliente seleccionado',
      detail: nombreCliente,
    });
  }

  onClearCliente(): void {
    this.clienteAutoComplete = null;
    this.numeroDocumento = '';
    this.tieneSugerencias = false;
    this.limpiarCliente();
  }

  buscarCliente(): void {
    this.clickEnBotonBuscar = true;

    const documentoIngresado =
      typeof this.clienteAutoComplete === 'string'
        ? this.clienteAutoComplete.trim()
        : this.clienteAutoComplete?.num_doc || '';

    if (!documentoIngresado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documento requerido',
        detail: 'Ingrese un número de documento',
      });
      return;
    }

    const longitudRequerida = this.tipoComprobante === '03' ? 8 : 11;
    if (documentoIngresado.length !== longitudRequerida) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documento inválido',
        detail: `El ${this.tipoComprobante === '03' ? 'DNI' : 'RUC'} debe tener ${longitudRequerida} dígitos`,
      });
      return;
    }

    this.busquedaRealizada = true;
    const cliente = this.clientesService.buscarPorDocumento(documentoIngresado);
    this.clienteEncontrado = cliente || null;

    if (!this.clienteEncontrado) {
      this.preguntarCrearCliente(documentoIngresado);
    } else {
      this.mostrarFormulario = false;

      const nombreCliente =
        this.tipoComprobante === '03'
          ? `${this.clienteEncontrado.apellidos || ''} ${this.clienteEncontrado.nombres || ''}`.trim()
          : this.clienteEncontrado.razon_social || 'Sin nombre';

      this.messageService.add({
        severity: 'success',
        summary: 'Cliente encontrado',
        detail: nombreCliente,
      });
    }
  }

  registrarNuevoCliente(): void {
    if (this.tipoComprobante === '03') {
      if (!this.nuevoCliente.apellidos.trim()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Apellidos requeridos',
          detail: 'Ingrese los apellidos del cliente',
        });
        return;
      }
      if (!this.nuevoCliente.nombres.trim()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Nombres requeridos',
          detail: 'Ingrese los nombres del cliente',
        });
        return;
      }
    }

    if (this.tipoComprobante === '01' && !this.nuevoCliente.razon_social.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Razón social requerida',
        detail: 'Ingrese la razón social',
      });
      return;
    }

    this.clienteEncontrado = this.clientesService.crearCliente({
      ...this.nuevoCliente,
      estado: true,
    });

    this.mostrarFormulario = false;

    const nombreCliente =
      this.tipoComprobante === '03'
        ? `${this.nuevoCliente.apellidos} ${this.nuevoCliente.nombres}`
        : this.nuevoCliente.razon_social;

    this.messageService.add({
      severity: 'success',
      summary: 'Cliente registrado',
      detail: nombreCliente,
    });
  }

  limpiarCliente(): void {
    this.numeroDocumento = '';
    this.clienteEncontrado = null;
    this.busquedaRealizada = false;
    this.mostrarFormulario = false;
    this.clientesSugeridos = [];
    this.tieneSugerencias = false;

    this.nuevoCliente = {
      tipo_doc: this.tipoComprobante === '03' ? 'DNI' : 'RUC',
      num_doc: '',
      apellidos: '',
      nombres: '',
      razon_social: '',
      direccion: '',
      email: '',
      telefono: '',
    };
  }

  // MÉTODOS DE PRODUCTOS
  cargarProductos(): void {
    this.productosDisponibles = this.productosService.getProductos(
      this.sedeSeleccionada || this.sedeNombreSeleccionada,
      'Activo',
    );

    this.aplicarFiltros();
  }

  cargarFamilias(): void {
    const familiasUnicas = [...new Set(this.productosDisponibles.map((p) => p.familia))];

    this.familiasDisponibles = [
      { label: 'Todas las familias', value: null },
      ...familiasUnicas.map((f) => ({ label: f, value: f })),
    ];
  }

  buscarProductos(event: any): void {
    const query = event.query.toLowerCase();

    let productosBase = this.familiaSeleccionada
      ? this.productosDisponibles.filter((p) => p.familia === this.familiaSeleccionada)
      : this.productosDisponibles;

    this.productosSugeridos = productosBase
      .filter((producto) => {
        const coincideNombre = producto.nombre.toLowerCase().includes(query);
        const coincideCodigo = producto.codigo.toLowerCase().includes(query);

        return coincideNombre || coincideCodigo;
      })
      .slice(0, 10);
  }

  onProductoSeleccionado(event: any): void {
    const producto: Producto = event.value;

    this.seleccionarProducto(producto);

    this.productoSeleccionadoBusqueda = '';

    this.messageService.add({
      severity: 'success',
      summary: 'Producto seleccionado',
      detail: producto.nombre,
      life: 2000,
    });
  }

  onLimpiarBusqueda(): void {
    this.productoSeleccionadoBusqueda = '';
    this.productosSugeridos = [];
  }

  onFamiliaChange(): void {
    this.aplicarFiltros();
    this.productoSeleccionadoBusqueda = '';
    this.productosSugeridos = [];
  }

  aplicarFiltros(): void {
    if (this.familiaSeleccionada) {
      this.productosFiltrados = this.productosDisponibles.filter(
        (p) => p.familia === this.familiaSeleccionada,
      );
    } else {
      this.productosFiltrados = [...this.productosDisponibles];
    }
  }

  seleccionarProducto(producto: Producto): void {
    this.productoTemp = producto;
    this.cantidadTemp = 1;
    this.tipoPrecioTemp = 'UNIDAD';
  }

  agregarProducto(): void {
    console.log("agregando al carrito")

    console.log("producto", this.productoTemp)
    console.log("cantidad", this.cantidadTemp)
    if (!this.productoTemp) {

      this.messageService.add({
        severity: 'warn',
        summary: 'Cantidad inválida',
        detail: 'Ingrese una cantidad válida',
        life: 3000,
      });
      return;
    }

    // ✅ VALIDAR QUE EL PRODUCTO TENGA ID
    if (!this.productoTemp.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El producto seleccionado no tiene ID válido',
        life: 3000,
      });
      return;
    }

    const stockDisponibleActual = 1;

    const cantidadYaEnCarrito = this.productosSeleccionados
      .filter((p) => p.id_producto === String(this.productoTemp!.id))
      .reduce((sum, p) => sum + p.cantidad, 0);

    const stockTotalDisponible = stockDisponibleActual + cantidadYaEnCarrito;
    /*
    if (this.cantidadTemp > stockTotalDisponible) {
      this.messageService.add({
        severity: 'error',
        summary: 'Stock insuficiente',
        detail: `Solo hay ${stockTotalDisponible} unidades disponibles de este producto. Stock en almacén: ${stockDisponibleActual}, ya en carrito: ${cantidadYaEnCarrito}`,
        life: 5000,
      });
      return;
    }

    if (this.cantidadTemp > stockDisponibleActual) {
      this.messageService.add({
        severity: 'error',
        summary: 'Stock insuficiente en almacén',
        detail: `Solo quedan ${stockDisponibleActual} unidades en almacén. Ya tiene ${cantidadYaEnCarrito} en el carrito.`,
        life: 5000,
      });
      return;
    }
    
    const exito = this.productosService.descontarStock(this.productoTemp.id, this.cantidadTemp);

    if (!exito) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al descontar stock',
        detail: 'No se pudo descontar el stock del producto',
        life: 4000,
      });
      return;
    }
    */
    const precio = this.getPrecioSegunTipo(this.productoTemp);
    const valorUnit = this.comprobantesService.calcularValorUnitario(precio);
    const igv = this.comprobantesService.calcularIGVItem(valorUnit, this.cantidadTemp);

    const detalle: DetalleComprobante = {
      id_det_com: this.productosSeleccionados.length + 1,
      id_comprobante: '',
      id_producto: String(this.productoTemp.id),
      cod_prod: this.productoTemp.codigo,
      descripcion: this.productoTemp.nombre,
      cantidad: this.cantidadTemp,
      valor_unit: valorUnit,
      pre_uni: precio,
      igv: igv,
      tipo_afe_igv: '10',
    };

    this.productosSeleccionados.push(detalle);
    this.cargarProductos();
    this.productoTemp = null;
    this.cantidadTemp = 1;

    this.messageService.add({
      severity: 'success',
      summary: 'Producto agregado',
      detail: 'Producto añadido al carrito',
      life: 2000,
    });

    this.guardarEstado();
  }

  getPrecioSegunTipo(producto: Producto): number {
    switch (this.tipoPrecioTemp) {
      case 'CAJA':
        return producto.precioCaja;
      case 'MAYORISTA':
        return producto.precioMayorista;
      default:
        return producto.precioUnidad;
    }
  }

  eliminarProducto(index: number): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este producto del carrito?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        const productoEliminado = this.productosSeleccionados[index];

        this.productosService.devolverStock(
          Number(productoEliminado.id_producto),
          productoEliminado.cantidad,
        );

        this.cargarProductos();

        this.productosSeleccionados.splice(index, 1);

        this.messageService.add({
          severity: 'info',
          summary: 'Producto eliminado',
          detail: 'Producto removido del carrito y stock devuelto',
        });

        this.guardarEstado();
      },
    });
  }

  obtenerSeveridadStock(stock: number | undefined): 'success' | 'warn' | 'danger' {
    if (!stock || stock === 0) return 'danger';
    if (stock <= 5) return 'warn';
    if (stock <= 20) return 'warn';
    return 'success';
  }

  // MÉTODOS DE PROMOCIONES
  onCodigoPromocionChange(): void {
    if (!this.codigoPromocion.trim()) {
      this.limpiarPromocion();
    }
  }

  aplicarPromocion(): void {
    if (!this.codigoPromocion.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Código requerido',
        detail: 'Ingrese un código de promoción',
        life: 3000,
      });
      return;
    }

    const resultado = this.promocionesService.aplicarPromocion(this.codigoPromocion, {
      subtotal: this.calcularSubtotal(),
      tipoComprobante: this.tipoComprobante,
      idCliente: this.clienteEncontrado?.id_cliente,
      idSede: this.sedeIdSeleccionada,
    });

    if (!resultado.exito) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error en promoción',
        detail: resultado.mensaje,
        life: 3000,
      });
      return;
    }

    this.promocionAplicada = resultado.promocion!;
    this.descuentoPromocion = resultado.descuento!;

    this.messageService.add({
      severity: 'success',
      summary: 'Promoción aplicada',
      detail: `${resultado.mensaje} - Descuento: S/ ${this.descuentoPromocion.toFixed(2)}`,
      life: 3000,
    });

    this.guardarEstado();
  }

  limpiarPromocion(): void {
    const habiaPromocion = this.promocionAplicada !== null;

    this.codigoPromocion = '';
    this.promocionAplicada = null;
    this.descuentoPromocion = 0;

    if (habiaPromocion) {
      this.messageService.add({
        severity: 'info',
        summary: 'Promoción removida',
        detail: 'Se eliminó el descuento aplicado',
        life: 2000,
      });
    }

    this.guardarEstado();
  }

  // MÉTODOS DE CÁLCULO
  calcularSubtotal(): number {
    return this.productosSeleccionados.reduce((sum, p) => sum + p.valor_unit * p.cantidad, 0);
  }

  calcularIGV(): number {
    const subtotalConDescuento = this.calcularSubtotal() - this.descuentoPromocion;
    return subtotalConDescuento * 0.18;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() - this.descuentoPromocion + this.calcularIGV();
  }

  calcularVuelto(): number {
    return this.posService.calcularVuelto(this.montoRecibido, this.calcularTotal());
  }

  // MÉTODOS DE NAVEGACIÓN (STEPS)
  nextStep(): void {
    if (this.validarStepActual()) {
      this.activeStep++;
      this.guardarEstado();
    }
  }

  prevStep(): void {
    if (this.activeStep > 0) {
      this.activeStep--;
      this.guardarEstado();
    }
  }

  validarStepActual(): boolean {
    switch (this.activeStep) {
      case 0:
        if (!this.clienteEncontrado) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cliente requerido',
            detail: 'Debe buscar o registrar un cliente',
          });
          return false;
        }
        return true;

      case 1:
        if (this.productosSeleccionados.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Productos requeridos',
            detail: 'Agregue al menos un producto',
          });
          return false;
        }
        return true;

      case 2:
        if (this.tipoVenta === 'ENVIO' && !this.departamento.trim()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Departamento requerido',
            detail: 'Ingrese el departamento de envío',
          });
          return false;
        }
        if (this.tipoPago === 'EFECTIVO' && this.montoRecibido < this.calcularTotal()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Monto insuficiente',
            detail: 'El monto debe ser mayor o igual al total',
          });
          return false;
        }
        if (this.tipoPago === 'TARJETA' && !this.bancoSeleccionado) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Banco requerido',
            detail: 'Seleccione un banco',
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  // MÉTODOS DE GENERACIÓN DE VENTA
  generarVenta(): void {
    this.confirmationService.confirm({
      message: '¿Confirmar la generación de esta venta?',
      header: 'Confirmar Venta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, generar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.procesarVenta();
      },
    });
  }

  procesarVenta(): void {
    this.loading = true;

    const nombreCliente =
      this.tipoComprobante === '03'
        ? `${this.clienteEncontrado!.apellidos} ${this.clienteEncontrado!.nombres}`
        : this.clienteEncontrado!.razon_social || '';

    const subtotal = this.calcularSubtotal();
    const subtotalConDescuento = subtotal - this.descuentoPromocion;
    const igv = this.calcularIGV();
    const total = this.calcularTotal();

    const detalles = this.productosSeleccionados.map((detalle) => ({
      ...detalle,
      id_det_com: 0,
    }));

    const nuevoComprobante: Omit<
      ComprobanteVenta,
      'id' | 'id_comprobante' | 'hash_cpe' | 'xml_cpe' | 'cdr_cpe' | 'numero'
    > = {
      id_cliente: this.clienteEncontrado!.id_cliente,
      tipo_comprobante: this.tipoComprobante,
      serie: this.ventasService.generarSerie(this.tipoComprobante),
      fec_emision: new Date(),
      fec_venc:
        this.tipoComprobante === '01' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      moneda: 'PEN',
      tipo_pago: this.tipoPago,
      tipo_op: '0101',
      subtotal: subtotalConDescuento,
      igv: igv,
      isc: 0,
      total: total,
      estado: true,
      responsable: this.nombreResponsable,
      id_sede: this.sedeIdSeleccionada,
      id_empleado: this.empleadoActual!.id_empleado,
      detalles: detalles,
      cliente_nombre: nombreCliente,
      cliente_doc: this.clienteEncontrado!.num_doc,
      codigo_promocion: this.promocionAplicada?.codigo,
      descuento_promocion: this.descuentoPromocion > 0 ? this.descuentoPromocion : undefined,
      descripcion_promocion: this.promocionAplicada?.descripcion,
      id_promocion: this.promocionAplicada?.id_promocion,
    };

    setTimeout(() => {
      this.comprobanteGenerado = this.ventasService.crearComprobante(nuevoComprobante);

      if (this.promocionAplicada && this.comprobanteGenerado) {
        this.promocionesService.registrarUsoPromocion(
          this.promocionAplicada.codigo,
          this.comprobanteGenerado.id_comprobante,
        );
      }

      this.posService.registrarPago({
        id_comprobante: this.comprobanteGenerado.id_comprobante,
        fec_pago: new Date(),
        med_pago: this.tipoPago as 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA',
        monto: total,
        banco: this.bancoSeleccionado || undefined,
        num_operacion: this.numeroOperacion || undefined,
      });

      this.loading = false;
      this.guardarEstado();

      this.messageService.add({
        severity: 'success',
        summary: 'Venta generada exitosamente',
        detail: `Comprobante ${this.comprobanteGenerado.serie}-${this.comprobanteGenerado.numero.toString().padStart(8, '0')} creado`,
        life: 4000,
      });
    }, 1500);
  }

  imprimirComprobante(): void {
    if (!this.comprobanteGenerado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin comprobante',
        detail: 'No hay comprobante para imprimir',
        life: 3000,
      });
      return;
    }

    this.guardarEstado();

    this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
      state: {
        comprobante: this.comprobanteGenerado,
        rutaRetorno: '/admin/generar-ventas-administracion',
      },
    });
  }

  nuevaVenta(): void {
    if (this.comprobanteGenerado) {
      this.limpiarEstado();
      window.location.reload();
    } else {
      this.confirmationService.confirm({
        message: '¿Estás seguro de cancelar esta venta? Se perderá el progreso actual.',
        header: 'Confirmar Cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cancelar',
        rejectLabel: 'No',
        accept: () => {
          this.productosSeleccionados.forEach((item) => {
            this.productosService.devolverStock(Number(item.id_producto), item.cantidad);
          });

          this.limpiarEstado();
          window.location.reload();
        },
      });
    }
  }

  verListado(): void {
    if (this.comprobanteGenerado) {
      this.router.navigate(['/admin/historial-ventas-administracion']);
      return;
    }

    if (this.productosSeleccionados.length > 0) {
      this.confirmationService.confirm({
        message: '¿Desea salir sin generar la venta? Se cancelará la operación.',
        header: 'Confirmar salida',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, salir',
        rejectLabel: 'Continuar venta',
        accept: () => {
          this.productosSeleccionados.forEach((item) => {
            this.productosService.devolverStock(Number(item.id_producto), item.cantidad);
          });

          this.limpiarEstado();
          this.router.navigate(['/admin/historial-ventas-administracion']);
        },
      });
    } else {
      this.limpiarEstado();
      this.router.navigate(['/admin/historial-ventas-administracion']);
    }
  }
}

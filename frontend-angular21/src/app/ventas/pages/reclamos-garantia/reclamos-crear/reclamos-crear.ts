import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { AutoComplete, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { Toast } from 'primeng/toast';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { Tooltip } from 'primeng/tooltip';
import { InputNumber } from 'primeng/inputnumber';

import { ReclamosService, Reclamo, EstadoReclamo } from '../../../../core/services/reclamo.service';
import {
  VentasService,
  ComprobanteVenta,
  DetalleComprobante,
} from '../../../../core/services/ventas.service';
import { EmpleadosService, Empleado } from '../../../../core/services/empleados.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { ClientesService, Cliente } from '../../../../core/services/clientes.service';
import { MessageService } from 'primeng/api';

interface ComprobanteConProductos extends ComprobanteVenta {
  productosSeleccionados?: DetalleComprobante[];
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
  ],
  providers: [MessageService],
  templateUrl: './reclamos-crear.html',
  styleUrl: './reclamos-crear.css',
})
export class ReclamosCrear implements OnInit, OnDestroy {
  tituloKicker = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'REGISTRAR NUEVO RECLAMO';
  iconoCabecera = 'pi pi-file-plus';

  private subscriptions = new Subscription();
  empleadoActual: Empleado | null = null;

  activeStep = 0;
  steps = [
    'Buscar Cliente',
    'Seleccionar Comprobante',
    'Seleccionar Producto',
    'Datos del Reclamo',
    'Confirmación',
  ];

  tipoDocumentoOptions = [
    { label: 'DNI', value: 'DNI', icon: 'pi pi-id-card' },
    { label: 'RUC', value: 'RUC', icon: 'pi pi-briefcase' },
  ];
  tipoDocumento: 'DNI' | 'RUC' = 'DNI';

  busquedaComprobante: any = null;
  sugerenciasComprobantesObj: Cliente[] = [];
  clienteEncontrado: Cliente | null = null;

  comprobantesCliente: ComprobanteVenta[] = [];
  comprobanteSeleccionado: ComprobanteConProductos | null = null;
  garantiaVigente: boolean = false;
  diasRestantes: number = 0;

  productoSeleccionado: DetalleComprobante | null = null;
  unidadesAfectadas: number = 1;
  identificacionUnidad: string = '';

  motivosOptions = [
    { label: 'Producto defectuoso', value: 'Producto defectuoso' },
    { label: 'No funciona correctamente', value: 'No funciona correctamente' },
    { label: 'Producto dañado', value: 'Producto dañado' },
    { label: 'No cumple especificaciones', value: 'No cumple especificaciones' },
    { label: 'Piezas faltantes', value: 'Piezas faltantes' },
    { label: 'Otro motivo', value: 'Otro motivo' },
  ];
  motivoSeleccionado: string = '';
  descripcionProblema: string = '';

  guardando: boolean = false;
  reclamoGenerado: Reclamo | null = null;

  Math = Math;

  constructor(
    private router: Router,
    private reclamosService: ReclamosService,
    private ventasService: VentasService,
    private empleadosService: EmpleadosService,
    private productosService: ProductosService,
    private clientesService: ClientesService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.cargarEmpleadoActual();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  cargarEmpleadoActual(): void {
    this.empleadoActual = this.empleadosService.getEmpleadoActual();

    if (!this.empleadoActual) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin autenticación',
        detail: 'No hay empleado logueado',
        life: 3000,
      });
    }
  }

  onTipoDocumentoChange(): void {
    this.busquedaComprobante = null;
    this.clienteEncontrado = null;
    this.comprobantesCliente = [];
    this.comprobanteSeleccionado = null;
    this.productoSeleccionado = null;
    this.sugerenciasComprobantesObj = [];
    this.resetearUnidades();

    this.messageService.add({
      severity: 'info',
      summary: 'Tipo de documento cambiado',
      detail: `Busque por ${this.tipoDocumento}`,
      life: 2000,
    });
  }

  buscarSugerenciasComprobantes(event: any): void {
    let query = event.query.toLowerCase().trim();

    if (/^\d+$/.test(query)) {
      query = query.replace(/\D/g, '');
    }

    if (!query || query.length < 3) {
      this.sugerenciasComprobantesObj = [];
      return;
    }

    const todosClientes = this.clientesService.getClientes();
    const longitudRequerida = this.tipoDocumento === 'DNI' ? 8 : 11;

    this.sugerenciasComprobantesObj = todosClientes
      .filter((cliente: Cliente) => {
        const longitudDoc = cliente.num_doc?.length || 0;
        const esTipoDocCorrecto =
          (this.tipoDocumento === 'DNI' && longitudDoc === 8) ||
          (this.tipoDocumento === 'RUC' && longitudDoc === 11);

        if (!esTipoDocCorrecto) {
          return false;
        }

        const matchDoc = cliente.num_doc?.toLowerCase().includes(query);
        const matchNombre =
          this.tipoDocumento === 'DNI'
            ? `${cliente.nombres} ${cliente.apellidos}`.toLowerCase().includes(query)
            : cliente.razon_social?.toLowerCase().includes(query);

        return matchDoc || matchNombre;
      })
      .slice(0, 10);
  }

  seleccionarComprobante(event: AutoCompleteSelectEvent): void {
    const cliente = event.value as Cliente;

    if (!cliente) {
      return;
    }

    setTimeout(() => {
      this.busquedaComprobante = null;
    }, 0);

    this.clienteEncontrado = cliente;
    this.cargarComprobantesCliente();

    this.messageService.add({
      severity: 'success',
      summary: 'Cliente encontrado',
      detail: this.getNombreCliente(cliente),
      life: 3000,
    });
  }

  cargarComprobantesCliente(): void {
    if (!this.clienteEncontrado) return;

    const todosComprobantes = this.ventasService.getComprobantes();

    this.comprobantesCliente = todosComprobantes
      .filter(
        (c: ComprobanteVenta) =>
          c.cliente_doc === this.clienteEncontrado!.num_doc &&
          c.estado &&
          c.id_sede === this.empleadoActual!.id_sede,
      )
      .sort((a, b) => new Date(b.fec_emision).getTime() - new Date(a.fec_emision).getTime());

    if (this.comprobantesCliente.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin compras',
        detail: 'Este cliente no tiene compras registradas',
        life: 3000,
      });
    }
  }

  validarSoloNumeros(event: any): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    const valorLimpio = valor.replace(/\D/g, '');
    const longitudMaxima = this.tipoDocumento === 'DNI' ? 8 : 11;
    const valorFinal = valorLimpio.slice(0, longitudMaxima);

    if (typeof this.busquedaComprobante === 'string') {
      this.busquedaComprobante = valorFinal;
    }
    input.value = valorFinal;
  }

  manejarBuscarComprobante(): void {
    const documentoIngresado =
      typeof this.busquedaComprobante === 'string'
        ? this.busquedaComprobante.trim()
        : this.busquedaComprobante?.num_doc || '';

    if (!documentoIngresado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: `Ingrese un ${this.tipoDocumento} para buscar`,
        life: 3000,
      });
      return;
    }

    const longitudRequerida = this.tipoDocumento === 'DNI' ? 8 : 11;

    if (documentoIngresado.length !== longitudRequerida) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documento inválido',
        detail: `El ${this.tipoDocumento} debe tener ${longitudRequerida} dígitos`,
        life: 3000,
      });
      return;
    }

    const cliente = this.clientesService.buscarPorDocumento(documentoIngresado);

    if (cliente) {
      this.clienteEncontrado = cliente;
      this.cargarComprobantesCliente();

      this.messageService.add({
        severity: 'success',
        summary: 'Cliente encontrado',
        detail: this.getNombreCliente(cliente),
        life: 3000,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'No encontrado',
        detail: `No se encontró ningún cliente con ese ${this.tipoDocumento}`,
        life: 3000,
      });
    }
  }

  getNombreCliente(cliente: Cliente): string {
    return this.tipoDocumento === 'DNI'
      ? `${cliente.nombres} ${cliente.apellidos}`
      : cliente.razon_social || 'Sin nombre';
  }

  get textoBotonBuscar(): string {
    return 'Buscar';
  }

  get botonBuscarHabilitado(): boolean {
    const documentoActual =
      typeof this.busquedaComprobante === 'string' ? this.busquedaComprobante.trim() : '';

    const longitudRequerida = this.tipoDocumento === 'DNI' ? 8 : 11;
    return documentoActual.length === longitudRequerida;
  }

  limpiarBusqueda(): void {
    this.busquedaComprobante = null;
    this.clienteEncontrado = null;
    this.comprobantesCliente = [];
    this.comprobanteSeleccionado = null;
    this.productoSeleccionado = null;
    this.sugerenciasComprobantesObj = [];
    this.resetearUnidades();

    this.messageService.add({
      severity: 'info',
      summary: 'Búsqueda limpiada',
      detail: 'Puede buscar otro cliente',
      life: 2000,
    });
  }

  seleccionarComprobanteDeCliente(comprobante: ComprobanteVenta): void {
    if (this.comprobanteSeleccionado?.id_comprobante === comprobante.id_comprobante) {
      this.comprobanteSeleccionado = null;
      this.garantiaVigente = false;
      this.diasRestantes = 0;
      this.productoSeleccionado = null;
      this.resetearUnidades();

      this.messageService.add({
        severity: 'info',
        summary: 'Comprobante deseleccionado',
        detail: 'Puede seleccionar otro comprobante',
        life: 2000,
      });
      return;
    }

    this.comprobanteSeleccionado = {
      ...comprobante,
      productosSeleccionados: comprobante.detalles || [],
    };

    this.validarGarantiaComprobante(comprobante.fec_emision);

    this.messageService.add({
      severity: 'success',
      summary: 'Comprobante seleccionado',
      detail: this.formatearComprobante(comprobante.serie, comprobante.numero),
      life: 2000,
    });
  }

  validarGarantiaComprobante(fechaEmision: Date): void {
    this.garantiaVigente = this.reclamosService.validarGarantia(fechaEmision);
    this.diasRestantes = this.reclamosService.calcularDiasRestantes(fechaEmision);

    if (!this.garantiaVigente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Garantía vencida',
        detail: 'Este comprobante ya no tiene garantía vigente (60 días)',
        life: 4000,
      });
    }
  }

  calcularDiasRestantesComprobante(fechaEmision: Date): number {
    return this.reclamosService.calcularDiasRestantes(fechaEmision);
  }

  validarGarantia(fechaEmision: Date): boolean {
    return this.reclamosService.validarGarantia(fechaEmision);
  }

  seleccionarProducto(producto: any): void {
    if (this.productoSeleccionado?.id_producto === producto.id_producto) {
      this.productoSeleccionado = null;
      this.resetearUnidades();

      this.messageService.add({
        severity: 'info',
        summary: 'Producto deseleccionado',
        life: 2000,
      });
      return;
    }

    this.productoSeleccionado = producto;
    this.resetearUnidades();

    this.messageService.add({
      severity: 'success',
      summary: 'Producto seleccionado',
      detail: producto.descripcion,
      life: 2000,
    });
  }

  resetearUnidades(): void {
    this.unidadesAfectadas = 1;
    this.identificacionUnidad = '';
  }

  getPrecioProducto(detalle: DetalleComprobante): number {
    const producto = this.productosService.getProductoPorCodigo(detalle.cod_prod);
    return producto?.precioVenta || 0;
  }

  getSubtotalDetalle(detalle: DetalleComprobante): number {
    const precio = this.getPrecioProducto(detalle);
    return precio * detalle.cantidad;
  }

  nextStep(): void {
    if (this.validarStepActual()) {
      this.activeStep++;
    }
  }

  prevStep(): void {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  validarStepActual(): boolean {
    switch (this.activeStep) {
      case 0:
        if (!this.clienteEncontrado) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cliente requerido',
            detail: 'Debe buscar un cliente',
            life: 3000,
          });
          return false;
        }
        if (this.comprobantesCliente.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin compras',
            detail: 'Este cliente no tiene compras para reclamar',
            life: 3000,
          });
          return false;
        }
        return true;

      case 1:
        if (!this.comprobanteSeleccionado) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Comprobante requerido',
            detail: 'Debe seleccionar un comprobante',
            life: 3000,
          });
          return false;
        }
        return true;

      case 2:
        if (!this.productoSeleccionado) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Producto requerido',
            detail: 'Debe seleccionar un producto',
            life: 3000,
          });
          return false;
        }

        if (this.productoSeleccionado.cantidad > 1) {
          if (!this.unidadesAfectadas || this.unidadesAfectadas < 1) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Unidades requeridas',
              detail: 'Indique cuántas unidades tienen el problema',
              life: 3000,
            });
            return false;
          }

          if (this.unidadesAfectadas > this.productoSeleccionado.cantidad) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Unidades inválidas',
              detail: `No puede reclamar más de ${this.productoSeleccionado.cantidad} unidades`,
              life: 3000,
            });
            return false;
          }
        }

        return true;

      case 3:
        if (!this.motivoSeleccionado || !this.motivoSeleccionado.trim()) {
          this.messageService.add({
            severity: 'error',
            summary: 'Motivo requerido',
            detail: 'Debe seleccionar un motivo',
            life: 3000,
          });
          return false;
        }

        if (!this.descripcionProblema || !this.descripcionProblema.trim()) {
          this.messageService.add({
            severity: 'error',
            summary: 'Descripción requerida',
            detail: 'Debe describir el problema',
            life: 3000,
          });
          return false;
        }

        if (this.descripcionProblema.trim().length < 20) {
          this.messageService.add({
            severity: 'error',
            summary: 'Descripción muy corta',
            detail: 'La descripción debe tener al menos 20 caracteres',
            life: 3000,
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  guardarReclamo(): void {
    this.guardando = true;

    let descripcionCompleta = this.descripcionProblema;

    if (this.productoSeleccionado && this.productoSeleccionado.cantidad > 1) {
      descripcionCompleta += `\n\n[UNIDADES AFECTADAS: ${this.unidadesAfectadas} de ${this.productoSeleccionado.cantidad}]`;

      if (this.identificacionUnidad.trim()) {
        descripcionCompleta += `\n[IDENTIFICACIÓN: ${this.identificacionUnidad.trim()}]`;
      }
    }

    const nuevoReclamo: Omit<Reclamo, 'id_reclamo'> = {
      id_sede: this.comprobanteSeleccionado!.id_sede,
      serie_comprobante: this.comprobanteSeleccionado!.serie,
      numero_comprobante: this.comprobanteSeleccionado!.numero,
      fecha_compra: this.comprobanteSeleccionado!.fec_emision,
      fecha_registro: new Date(),
      cliente_dni: this.clienteEncontrado!.num_doc,
      cliente_nombre: this.getNombreCliente(this.clienteEncontrado!),
      cliente_telefono: this.clienteEncontrado!.telefono || '',
      cliente_email: this.clienteEncontrado!.email || '',
      cod_producto: this.productoSeleccionado!.id_producto,
      descripcion_producto: this.productoSeleccionado!.descripcion,
      motivo: this.motivoSeleccionado,
      descripcion_problema: descripcionCompleta,
      estado: EstadoReclamo.PENDIENTE,
      observaciones: `Registrado por: ${this.empleadoActual?.nombres || 'Sistema'}`,
    };

    setTimeout(() => {
      const sub = this.reclamosService.crearReclamo(nuevoReclamo).subscribe({
        next: (reclamoCreado: Reclamo) => {
          this.guardando = false;
          this.reclamoGenerado = reclamoCreado;

          this.messageService.add({
            severity: 'success',
            summary: 'Reclamo registrado',
            detail: `Reclamo #${reclamoCreado.id_reclamo} creado exitosamente`,
            life: 3000,
          });
        },
        error: (error: any) => {
          console.error('Error al crear reclamo:', error);
          this.guardando = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo registrar el reclamo',
            life: 3000,
          });
        },
      });

      this.subscriptions.add(sub);
    }, 1500);
  }
  
  verDetalle(): void {
    if (this.reclamoGenerado) {
      const isAdmin = this.router.url.startsWith('/admin');
      const base = isAdmin ? '/admin/reclamos-listado' : '/ventas/reclamos-listado';
      this.router.navigate([`${base}/detalle`, this.reclamoGenerado.id_reclamo]);
    }
  }

  nuevoReclamo(): void {
    this.limpiarFormulario();
  }

  cancelar(): void {
    const isAdmin = this.router.url.startsWith('/admin');
    const base = isAdmin ? '/admin/reclamos-listado' : '/ventas/reclamos-listado';
    this.router.navigate([base]);
  }


  limpiarFormulario(): void {
    this.busquedaComprobante = null;
    this.clienteEncontrado = null;
    this.comprobantesCliente = [];
    this.comprobanteSeleccionado = null;
    this.productoSeleccionado = null;
    this.garantiaVigente = false;
    this.diasRestantes = 0;
    this.motivoSeleccionado = '';
    this.descripcionProblema = '';
    this.activeStep = 0;
    this.reclamoGenerado = null;
    this.sugerenciasComprobantesObj = [];
    this.tipoDocumento = 'DNI';
    this.resetearUnidades();

    this.messageService.add({
      severity: 'info',
      summary: 'Formulario limpiado',
      detail: 'Se han restablecido todos los campos',
      life: 2000,
    });
  }

  formatearComprobante(serie: string, numero: number): string {
    return `${serie}-${numero.toString().padStart(8, '0')}`;
  }

  getTipoComprobanteLabel(tipo: string): string {
    return tipo === '01' ? 'Factura' : tipo === '03' ? 'Boleta' : tipo;
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { AuthService } from '../../../auth/services/auth.service';
import { InventarioService } from '../../services/inventario.service';
import { ProductoService } from '../../../ventas/services/producto.service';

@Component({
  selector: 'app-ajuste-inventario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectButtonModule,
    InputNumberModule,
    TableModule,
    CardModule,
    SelectModule,
    ConfirmDialogModule,
    AutoCompleteModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './ajuste-inventario.html',
  styleUrl: './ajuste-inventario.css',
})
export class AjusteInventario implements OnInit {
  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private productosService = inject(ProductoService);
  private confirmationService = inject(ConfirmationService);

  tiposAjuste = [
    { label: 'Ingreso (+)', value: 'POS' },
    { label: 'Salida (-)', value: 'NEG' },
  ];

  productosSugeridos = signal<any[]>([]);
  buscandoProductos = signal<boolean>(false);
  productosTabla = signal<any[]>([]);
  guardando = signal<boolean>(false);

  ajusteForm = this.fb.group({
    productoInput: [null as any, Validators.required],
    warehouseId: [1, Validators.required],
    idSede: [null as number | null, Validators.required],
    tipo: ['POS', Validators.required],
    cantidad: [1 as number | null, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    const sedePorDefecto = currentUser?.idSede ? currentUser.idSede : 1;

    this.ajusteForm.patchValue({
      idSede: sedePorDefecto,
      warehouseId: sedePorDefecto,
    });
  }

  buscarProductoPorCodigo(event: any) {
    const query = event.query?.trim() || '';
    
    if (!query) {
      this.productosSugeridos.set([]);
      return;
    }

    this.buscandoProductos.set(true);

    this.productosService.buscarPorCodigo(query).subscribe({
      next: (resultados) => {
        const mapeados = resultados.map((prod: any) => ({
          ...prod,
          displayName: `${prod.codigo} - ${prod.descripcion || prod.nombre || 'Sin descripción'}`,
        }));
        
        this.productosSugeridos.set(mapeados);
        this.buscandoProductos.set(false);
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.productosSugeridos.set([]);
        this.buscandoProductos.set(false);
      }
    });
  }

  agregarATabla() {
    if (this.ajusteForm.invalid) return;

    const rawValue = this.ajusteForm.getRawValue();
    const productoInfo = rawValue.productoInput;
    const cantidadForm = rawValue.cantidad ?? 0;
    const stockActual = productoInfo.stock ?? 0;

    if (rawValue.tipo === 'NEG' && cantidadForm > stockActual) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cantidad insuficiente',
        detail: 'No hay stock suficiente para realizar la salida.',
      });
      return;
    }

    const finalQuantity = rawValue.tipo === 'POS' ? cantidadForm : -cantidadForm;
    const currentUser = this.authService.getCurrentUser();

    const itemTabla = {
      codigo: productoInfo.codigo,
      nombre: productoInfo.descripcion || productoInfo.nombre,
      tipo: rawValue.tipo,
      cantidad: cantidadForm,
      stock: stockActual,
      reason: rawValue.reason,
      dto: {
        productId: Number(productoInfo.id_producto || productoInfo.id),
        warehouseId: Number(rawValue.warehouseId),
        idSede: Number(rawValue.idSede),
        quantity: Number(finalQuantity),
        reason: String(rawValue.reason),
        userId: Number(currentUser?.userId || 0),
      },
    };

    this.productosTabla.update(tabla => [...tabla, itemTabla]);
    this.resetFormularioParcial();
  }

  guardarAjustes() {
    const tablaActual = this.productosTabla();
    if (tablaActual.length === 0) return;
    
    const productosNuevos = tablaActual.filter(
      (p) => p.stock === 0 || p.stock === null || p.stock === undefined
    );

    if (productosNuevos.length > 0) {
      this.confirmationService.confirm({
        header: 'Creación de Stock Inicial',
        message: `Has agregado <b>${productosNuevos.length} producto(s)</b> que no tienen registros previos en esta Sede/Almacén.<br><br>El sistema procederá a crear su registro de stock automáticamente con este ajuste positivo. ¿Deseas continuar?`,
        icon: 'pi pi-info-circle text-blue-500',
        acceptLabel: 'Sí, registrar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => this.ejecutarGuardado(),
      });
    } else {
      this.ejecutarGuardado();
    }
  }

  private ejecutarGuardado() {
    this.guardando.set(true);

    const currentUser = this.authService.getCurrentUser();
    const tablaActual = this.productosTabla();
    const motivoGeneral = tablaActual[0].reason || 'Ajuste manual múltiple';

    const payload = {
      userId: Number(currentUser?.userId || 0),
      reason: String(motivoGeneral),
      items: tablaActual.map((item) => ({
        productId: Number(item.dto.productId),
        warehouseId: Number(item.dto.warehouseId),
        idSede: Number(item.dto.idSede),
        quantity: Number(item.dto.quantity),
      })),
    };

    this.inventarioService.realizarAjusteManualMasivo(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Se guardó el ajuste masivo correctamente.`,
        });
        this.limpiarTodo();
      },
      error: (err) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al procesar el ajuste masivo.',
        });
      },
    });
  }

  eliminarDeTabla(index: number) {
    this.productosTabla.update(tabla => tabla.filter((_, i) => i !== index));
  }

  limpiarTabla() {
    this.productosTabla.set([]);
  }

  resetFormularioParcial() {
    this.ajusteForm.patchValue({
      productoInput: null,
      cantidad: 1,
      reason: '',
    });
  }

  limpiarTodo() {
    this.productosTabla.set([]);
    this.onCancel();
  }

  onCancel() {
    const currentUser = this.authService.getCurrentUser();
    const sedePorDefecto = currentUser?.idSede ? currentUser.idSede : 1;

    this.ajusteForm.reset({
      tipo: 'POS',
      cantidad: 1,
      idSede: sedePorDefecto,
      warehouseId: sedePorDefecto,
    });
    this.guardando.set(false);
  }
}

import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';

// Servicios
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
    AutoCompleteModule,
    TableModule
  ],
  providers: [MessageService],
  templateUrl: './ajuste-inventario.html',
  styleUrl: './ajuste-inventario.css',
})
export class AjusteInventario implements OnInit {
  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private productosService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);
  tiposAjuste = [
    { label: 'Ingreso (+)', value: 'POS' },
    { label: 'Salida (-)', value: 'NEG' },
  ];

  productosSugeridos: any[] = [];
  productosTabla: any[] = [];
  guardando = false;

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
    
    this.ajusteForm.patchValue({ idSede: sedePorDefecto });
  }

  buscarProductoPorCodigo(event: AutoCompleteCompleteEvent) {
    const query = event.query.trim();
    if (!query) {
      this.productosSugeridos = [];
      return;
    }
    this.productosService.buscarPorCodigo(query).subscribe({
      next: (resultados) => {
        this.productosSugeridos = resultados.map((prod: any) => ({
          ...prod,
          displayName: `${prod.codigo} - ${prod.descripcion}` 
        }));

        this.cdr.detectChanges(); 
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
      detail: 'No hay stock suficiente para realizar la salida.'
    });
      return;
    }

    const finalQuantity = rawValue.tipo === 'POS' ? cantidadForm : -cantidadForm;
    const currentUser = this.authService.getCurrentUser();

    const itemTabla = {
      codigo: productoInfo.codigo,
      nombre: productoInfo.descripcion, 
      tipo: rawValue.tipo,
      cantidad: cantidadForm,
      reason: rawValue.reason,
      dto: {
        productId: Number(productoInfo.id_producto),
        warehouseId: Number(rawValue.warehouseId),
        idSede: Number(rawValue.idSede),
        quantity: Number(finalQuantity),
        reason: String(rawValue.reason),
        userId: Number(currentUser?.userId || 0),
      }
    };

    this.productosTabla.push(itemTabla);
    this.resetFormularioParcial();
  }

  guardarAjustes() {
    if (this.productosTabla.length === 0) return;
    
    this.guardando = true;

    const currentUser = this.authService.getCurrentUser();
    const motivoGeneral = this.productosTabla[0].reason || 'Ajuste manual múltiple';

    const payload = {
      userId: Number(currentUser?.userId || 0),
      reason: String(motivoGeneral),
      items: this.productosTabla.map(item => ({
        productId: Number(item.dto.productId),
        warehouseId: Number(item.dto.warehouseId),
        idSede: Number(item.dto.idSede),
        quantity: Number(item.dto.quantity)
      }))
    };

    this.inventarioService.realizarAjusteManualMasivo(payload).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: `Se guardó el ajuste masivo de ${this.productosTabla.length} productos correctamente.` 
        });
        this.limpiarTodo();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Error al procesar el ajuste masivo.' 
        });
      },
      complete: () => {
        this.guardando = false;
      }
    });
  }

  eliminarDeTabla(index: number) {
    this.productosTabla.splice(index, 1);
  }

  limpiarTabla() {
    this.productosTabla = [];
  }

  resetFormularioParcial() {
    this.ajusteForm.patchValue({
      productoInput: null,
      cantidad: 1,
      reason: ''
    });
    this.productosSugeridos = [];
  }

  limpiarTodo() {
    this.productosTabla = [];
    this.onCancel();
  }

  onCancel() {
    const currentUser = this.authService.getCurrentUser();
    this.ajusteForm.reset({ 
      tipo: 'POS', 
      cantidad: 1, 
      idSede: currentUser?.idSede ? currentUser.idSede : 1,
      warehouseId: 1
    });
    this.productosSugeridos = [];
    this.guardando = false;
  }
}

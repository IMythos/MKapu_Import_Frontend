import { Component, inject, model, output, signal, computed, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

import { VentasService } from '../../../../core/services/ventas.service';
import { RemissionService } from '../../../services/remission.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-nueva-remision',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    TableModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './nueva-remision.html',
  styleUrl: './nueva-remision.css',
})
export class NuevaRemision implements OnInit {
  private fb = inject(FormBuilder);
  private ventasService = inject(VentasService);
  private remissionService = inject(RemissionService);
  private messageService = inject(MessageService);

  abierto = model<boolean>(false);
  onHide = output<void>();

  remissionForm!: FormGroup;

  saleFound = signal<any | null>(null);
  isLoading = signal(false);

  itemsWeights = signal<any[]>([]);

  pesoBrutoTotal = computed(() => {
    const weights = this.itemsWeights();
    const total = weights.reduce((acc, curr) => acc + (Number(curr.peso_total) || 0), 0);
    return parseFloat(total.toFixed(3));
  });

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.remissionForm = this.fb.group({
      id_comprobante_ref: [null, Validators.required],
      id_almacen_origen: [null, Validators.required],
      id_sede_origen: ['', Validators.required],
      tipo_guia: [0, Validators.required],
      modalidad: [1, Validators.required],
      fecha_inicio_traslado: [new Date(), Validators.required],
      motivo_traslado: ['VENTA', Validators.required],
      unidad_peso: ['KGM', Validators.required],
      descripcion: [''],
      datos_traslado: this.fb.group({
        ubigeo_origen: ['150101', Validators.required],
        direccion_origen: ['Almacén Principal', Validators.required],
        ubigeo_destino: ['', Validators.required],
        direccion_destino: ['', Validators.required],
      }),

      datos_transporte: this.fb.group({
        nombre_completo: [''],
        tipo_documento: ['DNI'],
        numero_documento: [''],
        licencia: [''],
        placa: [''],
        ruc: [''],
        razon_social: [''],
      }),

      items: this.fb.array([]),
    });

    this.remissionForm
      .get('modalidad')
      ?.valueChanges.subscribe((val) => this.ajustarValidadoresTransporte(val));
    this.items.valueChanges.subscribe(() => {
      this.items.controls.forEach((control) => {
        const cant = Number(control.get('cantidad')?.value) || 0;
        const pesoU = Number(control.get('peso_unitario')?.value) || 0;
        const nuevoTotal = cant * pesoU;

        if (control.get('peso_total')?.value !== nuevoTotal) {
          control.get('peso_total')?.setValue(nuevoTotal, { emitEvent: false });
        }
      });

      this.itemsWeights.set(this.items.getRawValue());
    });
  }

  get items(): FormArray {
    return this.remissionForm.get('items') as FormArray;
  }

  buscarComprobante(correlativo: string) {
    if (!correlativo) return;
    this.isLoading.set(true);

    this.ventasService.getVentaByCorrelativo(correlativo).subscribe({
      next: (venta) => {
        this.saleFound.set(venta);
        this.cargarDatosVenta(venta);
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Venta no encontrada',
        });
        this.isLoading.set(false);
        this.saleFound.set(null);
        this.items.clear();
      },
    });
  }

  private cargarDatosVenta(venta: any) {
    this.remissionForm.patchValue({
      id_comprobante_ref: venta.id,
      id_almacen_origen: venta.id_almacen,
      id_sede_origen: venta.id_sede.toString(),
      datos_traslado: {
        direccion_destino: venta.cliente_direccion || '',
        ubigeo_destino: venta.cliente_ubigeo || ''
      },
    });

    this.items.clear();
    if (venta.detalles && venta.detalles.length > 0) {
      venta.detalles.forEach((d: any) => {
        this.items.push(this.fb.group({
          id_producto: [d.id_producto],
          cod_prod: [d.cod_prod],
          cantidad: [Number(d.cantidad)],
          peso_unitario: [{ value: Number(d.peso_unitario), disabled: true }],
          peso_total: [Number(d.peso_total)]
        }));
      });
    }
    this.itemsWeights.set(this.items.getRawValue());
  }

  calcularLinea(group: FormGroup) {
    const cant = group.get('cantidad')?.value || 0;
    const unit = group.get('peso_unitario')?.value || 0;
    const total = Number((cant * unit).toFixed(3));

    group.get('peso_total')?.setValue(total, { emitEvent: false });
    this.sincronizarSignals();
  }

  sincronizarSignals() {
    this.itemsWeights.set(this.items.getRawValue());
  }

  enviar() {
    if (this.remissionForm.invalid) {
      this.remissionForm.markAllAsTouched();
      return;
    }
    const formValue = this.remissionForm.getRawValue();
    const payload = {
      ...formValue,
      peso_bruto_total: this.pesoBrutoTotal(),
      id_usuario: 1,
      fecha_inicio_traslado: formValue.fecha_inicio_traslado.toISOString(),
    };

    this.remissionService.create(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Guía ${res.serie_numero} generada`,
        });
        this.cerrar();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al emitir guía',
        });
      },
    });
  }
  
  private ajustarValidadoresTransporte(modalidad: number) {
    const transport = this.remissionForm.get('datos_transporte');
    if (modalidad === 1) {
      transport?.get('nombre_completo')?.setValidators(Validators.required);
      transport?.get('placa')?.setValidators(Validators.required);
      transport?.get('ruc')?.clearValidators();
      transport?.get('razon_social')?.clearValidators();
    } else {
      transport?.get('ruc')?.setValidators(Validators.required);
      transport?.get('razon_social')?.setValidators(Validators.required);
      transport?.get('nombre_completo')?.clearValidators();
      transport?.get('placa')?.clearValidators();
    }
    transport?.get('nombre_completo')?.updateValueAndValidity();
    transport?.get('placa')?.updateValueAndValidity();
    transport?.get('ruc')?.updateValueAndValidity();
    transport?.get('razon_social')?.updateValueAndValidity();
  }

  cerrar() {
    this.abierto.set(false);
    this.onHide.emit();
    this.remissionForm.reset();
    this.saleFound.set(null);
  }
  
}

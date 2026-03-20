import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { filter, switchMap, catchError, tap, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';

import { VentasService } from '../../../../core/services/ventas.service';
import { RemissionService } from '../../../services/remission.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SunatService, ReniecDniResponse } from '../../../services/sunat.service';
import { TagModule } from 'primeng/tag';
import { CreateRemissionDto } from '../../../interfaces/remision.interface';

@Component({
  selector: 'app-nueva-remision',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    TableModule,
    ToastModule,
    CardModule,
    TagModule,
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
  private sunatService = inject(SunatService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  correlativoInicial = signal<string>('');
  remissionForm!: FormGroup;

  saleFound = signal<any | null>(null);
  isLoading = signal(false);
  buscandoRuc = signal(false);
  itemsWeights = signal<any[]>([]);

  pesoBrutoTotal = computed(() => {
    const weights = this.itemsWeights();
    const total = weights.reduce((acc, curr) => acc + (Number(curr.peso_total) || 0), 0);
    return parseFloat(total.toFixed(3));
  });

  ngOnInit() {
    this.initForm();
    
    this.route.queryParams.subscribe(params => {
      const comprobanteRef = params['comprobanteRef'];
      const correlativo = params['correlativo']; 
      
      const paramAUsar = comprobanteRef || correlativo;

      if (paramAUsar) {
        this.correlativoInicial.set(paramAUsar);
        this.buscarComprobante(paramAUsar);
      }
    });
  }

  initForm() {
    this.remissionForm = this.fb.group({
      id_comprobante_ref: [null, Validators.required],
      id_almacen_origen: [null, Validators.required],
      id_sede_ref: ['', Validators.required],
      tipo_guia: ['0', Validators.required],
      modalidad: [1, Validators.required],
      fecha_inicio: [new Date(), Validators.required],
      motivo_traslado: ['VENTA', Validators.required],
      unidad_peso: ['KGM', Validators.required],
      descripcion: [''],
      datos_traslado: this.fb.group({
        ubigeo_origen: ['150101', Validators.required],
        direccion_origen: ['Almacén Principal', Validators.required],
        // ✅ Se agregó validación de regex para asegurar exactamente 6 números
        ubigeo_destino: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        direccion_destino: ['', Validators.required],
      }),

      datos_transporte: this.fb.group({
        nombre_completo: [''],
        tipo_documento: ['DNI'],
        numero_documento: [''], 
        licencia: [''],
        placa: [''],
        ruc: [''],
        razon_social: [{ value: '', disabled: true }],
      }),

      items: this.fb.array([]),
    });

    this.remissionForm
      .get('modalidad')
      ?.valueChanges.subscribe((val) => this.ajustarValidadoresTransporte(val));
      
    // Inicializar validadores para modo por defecto
    this.ajustarValidadoresTransporte(1);

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

    this.configurarAutocompletadoRuc();
  }

  private configurarAutocompletadoRuc() {
    const rucControl = this.remissionForm.get('datos_transporte.ruc');
    
    rucControl?.valueChanges.pipe(
      filter((ruc): ruc is string => typeof ruc === 'string' && /^\d{11}$/.test(ruc)),
      distinctUntilChanged(),
      tap(() => {
        this.buscandoRuc.set(true);
        this.remissionForm.get('datos_transporte.razon_social')?.setValue('', { emitEvent: false });
      }),
      switchMap((ruc) => this.sunatService.consultarRuc(ruc).pipe(
        catchError((err) => {
          this.buscandoRuc.set(false);
          this.messageService.add({
            severity: 'warn',
            summary: 'Atención',
            detail: err.error?.message || 'RUC no encontrado',
          });
          return of(null);
        })
      ))
    ).subscribe((res: ReniecDniResponse | null) => {
      this.buscandoRuc.set(false);
      
      if (res && res.razonSocial) {
        this.remissionForm.get('datos_transporte.razon_social')?.setValue(res.razonSocial);
        this.messageService.add({
          severity: 'success',
          summary: 'RUC Validado',
          detail: 'Razón social autocompletada exitosamente'
        });
      }
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
    const comprobanteActual = this.correlativoInicial();
    const idSede = (venta.id_sede || venta.sedeId)?.toString() || '';

    this.remissionForm.patchValue({
      id_comprobante_ref: venta.id,
      id_almacen_origen: venta.id_almacen || venta.almacenId, 
      id_sede_ref: idSede,
      motivo_traslado: 'VENTA',
      descripcion: `Traslado de mercadería por venta ${comprobanteActual}`,
      datos_traslado: {
        direccion_destino: venta.cliente_direccion || venta.clienteDireccion || '',
        ubigeo_destino: venta.cliente_ubigeo || venta.clienteUbigeo || ''
      },
    });

    this.items.clear();
    
    if (venta.detalles && venta.detalles.length > 0) {
      venta.detalles.forEach((d: any) => {
        const idProd = d.id_producto || d.productoId;
        const codProd = d.cod_prod || d.codigoProducto || d.codigo;
        const cant = Number(d.cantidad);
        const pesoU = Number(d.peso_unitario || d.pesoUnitario || 0);
        const pesoT = Number(d.peso_total || (cant * pesoU));

        this.items.push(this.fb.group({
          id_producto: [idProd],
          cod_prod: [codProd],
          cantidad: [cant, [Validators.required, Validators.min(1)]],
          peso_unitario: [{ value: pesoU, disabled: true }],
          peso_total: [pesoT]
        }));
      });
    }
    
    this.itemsWeights.set(this.items.getRawValue());
    
    this.messageService.add({
      severity: 'info',
      summary: 'Datos cargados',
      detail: `Se cargaron ${venta.detalles?.length || 0} productos de la venta.`
    });
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Por favor, revise los campos marcados en rojo.',
      });
      return;
    }
    
    this.isLoading.set(true);
    const formValue = this.remissionForm.getRawValue(); 
    
    const cantidadTotal = formValue.items.reduce((acc: number, curr: any) => acc + (Number(curr.cantidad) || 0), 0);

    const payload: CreateRemissionDto = {
      id_comprobante_ref: Number(formValue.id_comprobante_ref),
      id_almacen_origen: Number(formValue.id_almacen_origen),
      id_sede_origen: String(formValue.id_sede_ref),
      id_usuario: 1,
      tipo_guia: Number(formValue.tipo_guia),
      modalidad: Number(formValue.modalidad),
      fecha_inicio_traslado: formValue.fecha_inicio.toISOString(),
      motivo_traslado: formValue.motivo_traslado,
      peso_bruto_total: this.pesoBrutoTotal(),
      unidad_peso: formValue.unidad_peso,
      descripcion: formValue.descripcion,
      observaciones: formValue.descripcion,
      cantidad: cantidadTotal,
      razon_social: formValue.modalidad === 0 ? formValue.datos_transporte.razon_social : formValue.datos_transporte.nombre_completo,
      datos_traslado: formValue.datos_traslado,
      datos_transporte: formValue.datos_transporte,
      items: formValue.items 
    };

    this.remissionService.create(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Guía ${res.serie_numero || 'generada exitosamente'}`,
        });
        setTimeout(() => {
          this.cerrar();
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al emitir guía',
        });
      },
    });
  }
  
  private ajustarValidadoresTransporte(modalidad: number) {
    const transport = this.remissionForm.get('datos_transporte') as FormGroup;
    if (modalidad === 1) { // Privado
      transport.get('nombre_completo')?.setValidators(Validators.required);
      // ✅ Regex: Solo acepta de 8 a 11 números
      transport.get('numero_documento')?.setValidators([Validators.required, Validators.pattern(/^\d{8,11}$/)]);
      // ✅ Regex: Acepta exactamente formato ABC-123
      transport.get('placa')?.setValidators([Validators.required, Validators.pattern(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/)]);
      transport.get('licencia')?.setValidators(Validators.required);
      transport.get('ruc')?.clearValidators();
      transport.get('razon_social')?.clearValidators();
    } else { // Público
      transport.get('ruc')?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
      transport.get('razon_social')?.setValidators(Validators.required);
      transport.get('nombre_completo')?.clearValidators();
      transport.get('numero_documento')?.clearValidators();
      transport.get('placa')?.clearValidators();
      transport.get('licencia')?.clearValidators();
    }
    
    Object.keys(transport.controls).forEach(key => {
      transport.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  buscarRucTransportista() {
    const rucControl = this.remissionForm.get('datos_transporte.ruc');
    const ruc = rucControl?.value;

    if (!ruc || ruc.length !== 11) {
      return;
    }

    this.buscandoRuc.set(true);
    this.remissionForm.get('datos_transporte.razon_social')?.setValue('');

    this.sunatService.consultarRuc(ruc).subscribe({
      next: (res: ReniecDniResponse) => { 
        this.buscandoRuc.set(false);
        
        if (res && res.razonSocial) {
          this.remissionForm.get('datos_transporte.razon_social')?.setValue(res.razonSocial);
          this.messageService.add({
            severity: 'success',
            summary: 'RUC Encontrado',
            detail: 'Razón social autocompletada'
          });
        }
      },
      error: (err) => {
        this.buscandoRuc.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Atención',
          detail: err.error?.message || 'No se pudo encontrar el RUC ingresado',
        });
      }
    });
  }

  cerrar() {
    this.router.navigate(['/logistica/remision']);
  }


  allowOnlyNumbers(event: Event, controlPath: string) {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.replace(/[^0-9]/g, '');
    this.remissionForm.get(controlPath)?.setValue(cleanValue, { emitEvent: false });
  }

  formatPlaca(event: Event) {
    const input = event.target as HTMLInputElement;
    let cleanValue = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    
    if (cleanValue.length > 3) {
      cleanValue = cleanValue.substring(0, 3) + '-' + cleanValue.substring(3);
    }
    
    this.remissionForm.get('datos_transporte.placa')?.setValue(cleanValue, { emitEvent: false });
  }

  forceUppercase(event: Event, controlPath: string) {
    const input = event.target as HTMLInputElement;
    this.remissionForm.get(controlPath)?.setValue(input.value.toUpperCase(), { emitEvent: false });
  }
}

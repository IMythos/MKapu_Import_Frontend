// src/app/administracion/pages/gestion-proveedor/proveedor-formulario/proveedor-formulario.ts

import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { ProveedorService } from '../../../services/proveedor.service';
import { 
  SupplierResponse, 
  CreateSupplierRequest, 
  UpdateSupplierRequest 
} from '../../../interfaces/supplier.interface';

@Component({
  selector: 'app-proveedor-formulario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    InputTextModule,
    CardModule,
    ConfirmDialog,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './proveedor-formulario.html',
  styleUrls: ['./proveedor-formulario.css'],
  providers: [ConfirmationService, MessageService],
})
export class ProveedorFormulario implements OnInit, OnDestroy {
  proveedorForm: FormGroup;
  
  // Signals
  isEditMode = signal(false);
  proveedorId = signal<number | null>(null);
  proveedorOriginal = signal<SupplierResponse | null>(null);
  loading = signal(false);
  navegando = signal(false);
  
  // Computed
  tituloFormulario = computed(() => 
    this.isEditMode() ? 'Editar Proveedor' : 'Nuevo Proveedor'
  );
  
  iconoFormulario = computed(() => 
    this.isEditMode() ? 'pi pi-pencil' : 'pi pi-plus-circle'
  );
  
  labelBotonGuardar = computed(() => 
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );
  
  iconoBotonGuardar = computed(() => 
    this.isEditMode() ? 'pi pi-refresh' : 'pi pi-check'
  );

  returnUrl = '/admin/proveedores';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    this.proveedorForm = this.fb.group({
      razon_social: ['', [Validators.required, Validators.minLength(3)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      contacto: [''],
      email: ['', [Validators.email]],
      telefono: ['', [Validators.pattern(/^\d{7,15}$/)]],
      dir_fiscal: [''],
    });

    effect(() => {
      if (this.isEditMode()) {
        console.log('Modo edición activado para ID:', this.proveedorId());
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.proveedorId.set(+params['id']);
        this.cargarProveedor(+params['id']);
      } else {
        this.isEditMode.set(false);
        this.proveedorId.set(null);
        this.proveedorOriginal.set(null);
      }
    });
  }

  ngOnDestroy() {
    this.confirmationService.close();
  }

  cargarProveedor(id: number) {
    this.loading.set(true);
    
    this.proveedorService.getSupplierById(id).subscribe({
      next: (proveedor: SupplierResponse) => {
        this.proveedorOriginal.set(proveedor);

        this.proveedorForm.patchValue({
          razon_social: proveedor.razon_social,
          ruc: proveedor.ruc,
          contacto: proveedor.contacto || '',
          email: proveedor.email || '',
          telefono: proveedor.telefono || '',
          dir_fiscal: proveedor.dir_fiscal || '',
        });

        Promise.resolve().then(() => {
          this.proveedorForm.markAsPristine();
          this.proveedorForm.markAsUntouched();
          this.loading.set(false);
        });
      },
      error: (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Proveedor no encontrado',
          life: 3000,
        });
        this.loading.set(false);
        this.volverSinConfirmar();
      }
    });
  }

  hayaCambios(): boolean {
    if (!this.isEditMode() || !this.proveedorOriginal()) {
      const formData = this.proveedorForm.value;
      return (
        (formData.razon_social && formData.razon_social.trim() !== '') ||
        (formData.ruc && formData.ruc.trim() !== '') ||
        (formData.contacto && formData.contacto.trim() !== '') ||
        (formData.email && formData.email.trim() !== '') ||
        (formData.telefono && formData.telefono.trim() !== '') ||
        (formData.dir_fiscal && formData.dir_fiscal.trim() !== '')
      );
    }

    const formData = this.proveedorForm.value;
    const original = this.proveedorOriginal()!;

    return (
      String(formData.razon_social || '').trim() !== String(original.razon_social || '').trim() ||
      String(formData.ruc || '').trim() !== String(original.ruc || '').trim() ||
      String(formData.contacto || '').trim() !== String(original.contacto || '').trim() ||
      String(formData.email || '').trim() !== String(original.email || '').trim() ||
      String(formData.telefono || '').trim() !== String(original.telefono || '').trim() ||
      String(formData.dir_fiscal || '').trim() !== String(original.dir_fiscal || '').trim()
    );
  }

  guardar() {
    if (!this.proveedorForm.valid) {
      Object.keys(this.proveedorForm.controls).forEach((key) => {
        this.proveedorForm.get(key)?.markAsTouched();
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Por favor complete todos los campos requeridos correctamente',
        life: 3000,
      });
      return;
    }

    const formData = this.proveedorForm.value;

    if (this.isEditMode() && this.proveedorId()) {
      this.confirmarActualizacion(formData);
    } else {
      this.confirmarCreacion(formData);
    }
  }

  private confirmarActualizacion(formData: any) {
    this.confirmationService.confirm({
      message: `¿Seguro que deseas actualizar el proveedor <strong>${formData.razon_social}</strong>?`,
      header: 'Confirmar Actualización',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Actualizar',
      acceptButtonProps: { severity: 'warning' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.loading.set(true);
        
        const updateData: UpdateSupplierRequest = {
          razon_social: formData.razon_social,
          ruc: formData.ruc,
          contacto: formData.contacto || undefined,
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          dir_fiscal: formData.dir_fiscal || undefined,
        };

        this.proveedorService.updateSupplier(this.proveedorId()!, updateData).subscribe({
          next: (response: SupplierResponse) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Proveedor Actualizado',
              detail: `"${response.razon_social}" actualizado correctamente`,
              life: 2500,
            });

            this.loading.set(false);
            
            setTimeout(() => {
              this.cargarProveedor(this.proveedorId()!);
            }, 500);
          },
          error: (error: Error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Error al actualizar el proveedor',
              life: 3000,
            });
            this.loading.set(false);
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Actualización cancelada',
          life: 2000,
        });
      },
    });
  }

  private confirmarCreacion(formData: any) {
    this.confirmationService.confirm({
      message: `¿Seguro que deseas crear el proveedor <strong>${formData.razon_social}</strong>?`,
      header: 'Confirmar Creación',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Crear',
      acceptButtonProps: { severity: 'warning' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.loading.set(true);

        const newProveedor: CreateSupplierRequest = {
          razon_social: formData.razon_social,
          ruc: formData.ruc,
          contacto: formData.contacto || undefined,
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          dir_fiscal: formData.dir_fiscal || undefined,
        };

        this.proveedorService.createSupplier(newProveedor).subscribe({
          next: (response: SupplierResponse) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Proveedor Creado',
              detail: `"${response.razon_social}" creado correctamente`,
              life: 2500,
            });
            
            this.loading.set(false);
            
            Promise.resolve().then(() => {
              setTimeout(() => this.volverSinConfirmar(), 1000);
            });
          },
          error: (error: Error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Error al crear el proveedor',
              life: 3000,
            });
            this.loading.set(false);
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Creación cancelada',
          life: 2000,
        });
      },
    });
  }

  volver() {
    if (!this.hayaCambios()) {
      this.volverSinConfirmar();
      return;
    }

    const mensaje = this.isEditMode() && this.proveedorOriginal()
      ? `¿Seguro que deseas cancelar la edición de <strong>${this.proveedorOriginal()!.razon_social}</strong>?<br>Se perderán los cambios realizados.`
      : `¿Seguro que deseas cancelar la creación del proveedor?<br>Se perderán los datos ingresados.`;

    const header = this.isEditMode() ? 'Cancelar Edición' : 'Cancelar Creación';

    this.confirmationService.confirm({
      message: mensaje,
      header: header,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Quedarme',
      acceptLabel: 'Salir',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: this.isEditMode() ? 'Edición Cancelada' : 'Creación Cancelada',
          detail: this.isEditMode()
            ? `Edición de "${this.proveedorOriginal()?.razon_social}" cancelada`
            : 'Creación de proveedor cancelada',
          life: 2000,
        });
        Promise.resolve().then(() => {
          setTimeout(() => this.volverSinConfirmar(), 500);
        });
      },
    });
  }

  volverSinConfirmar() {
    if (this.navegando()) return;

    this.navegando.set(true);

    Promise.resolve().then(() => {
      this.router
        .navigate([this.returnUrl])
        .then(() => {
          this.navegando.set(false);
        })
        .catch(() => {
          this.navegando.set(false);
        });
    });
  }

  // Validaciones personalizadas para mostrar en template
  get rucInvalido(): boolean {
    const ruc = this.proveedorForm.get('ruc');
    return !!(ruc?.invalid && ruc?.touched);
  }

  get emailInvalido(): boolean {
    const email = this.proveedorForm.get('email');
    return !!(email?.invalid && email?.touched && email?.value);
  }

  get telefonoInvalido(): boolean {
    const telefono = this.proveedorForm.get('telefono');
    return !!(telefono?.invalid && telefono?.touched && telefono?.value);
  }
}

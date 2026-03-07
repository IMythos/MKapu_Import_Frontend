import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';

import { AuthService } from '../../../../../auth/services/auth.service';
import { DispatchService } from '../../../../services/dispatch.service';
import { SedeAlmacenService } from '../../../../services/sede-almacen.service';
import { CreateDispatchRequest } from '../../../../interfaces/dispatch.interfaces';

interface DetalleForm {
  id_producto: number | null;
  cantidad_solicitada: number;
}

@Component({
  selector: 'app-agregar-despacho',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TooltipModule,
    TextareaModule,
  ],
  templateUrl: './agregar-despacho.html',
  styleUrl: './agregar-despacho.css',
  providers: [MessageService],
})
export class AgregarDespacho implements OnInit {

  private readonly authService        = inject(AuthService);
  private readonly dispatchService    = inject(DispatchService);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private readonly messageService     = inject(MessageService);
  private readonly router             = inject(Router);

  readonly tituloKicker    = 'ADMINISTRADOR - DESPACHO - PRODUCTOS';
  readonly subtituloKicker = 'NUEVO DESPACHO';
  readonly iconoCabecera   = 'pi pi-plus-circle';

  loading         = signal(false);
  idUsuarioActual = signal<string>('0');

  id_venta_ref      = signal<number | null>(null);
  id_almacen_origen = signal<number | null>(null);
  direccion_entrega = signal<string>('');
  observacion       = signal<string>('');

  almacenesOptions = signal<{ label: string; value: number }[]>([]);
  almacenesLoading = signal(false);

  detalles = signal<DetalleForm[]>([
    { id_producto: null, cantidad_solicitada: 1 }
  ]);

  readonly almacenLabel = computed(() =>
    this.almacenesOptions().find(a => a.value === this.id_almacen_origen())?.label ?? '—'
  );

  readonly formularioValido = computed(() =>
    (this.id_venta_ref() ?? 0) > 0 &&
    (this.id_almacen_origen() ?? 0) > 0 &&
    this.direccion_entrega().trim().length > 0 &&
    this.detalles().length > 0 &&
    this.detalles().every(d => (d.id_producto ?? 0) > 0 && d.cantidad_solicitada > 0)
  );

  ngOnInit(): void {
    this.cargarSesion();
    this.cargarAlmacenes();
  }

  private cargarSesion(): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.idUsuarioActual.set(user.userId?.toString() ?? '0');
  }

  private cargarAlmacenes(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.idSede) return;

    this.almacenesLoading.set(true);
    this.sedeAlmacenService.loadWarehouseOptionsBySede(user.idSede).subscribe({
      next: (opts) => {
        this.almacenesOptions.set(opts);
        this.almacenesLoading.set(false);
      },
      error: () => {
        this.almacenesLoading.set(false);
        this.messageService.add({ severity: 'warn', summary: 'Almacenes', detail: 'No se pudieron cargar los almacenes' });
      },
    });
  }

  agregarDetalle(): void {
    this.detalles.update(list => [...list, { id_producto: null, cantidad_solicitada: 1 }]);
  }

  eliminarDetalle(index: number): void {
    if (this.detalles().length === 1) {
      this.messageService.add({ severity: 'warn', summary: 'Mínimo requerido', detail: 'Debe haber al menos un producto' });
      return;
    }
    this.detalles.update(list => list.filter((_, i) => i !== index));
  }

  actualizarDetalle(index: number, campo: keyof DetalleForm, valor: any): void {
    this.detalles.update(list => {
      const nueva = [...list];
      nueva[index] = { ...nueva[index], [campo]: valor };
      return nueva;
    });
  }

  guardarDespacho(): void {
    if (!this.formularioValido()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Complete todos los campos obligatorios.' });
      return;
    }

    this.loading.set(true);

    const payload: CreateDispatchRequest = {
      id_venta_ref:      this.id_venta_ref()!,
      id_usuario_ref:    this.idUsuarioActual(),
      id_almacen_origen: this.id_almacen_origen()!,
      direccion_entrega: this.direccion_entrega().trim(),
      observacion:       this.observacion().trim() || undefined,
      detalles: this.detalles().map(d => ({
        id_producto:         d.id_producto!,
        cantidad_solicitada: d.cantidad_solicitada,
      })),
    };

    this.dispatchService.createDispatch(payload).subscribe({
      next: (despacho) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary:  '¡Despacho Creado!',
          detail:   `Despacho #${despacho.id_despacho} registrado correctamente.`,
          life:     3000,
        });
        setTimeout(() => this.router.navigate(['/admin/despacho-productos/listado-despacho']), 1500);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al crear despacho',
          detail:   err?.error?.message ?? 'Verifica los datos ingresados.',
        });
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/despacho-productos/listado-despacho']);
  }
}
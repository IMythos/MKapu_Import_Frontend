import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, OnInit, Directive, HostListener, ElementRef } from '@angular/core';
import { FormsModule, NgForm, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Observable, Subject } from 'rxjs';
import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';
import { AlmacenService } from '../../../../services/almacen.service';
import { DEPARTAMENTOS_PROVINCIAS } from '../../../../shared/data/departamentos-provincias';
import { HttpErrorResponse } from '@angular/common/http';

// Directiva para bloquear números en autocomplete (standalone)
@Directive({
  selector: '[appNoNumbers]',
  standalone: true
})
export class NoNumbersDirective {
  constructor(private el: ElementRef) {}

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.includes(event.key)) return true;
    if (!regex.test(event.key)) { event.preventDefault(); return false; }
    return true;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): boolean {
    const pastedText = event.clipboardData?.getData('text') || '';
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (!regex.test(pastedText)) { event.preventDefault(); return false; }
    return true;
  }
}

interface Provincia { nombre: string; distritos: string[]; }

@Component({
  selector: 'app-editar-almacen',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule,
    ToastModule,
    AutoCompleteModule,
    MessageModule,
    NoNumbersDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './editar-almacen.html',
  styleUrls: ['./editar-almacen.css'],
})
export class AlmacenEditar implements OnInit, CanComponentDeactivate {
  @ViewChild('almacenForm') almacenForm?: NgForm;

  private allowNavigate = false;
  submitted = false;
  almacenId: number | null = null;

  almacen = {
    codigo: '',
    nombre: '',
    departamento: '',
    provincia: '',
    ciudad: '',
    telefono: '' as string | null,
    direccion: '',
  };

  departamentos = Object.keys(DEPARTAMENTOS_PROVINCIAS);
  filteredDepartamentos: string[] = [];

  provincias: string[] = [];
  filteredProvincias: string[] = [];

  distritos: string[] = [];
  filteredDistritos: string[] = [];

  private readonly almacenService = inject(AlmacenService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = this.almacenService.loading;
  readonly error = this.almacenService.error;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idFromParam = params.get('id');
      const idFromQuery = this.route.snapshot.queryParamMap.get('id');
      const idStr = idFromParam ?? idFromQuery;

      if (!idStr) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se recibió el ID del almacén.' });
        setTimeout(() => this.router.navigate(['/admin/almacen']), 1000);
        return;
      }

      const id = parseInt(idStr, 10);
      if (Number.isNaN(id)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID inválido.' });
        setTimeout(() => this.router.navigate(['/admin/almacen']), 1000);
        return;
      }

      this.almacenId = id;
      this.loadAlmacen();
    });
  }


  private loadAlmacen(): void {
    if (!this.almacenId) return;

    this.almacenService.getAlmacenById(this.almacenId).subscribe({
      next: (data) => {
        this.almacen = {
          codigo: data.codigo ?? '',
          nombre: data.nombre ?? '',
          departamento: data.departamento ?? '',
          provincia: '', 
          ciudad: data.ciudad ?? '',
          telefono: data.telefono ?? '',
          direccion: data.direccion ?? '',
        };
        this.initializeProvinciaFromCiudad();
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractServerMessage(err) });
      },
    });
  }

  private initializeProvinciaFromCiudad(): void {
    const dept = this.almacen.departamento;
    const ciudad = this.almacen.ciudad;
    const provinciasData: Provincia[] = DEPARTAMENTOS_PROVINCIAS[dept] || [];

    const provinciaEncontrada = provinciasData.find(p => p.distritos.includes(ciudad));
    if (provinciaEncontrada) {
      this.almacen.provincia = provinciaEncontrada.nombre;
      this.provincias = provinciasData.map(p => p.nombre);
      this.distritos = provinciaEncontrada.distritos;
    } else {
      this.provincias = provinciasData.map(p => p.nombre);
      this.distritos = [];
    }
  }

  toUpperCase(field: 'codigo' | 'nombre' | 'direccion'): void {
    this.almacen[field] = (this.almacen[field] ?? '').toString().toUpperCase();
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    return regex.test(event.key) || event.key === 'Backspace' || event.key === 'Tab';
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const regex = /^[0-9]$/;
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.includes(event.key)) return true;
    if (!regex.test(event.key)) { event.preventDefault(); return false; }
    return true;
  }

  filterDepartamentos(event: { query: string }): void {
    const q = (event.query ?? '').toLowerCase();
    this.filteredDepartamentos = this.departamentos.filter(dept => dept.toLowerCase().includes(q));
  }

  filterProvincias(event: { query: string }): void {
    const q = (event.query ?? '').toLowerCase();
    this.filteredProvincias = this.provincias.filter(prov => prov.toLowerCase().includes(q));
  }

  filterDistritos(event: { query: string }): void {
    const q = (event.query ?? '').toLowerCase();
    this.filteredDistritos = this.distritos.filter(dist => dist.toLowerCase().includes(q));
  }

  onDepartamentoSelect(): void {
    const dept = this.almacen.departamento;
    const provinciasData: Provincia[] = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    this.provincias = provinciasData.map(p => p.nombre);
    this.almacen.provincia = '';
    this.almacen.ciudad = '';
    this.distritos = [];
    this.filteredProvincias = [];
    this.filteredDistritos = [];
  }

  onProvinciaSelect(): void {
    const dept = this.almacen.departamento;
    const prov = this.almacen.provincia;
    const provinciasData: Provincia[] = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    const provinciaSeleccionada = provinciasData.find(p => p.nombre === prov);
    this.distritos = provinciaSeleccionada?.distritos || [];
    this.almacen.ciudad = '';
    this.filteredDistritos = [];
  }

  private extractServerMessage(err: any): string {
    try {
      if (!err) return 'Error desconocido';
      if ((err as any).friendlyMessage) return String((err as any).friendlyMessage);
      if (err.error) {
        if (typeof err.error === 'string') return err.error;
        if (err.error.message) return Array.isArray(err.error.message) ? err.error.message.join(', ') : String(err.error.message);
        if (err.error.error) return String(err.error.error);
        return JSON.stringify(err.error);
      }
      return err.message ?? 'Error del servidor';
    } catch {
      return 'Error procesando la respuesta del servidor';
    }
  }

  updateAlmacen(): void {
    this.submitted = true;

    if (!this.almacenId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el ID del almacén.' });
      return;
    }

    if (!this.departamentos.includes(this.almacen.departamento)) {
      this.messageService.add({ severity: 'warn', summary: 'Departamento inválido', detail: 'Seleccione un departamento de la lista.' });
      return;
    }

    if (!this.provincias.includes(this.almacen.provincia)) {
      this.messageService.add({ severity: 'warn', summary: 'Provincia inválida', detail: 'Seleccione una provincia de la lista.' });
      return;
    }

    if (!this.distritos.includes(this.almacen.ciudad)) {
      this.messageService.add({ severity: 'warn', summary: 'Distrito inválido', detail: 'Seleccione un distrito de la lista.' });
      return;
    }

    const telefonoStr = String(this.almacen.telefono ?? '').trim();
    if (telefonoStr.length !== 9 || !/^\d{9}$/.test(telefonoStr)) {
      this.messageService.add({ severity: 'warn', summary: 'Teléfono inválido', detail: 'El teléfono debe tener exactamente 9 dígitos numéricos.' });
      return;
    }

    const payload = {
      codigo: (this.almacen.codigo ?? '').trim().toUpperCase(),
      nombre: (this.almacen.nombre ?? '').trim().toUpperCase(),
      ciudad: (this.almacen.ciudad ?? '').trim(),
      departamento: (this.almacen.departamento ?? '').trim(),
      provincia: (this.almacen.provincia ?? '').trim(),
      direccion: (this.almacen.direccion ?? '').trim().toUpperCase(),
      telefono: telefonoStr,
    };

    this.almacenService.updateAlmacen(this.almacenId, payload, 'Administrador').subscribe({
      next: (updated) => {
        this.allowNavigate = true;
        this.messageService.add({ severity: 'success', summary: 'Almacén actualizado', detail: 'El almacén se actualizó correctamente.', life: 3000 });
        setTimeout(() => this.router.navigate(['/admin/almacen']), 1200);
      },
      error: (err: HttpErrorResponse) => {
        const serverMsg = this.extractServerMessage(err);

        // Map server validation message to control if it mentions a field (e.g. 'codigo', 'nombre')
        const lower = serverMsg.toLowerCase();
        if (lower.includes('codigo') || lower.includes('códig')) {
          const ctrl = this.almacenForm?.controls['codigo'] as AbstractControl | undefined;
          ctrl?.setErrors({ server: serverMsg });
          ctrl?.markAsTouched();
        } else if (lower.includes('nombre')) {
          const ctrl = this.almacenForm?.controls['nombre'] as AbstractControl | undefined;
          ctrl?.setErrors({ server: serverMsg });
          ctrl?.markAsTouched();
        }

        this.messageService.add({ severity: err.status === 400 ? 'warn' : 'error', summary: err.status === 400 ? 'Validación' : 'Error', detail: serverMsg });
      },
    });
  }

  confirmCancel(): void {
    if (!this.almacenForm?.dirty) {
      this.navigateWithToast();
      return;
    }

    this.confirmDiscardChanges().subscribe((confirmed) => {
      if (confirmed) {
        this.allowNavigate = true;
        this.navigateWithToast();
      }
    });
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.allowNavigate || !this.almacenForm?.dirty) return true;
    return this.confirmDiscardChanges();
  }

  private confirmDiscardChanges(): Observable<boolean> {
    const result = new Subject<boolean>();

    this.confirmationService.confirm({
      header: 'Cambios sin guardar',
      message: 'Tienes cambios sin guardar. ¿Deseas salir?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Salir',
      rejectLabel: 'Continuar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => { this.allowNavigate = true; result.next(true); result.complete(); },
      reject: () => { result.next(false); result.complete(); },
    });

    return result.asObservable();
  }

  private navigateWithToast(): void {
    this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'Se canceló la edición del almacén.' });
    setTimeout(() => this.router.navigate(['/admin/almacen']), 1200);
  }
}
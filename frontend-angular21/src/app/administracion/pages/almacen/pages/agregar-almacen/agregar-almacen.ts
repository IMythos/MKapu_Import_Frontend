import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  inject,
  Directive,
  HostListener,
  ElementRef,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { FormsModule, NgForm, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, take } from 'rxjs/operators';
import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';
import { AlmacenService } from '../../../../services/almacen.service';
import { DEPARTAMENTOS_PROVINCIAS } from '../../../../shared/data/departamentos-provincias';
import { HttpErrorResponse } from '@angular/common/http';
import { SedeService } from '../../../../services/sede.service';
import { SedeAlmacenService } from '../../../../services/sede-almacen.service';

// Directiva para bloquear números en autocomplete
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
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): boolean {
    const pastedText = event.clipboardData?.getData('text') || '';
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (!regex.test(pastedText)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}

interface Provincia {
  nombre: string;
  distritos: string[];
}

interface SedeSelectOption {
  value: number;
  label: string;
}

interface AssignWarehouseError {
  step: 'assign';
  createdWarehouse: {
    id?: number;
    id_almacen?: number;
    codigo?: string;
    nombre?: string | null;
  };
  message: string;
  originalError: unknown;
}

@Component({
  selector: 'app-agregar-almacen',
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
    SelectModule,
    NoNumbersDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './agregar-almacen.html',
  styleUrls: ['./agregar-almacen.css'],
})
export class AlmacenCrear implements CanComponentDeactivate, OnInit {
  @ViewChild('sedeForm') sedeForm?: NgForm;

  private allowNavigate = false;
  submitted = false;

  sede = {
    codigo: '',
    nombre: '',
    departamento: '',
    provincia: '',
    ciudad: '',
    telefono: null as number | null,
    direccion: '',
  };

  departamentos = Object.keys(DEPARTAMENTOS_PROVINCIAS);
  filteredDepartamentos: string[] = [];

  provincias: string[] = [];
  filteredProvincias: string[] = [];

  distritos: string[] = [];
  filteredDistritos: string[] = [];
  readonly sedeOptions = signal<SedeSelectOption[]>([]);
  readonly selectedSedeId = signal<number | null>(null);
  readonly sedesLoading = signal(false);
  readonly sedesError = signal<string | null>(null);
  private readonly submitting = signal(false);

  private readonly almacenService = inject(AlmacenService);
  private readonly sedeService = inject(SedeService);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);

  readonly loading = this.almacenService.loading;
  readonly error = this.almacenService.error;
  readonly busy = computed(
    () => this.loading() || this.sedesLoading() || this.submitting(),
  );

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSedeOptions();
  }

  reloadSedeOptions(): void {
    this.loadSedeOptions();
  }

  private loadSedeOptions(): void {
    this.sedesLoading.set(true);
    this.sedesError.set(null);

    this.sedeService
      .loadSedes('Administrador')
      .pipe(
        take(1),
        map((response) =>
          (response.headquarters ?? [])
            .filter((headquarter) => headquarter.activo)
            .map((headquarter) => {
              const code = String(headquarter.codigo ?? '').trim();
              const name = String(headquarter.nombre ?? '').trim();
              const label = [code, name].filter(Boolean).join(' - ').trim();

              return {
                value: Number(headquarter.id_sede),
                label: label || `Sede ${headquarter.id_sede}`,
              };
            })
            .sort((a, b) =>
              a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }),
            ),
        ),
        finalize(() => this.sedesLoading.set(false)),
      )
      .subscribe({
        next: (options) => this.sedeOptions.set(options),
        error: () => {
          this.sedesError.set('No se pudieron cargar las sedes disponibles.');
          this.messageService.add({
            severity: 'error',
            summary: 'Sedes no disponibles',
            detail:
              'No fue posible cargar el listado de sedes. Intenta nuevamente.',
          });
        },
      });
  }

  toUpperCase(field: 'codigo' | 'nombre' | 'direccion'): void {
    this.sede[field] = this.sede[field].toUpperCase();
  }

  onCodigoModelChange(value: string): void {
    const normalized = (value ?? '').trim().toUpperCase();
    this.sede.codigo = normalized;

    this.messageService.clear();

    const codigoCtrl = this.sedeForm?.controls['codigo'] as AbstractControl | undefined;
    if (!codigoCtrl) return;

    const errors = codigoCtrl.errors;
    if (!errors) return;

    const newErrors: Record<string, any> = {};
    for (const key of Object.keys(errors)) {
      if (key === 'server') continue;
      if (key === 'required' && normalized) continue;
      newErrors[key] = (errors as any)[key];
    }

    if (Object.keys(newErrors).length === 0) {
      codigoCtrl.setErrors(null);
    } else {
      codigoCtrl.setErrors(newErrors);
    }
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    return regex.test(event.key) || event.key === 'Backspace' || event.key === 'Tab';
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const regex = /^[0-9]$/;
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.includes(event.key)) return true;
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
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
    const dept = this.sede.departamento;
    const provinciasData: Provincia[] = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    this.provincias = provinciasData.map(p => p.nombre);
    this.sede.provincia = '';
    this.sede.ciudad = '';
    this.distritos = [];
    this.filteredProvincias = [];
    this.filteredDistritos = [];
  }

  onProvinciaSelect(): void {
    const dept = this.sede.departamento;
    const prov = this.sede.provincia;
    const provinciasData: Provincia[] = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    const provinciaSeleccionada = provinciasData.find(p => p.nombre === prov);
    this.distritos = provinciaSeleccionada?.distritos || [];
    this.sede.ciudad = '';
    this.filteredDistritos = [];
  }

  private extractServerMessage(err: any): string {
    try {
      if (!err) return 'Error desconocido';
      if ((err as any).friendlyMessage) return String((err as any).friendlyMessage);
      if (err.error) {
        if (typeof err.error === 'string') return err.error;
        if (err.error.message) {
          return Array.isArray(err.error.message) ? err.error.message.join(', ') : String(err.error.message);
        }
        if (err.error.error) return String(err.error.error);
        return JSON.stringify(err.error);
      }
      return err.message ?? 'Error del servidor';
    } catch {
      return 'Error procesando la respuesta del servidor';
    }
  }

  private normalizeMessage(value: string): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private isDuplicateCreateAlmacenCodeError(message: string): boolean {
    const duplicateContext =
      message.includes('duplicate') ||
      message.includes('ya existe') ||
      message.includes('already exists') ||
      message.includes('duplicado');

    const codeContext =
      message.includes('codigo') ||
      message.includes('code') ||
      message.includes('duplicate entry') ||
      message.includes('for key') ||
      message.includes('almacen');

    return duplicateContext && codeContext;
  }

  private isAssignWarehouseError(error: unknown): error is AssignWarehouseError {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as Partial<AssignWarehouseError>;
    return candidate.step === 'assign' && typeof candidate.message === 'string';
  }

  // ----- Helpers para limpiar errores del control Código -----
  onCodigoInput(): void {
    this.messageService.clear();

    const codigoCtrl = this.sedeForm?.controls['codigo'] as AbstractControl | undefined;
    if (!codigoCtrl) return;

    const value = (this.sede && this.sede.codigo) ? String(this.sede.codigo).trim() : '';

    const errors = codigoCtrl.errors;
    if (!errors) return;

    const newErrors: Record<string, any> = {};
    for (const key of Object.keys(errors)) {
      if (key === 'server') continue;
      if (key === 'required' && value) continue;
      newErrors[key] = (errors as any)[key];
    }

    if (Object.keys(newErrors).length === 0) {
      codigoCtrl.setErrors(null);
    } else {
      codigoCtrl.setErrors(newErrors);
    }
  }

  onCodigoBlur(): void {
    const value = (this.sede && this.sede.codigo) ? String(this.sede.codigo).trim() : '';
    if (value) {
      this.messageService.clear();
      const codigoCtrl = this.sedeForm?.controls['codigo'] as AbstractControl | undefined;
      if (!codigoCtrl) return;
      if (codigoCtrl.errors && codigoCtrl.errors['required']) {
        const otherErrors = Object.keys(codigoCtrl.errors).filter(k => k !== 'required');
        if (otherErrors.length === 0) {
          codigoCtrl.setErrors(null);
        } else {
          const newErrors: Record<string, any> = {};
          for (const k of otherErrors) newErrors[k] = (codigoCtrl.errors as any)[k];
          codigoCtrl.setErrors(newErrors);
        }
      }
    }
  }

  // Getter used by template to avoid complex expressions in the template
  getCodigoErrorText(): string {
    const codigoCtrl = this.sedeForm?.controls?.['codigo'] as AbstractControl | undefined;
    const serverErr = codigoCtrl?.errors?.['server'];
    if (serverErr) return String(serverErr);
    return 'El código es obligatorio.';
  }

  saveSede(form: NgForm): void {
    this.submitted = true;

    if (this.busy()) {
      return;
    }

    if (form.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Completa los campos obligatorios para registrar el almac?n.',
      });
      return;
    }

    if (!this.departamentos.includes(this.sede.departamento)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Departamento inv?lido',
        detail: 'Seleccione un departamento de la lista.',
      });
      return;
    }

    if (!this.provincias.includes(this.sede.provincia)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Provincia inv?lida',
        detail: 'Seleccione una provincia de la lista.',
      });
      return;
    }

    if (!this.distritos.includes(this.sede.ciudad)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Distrito inv?lido',
        detail: 'Seleccione un distrito de la lista.',
      });
      return;
    }

    const selectedSedeId = Number(this.selectedSedeId() ?? 0);
    if (!Number.isFinite(selectedSedeId) || selectedSedeId <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sede requerida',
        detail: 'Selecciona una sede para asignar el almac?n.',
      });
      return;
    }

    const telefonoStr = String(this.sede.telefono ?? '');
    if (telefonoStr.length !== 9) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tel?fono inv?lido',
        detail: 'El tel?fono debe tener exactamente 9 d?gitos.',
      });
      return;
    }

    const payload = {
      codigo: (this.sede.codigo ?? '').trim().toUpperCase(),
      nombre: (this.sede.nombre ?? '').trim().toUpperCase(),
      ciudad: (this.sede.ciudad ?? '').trim(),
      departamento: (this.sede.departamento ?? '').trim(),
      provincia: (this.sede.provincia ?? '').trim(),
      direccion: (this.sede.direccion ?? '').trim().toUpperCase(),
      telefono: telefonoStr,
    };

    if (!payload.codigo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'C?digo requerido',
        detail: 'El campo c?digo es obligatorio.',
      });
      const codigoCtrl = this.sedeForm?.controls['codigo'] as
        | AbstractControl
        | undefined;
      codigoCtrl?.setErrors({ required: true });
      codigoCtrl?.markAsTouched();
      return;
    }

    this.submitting.set(true);

    this.almacenService
      .createAlmacen(payload, 'Administrador')
      .pipe(
        switchMap((created) => {
          const warehouseId = Number(created.id_almacen ?? created.id ?? 0);
          if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
            return throwError(
              () =>
                new Error(
                  'El almac?n se cre?, pero no se recibi? un identificador v?lido.',
                ),
            );
          }

          return this.sedeAlmacenService
            .assignWarehouseToSede(
              {
                id_sede: selectedSedeId,
                id_almacen: warehouseId,
              },
              'Administrador',
            )
            .pipe(
              map(() => created),
              catchError((assignError) =>
                throwError(() => ({
                  step: 'assign',
                  createdWarehouse: created,
                  message: this.extractServerMessage(assignError),
                  originalError: assignError,
                }) satisfies AssignWarehouseError),
              ),
            );
        }),
        take(1),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (created) => {
          this.allowNavigate = true;
          this.messageService.add({
            severity: 'success',
            summary: 'Almac?n registrado',
            detail: `Se registr? el almac?n ${created.nombre} (${created.codigo}) y se asign? correctamente a la sede.`,
            life: 3000,
          });
          setTimeout(() => {
            this.router.navigate(['/admin/almacen']);
          }, 1200);
        },
        error: (err: unknown) => {
          if (this.isAssignWarehouseError(err)) {
            const fallbackWarehouseId = Number(
              err.createdWarehouse.id_almacen ?? err.createdWarehouse.id ?? 0,
            );
            this.messageService.add({
              severity: 'warn',
              summary: 'Asignaci?n pendiente',
              detail: `El almac?n se cre? (ID ${fallbackWarehouseId}), pero no se pudo asignar a la sede seleccionada. ${err.message}`,
              life: 5000,
            });
            return;
          }

          const httpError = err as HttpErrorResponse;
          const serverMsg = this.extractServerMessage(httpError);
          const normalizedServerMessage = this.normalizeMessage(serverMsg);
          const isDuplicateCodeError =
            this.isDuplicateCreateAlmacenCodeError(normalizedServerMessage);
          const duplicateCodeMessage = 'Ya existe un almacen con ese nombre.';
          const detailMessage = isDuplicateCodeError
            ? duplicateCodeMessage
            : serverMsg;

          const codigoCtrl = this.sedeForm?.controls['codigo'] as
            | AbstractControl
            | undefined;
          if (
            isDuplicateCodeError ||
            normalizedServerMessage.includes('codigo') ||
            normalizedServerMessage.includes('code')
          ) {
            codigoCtrl?.setErrors({ server: detailMessage });
            codigoCtrl?.markAsTouched();
            try {
              (document.getElementById('codigo') as HTMLInputElement)?.focus();
            } catch {
              // noop
            }
          }

          this.messageService.add({
            severity:
              isDuplicateCodeError || httpError?.status === 400
                ? 'warn'
                : 'error',
            summary:
              isDuplicateCodeError || httpError?.status === 400
                ? 'Validacion'
                : 'Error',
            detail: detailMessage,
            styleClass: isDuplicateCodeError
              ? 'duplicate-entity-toast'
              : undefined,
          });
        },
      });
  }

  confirmCancel(): void {
    if (!this.sedeForm?.dirty) {
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
    if (this.allowNavigate || !this.sedeForm?.dirty) return true;
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
      accept: () => {
        this.allowNavigate = true;
        result.next(true);
        result.complete();
      },
      reject: () => {
        result.next(false);
        result.complete();
      },
    });

    return result.asObservable();
  }

  private navigateWithToast(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Cancelado',
      detail: 'Se canceló el registro del almacén.',
    });

    setTimeout(() => {
      this.router.navigate(['/admin/almacen']);
    }, 1200);
  }
}

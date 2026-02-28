// editar-sede.ts
import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, OnInit, Directive, HostListener, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Message } from 'primeng/message';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Observable, Subject } from 'rxjs';
import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';
import { SedeService } from '../../../../services/sede.service';
import { DEPARTAMENTOS_PROVINCIAS } from '../../../../shared/data/departamentos-provincias';

// Directiva para bloquear números
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
    
    if (allowedKeys.includes(event.key)) {
      return true;
    }
    
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

@Component({
  selector: 'app-editar-sede',
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
    Message,
    AutoCompleteModule,
    NoNumbersDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './editar-sede.html',
  styleUrl: './editar-sede.css',
})
export class EditarSede implements OnInit, CanComponentDeactivate {
  @ViewChild('sedeForm') sedeForm?: NgForm;

  private allowNavigate = false;
  submitted = false;
  sedeId: number | null = null;

  sede = {
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

  private readonly sedeService = inject(SedeService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = this.sedeService.loading;
  readonly error = this.sedeService.error;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Preferir paramMap (path param), si no existe usar queryParamMap
    const idFromParam = this.route.snapshot.paramMap.get('id');
    const idFromQuery = this.route.snapshot.queryParamMap.get('id');
    const idStr = idFromParam ?? idFromQuery;
    if (idStr) {
      this.sedeId = parseInt(idStr, 10);
      this.loadSede();
    } else {
      // manejar caso sin id (mostrar error o redirigir)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se recibió el ID de la sede.' });
    }
  }

  private loadSede(): void {
    if (!this.sedeId) return;

    this.sedeService.getSedeById(this.sedeId).subscribe({
      next: (sedeData) => {
        this.sede = {
          codigo: sedeData.codigo,
          nombre: sedeData.nombre,
          departamento: sedeData.departamento,
          provincia: '', // Inicialmente vacío, se cargará después
          ciudad: sedeData.ciudad,
          telefono: sedeData.telefono,
          direccion: sedeData.direccion,
        };

        // Cargar provincia basándose en departamento y ciudad
        this.initializeProvinciaFromCiudad();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la sede.',
        });
      },
    });
  }

  private initializeProvinciaFromCiudad(): void {
    const dept = this.sede.departamento;
    const ciudad = this.sede.ciudad;
    const provinciasData = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    
    // Encontrar la provincia que contiene esta ciudad
    const provinciaEncontrada = provinciasData.find(p => 
      p.distritos.includes(ciudad)
    );

    if (provinciaEncontrada) {
      this.sede.provincia = provinciaEncontrada.nombre;
      this.provincias = provinciasData.map(p => p.nombre);
      this.distritos = provinciaEncontrada.distritos;
    }
  }

  toUpperCase(field: 'codigo' | 'nombre' | 'direccion'): void {
    this.sede[field] = this.sede[field].toUpperCase();
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    return regex.test(event.key) || event.key === 'Backspace' || event.key === 'Tab';
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const regex = /^[0-9]$/;
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(event.key)) {
      return true;
    }
    
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }

  filterDepartamentos(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredDepartamentos = this.departamentos.filter(dept =>
      dept.toLowerCase().includes(query)
    );
  }

  filterProvincias(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredProvincias = this.provincias.filter(prov =>
      prov.toLowerCase().includes(query)
    );
  }

  filterDistritos(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredDistritos = this.distritos.filter(dist =>
      dist.toLowerCase().includes(query)
    );
  }

  onDepartamentoSelect(): void {
    const dept = this.sede.departamento;
    const provinciasData = DEPARTAMENTOS_PROVINCIAS[dept] || [];
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
    const provinciasData = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    const provinciaSeleccionada = provinciasData.find(p => p.nombre === prov);
    this.distritos = provinciaSeleccionada?.distritos || [];
    this.sede.ciudad = '';
    this.filteredDistritos = [];
  }

  updateSede(): void {
    this.submitted = true;

    if (!this.sedeId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID de la sede.',
      });
      return;
    }

    if (!this.departamentos.includes(this.sede.departamento)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Departamento inválido',
        detail: 'Seleccione un departamento de la lista.',
      });
      return;
    }

    if (!this.provincias.includes(this.sede.provincia)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Provincia inválida',
        detail: 'Seleccione una provincia de la lista.',
      });
      return;
    }

    if (!this.distritos.includes(this.sede.ciudad)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Distrito inválido',
        detail: 'Seleccione un distrito de la lista.',
      });
      return;
    }
  
    const telefonoStr = String(this.sede.telefono ?? '').trim();
    
    if (telefonoStr.length !== 9 || !/^\d{9}$/.test(telefonoStr)) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Teléfono inválido',
      detail: 'El teléfono debe tener exactamente 9 dígitos numéricos.',
    });
    return;
  }

  const payload = {
    codigo: this.sede.codigo.trim().toUpperCase(),
    nombre: this.sede.nombre.trim().toUpperCase(),
    ciudad: this.sede.ciudad.trim(),
    departamento: this.sede.departamento.trim(),
    direccion: this.sede.direccion.trim().toUpperCase(),
    telefono: telefonoStr, 
  };

    this.sedeService.updateSede(this.sedeId, payload, 'Administrador').subscribe({
      next: () => {
        this.allowNavigate = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Sede actualizada',
          detail: 'La sede se actualizó correctamente.',
        });
        setTimeout(() => this.router.navigate(['/admin/sedes']), 1500); // <- agrega delay
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la sede.',
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
      detail: 'Se canceló la edición de la sede.',
    });

    setTimeout(() => {
      this.router.navigate(['/admin/sedes']);
    }, 1500);
  }
}
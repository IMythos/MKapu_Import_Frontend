import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';

interface Producto {
  codigo: string;
  nombre: string;
  responsable: string;
  cantidad: number;
  tipo: 'merma' | 'remate' | null;
  codigoRemate?: string;
  precioRemate?: number;
  fechaRegistro: Date;
}

@Component({
  selector: 'app-mermas-remates-edc',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    ToastModule,
    InputNumberModule
  ],
  templateUrl: './mermas-remates-edc.html',
  styleUrl: './mermas-remates-edc.css',
  providers: [MessageService],
})
export class MermasRematesEdcComponent implements OnInit {

  productoId: string | null = null;
  modoEdicion: boolean = false;

  producto: Producto = {
    codigo: '',
    nombre: '',
    responsable: 'Jefatura de almacén',
    cantidad: 1,
    tipo: null,
    fechaRegistro: new Date()
  };
  tiposProducto = [
    { label: 'Merma', value: 'merma' },
    { label: 'Remate', value: 'remate' }
  ];

  tiposFiltrados: any[] = [];

  filtrarTipos(event: any) {
    const query = event.query?.toLowerCase() || '';

    this.tiposFiltrados = this.tiposProducto.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
  }
  
  constructor(
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Obtener ID del producto de la ruta
    this.productoId = this.route.snapshot.paramMap.get('id');

    if (this.productoId) {
      this.modoEdicion = true;
      this.cargarProducto(this.productoId);
    } else {
      this.modoEdicion = false;
      this.generarCodigoAutomatico();
    }
  }

  cargarProducto(id: string): void {
    // Aquí iría la lógica para cargar el producto desde el backend
    // Por ahora simulamos los datos
    this.producto = {
      codigo: 'TRF-2026-0001',
      nombre: 'Smart TV LED 55" 4K RAF',
      responsable: 'Jefatura de almacén',
      cantidad: 3,
      tipo: 'merma',
      fechaRegistro: new Date('2026-01-31')
    };
  }

  generarCodigoAutomatico(): void {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const random = Math.floor(Math.random() * 10000);
    this.producto.codigo = `TRF-${año}-${String(random).padStart(4, '0')}`;
  }

  onTipoChange(): void {
    if (this.producto.tipo === 'merma') {
      // Limpiar campos de remate si se selecciona merma
      this.producto.codigoRemate = undefined;
      this.producto.precioRemate = undefined;
    } else if (this.producto.tipo === 'remate' && !this.producto.codigoRemate) {
      // Generar código de remate automático
      this.producto.codigoRemate = this.generarCodigoRemate();
    }
  }

  generarCodigoRemate(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const random = Math.floor(Math.random() * 1000);
    return `RMT-${año}-${String(random).padStart(3, '0')}`;
  }

  validarFormulario(): boolean {
    if (!this.producto.nombre.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El nombre del producto es obligatorio',
        life: 3000
      });
      return false;
    }

    if (!this.producto.tipo) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar un tipo de registro',
        life: 3000
      });
      return false;
    }

    if (this.producto.cantidad <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La cantidad debe ser mayor a 0',
        life: 3000
      });
      return false;
    }

    if (this.producto.tipo === 'remate') {
      if (!this.producto.codigoRemate || !this.producto.precioRemate) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Los productos de remate deben tener código y precio de remate',
          life: 3000
        });
        return false;
      }

      if (this.producto.precioRemate <= 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'El precio de remate debe ser mayor a 0',
          life: 3000
        });
        return false;
      }
    }

    return true;
  }

  guardar(): void {
    if (!this.validarFormulario()) {
      return;
    }

    // Aquí iría la lógica para guardar en el backend
    console.log('Producto a guardar:', this.producto);

    this.messageService.add({
      severity: 'success',
      summary: this.modoEdicion ? 'Producto Actualizado' : 'Producto Registrado',
      detail: `${this.producto.nombre} ${this.modoEdicion ? 'actualizado' : 'registrado'} correctamente`,
      life: 3000
    });

    // Redirigir después de un delay
    setTimeout(() => {
      this.router.navigate(['/admin/mermas-remates']);
    }, 2000);
  }

  cancelar(): void {
    this.router.navigate(['/admin/mermas-remates']);
  }
}
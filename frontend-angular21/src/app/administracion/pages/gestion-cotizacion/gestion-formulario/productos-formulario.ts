import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; 
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, forkJoin } from 'rxjs'; // <-- IMPORTANTE: Añadido forkJoin
import { concatMap, catchError, finalize } from 'rxjs/operators';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

// Servicios e Interfaces
import { Categoria } from '../../../interfaces/categoria.interface';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { SedeService } from '../../../services/sede.service';
import { CreateProductoDto, MovimientoInventarioDto, UpdateProductoDto, UpdateProductoPreciosDto } from '../../../interfaces/producto.interface';
import { AlmacenService } from '../../../services/almacen.service';

@Component({
  selector: 'app-productos-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CardModule,
    ConfirmDialog,
    ToastModule
  ],
  templateUrl: './productos-formulario.html',
  styleUrl: './productos-formulario.css',
  providers: [ConfirmationService, MessageService],
})
export class ProductosFormulario implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute); 
  private almacenService = inject(AlmacenService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private sedeService = inject(SedeService);
  private messageService = inject(MessageService);

  categorias = signal<Categoria[]>([]);
  isSubmitting = signal<boolean>(false);
  sedes = this.sedeService.sedes;
  almacenes = this.almacenService.sedes;
  
  // SIGNALS MODO EDICIÓN
  esModoEdicion = signal<boolean>(false);
  idProductoActual = signal<number | null>(null);

  // NUEVOS SIGNALS PARA EL CÁLCULO DE STOCK EN VIVO
  stockActual = signal<number>(0);
  stockAgregado = signal<number>(0);
  // El stock total se calcula solo sumando el actual + lo que escriba el usuario
  stockTotal = computed(() => this.stockActual() + this.stockAgregado());

  // SIGNALS CABECERA
  tituloKicker = signal<string>('ADMINISTRADOR - ADMINISTRACIÓN - PRODUCTOS CREACIÓN');
  tituloPrincipal = signal<string>('CREAR PRODUCTO');
  iconoCabecera = signal<string>('pi pi-plus-circle');

  productoForm: FormGroup = this.fb.group({
    codigo: ['', Validators.required],
    anexo: ['', Validators.required],
    descripcion: ['', Validators.required],
    familia: [null, Validators.required],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    precioUnidad: [0, [Validators.required, Validators.min(0)]],
    precioCaja: [0, [Validators.required, Validators.min(0)]],
    precioMayorista: [0, [Validators.required, Validators.min(0)]],
    unidadMedida: ['UNIDAD', Validators.required],
    almacen: [null, Validators.required],
    sede: [null, Validators.required],
    stockInicial: [0, [Validators.required, Validators.min(0)]] // Funciona como "Agregar Stock" en edición
  });

  ngOnInit() {
    this.cargarDatosIniciales();
    this.setSedePorDefecto();
    this.verificarModoEdicion();

    // Escuchamos lo que el usuario teclea en "stockInicial" para actualizar el Stock Total visualmente
    this.productoForm.get('stockInicial')?.valueChanges.subscribe(valor => {
      this.stockAgregado.set(valor || 0);
    });

    this.productoForm.get('almacen')?.valueChanges.subscribe(v => {
  console.log('ALMACEN VALUE:', v, typeof v);

  console.log("almacenes", this.almacenes)

});

  }

  private cargarDatosIniciales() {
    this.categoriaService.getCategorias().subscribe({
      next: (res) => this.categorias.set(res.categories),
      error: (err) => console.error('Error cargando categorías', err)
    });

    this.sedeService.loadSedes().subscribe({
      error: (err) => console.error('Error cargando sedes', err)
    });

    this.almacenService.loadAlmacen().subscribe({
  next: () => {
    console.log('ALMACENES CARGADOS:', this.almacenes());
  },
  error: (err) => console.error(err)
});

  }

  private setSedePorDefecto() {
    const userStorage = localStorage.getItem('user');
    if (userStorage) {
      try {
        const user = JSON.parse(userStorage);
        if (user && user.idSede) {
          this.productoForm.patchValue({ sede: user.idSede });
        }
      } catch (error) {
        console.error('Error parseando usuario', error);
      }
    }
  }

  private verificarModoEdicion() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const sedeParam = this.route.snapshot.queryParamMap.get('idSede');

    if (idParam) {
      this.esModoEdicion.set(true);
      const id = Number(idParam);
      this.idProductoActual.set(id);

      this.tituloKicker.set('ADMINISTRADOR - ADMINISTRACIÓN - PRODUCTOS EDICIÓN');
      this.tituloPrincipal.set('EDITAR PRODUCTO');
      this.iconoCabecera.set('pi pi-pencil');

      const idSedeBackend = sedeParam ? Number(sedeParam) : (this.productoForm.get('sede')?.value || 1);
      this.cargarDatosDelProducto(id, idSedeBackend);
    }
  }

  private cargarDatosDelProducto(id: number, idSede: number) {
    this.productoService.getProductoDetalleStock(id, idSede).subscribe({
      next: (res) => {
        const prod = res.producto;
        
        // Guardamos el stock que viene de la BD
        this.stockActual.set(res.stock?.cantidad || 0);

        this.productoForm.patchValue({
          codigo: prod.codigo,
          anexo: prod.nombre,
          descripcion: prod.descripcion || '',
          familia: prod.categoria.id_categoria,
          precioCompra: prod.precio_compra,
          precioVenta: prod.precio_unitario,
          precioUnidad: prod.precio_unitario,
          precioCaja: prod.precio_caja,
          precioMayorista: prod.precio_mayor,
          unidadMedida: prod.unidad_medida?.nombre || 'UNIDAD',
          sede: res.stock?.id_sede,
          almacen: res.stock?.id_almacen,
          stockInicial: 0 // Lo ponemos en 0 porque ahora es "Stock a agregar"
        });

        // NOTA: NO deshabilitamos stockInicial para que puedan añadir stock
        this.productoForm.get('sede')?.disable();
        this.productoForm.get('almacen')?.disable();
      },
      error: (err) => {
        console.error('Error trayendo datos del backend:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron los datos.' });
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/gestion-productos']);
  }

  guardarProducto() {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios.' });
      return;
    }

    this.isSubmitting.set(true);
    // getRawValue obtiene también los campos disabled (como sede y almacen en edición)
    const formValue = this.productoForm.getRawValue(); 

    const codigoLimpio = formValue.codigo?.trim().toUpperCase() || '';
    const anexoLimpio = formValue.anexo?.trim().toUpperCase() || ''; 
    const descripcionLimpia = formValue.descripcion?.trim().toUpperCase() || '';

    if (this.esModoEdicion() && this.idProductoActual()) {
      // ===== LÓGICA DE ACTUALIZAR (PUTs) =====
      const idProd = this.idProductoActual()!;

      const updateInfo: UpdateProductoDto = {
        id_producto: idProd,
        id_categoria: formValue.familia,
        codigo: codigoLimpio,
        anexo: anexoLimpio,
        descripcion: descripcionLimpia,
        uni_med: formValue.unidadMedida
      };

      const updatePrecios: UpdateProductoPreciosDto = {
        id_producto: idProd,
        pre_compra: formValue.precioCompra,
        pre_venta: formValue.precioVenta,
        pre_unit: formValue.precioUnidad,
        pre_may: formValue.precioMayorista,
        pre_caja: formValue.precioCaja
      };

      // Lanzamos ambas peticiones al mismo tiempo
      forkJoin([
        this.productoService.actualizarProductoInfo(updateInfo),
        this.productoService.actualizarProductoPrecios(updatePrecios)
      ]).pipe(
        concatMap(() => {
          // Si el usuario puso un número mayor a 0, agregamos el inventario
          if (formValue.stockInicial > 0) {
            const movDto: MovimientoInventarioDto = {
              originType: 'COMPRA', // o 'COMPRA', 'AJUSTE', según requiera tu BD
              refId: 101,
              refTable: 'ordenes_compra',
              observation: "Ingreso por orden de compra #101",
              items: [{
                productId: idProd,
                warehouseId: formValue.almacen, 
                sedeId: formValue.sede,         
                quantity: formValue.stockInicial, // Cantidad a sumar
                type: 'INGRESO'
              }]
            };
            return this.productoService.registrarIngresoInventario(movDto);
          }
          return of(null); // Si es 0, no hace petición de stock
        }),
        catchError(error => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al actualizar.' });
          throw error;
        }),
        finalize(() => this.isSubmitting.set(false))
      ).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado correctamente.' });
          setTimeout(() => this.router.navigate(['/admin/gestion-productos']), 1500);
        }
      });

    } else {
      // ===== LÓGICA DE CREAR (POST) =====
      const productoDto: CreateProductoDto = {
        id_categoria: formValue.familia,
        codigo: codigoLimpio,
        anexo: anexoLimpio,
        descripcion: descripcionLimpia,
        pre_compra: formValue.precioCompra,
        pre_venta: formValue.precioVenta,
        pre_unit: formValue.precioUnidad,
        pre_may: formValue.precioMayorista,
        pre_caja: formValue.precioCaja,
        uni_med: formValue.unidadMedida
      };

      this.productoService.crearProducto(productoDto).pipe(
        concatMap(productoCreado => {
          if (formValue.stockInicial <= 0) {
            return of(productoCreado);
          }

          const movDto: MovimientoInventarioDto = {
            originType: 'COMPRA',
            refId: 101,
            refTable: 'ordenes_compra',
            observation: "Ingreso inicial de producto",
            items: [{
              productId: productoCreado.id_producto,
              warehouseId: formValue.almacen,
              sedeId: formValue.sede,
              quantity: formValue.stockInicial,
              type: 'INGRESO'
            }]
          };

          return this.productoService.registrarIngresoInventario(movDto);
        }),
        catchError(error => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Hubo un error al crear.' });
          throw error;
        }),
        finalize(() => this.isSubmitting.set(false))
      ).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado correctamente.' });
          setTimeout(() => this.router.navigate(['/admin/gestion-productos']), 1500);
        }
      });
    }
  }
}
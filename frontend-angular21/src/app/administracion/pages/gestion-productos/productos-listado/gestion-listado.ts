import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, filter, map, takeUntil } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { Router, RouterModule} from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductoService } from '../../../services/producto.service';
import { ProductoAutocomplete, ProductoStock } from '../../../interfaces/producto.interface';
import { SedeService } from '../../../services/sede.service';
import { CategoriaService } from '../../../services/categoria.service';

@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, CardModule, TagModule,
    AutoCompleteModule, SelectModule, ToggleButtonModule, ProgressSpinnerModule,
    InputTextModule, TooltipModule, PaginatorModule, RouterModule,
    ConfirmDialog, DialogModule, ToastModule
  ],
  templateUrl: './gestion-listado.html',
  styleUrl: './gestion-listado.css',
  providers: [ConfirmationService, MessageService]
})
export class GestionListado implements OnInit {
  public router = inject(Router);
  private productoService = inject(ProductoService);
  private sedeService = inject(SedeService);
  private categoriaService = inject(CategoriaService);
  // Definición de Signals para el estado

  productos = signal<ProductoStock[]>([]);
  loading = signal<boolean>(false);

  categorias = signal<{ label: string; value: string }[]>([]);
  categoriaSeleccionada = signal<string | null>(null);

  buscarValue = signal<ProductoAutocomplete | string | null>(null);
  sugerencias = signal<ProductoAutocomplete[]>([]);

  // Signals para la Paginación (Server-Side)
  totalRecords = signal<number>(0);
  rows = signal<number>(10);
  currentPage = signal<number>(1);
  idSedeActual = signal<number | null>(null);
  esVistaEliminados: any;
  tituloKicker: string | undefined;
  iconoCabecera: string | undefined;
  subtituloKicker: string | undefined;
  mostrarDialogEliminar: boolean = false;
  mostrarDialogStock: boolean = true;

  sedesOptions = computed(() => {
    // Leemos el signal del servicio de sedes y lo mapeamos
    return this.sedeService.sedes().map(sede => ({
      label: sede.nombre, // Asumiendo que tu interfaz Headquarter tiene 'nombre'
      value: sede.id_sede
    }));
  });

  stockTotalVisible = computed(() => {
    return this.productos().reduce((suma, producto) => suma + producto.stock, 0);
  });

constructor() {
    // Escuchamos los cambios de ruta en tiempo real y actualizamos la signal
    this.actualizarCabecera(); // Actualizamos la cabecera automáticamente aquí
    this.obtenerSedeDeUsuario();
  }

  ngOnInit() {
    this.cargarProductos();

    this.sedeService.loadSedes().subscribe({
      error: (err) => console.error('Error cargando sedes', err)
    });

    this.categoriaService.getCategorias(true).subscribe({
      next: (resp) => {
        this.categorias.set(
          resp.categories.map(cat => ({
            label: cat.nombre,
            value: cat.nombre
          }))
        );
        console.log("categorias", resp)
      },
      error: (err) => console.error('Error cargando categorías', err)
    });

  }

  onSedeChange(nuevaSedeId: number | null) {
    this.idSedeActual.set(nuevaSedeId);

    if (nuevaSedeId) {
      this.currentPage.set(1);
      this.cargarProductos();
    } else {
      // Si el usuario borra la selección
      this.productos.set([]);
      this.totalRecords.set(0);
    }
  }

  onCategoriaChange(nuevaCategoria: string | null) {
    this.categoriaSeleccionada.set(nuevaCategoria);
    this.currentPage.set(1);
    this.cargarProductos();
  }

  private obtenerSedeDeUsuario() {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        if (user.idSede) {
          // Seteamos la signal inicial con la sede del usuario
          this.idSedeActual.set(user.idSede);
        }
      }
    } catch (e) {
      console.error('Error parseando el usuario del localStorage', e);
    }
  }

private actualizarCabecera() {
    Promise.resolve().then(() => {
      const url = this.router.url;

      if (url.includes('crear-producto')) {
        this.tituloKicker = 'ADMINISTRACIÓN - PRODUCTOS CREACIÓN';
        this.subtituloKicker = 'CREAR PRODUCTO'; // Añadido
        this.iconoCabecera = 'pi pi-plus-circle';
      } else if (url.includes('editar-producto')) {
        this.tituloKicker = 'ADMINISTRACIÓN - PRODUCTOS EDICIÓN';
        this.subtituloKicker = 'EDITAR PRODUCTO'; // Añadido
        this.iconoCabecera = 'pi pi-pencil';
      } else if (url.includes('ver-detalle-producto')) {
        this.tituloKicker = 'ADMINISTRACIÓN - PRODUCTOS DETALLE';
        this.subtituloKicker = 'DETALLE DE PRODUCTO'; // Añadido
        this.iconoCabecera = 'pi pi-eye';
      } else {
        // RUTA PRINCIPAL
        this.tituloKicker = 'ADMINISTRADOR - ADMINISTRACIÓA - PRODUCTOS ';
        this.subtituloKicker = 'GESTIÓN DE PRODUCTOS'; // Esto es lo que se estaba perdiendo
        this.iconoCabecera = 'pi pi-building';
      }
    });
  }

  cargarProductos() {
    const sedeId = this.idSedeActual();
    if (!sedeId) return;

    this.loading.set(true);

    this.productoService.getProductosConStock(
      sedeId,
      this.currentPage(),
      this.rows(),
      this.categoriaSeleccionada() ?? undefined
    ).subscribe({
      next: (response) => {
        this.productos.set(response.data);
        this.totalRecords.set(response.pagination.total_records);
        this.loading.set(false);
        console.log('productos:', this.productos())
      },
      error: (err) => {
        console.error('Error al cargar productos con stock:', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: TableLazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.rows();

    if (rows > 0) {
      const paginaCalculada = Math.floor(first / rows) + 1;
      this.currentPage.set(paginaCalculada);
      this.rows.set(rows);
      this.cargarProductos();
    }
  }

  searchBuscar(event: any) {
    const query = event.query;
    const sedeId = this.idSedeActual();
    
    // Si no hay sede o no escribió nada, no buscamos
    if (!sedeId || !query) {
      this.sugerencias.set([]);
      return;
    }

    // Llamamos al endpoint de autocompletado
    this.productoService.getProductosAutocomplete(query, sedeId).subscribe({
      next: (response) => {
        // Llenamos las opciones del dropdown con la 'data' del JSON
        this.sugerencias.set(response.data);
      },
      error: (err) => console.error('Error en autocomplete:', err)
    });
  }

seleccionarProductoBusqueda(event: any) {
    // 1. Extraemos el objeto ligero que nos dio el autocomplete
    const productoSeleccionado = event.value as ProductoAutocomplete;
    
    // 2. Solucionamos el [object Object] dejando solo el nombre en el input
    this.buscarValue.set(productoSeleccionado.nombre);

    const sedeId = this.idSedeActual();
    if (!sedeId) return;

    this.loading.set(true);

    // 3. Usamos tu endpoint detallado buscando por ID y Sede
    this.productoService.getProductoDetalleStock(productoSeleccionado.id_producto, sedeId).subscribe({
      next: (detalleResponse) => {
        // 4. Mapeamos la respuesta rica al formato que espera tu tabla (ProductoStock)
        const productoParaTabla: ProductoStock = {
          id_producto: detalleResponse.producto.id_producto,
          codigo: detalleResponse.producto.codigo,
          nombre: detalleResponse.producto.nombre,
          // ¡Aquí extraemos la familia y sede de la nueva estructura JSON!
          familia: detalleResponse.producto.categoria.nombre, 
          sede: detalleResponse.stock.sede,
          stock: detalleResponse.stock.cantidad
        };
        
        // 5. Reemplazamos los datos de la tabla con nuestro único producto
        this.productos.set([productoParaTabla]);
        this.totalRecords.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar detalle completo del producto:', err);
        this.loading.set(false);
      }
    });
  }

  limpiarBusqueda() {
    this.buscarValue.set(null);
    this.currentPage.set(1);
    this.cargarProductos(); // Volvemos a cargar todos los productos de la sede
  }

  irCrear() { 
    this.router.navigate(['/admin/gestion-productos/crear-producto']);
  }
  
  irEditar(id: number) { 
    // Obtenemos la sede que el usuario seleccionó en el dropdown de la tabla
    const sedeActual = this.idSedeActual(); 

    this.router.navigate(['/admin/gestion-productos/editar-producto', id], {
      // Mandamos la sede como parámetro en la URL (?idSede=X)
      queryParams: { idSede: sedeActual } 
    });
  }

  irDetalle(id: number) { 
    this.router.navigate(['/admin/gestion-productos/ver-detalle-producto', id]);
  }

}
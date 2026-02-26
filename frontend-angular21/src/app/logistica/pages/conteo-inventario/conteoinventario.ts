import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';

import { ConteoInventarioService } from '../../../logistica/services/conteo-inventario.service';
import { CategoriaService } from '../../../administracion/services/categoria.service';

@Component({
  selector: 'app-conteo-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DatePickerModule,
    AutoCompleteModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    RouterModule,
  ],
  templateUrl: './conteoinventario.html',
  styleUrls: ['./conteoinventario.css'],
})
export class ConteoInventarios implements OnInit {
  private router = inject(Router);
  private conteoService = inject(ConteoInventarioService);
  private categoriaService = inject(CategoriaService);

  loading = this.conteoService.loading;
  conteosListado = this.conteoService.conteosListado;

  idSedeSeleccionada = signal<number>(1);
  fechaSeleccionada = signal<Date | string | null>(null); // Permitimos string por precaución con PrimeNG
  filtroBusqueda = signal<string>('');
  estadoSeleccionado = signal<any>(null);
  familiaSeleccionada = signal<any>(null);

  // Variables de Paginación UI
  first = signal<number>(0);
  rows = signal<number>(10);
  totalRegistros = this.conteoService.totalRegistros;

  estados = [
    { nombre: 'TODOS' },
    { nombre: 'AJUSTADO' },
    { nombre: 'PENDIENTE' },
    { nombre: 'ANULADO' },
  ];
  estadosFiltrados = signal<any[]>([]);

  familias = signal<any[]>([{ nombre: 'Todas' }, { nombre: 'General' }]);
  familiasFiltradas = signal<any[]>([]);

  conteosFiltrados = computed(() => {
    const listado = this.conteosListado();
    if (!listado || listado.length === 0) return [];

    const busqueda = this.filtroBusqueda()?.toLowerCase().trim() || '';

    const estadoObj = this.estadoSeleccionado();
    const estadoFiltro = !estadoObj || estadoObj.nombre?.toUpperCase() === 'TODOS' ? null : estadoObj.nombre || estadoObj;

    const familiaObj = this.familiaSeleccionada();
    const familiaFiltro = !familiaObj || familiaObj.nombre?.toUpperCase() === 'TODAS' ? null : familiaObj.nombre || familiaObj;

    let fechaFiltro = this.fechaSeleccionada();
    if (fechaFiltro && typeof fechaFiltro === 'string') {
      fechaFiltro = new Date(fechaFiltro);
    }

    return listado.filter((c: any) => {
      const textoSede = c.nomSede?.toLowerCase() || '';
      const cantidadItems = String(c.totalItems || 0);
      const textoProductos = c.detalles
        ? c.detalles.map((d: any) => d.descripcion?.toLowerCase()).join(' ')
        : '';

      const textoDetalleCompleto = `conteo en ${textoSede} ${cantidadItems} ítems ${textoProductos}`;

      const coincideBusqueda =
        !busqueda ||
        textoDetalleCompleto.includes(busqueda) ||
        String(c.idConteo).includes(busqueda);

      const coincideEstado = !estadoFiltro || c.estado === estadoFiltro;

      const nombreFamBd = c.nomCategoria || 'General';
      const coincideFamilia = !familiaFiltro || nombreFamBd === familiaFiltro;

      let coincideFecha = true;
      if (fechaFiltro && !isNaN((fechaFiltro as Date).getTime())) {
        const fechaConteo = new Date(c.fechaIni);
        if (!isNaN(fechaConteo.getTime())) {
          coincideFecha = 
            fechaConteo.getFullYear() === (fechaFiltro as Date).getFullYear() &&
            fechaConteo.getMonth() === (fechaFiltro as Date).getMonth() &&
            fechaConteo.getDate() === (fechaFiltro as Date).getDate();
        }
      }

      // Añadimos coincideFecha a la condición final de retorno
      return coincideBusqueda && coincideEstado && coincideFamilia && coincideFecha;
    });
  });
  conteosPaginados = computed(() => {
    const filtrados = this.conteosFiltrados();
    const inicio = this.first();
    const fin = inicio + this.rows();
    return filtrados.slice(inicio, fin);
  });

  ngOnInit() {
    this.cargarFamiliasDinamicamente();
    this.cargarHistorialBackend(1, this.rows());
  }

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rows.set(event.rows || 10);
    const page = event.first / this.rows() + 1;
    this.cargarHistorialBackend(page, this.rows());
  }

  cambiarFilas(nuevasFilas: number) {
    this.rows.set(nuevasFilas);
    this.first.set(0);
    this.cargarHistorialBackend(1, nuevasFilas);
  }

  getLast(): number {
    const total = this.totalRegistros() || this.conteosFiltrados().length;
    return Math.min(this.first() + this.rows(), total);
  }

  alCambiarFiltro() {
    this.first.set(0); 
    this.cargarHistorialBackend(1, this.rows());
  }

  cargarHistorialBackend(page: number = 1, limit: number = 10) {
    const payload: any = {
      id_sede: this.idSedeSeleccionada(),
      page: page,
      limit: limit
    };

    let fecha = this.fechaSeleccionada();
    
    // VALIDACIÓN DE SEGURIDAD PARA LA FECHA
    if (fecha) {
      if (typeof fecha === 'string') {
        fecha = new Date(fecha);
      }
      
      // Aseguramos que sea una fecha válida antes de aplicar métodos como getFullYear
      if (!isNaN(fecha.getTime())) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const fechaStr = `${year}-${month}-${day}`;

        payload.fecha_inicio = fechaStr;
        payload.fecha_fin = fechaStr; 
      }
    }

    this.conteoService.listarConteos(payload);
  }

  filtrarEstados(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.estadosFiltrados.set(this.estados.filter((e) => e.nombre.toLowerCase().includes(query)));
  }

  cargarFamiliasDinamicamente() {
    this.categoriaService.getCategorias(true).subscribe({
      next: (res: any) => {
        let arrayBruto = [];
        if (res && Array.isArray(res)) {
          arrayBruto = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          arrayBruto = res.data;
        } else if (res && res.categories && Array.isArray(res.categories)) {
          arrayBruto = res.categories;
        }

        const categoriasBD = arrayBruto.map((c: any) => ({
          nombre: c.nombre || c.name || 'Sin nombre',
          id: c.id_categoria || c.idCategoria || c.id,
        }));

        this.familias.set([{ nombre: 'Todas' }, { nombre: 'General' }, ...categoriasBD]);
      },
      error: (err) => console.error('Error cargando categorías en listado:', err),
    });
  }

  filtrarFamilias(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.familiasFiltradas.set(
      this.familias().filter((f) => f.nombre.toLowerCase().includes(query)),
    );
  }

  verDetalle(row: any) {
    this.router.navigate(['/logistica/conteo-detalle', row.idConteo]);
  }

  crearConteo() {
    this.router.navigate(['/logistica/conteo-crear']);
  }
}

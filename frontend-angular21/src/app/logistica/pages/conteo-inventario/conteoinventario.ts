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
import { SelectModule } from 'primeng/select';

import { ConteoInventarioService } from '../../../logistica/services/conteo-inventario.service';
import { CategoriaService } from '../../../administracion/services/categoria.service';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../shared/components/paginador/Paginador.component';

// 👇 Importamos las utilidades de fecha
import { getLunesSemanaActualPeru, getDomingoSemanaActualPeru } from '../../../shared/utils/date-peru.utils';

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
    SelectModule,
    RouterModule,
    LoadingOverlayComponent,
    PaginadorComponent,
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
  totalRegistros = this.conteoService.totalRegistros;

  idSedeSeleccionada = signal<number | null>(null);
  
  fechaSeleccionada = signal<Date[] | null>([getLunesSemanaActualPeru(), getDomingoSemanaActualPeru()]);
  
  filtroBusqueda = signal<string>('');
  estadoSeleccionado = signal<any>(null);
  familiaSeleccionada = signal<any>(null);

  paginaActual = signal<number>(1);
  rows = signal<number>(10);

  totalPaginas = computed(
    () => Math.ceil((this.totalRegistros() || this.conteosFiltrados().length) / this.rows()) || 1,
  );

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

    let fechas = this.fechaSeleccionada();

    return listado.filter((c: any) => {
      const textoSede = c.nomSede?.toLowerCase() || '';
      const cantidadItems = String(c.totalItems || 0);
      const textoProductos = c.detalles
        ? c.detalles.map((d: any) => d.descripcion?.toLowerCase()).join(' ')
        : '';
      const textoDetalleCompleto = `conteo en ${textoSede} ${cantidadItems} ítems ${textoProductos}`;

      const coincideBusqueda =
        !busqueda || textoDetalleCompleto.includes(busqueda) || String(c.idConteo).includes(busqueda);

      const coincideEstado = !estadoFiltro || c.estado === estadoFiltro;
      const nombreFamBd = c.nomCategoria || 'General';
      const coincideFamilia = !familiaFiltro || nombreFamBd === familiaFiltro;

      let coincideFecha = true;
      
      // 👇 Filtro local para rango de fechas
      if (fechas && fechas.length > 0 && fechas[0]) {
        const fechaConteo = new Date(c.fechaIni);
        if (!isNaN(fechaConteo.getTime())) {
          const inicio = new Date(fechas[0]);
          inicio.setHours(0, 0, 0, 0);
          const fin = fechas[1] ? new Date(fechas[1]) : new Date(inicio);
          fin.setHours(23, 59, 59, 999);

          coincideFecha = fechaConteo >= inicio && fechaConteo <= fin;
        }
      }

      return coincideBusqueda && coincideEstado && coincideFamilia && coincideFecha;
    });
  });

  conteosPaginados = computed(() => {
    return this.conteosFiltrados();
  });

  ngOnInit() {
    this.recuperarSedeDeLocalStorage();
    this.cargarFamiliasDinamicamente();
    this.cargarHistorialBackend(1, this.rows());
  }

  onPageChange(page: number): void {
    this.paginaActual.set(page);
    this.cargarHistorialBackend(page, this.rows());
  }

  onLimitChange(limit: number): void {
    this.rows.set(limit);
    this.paginaActual.set(1);
    this.cargarHistorialBackend(1, limit);
  }

  alCambiarFiltro(): void {
    this.paginaActual.set(1);
    this.cargarHistorialBackend(1, this.rows());
  }

  // 👇 Limpiar fechas devuelve a la semana actual
  limpiarFechas(): void {
    this.fechaSeleccionada.set([getLunesSemanaActualPeru(), getDomingoSemanaActualPeru()]);
    this.alCambiarFiltro();
  }

  cargarHistorialBackend(page = 1, limit = 10): void {
    const payload: any = { id_sede: this.idSedeSeleccionada(), page, limit };

    // 👇 Envío de rango de fechas al backend
    let fechas = this.fechaSeleccionada();
    if (fechas && fechas.length > 0 && fechas[0]) {
      const f1 = new Date(fechas[0]);
      payload.fecha_inicio = `${f1.getFullYear()}-${String(f1.getMonth() + 1).padStart(2, '0')}-${String(f1.getDate()).padStart(2, '0')}`;
      
      const f2 = fechas[1] ? new Date(fechas[1]) : f1;
      payload.fecha_fin = `${f2.getFullYear()}-${String(f2.getMonth() + 1).padStart(2, '0')}-${String(f2.getDate()).padStart(2, '0')}`;
    }

    this.conteoService.listarConteos(payload);
  }

  recuperarSedeDeLocalStorage(): void {
    try {
      const session = localStorage.getItem('user');
      if (session) {
        const userData = JSON.parse(session);
        const sedeId = userData.idSede || userData.id_sede || userData.sedeId;
        if (sedeId) this.idSedeSeleccionada.set(Number(sedeId));
      }
    } catch (error) {
      console.error('Error recuperando sede del storage', error);
    }
  }

  cargarFamiliasDinamicamente(): void {
    this.categoriaService.getCategorias(true).subscribe({
      next: (res: any) => {
        let arrayBruto: any[] = [];
        if (Array.isArray(res)) arrayBruto = res;
        else if (Array.isArray(res?.data)) arrayBruto = res.data;
        else if (Array.isArray(res?.categories)) arrayBruto = res.categories;

        const categoriasBD = arrayBruto.map((c: any) => ({
          nombre: c.nombre || c.name || 'Sin nombre',
          id: c.id_categoria || c.idCategoria || c.id,
        }));
        this.familias.set([{ nombre: 'Todas' }, { nombre: 'General' }, ...categoriasBD]);
      },
      error: (err) => console.error('Error cargando categorías en listado:', err),
    });
  }

  filtrarEstados(event: any): void {
    const query = event.query?.toLowerCase() || '';
    this.estadosFiltrados.set(this.estados.filter((e) => e.nombre.toLowerCase().includes(query)));
  }

  filtrarFamilias(event: any): void {
    const query = event.query?.toLowerCase() || '';
    this.familiasFiltradas.set(
      this.familias().filter((f) => f.nombre.toLowerCase().includes(query)),
    );
  }

  verDetalle(row: any): void {
    this.router.navigate(['/logistica/conteo-detalle', row.idConteo]);
  }
  
  crearConteo(): void {
    this.router.navigate(['/logistica/conteo-crear']);
  }
}
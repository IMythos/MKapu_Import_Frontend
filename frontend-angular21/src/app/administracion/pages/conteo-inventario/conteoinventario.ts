import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { ConteoInventarioService } from '../../../logistica/services/conteo-inventario.service';

// Cambiamos el nombre para que no choque con la interfaz real de tu backend
interface ConteoInventarioLocal {
  fecha: string;
  detalle: string;
  estado: string;
  familia: string;
}

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
    RouterModule,
  ],
  templateUrl: './conteoinventario.html',
  styleUrls: ['./conteoinventario.css'],
})
export class ConteoInventarios implements OnInit {
  private router = inject(Router);
  private conteosService = inject(ConteoInventarioService);

  // CORRECCIÓN 1: Definimos la señal localmente para poder usar .set() con la data Mock.
  // (Cuando conectes el backend real, eliminarás cargarData() y usarás la señal del service).
  conteos = signal<ConteoInventarioLocal[]>([]);

  // Mantenemos el loading conectado al servicio por si hace peticiones
  loading = this.conteosService.loading;

  idSedeSeleccionada = signal<number>(1);
  filtroBusqueda = signal<string>('');
  fechaSeleccionada = signal<Date | null>(null);
  estadoSeleccionado = signal<{ nombre: string }>({ nombre: 'Todos' });
  familiaSeleccionada = signal<{ nombre: string }>({ nombre: 'Todas' });

  estados = [
    { nombre: 'Todos' },
    { nombre: 'Inicio' },
    { nombre: 'Finalizado' },
    { nombre: 'Anulado' },
  ];

  familias = [
    { nombre: 'Todas' },
    { nombre: 'Licuadoras' },
    { nombre: 'Freidoras' },
    { nombre: 'Refris' },
    { nombre: 'Cocinas' },
  ];

  estadosFiltrados = signal<any[]>([]);
  familiasFiltradas = signal<any[]>([]);

  conteosFiltrados = computed(() => {
    const listado = this.conteos();
    const busqueda = this.filtroBusqueda().toLowerCase();
    const estado = this.estadoSeleccionado()?.nombre;
    const familia = this.familiaSeleccionada()?.nombre;
    const fecha = this.fechaSeleccionada();

    let fechaFormateada = '';
    if (fecha) {
      fechaFormateada =
        fecha.getDate().toString().padStart(2, '0') +
        '/' +
        (fecha.getMonth() + 1).toString().padStart(2, '0') +
        '/' +
        fecha.getFullYear();
    }

    return listado.filter((c) => {
      // CORRECCIÓN 2: Se usa c.detalle en singular tal cual tu interfaz
      const coincideBusqueda = c.detalle.toLowerCase().includes(busqueda);
      const coincideEstado = estado === 'Todos' || c.estado === estado;
      const coincideFamilia = familia === 'Todas' || c.familia === familia;
      const coincideFecha = !fecha || c.fecha === fechaFormateada;

      return coincideBusqueda && coincideEstado && coincideFamilia && coincideFecha;
    });
  });

  ngOnInit() {
    this.conteosService.listarConteos({
      id_sede: this.idSedeSeleccionada(),
    });

    this.cargarData();
  }

  cargarData() {
    this.conteos.set([
      {
        fecha: '08/02/2026',
        detalle: 'Conteo mensual licuadoras',
        estado: 'Inicio',
        familia: 'Licuadoras',
      },
      {
        fecha: '07/02/2026',
        detalle: 'Revisión anual freidoras',
        estado: 'Finalizado',
        familia: 'Freidoras',
      },
      {
        fecha: '06/02/2026',
        detalle: 'Conteo REFRIS - Sede Norte',
        estado: 'Anulado',
        familia: 'Refris',
      },
      {
        fecha: '05/02/2026',
        detalle: 'Stock Cocinas industriales',
        estado: 'Inicio',
        familia: 'Cocinas',
      },
      {
        fecha: '04/02/2026',
        detalle: 'Inventario licuadoras portátiles',
        estado: 'Finalizado',
        familia: 'Licuadoras',
      },
    ]);
  }

  filtrarEstados(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.estadosFiltrados.set(this.estados.filter((e) => e.nombre.toLowerCase().includes(query)));
  }

  filtrarFamilias(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.familiasFiltradas.set(this.familias.filter((f) => f.nombre.toLowerCase().includes(query)));
  }

  verDetalle(row: ConteoInventarioLocal) {
    this.router.navigate(['/conteo-detalle'], {
      state: { conteo: row },
    });
  }

  crearConteo() {
    this.router.navigate(['/admin/conteo-crear']);
  }
}

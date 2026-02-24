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

import { ConteoInventarioService } from '../../../logistica/services/conteo-inventario.service';

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
  private conteoService = inject(ConteoInventarioService);

  loading = this.conteoService.loading;
  conteosListado = this.conteoService.conteosListado; 

  idSedeSeleccionada = signal<number>(1);
  fechaSeleccionada = signal<Date | null>(null);
  filtroBusqueda = signal<string>('');
  estadoSeleccionado = signal<any>(null);
  familiaSeleccionada = signal<any>(null);

  estados = [{ nombre: 'INICIADO' }, { nombre: 'FINALIZADO' }, { nombre: 'ANULADO' }, { nombre:'PENDIENTE' }];
  estadosFiltrados = signal<any[]>([]);

  familias = [{ nombre: 'Todas' }, { nombre: 'Cafeteras' }, { nombre: 'Licuadoras' }];
  familiasFiltradas = signal<any[]>([]);

  conteosFiltrados = computed(() => {
    const listado = this.conteosListado();
    if (!listado || listado.length === 0) return [];

    const busqueda = this.filtroBusqueda().toLowerCase();
    const estado = this.estadoSeleccionado()?.nombre;
    const familia = this.familiaSeleccionada()?.nombre;

    return listado.filter((c: any) => {
      const coincideBusqueda = c.nomSede?.toLowerCase().includes(busqueda) || false;
      const coincideEstado = !estado || c.estado === estado;
      const coincideFamilia = !familia || familia === 'Todas' || c.familia === familia; // Borrar si es necesario

      return coincideBusqueda && coincideEstado; 
    });
  });

  ngOnInit() {
    this.cargarHistorialBackend();
  }

  cargarHistorialBackend() {
    this.conteoService.listarConteos({
      id_sede: this.idSedeSeleccionada()
    });
  }

  filtrarEstados(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.estadosFiltrados.set(this.estados.filter((e) => e.nombre.toLowerCase().includes(query)));
  }

  filtrarFamilias(event: any) {
    const query = event.query?.toLowerCase() || '';
    this.familiasFiltradas.set(this.familias.filter((f) => f.nombre.toLowerCase().includes(query)));
  }

  verDetalle(row: any) {
    this.router.navigate(['/admin/conteo-detalle', row.idConteo]);
  }

  crearConteo() {
    this.router.navigate(['/admin/conteo-crear']);
  }
}
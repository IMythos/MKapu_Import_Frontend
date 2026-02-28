import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { SedeService } from '../../../services/sede.service';
import { QuoteService } from '../../../services/quote.service';
import { QuoteListItem } from '../../../interfaces/quote.interface';

@Component({
  selector: 'app-gestion-cotizaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, SelectModule, CardModule,
    ButtonModule, TagModule, ToastModule, ConfirmDialog, ConfirmDialogModule,
    RouterModule, AutoComplete
  ],
  templateUrl: './gestion-listado.html',
  styleUrl: './gestion-listado.css',
  providers: [MessageService, ConfirmationService]
})
export class GestionCotizacionesComponent implements OnInit {
  public iconoCabecera = 'pi pi-wallet';
  public tituloKicker = 'ADMINISTRACIÓN';
  public subtituloKicker = 'GESTIÓN DE COTIZACIONES';

  private sedeService = inject(SedeService);
  private quoteService = inject(QuoteService);

  buscarValue = signal<string>('');
  cotizacionSugerencias = signal<QuoteListItem[]>([]);
  estadoSeleccionado = signal<string | null>('PENDIENTE');
  sedeSeleccionada = signal<number | null>(null);

  estadosOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobada', value: 'APROBADA' },
    { label: 'Rechazada', value: 'RECHAZADA' }
  ];

  currentPage = signal<number>(1);
  rows = signal<number>(10);

  sedesOptions = computed(() => this.sedeService.sedes().map(sede => ({
    label: sede.nombre,
    value: sede.id_sede
  })));

  cotizaciones = computed(() => this.quoteService.quotes());
  cotizacionesFiltradas = computed(() => this.cotizaciones());
  totalRecords = computed(() => this.quoteService.total());
  totalPages = computed(() => this.quoteService.totalPages());
  loading = computed(() => this.quoteService.loading());

  totalAprobadas = computed(() => this.cotizaciones().filter(c => c.estado === 'APROBADA').length);
  totalPendientes = computed(() => this.cotizaciones().filter(c => c.estado === 'PENDIENTE').length);

  ngOnInit() {
    const sedeDefaultId = this.getSedeUsuarioActual();
    if (sedeDefaultId) this.sedeSeleccionada.set(sedeDefaultId);
    this.cargarCotizacion();
    
    this.sedeService.loadSedes().subscribe({
      error: (err) => console.error('Error cargando sedes', err)
    });
  }

  private getSedeUsuarioActual(): number | null {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.idSede ?? null;
      }
    } catch (e) {
      console.error('Error parseando usuario', e);
    }
    return null;
  }

  cargarCotizacion() {
    this.quoteService.loadQuotes({
      estado: this.estadoSeleccionado(),
      id_sede: this.sedeSeleccionada(),
      search: this.buscarValue() || undefined,
      page: this.currentPage(),
      limit: this.rows()
    }).subscribe();
  }

  onSedeChange(nuevaSedeId: number | null) {
    this.sedeSeleccionada.set(nuevaSedeId);
    this.currentPage.set(1);
    this.cargarCotizacion();
  }

  onEstadoChange(estado: string | null) {
    this.estadoSeleccionado.set(estado);
    this.currentPage.set(1);
    this.cargarCotizacion();
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.rows.set(event.rows);
    this.cargarCotizacion();
  }

  searchCotizacion(event: any) {
    const query = event.query?.toLowerCase() ?? '';
    if (!query || query.length < 2) {
      this.cotizacionSugerencias.set([]);
      return;
    }
    this.quoteService.loadQuotes({ search: query, limit: 6 }).subscribe({
      next: () => this.cotizacionSugerencias.set(this.quoteService.quotes())
    });
  }

  seleccionarCotizacionBusqueda(event: any) {
    const c = event.value as QuoteListItem;
    this.buscarValue.set(c.codigo);
    this.irDetalle(c.id_cotizacion);
  }

  limpiarBusquedaCotizacion() {
    this.buscarValue.set('');
    this.cotizacionSugerencias.set([]);
    this.cargarCotizacion();
  }

  mapEstadoTag(estado: string | null | undefined): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    switch (estado) {
      case 'APROBADA': return 'success';
      case 'PENDIENTE': return 'warn';
      case 'RECHAZADA': return 'danger';
      default: return 'secondary';
    }
  }

  constructor(private router: Router) {}

  irCrear() { this.router.navigate(['/admin/gestion-cotizaciones/crear-cotizacion']); }
  irEditar(id: number) { this.router.navigate(['/admin/gestion-cotizaciones/editar-cotizacion', id]); }
  irDetalle(id: number) { this.router.navigate(['/admin/gestion-cotizaciones/ver-detalle-cotizacion', id]); }
}
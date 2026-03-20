import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CommonModule } from '@angular/common';
import { SedeService } from '../../../../services/sede.service';
import { WastageService, WastageResponseDto, WastageTypeDto } from '../../../../services/wastage.service';
import { SharedTableContainerComponent } from '../../../../../shared/components/table.componente/shared-table-container.component';
import { AuthService } from '../../../../../auth/services/auth.service';

interface WastageDetail {
  id_detalle:    number;
  id_producto:   number;
  cod_prod:      string;
  desc_prod:     string;
  cantidad:      number;
  pre_unit:      number;
  observacion?:  string;
  id_tipo_merma: number;
}

interface MermaUI {
  id_merma:      number;
  codigo:        string;
  motivo:        string;
  tipoMerma:     string;
  tipoMermaId:   number;
  cantidad:      number;
  responsable:   string;
  fechaRegistro: Date;
  observacion?:  string;
  detalles:      WastageDetail[];
  valorTotal:    number;
  id_sede:       number;
}

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-mermas-pr',
  standalone: true,
  imports: [
    CardModule, ButtonModule, RouterModule, FormsModule, InputTextModule,
    AutoCompleteModule, Select, ConfirmDialogModule, ToastModule, TableModule,
    TooltipModule, TagModule, DialogModule, InputNumberModule, SelectButtonModule,
    CommonModule, SharedTableContainerComponent,
  ],
  templateUrl: './mermas-pr.html',
  styleUrl: './mermas-pr.css',
  providers: [ConfirmationService, MessageService],
})
export class MermasPr implements OnInit {
  private readonly wastageService      = inject(WastageService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router              = inject(Router);
  private readonly sedeService         = inject(SedeService);
  private readonly authService         = inject(AuthService);

  mesActual = signal(this.obtenerMesActual());
  cargando  = this.wastageService.loading;

  // ── Tipos de merma desde la API ───────────────────────────────────────────
  tiposMermaOpciones = computed(() => [
    { label: 'Todos los tipos', value: '' },
    ...this.wastageService.tiposMerma().map((t: WastageTypeDto) => ({
      label: t.tipo,
      value: t.tipo,
    })),
  ]);

  // ── Sedes desde la API ────────────────────────────────────────────────────
  sedesOpciones = computed(() => [
    { label: 'Todas las sedes', value: '' },
    ...this.sedeService.sedes().map(s => ({
      label: s.nombre,
      value: String(s.id_sede),
    })),
  ]);

  // ── Filtros ───────────────────────────────────────────────────────────────
  busqueda        = signal('');
  tipoMermaFiltro = signal('');
  sedeFiltro      = signal(
    String(this.authService.getCurrentUser()?.idSede ?? '') 
  );

  readonly paginaActual = signal<number>(1);
  readonly limitePagina = signal<number>(5);

  // ── Modal detalle ─────────────────────────────────────────────────────────
  mermaSeleccionada   = signal<MermaUI | null>(null);
  mostrarModalDetalle = signal(false);

  // ── Constructor con effect para filtro de sede ────────────────────────────
  constructor() {
    effect(() => {
      const sede   = this.sedeFiltro();
      const idSede = sede ? Number(sede) : 0;
      this.wastageService.loadWastages(1, this.limitePagina(), idSede).subscribe();
      this.paginaActual.set(1);
    });
  }

  // ── Datos ─────────────────────────────────────────────────────────────────
  mermas = computed(() =>
    this.wastageService.wastages().map(merma => this.mapToUI(merma))
  );

  mermasFiltradas = computed(() => {
    let resultados    = [...this.mermas()];
    const busquedaStr = this.busqueda().toLowerCase().trim();

    if (busquedaStr) {
      resultados = resultados.filter(m =>
        m.codigo.toLowerCase().includes(busquedaStr)      ||
        m.motivo.toLowerCase().includes(busquedaStr)      ||
        m.responsable.toLowerCase().includes(busquedaStr)
      );
    }

    if (this.tipoMermaFiltro()) {
      resultados = resultados.filter(m => m.tipoMerma === this.tipoMermaFiltro());
    }

    return resultados;
  });

  readonly mermasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limitePagina();
    return this.mermasFiltradas().slice(inicio, inicio + this.limitePagina());
  });

  readonly totalPaginas = computed(() =>
    Math.ceil(this.mermasFiltradas().length / this.limitePagina())
  );

  totalMermas    = computed(() => this.mermas().length);
  totalProductos = computed(() => this.mermas().reduce((sum, m) => sum + m.cantidad, 0));

  mermasMesActual = computed(() => {
    const mes  = new Date().getMonth();
    const year = new Date().getFullYear();
    return this.mermas().filter(m => {
      const fecha = new Date(m.fechaRegistro);
      return fecha.getMonth() === mes && fecha.getFullYear() === year;
    }).length;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarTiposMerma();
    this.sedeService.loadSedes().subscribe();
  }

  // ── Carga ─────────────────────────────────────────────────────────────────
  private cargarTiposMerma(): void {
    this.wastageService.loadTiposMerma().subscribe({
      error: () => this.messageService.add({
        severity: 'warn', summary: 'Aviso',
        detail: 'No se pudieron cargar los tipos de merma.', life: 3000,
      }),
    });
  }

  cargarMermas(id_sede = 0): void {
    this.wastageService.loadWastages(1, this.limitePagina(), id_sede).subscribe({
      next: () => console.log(`✅ ${this.mermas().length} mermas cargadas`),
      error: () => this.messageService.add({
        severity: 'error', summary: 'Error',
        detail: 'No se pudieron cargar las mermas', life: 3000,
      }),
    });
  }

  // ── Mapper ────────────────────────────────────────────────────────────────
  private mapToUI(merma: WastageResponseDto): MermaUI {
    const valorTotal = merma.detalles?.reduce(
      (sum, d) => sum + (d.cantidad * d.pre_unit), 0
    ) ?? 0;

    return {
      id_merma:      merma.id_merma,
      codigo:        `MER-${merma.id_merma.toString().padStart(4, '0')}`,
      motivo:        merma.motivo,
      tipoMerma:     merma.tipo_merma_label || 'SIN CLASIFICAR',
      tipoMermaId:   merma.tipo_merma_id,
      cantidad:      merma.total_items,
      responsable:   merma.responsable || 'Sin asignar',
      fechaRegistro: new Date(merma.fec_merma),
      observacion:   merma.detalles?.[0]?.observacion || '',
      id_sede:       merma.id_sede_ref ?? 0,
      detalles:      merma.detalles?.map(d => ({
        id_detalle:    d.id_detalle ?? 0,
        id_producto:   d.id_producto,
        cod_prod:      d.cod_prod,
        desc_prod:     d.desc_prod,
        cantidad:      d.cantidad,
        pre_unit:      d.pre_unit,
        observacion:   d.observacion,
        id_tipo_merma: d.id_tipo_merma,
      })) ?? [],
      valorTotal,
    };
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  irRegistro(): void {
    this.router.navigate(['/admin', 'mermas', 'registro-merma']);
  }

  irEditar(merma: MermaUI): void {
    this.router.navigate(['/admin/mermas', 'edicion-merma', merma.id_merma]);
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  limpiarFiltros(): void {
    this.busqueda.set('');
    this.tipoMermaFiltro.set('');
    this.sedeFiltro.set('');   
    this.paginaActual.set(1);
    this.messageService.add({
      severity: 'info', summary: 'Filtros limpiados',
      detail: 'Se muestran todas las mermas', life: 2000,
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  verDetalleMerma(merma: MermaUI): void {
    this.mermaSeleccionada.set({ ...merma });
    this.mostrarModalDetalle.set(true);
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle.set(false);
    this.mermaSeleccionada.set(null);
  }

  getNombreSede(id_sede: number): string {
    console.log('id_sede recibido:', id_sede, '| sedes cargadas:', this.sedeService.sedes().length);
    const sede = this.sedeService.sedes().find(s => s.id_sede === id_sede);
    return sede ? sede.nombre : '—';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  obtenerMesActual(): string {
    const meses = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
    ];
    return meses[new Date().getMonth()];
  }

  getTipoMermaLabel(tipo: string): string {
    const found = this.wastageService.tiposMerma()
      .find((t: WastageTypeDto) => t.tipo === tipo);
    return found ? found.tipo : tipo || 'SIN CLASIFICAR';
  }

  getTipoMermaSeverity(tipo: string): Severity {
    const map: Record<string, Severity> = {
      'DAÑO':           'danger',
      'VENCIMIENTO':    'warn',
      'ROBO':           'danger',
      'DETERIORO':      'info',
      'ERROR_CONTEO':   'secondary',
      'DEVOLUCION':     'warn',
      'OTRO':           'secondary',
      'SIN CLASIFICAR': 'secondary',
    };
    return map[tipo] || 'info';
  }

  refrescarLista(): void { this.cargarMermas(this.sedeFiltro() ? Number(this.sedeFiltro()) : 0); }

  onPageChange(page: number):   void { this.paginaActual.set(page); }
  onLimitChange(limit: number): void { this.limitePagina.set(limit); this.paginaActual.set(1); }
}
import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { RouterModule } from '@angular/router';
import { CommissionService, CommissionRule } from '../../services/commission.service';
import { CategoriaService } from '../../services/categoria.service';
import { SharedTableContainerComponent } from '../../../shared/components/table.componente/shared-table-container.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-comision',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule,
    InputTextModule, TableModule, TagModule,
    SelectModule, CardModule, RouterModule,
    TooltipModule,
    SharedTableContainerComponent,
  ],
  templateUrl: './comision.html',
  styleUrls: ['./comision.css'],
})
export class Comision implements OnInit {
  private readonly commissionService = inject(CommissionService);
  private readonly categoriaService  = inject(CategoriaService);

  readonly loading    = this.commissionService.loading;
  readonly error      = this.commissionService.error;
  readonly categorias = this.categoriaService.categorias;

  // ── Filtros ────────────────────────────────────────────────────────────────
  readonly filtroBusqueda   = signal('');
  readonly filtroTipo       = signal<string | null>(null);
  readonly filtroRecompensa = signal<string | null>(null);
  readonly filtroActivo     = signal<boolean | null>(true);
  readonly paginaActual     = signal<number>(1);
  readonly limitePagina     = signal<number>(5);

  tiposObjetivo = [
    { label: 'Categoría', value: 'CATEGORIA' },
    { label: 'Producto',  value: 'PRODUCTO'  },
  ];

  tiposRecompensa = [
    { label: 'Monto Fijo', value: 'MONTO_FIJO' },
    { label: 'Porcentaje', value: 'PORCENTAJE' },
  ];

  estadosFiltro = [
    { label: 'Activas',   value: true  },
    { label: 'Inactivas', value: false },
    { label: 'Todas',     value: null  },
  ];

  limpiarFiltros() {
    this.filtroBusqueda.set('');
    this.filtroTipo.set(null);
    this.filtroRecompensa.set(null);
    this.filtroActivo.set(true);
    this.paginaActual.set(1);
  }

  // ── Computed: mapa de uso indexado por id_regla ────────────────────────────
  private readonly usageMap = computed(() => {
    const map = new Map<number, { usos: number; monto_total: number }>();
    this.commissionService.usageByRule().forEach(u => map.set(u.id_regla, u));
    return map;
  });

  private readonly maxUsos = computed(() => {
    const usage = this.commissionService.usageByRule();
    return usage.length ? Math.max(...usage.map(u => u.usos), 1) : 1;
  });

  // ── Computed rows ──────────────────────────────────────────────────────────
  readonly reglas = computed(() => {
    const catMap   = new Map(this.categorias().map(c => [c.id_categoria, c.nombre]));
    const usageMap = this.usageMap();
    const maxUsos  = this.maxUsos();

    return this.commissionService.rules().map(r => {
      const uso = usageMap.get(r.id_regla) ?? { usos: 0, monto_total: 0 };
      return {
        id:           `RC-${String(r.id_regla).padStart(3, '0')}`,
        nombre:       r.nombre,
        descripcion:  r.descripcion ?? '',
        familia:      catMap.get(r.id_objetivo) ?? `ID: ${r.id_objetivo}`,
        tipo:         r.tipo_objetivo === 'PRODUCTO' ? 'Producto' : 'Categoría',
        tipoSeverity: (r.tipo_objetivo === 'PRODUCTO' ? 'info' : 'success') as any,
        condicion:    r.meta_unidades > 1 ? `Lote (≥${r.meta_unidades} uds.)` : 'Por Unidad',
        recompensa:   r.tipo_recompensa === 'PORCENTAJE' ? '%' : 'S/',
        comision:     Number(r.valor_recompensa),
        activo:       r.activo,
        usos:         uso.usos,
        montoTotal:   uso.monto_total,
        barWidth:     Math.round((uso.usos / maxUsos) * 100),
        raw:          r,
      };
    });
  });

  readonly reglasFiltradas = computed(() => {
    let data         = this.reglas();
    const activo     = this.filtroActivo();
    const busqueda   = this.filtroBusqueda().trim().toLowerCase();
    const tipo       = this.filtroTipo();
    const recompensa = this.filtroRecompensa();

    if (activo !== null) data = data.filter(r => r.activo === activo);
    if (busqueda)        data = data.filter(r => r.nombre.toLowerCase().includes(busqueda));
    if (tipo)            data = data.filter(r => r.raw.tipo_objetivo === tipo);
    if (recompensa)      data = data.filter(r => r.raw.tipo_recompensa === recompensa);

    return data;
  });

  readonly reglasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limitePagina();
    return this.reglasFiltradas().slice(inicio, inicio + this.limitePagina());
  });

  readonly totalPaginas = computed(() =>
    Math.ceil(this.reglasFiltradas().length / this.limitePagina())
  );

  // ── KPIs ───────────────────────────────────────────────────────────────────
  readonly totalReglasActivas = computed(() =>
    this.commissionService.rules().filter(r => r.activo).length
  );

  readonly totalInactivas = computed(() =>
    this.commissionService.rules().filter(r => !r.activo).length
  );

  readonly promedioComision = computed(() => {
    const lista = this.commissionService.activeRules();
    if (!lista.length) return 0;
    return lista.reduce((acc, r) => acc + Number(r.valor_recompensa), 0) / lista.length;
  });

  readonly reglasConMeta = computed(() =>
    this.commissionService.activeRules().filter(r => r.meta_unidades > 1).length
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.commissionService.loadRules().subscribe();
    this.commissionService.loadUsageByRule().subscribe();
    this.categoriaService.loadCategorias().subscribe();
  }

  onToggleStatus(rule: CommissionRule) {
    this.commissionService.toggleRuleStatus(rule.id_regla, !rule.activo).subscribe();
  }

  onPageChange(page: number): void   { this.paginaActual.set(page); }
  onLimitChange(limit: number): void { this.limitePagina.set(limit); this.paginaActual.set(1); }
}
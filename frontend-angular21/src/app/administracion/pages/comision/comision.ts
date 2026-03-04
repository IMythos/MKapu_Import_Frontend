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

@Component({
  selector: 'app-comision',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule,
    InputTextModule, TableModule, TagModule,
    SelectModule, CardModule, RouterModule,
  ],
  templateUrl: './comision.html',
  styleUrls: ['./comision.css'],
})
export class Comision implements OnInit {
  private readonly commissionService = inject(CommissionService);
  private readonly categoriaService  = inject(CategoriaService);

  readonly loading  = this.commissionService.loading;
  readonly error    = this.commissionService.error;
  readonly categorias = this.categoriaService.categorias;

  // ── Filtros como signals ───────────────────────────────────────────────────
  readonly filtroBusqueda   = signal('');
  readonly filtroTipo       = signal<string | null>(null);
  readonly filtroRecompensa = signal<string | null>(null);
  readonly filtroActivo     = signal<boolean | null>(true);

  tiposObjetivo = [
    { label: 'Categoría', value: 'CATEGORIA' },
    { label: 'Producto',  value: 'PRODUCTO' },
  ];

  tiposRecompensa = [
    { label: 'Monto Fijo', value: 'MONTO_FIJO' },
    { label: 'Porcentaje', value: 'PORCENTAJE' },
  ];

  estadosFiltro = [
    { label: 'Activas',   value: true },
    { label: 'Inactivas', value: false },
    { label: 'Todas',     value: null },
  ];

  limpiarFiltros() {
    this.filtroBusqueda.set('');
    this.filtroTipo.set(null);
    this.filtroRecompensa.set(null);
    this.filtroActivo.set(true);
  }

  // ── Computed rows ──────────────────────────────────────────────────────────
  readonly reglas = computed(() => {
    const catMap = new Map(
      this.categorias().map(c => [c.id_categoria, c.nombre])
    );
    return this.commissionService.rules().map(r => ({
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
      raw:          r,
    }));
  });

  readonly reglasFiltradas = computed(() => {
    let data = this.reglas();
    const activo     = this.filtroActivo();
    const busqueda   = this.filtroBusqueda().trim().toLowerCase();
    const tipo       = this.filtroTipo();
    const recompensa = this.filtroRecompensa();

    if (activo !== null) {
      data = data.filter(r => r.activo === activo);
    }
    if (busqueda) {
      data = data.filter(r => r.nombre.toLowerCase().includes(busqueda));
    }
    if (tipo) {
      data = data.filter(r => r.raw.tipo_objetivo === tipo);
    }
    if (recompensa) {
      data = data.filter(r => r.raw.tipo_recompensa === recompensa);
    }
    return data;
  });

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
    this.categoriaService.loadCategorias().subscribe();
  }

  onToggleStatus(rule: CommissionRule) {
    this.commissionService.toggleRuleStatus(rule.id_regla, !rule.activo).subscribe();
  }
}
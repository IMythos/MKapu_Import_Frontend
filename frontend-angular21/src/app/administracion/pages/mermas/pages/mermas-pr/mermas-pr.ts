// mermas-pr.ts

import { Component, signal, computed, inject, OnInit } from '@angular/core';
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

import { WastageService, WastageResponseDto } from '../../../../services/wastage.service';

interface WastageDetail {
  id_detalle: number;
  id_producto: number;
  cod_prod: string;
  desc_prod: string;
  cantidad: number;
  pre_unit: number;
  observacion?: string;
  id_tipo_merma: number;
}

interface MermaUI {
  id_merma: number;
  codigo: string;
  motivo: string;
  tipoMerma: string;
  tipoMermaId: number;
  cantidad: number;
  responsable: string;
  fechaRegistro: Date;
  observacion?: string;
  detalles: WastageDetail[];
  valorTotal: number; 
}

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-mermas-pr',
  standalone: true,
  imports: [
    CardModule, ButtonModule, RouterModule, FormsModule, InputTextModule, 
    AutoCompleteModule, Select, ConfirmDialogModule, ToastModule, TableModule, 
    TooltipModule, TagModule, DialogModule, InputNumberModule, SelectButtonModule, 
    CommonModule
  ],
  templateUrl: './mermas-pr.html',
  styleUrl: './mermas-pr.css',
  providers: [ConfirmationService, MessageService],
})
export class MermasPr implements OnInit {
  private readonly wastageService = inject(WastageService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  mesActual = signal(this.obtenerMesActual());
  
  cargando = this.wastageService.loading;
  
  tiposMerma = [
    { label: 'Por Defecto', value: 'POR_DEFECTO' },
    { label: 'Daño', value: 'DAÑO' },
    { label: 'Garantía', value: 'GARANTIA' },
    { label: 'Merma', value: 'MERMA' },
    { label: 'Oferta', value: 'OFERTA' }
  ];

  // Filtros
  busqueda = signal('');
  tipoMermaFiltro = signal('');

  // Modal
  mermaSeleccionada = signal<MermaUI | null>(null);
  mostrarModalDetalle = signal(false);

  mermas = computed(() => {
    return this.wastageService.wastages().map(merma => this.mapToUI(merma));
  });

  mermasFiltradas = computed(() => {
    let resultados = [...this.mermas()];
    const busquedaStr = this.busqueda().toLowerCase().trim();
    
    if (busquedaStr) {
      resultados = resultados.filter(m =>
        m.codigo.toLowerCase().includes(busquedaStr) ||
        m.motivo.toLowerCase().includes(busquedaStr) ||
        m.responsable.toLowerCase().includes(busquedaStr)
      );
    }
    
    if (this.tipoMermaFiltro()) {
      resultados = resultados.filter(m => m.tipoMerma === this.tipoMermaFiltro());
    }
    
    return resultados;
  });

  totalMermas = computed(() => this.mermas().length);
  
  totalProductos = computed(() => {
    return this.mermas().reduce((sum, m) => sum + m.cantidad, 0);
  });
  
  mermasMesActual = computed(() => {
    const mes = new Date().getMonth();
    const year = new Date().getFullYear();
    return this.mermas().filter(m => {
      const fecha = new Date(m.fechaRegistro);
      return fecha.getMonth() === mes && fecha.getFullYear() === year;
    }).length;
  });

  ngOnInit(): void {
    this.cargarMermas();
  }

  private mapToUI(merma: WastageResponseDto): MermaUI {
    const valorTotal = merma.detalles?.reduce(
      (sum, d) => sum + (d.cantidad * d.pre_unit), 
      0
    ) ?? 0;

    return {
      id_merma: merma.id_merma,
      codigo: `MER-${merma.id_merma.toString().padStart(4, '0')}`,
      motivo: merma.motivo,
      tipoMerma: merma.tipo_merma_label || 'SIN CLASIFICAR',
      tipoMermaId: merma.tipo_merma_id,
      cantidad: merma.total_items,
      responsable: merma.responsable || 'Sin asignar',
      fechaRegistro: new Date(merma.fec_merma),
      observacion: merma.detalles?.[0]?.observacion || '',
      detalles: merma.detalles?.map(d => ({
        id_detalle: d.id_detalle ?? 0,
        id_producto: d.id_producto,
        cod_prod: d.cod_prod,
        desc_prod: d.desc_prod,
        cantidad: d.cantidad,
        pre_unit: d.pre_unit,
        observacion: d.observacion,
        id_tipo_merma: d.id_tipo_merma
      })) ?? [],
      valorTotal
    };
  }

  irRegistro(): void {
    this.router.navigate(['/admin', 'mermas', 'registro-merma']);
  }

  obtenerMesActual(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[new Date().getMonth()];
  }

  cargarMermas(): void {
    this.wastageService.loadWastages(1, 50).subscribe({
      next: () => {
        // Datos cargados exitosamente, los signals se actualizan automáticamente
        console.log(`✅ ${this.mermas().length} mermas cargadas`);
      },
      error: (error) => {
        console.error('Error al cargar mermas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las mermas',
          life: 3000
        });
      }
    });
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.tipoMermaFiltro.set('');
    
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se muestran todas las mermas',
      life: 2000
    });
  }

  verDetalleMerma(merma: MermaUI): void {
    this.mermaSeleccionada.set({ ...merma });
    this.mostrarModalDetalle.set(true);
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle.set(false);
    this.mermaSeleccionada.set(null);
  }

  getTipoMermaLabel(tipo: string): string {
    return tipo.toUpperCase();
  }

  getTipoMermaSeverity(tipo: string): Severity {
    const severityMap: { [key: string]: Severity } = {
      'POR_DEFECTO': 'secondary',
      'DAÑO': 'danger',
      'GARANTIA': 'warn',
      'MERMA': 'info',
      'OFERTA': 'success',
      'SIN CLASIFICAR': 'secondary'
    };
    return severityMap[tipo] || 'info';
  }

  refrescarLista(): void {
    this.cargarMermas();
  }
}
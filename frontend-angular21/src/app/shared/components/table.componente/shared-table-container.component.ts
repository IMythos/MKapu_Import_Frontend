import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Card }                   from 'primeng/card';
import { Button }                 from 'primeng/button';
import { Tooltip }                from 'primeng/tooltip';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';
import { PaginadorComponent }      from '../paginador/Paginador.component';

@Component({
  selector: 'app-shared-table-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Card,
    Button,
    Tooltip,
    LoadingOverlayComponent,
    PaginadorComponent,
  ],
  
  template: `
    <div style="position: relative">
        <p-card styleClass="shared-card tarjeta-principal">

        <!-- Loading overlay sobre toda la card -->
        <app-loading-overlay
          [visible]="loading"
          [mensaje]="mensajeCarga"
          modo="inline"
        />

        <div
          class="seccion-tabla"
          [style.opacity]="loading ? '0.3' : '1'"
          style="transition: opacity 0.2s ease"
        >
          <!-- ── Header: título + botón exportar ── -->
          <div class="shared-tabla-header">
            <h3>
              <i [class]="iconoTitulo"></i>
              {{ titulo }}
            </h3>

            <div class="shared-tabla-acciones">
              <!-- Slot para botones extra que inyecte cada página -->
              <ng-content select="[slot=acciones]" />

              <p-button
                *ngIf="mostrarExportar"
                [label]="labelExportar"
                icon="pi pi-download"
                severity="success"
                [outlined]="true"
                [disabled]="totalRegistros === 0"
                pTooltip="Descargar reporte en Excel"
                tooltipPosition="bottom"
                size="small"
                (onClick)="exportar.emit()"
              />
            </div>
          </div>

          <!-- ── Contenido: p-table con sus columnas y filas ── -->
          <ng-content />

          <!-- ── Paginador ── -->
          <app-paginador
            [page]="paginaActual"
            [totalPages]="totalPaginas"
            [total]="totalRegistros"
            [limit]="limitePorPagina"
            (pageChange)="pageChange.emit($event)"
            (limitChange)="limitChange.emit($event)"
          />
        </div>

      </p-card>
    </div>
  `,
styles: [`
  :host ::ng-deep .p-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  }

  :host ::ng-deep .p-card .p-card-body {
    padding: 1.25rem !important;
  }

  .seccion-tabla {
    margin-top: 0;
  }

  .shared-tabla-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.875rem;
    border-bottom: 2px solid var(--surface-border);
  }

  .shared-tabla-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .shared-tabla-header h3 i {
    color: #f6af33;
    font-size: 1rem;
  }

  .shared-tabla-acciones {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: 600px) {
    .shared-tabla-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .shared-tabla-header h3 {
      font-size: 1rem;
    }
  }
`]

})
export class SharedTableContainerComponent {

  // ── Apariencia ─────────────────────────────────────────────────
  @Input() titulo        = 'Listado';
  @Input() iconoTitulo   = 'pi pi-list';
  @Input() mensajeCarga  = 'Cargando...';

  // ── Estado ─────────────────────────────────────────────────────
  @Input() loading       = false;

  // ── Exportar ───────────────────────────────────────────────────
  @Input() mostrarExportar = true;
  @Input() labelExportar   = 'Exportar Excel';

  // ── Paginador ──────────────────────────────────────────────────
  @Input() paginaActual    = 1;
  @Input() totalPaginas    = 0;
  @Input() totalRegistros  = 0;
  @Input() limitePorPagina = 5;

  // ── Eventos ────────────────────────────────────────────────────
  @Output() exportar    = new EventEmitter<void>();
  @Output() pageChange  = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();
}
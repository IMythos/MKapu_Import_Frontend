import {
  Component, Input, Output, EventEmitter,
  signal, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

export interface AccionesComprobanteConfig {
  titulo:     string;   // ej. "B001-00000168"  |  "Cierre de Caja"
  subtitulo?: string;   // ej. "JUAN DIEGO LUJAN CARRION"
  mostrarWsp?:    boolean;  // default true
  mostrarEmail?:  boolean;  // default true
  labelPdf?:      string;   // default "PDF"
  labelVoucher?:  string;   // default "Voucher"
}

export type AccionComprobante =
  | 'wsp' | 'email'
  | 'pdf-imprimir'     | 'pdf-descargar'
  | 'voucher-imprimir' | 'voucher-descargar';

@Component({
  selector: 'app-acciones-comprobante-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
<p-dialog
  [(visible)]="visible"
  [modal]="true"
  [closable]="true"
  [draggable]="false"
  [style]="{ width: '420px' }"
  (onHide)="onCerrar()"
  styleClass="acd-dialog">

  <!-- ── Header ── -->
  <ng-template pTemplate="header">
    <div class="acd-header">
      <div class="acd-header__icon"><i class="pi pi-file-edit"></i></div>
      <div>
        <p class="acd-header__titulo">{{ config?.titulo }}</p>
        <p class="acd-header__sub" *ngIf="config?.subtitulo">{{ config!.subtitulo }}</p>
      </div>
    </div>
  </ng-template>

  <!-- ── Body ── -->
  <div class="acd-body">

    <!-- ════ ENVÍOS ════════════════════════════════════════════════ -->
    <ng-container *ngIf="config?.mostrarWsp !== false || config?.mostrarEmail !== false">
      <ng-container *ngIf="mostrarSeccionEnvios()">
        <p class="acd-section-label">ENVÍOS</p>
        <div class="acd-fila">

          <button *ngIf="config?.mostrarWsp !== false"
                  class="acd-btn acd-btn--wsp"
                  [class.acd-btn--busy]="cargando() === 'wsp'"
                  [disabled]="!!cargando()"
                  (click)="emit('wsp')">
            <span class="acd-btn__ico acd-ico--wsp">
              <i [class]="cargando()==='wsp' ? 'pi pi-spin pi-spinner' : 'pi pi-whatsapp'"></i>
            </span>
            <span class="acd-btn__txt">WhatsApp</span>
          </button>

          <button *ngIf="config?.mostrarEmail !== false"
                  class="acd-btn acd-btn--email"
                  [class.acd-btn--busy]="cargando() === 'email'"
                  [disabled]="!!cargando()"
                  (click)="emit('email')">
            <span class="acd-btn__ico acd-ico--email">
              <i [class]="cargando()==='email' ? 'pi pi-spin pi-spinner' : 'pi pi-envelope'"></i>
            </span>
            <span class="acd-btn__txt">Correo</span>
          </button>

        </div>
      </ng-container>
    </ng-container>

    <!-- ════ PDF ════════════════════════════════════════════════════ -->
    <p class="acd-section-label" [class.acd-section-label--first]="!mostrarSeccionEnvios()">
      <i class="pi pi-file-pdf"></i>
      {{ config?.labelPdf ?? 'PDF' }}
    </p>
    <div class="acd-fila">

      <button class="acd-btn acd-btn--pdf"
              [class.acd-btn--busy]="cargando() === 'pdf-imprimir'"
              [disabled]="!!cargando()"
              (click)="emit('pdf-imprimir')">
        <span class="acd-btn__ico acd-ico--imprimir">
          <i [class]="cargando()==='pdf-imprimir' ? 'pi pi-spin pi-spinner' : 'pi pi-print'"></i>
        </span>
        <span class="acd-btn__txt">Imprimir PDF</span>
      </button>

      <button class="acd-btn acd-btn--pdf"
              [class.acd-btn--busy]="cargando() === 'pdf-descargar'"
              [disabled]="!!cargando()"
              (click)="emit('pdf-descargar')">
        <span class="acd-btn__ico acd-ico--pdf">
          <i [class]="cargando()==='pdf-descargar' ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
        </span>
        <span class="acd-btn__txt">Descargar PDF</span>
      </button>

    </div>

    <!-- ════ VOUCHER ════════════════════════════════════════════════ -->
    <p class="acd-section-label">
      <i class="pi pi-receipt"></i>
      {{ config?.labelVoucher ?? 'Voucher' }}
      <span class="acd-badge">Térmica</span>
    </p>
    <div class="acd-fila">

      <button class="acd-btn acd-btn--voucher"
              [class.acd-btn--busy]="cargando() === 'voucher-imprimir'"
              [disabled]="!!cargando()"
              (click)="emit('voucher-imprimir')">
        <span class="acd-btn__ico acd-ico--imprimir">
          <i [class]="cargando()==='voucher-imprimir' ? 'pi pi-spin pi-spinner' : 'pi pi-print'"></i>
        </span>
        <span class="acd-btn__txt">Imprimir Voucher</span>
      </button>

      <button class="acd-btn acd-btn--voucher"
              [class.acd-btn--busy]="cargando() === 'voucher-descargar'"
              [disabled]="!!cargando()"
              (click)="emit('voucher-descargar')">
        <span class="acd-btn__ico acd-ico--voucher">
          <i [class]="cargando()==='voucher-descargar' ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
        </span>
        <span class="acd-btn__txt">Descargar Voucher</span>
      </button>

    </div>

  </div>

  <!-- ── Footer ── -->
  <ng-template pTemplate="footer">
    <p-button label="Cerrar" icon="pi pi-times"
      severity="secondary" [text]="true" (onClick)="onCerrar()" />
  </ng-template>

</p-dialog>
  `,
  styles: [`

    /* ── Dialog shell ──────────────────────────────────────────── */
    :host ::ng-deep .acd-dialog .p-dialog-header {
      padding: 1rem 1.25rem 0.65rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    :host ::ng-deep .acd-dialog .p-dialog-content { padding: 0; }
    :host ::ng-deep .acd-dialog .p-dialog-footer {
      padding: 0.5rem 1.25rem 0.85rem;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    /* ── Header ────────────────────────────────────────────────── */
    .acd-header {
      display: flex; align-items: center; gap: .65rem;
    }
    .acd-header__icon {
      width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
      background: rgba(246,175,51,.15); color: #F6AF33;
      display: flex; align-items: center; justify-content: center;
      font-size: .95rem;
    }
    .acd-header__titulo {
      margin: 0; font-size: .92rem; font-weight: 700;
      color: var(--text-color, #e5e5e5);
    }
    .acd-header__sub {
      margin: 0; font-size: .72rem;
      color: var(--text-muted, #888);
    }

    /* ── Body wrapper ──────────────────────────────────────────── */
    .acd-body {
      padding: .85rem 1.25rem .6rem;
      display: flex; flex-direction: column; gap: .35rem;
    }

    /* ── Etiquetas de sección ──────────────────────────────────── */
    .acd-section-label {
      display: flex; align-items: center; gap: .35rem;
      margin: .6rem 0 .35rem;
      font-size: .65rem; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase;
      color: var(--text-muted, #777);
    }
    .acd-section-label--first { margin-top: 0; }

    /* ── Badge "Térmica" ───────────────────────────────────────── */
    .acd-badge {
      font-size: .6rem; font-weight: 500;
      padding: 1px 6px; border-radius: 10px;
      background: rgba(255,255,255,.07);
      color: var(--text-muted, #888);
    }

    /* ── Fila de 2 botones ─────────────────────────────────────── */
    .acd-fila {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .45rem;
      margin-bottom: .2rem;
    }

    /* ── Botón base ────────────────────────────────────────────── */
    .acd-btn {
      display: flex; align-items: center; gap: .55rem;
      padding: .6rem .85rem;
      border-radius: 9px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.03);
      cursor: pointer;
      transition: background .13s, border-color .13s, transform .1s;
      outline: none;
      text-align: left;
    }
    .acd-btn:hover:not(:disabled) {
      background: rgba(255,255,255,.07);
      transform: translateY(-1px);
    }
    .acd-btn:active:not(:disabled)  { transform: translateY(0); }
    .acd-btn:disabled, .acd-btn--busy {
      opacity: .42; cursor: not-allowed; transform: none !important;
    }

    /* ── Icono del botón ───────────────────────────────────────── */
    .acd-btn__ico {
      width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .9rem;
      transition: transform .13s;
    }
    .acd-btn:hover:not(:disabled) .acd-btn__ico { transform: scale(1.1); }

    .acd-btn__txt {
      font-size: .74rem; font-weight: 600;
      color: var(--text-color, #d0d0d0);
      white-space: nowrap;
    }

    /* ── Colores por tipo ──────────────────────────────────────── */
    .acd-ico--wsp      { background: rgba(37,211,102,.15);  color: #25D366; }
    .acd-ico--email    { background: rgba(96,165,250,.15);  color: #60a5fa; }
    .acd-ico--pdf      { background: rgba(248,113,113,.15); color: #f87171; }
    .acd-ico--imprimir { background: rgba(167,139,250,.15); color: #a78bfa; }
    .acd-ico--voucher  { background: rgba(251,191,36,.15);  color: #fbbf24; }

    /* Borde hover por tipo */
    .acd-btn--wsp:hover:not(:disabled)     { border-color: rgba(37,211,102,.3); }
    .acd-btn--email:hover:not(:disabled)   { border-color: rgba(96,165,250,.3); }
    .acd-btn--pdf:hover:not(:disabled)     { border-color: rgba(248,113,113,.3); }
    .acd-btn--voucher:hover:not(:disabled) { border-color: rgba(251,191,36,.3); }

  `],
})
export class AccionesComprobanteDialogComponent implements OnChanges {

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() config: AccionesComprobanteConfig | null = null;

  /** El padre setea el nombre de la acción en curso ('pdf-imprimir', etc.) o null al terminar */
  @Input() accionCargando: string | null = null;

  @Output() accion = new EventEmitter<AccionComprobante>();
  @Output() cerrar = new EventEmitter<void>();

  cargando = signal<string | null>(null);

  ngOnChanges(c: SimpleChanges): void {
    if (c['accionCargando']) this.cargando.set(this.accionCargando);
  }

  mostrarSeccionEnvios(): boolean {
    return this.config?.mostrarWsp !== false || this.config?.mostrarEmail !== false;
  }

  emit(a: string): void { this.accion.emit(a as AccionComprobante); }

  onCerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cerrar.emit();
  }
}
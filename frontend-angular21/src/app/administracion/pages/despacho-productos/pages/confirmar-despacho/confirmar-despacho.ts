import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmacionDespachoStateService, ConfirmacionDespachoData } from '../../../../services/confirmacion-despacho.state.service';

@Component({
  selector: 'app-confirmar-despacho',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  templateUrl: './confirmar-despacho.html',
  styleUrl: './confirmar-despacho.css',
})
export class ConfirmarDespacho implements OnInit, OnDestroy {
  private readonly router       = inject(Router);
  private readonly stateService = inject(ConfirmacionDespachoStateService);

  state     = signal<ConfirmacionDespachoData | null>(null);
  animating = signal(true);

  readonly totalUnidades = computed(() =>
    this.state()?.productos.reduce((acc, p) => acc + p.cantidad_solicitada, 0) ?? 0
  );

  readonly estadoLabel = computed(() => {
    const labels: Record<string, string> = {
      GENERADO: 'Generado', EN_PREPARACION: 'En Preparación',
      EN_TRANSITO: 'En Tránsito', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
    };
    return labels[this.state()?.estado ?? ''] ?? this.state()?.estado ?? '—';
  });

  readonly fechaFormateada = computed(() => {
    const f = this.state()?.fechaEmision;
    const d = f ? new Date(f) : new Date();
    return d.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  });

  readonly mapUrl = computed(() => {
    const dir = this.state()?.direccionEntrega;
    if (!dir) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ', Lima, Perú')}`;
  });

  private get printKey(): string {
    return `guia_impresa_${this.state()?.id_despacho ?? 0}`;
  }

  ngOnInit(): void {
    const raw = sessionStorage.getItem('confirmar_despacho_data');
    if (raw) {
      this.state.set(JSON.parse(raw));
      sessionStorage.removeItem('confirmar_despacho_data');
      setTimeout(() => this.animating.set(false), 100);
    } else {
      this.router.navigate(['/admin/despacho-productos']);
    }
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('confirmar_despacho_data');
  }

  getDetalleEstadoClass(estado: string): string {
    switch (estado) {
      case 'PREPARADO':  return 'cd-badge-preparado';
      case 'DESPACHADO': return 'cd-badge-despachado';
      case 'FALTANTE':   return 'cd-badge-faltante';
      default:           return 'cd-badge-pendiente';
    }
  }

  imprimirGuia(): void {
    const s = this.state();
    if (!s) return;
    // Desde esta pantalla SIEMPRE es la guía original (nunca copia)
    this.imprimirTicket(s, false);
  }

  verHistorial(): void {
    this.router.navigate(['/admin/despacho-productos']);
  }

  // ── Genera ticket 80mm como boleta térmica ────────────────────
  imprimirTicket(s: ConfirmacionDespachoData, esCopia: boolean): void {
    const fecha = s.fechaEmision
      ? new Date(s.fechaEmision).toLocaleString('es-PE', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : new Date().toLocaleString('es-PE');

    const tipoEntregaLabel = s.tipoEntrega === 'delivery' ? 'DELIVERY' : 'TIENDA';
    const totalNum = Number(s.total ?? 0);
    const totalStr = totalNum.toFixed(2);

    // Tabla productos — igual a boleta real: Desc | Cant | Und | P.Und | P.Total
    const filasProd = (s.productos ?? []).map(p => {
      const pu  = Number(p.precio_unit ?? 0) > 0 ? Number(p.precio_unit).toFixed(2) : '';
      const tot = Number(p.total_item  ?? 0) > 0 ? Number(p.total_item).toFixed(2)  : '';
      return `<tr>
        <td class="td-desc">${p.nombre}<span class="sku">${p.codigo}</span></td>
        <td class="td-cant">${p.cantidad_solicitada}</td>
        <td class="td-pu">${pu ? `S/ ${pu}` : ''}</td>
        <td class="td-und">NIU</td>
        <td class="td-tot">${tot ? `S/ ${tot}` : ''}</td>
      </tr>`;
    }).join('');

    // Sección totales — igual a boleta real
    const descStr = Number(s.descuento ?? 0).toFixed(2);
    const totalesHTML = `
      <tr><td class="tlbl">Descuento Gral.</td><td></td><td class="tval">S/ ${descStr}</td></tr>
      <tr><td colspan="3"><hr class="dash" style="margin:3px 0"></td></tr>
      <tr class="tr-total"><td class="tlbl bold">Total</td><td></td><td class="tval">S/ ${totalStr}</td></tr>
      <tr><td class="tlbl">Pago</td><td></td><td class="tval">S/ ${totalStr}</td></tr>
      <tr><td class="tlbl">Vuelto</td><td></td><td class="tval">S/ 0.00</td></tr>`;

    const copiaBlock = esCopia
      ? `<p class="copia-mark">*** COPIA ***</p>
         <p class="copia-mark" style="font-size:9.5px;letter-spacing:1px;border-top:none;padding-top:0">COPIA DE ${(s.tipoComprobante ?? 'COMPROBANTE').toUpperCase()}</p>`
      : '';

    const entregaDirBlock = s.tipoEntrega === 'delivery' && s.direccionEntrega
      ? `<p class="c" style="font-size:10px">${s.direccionEntrega}</p>` : '';

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${esCopia ? 'COPIA' : 'Guía'} ${s.numeroComprobante}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.6;color:#000;background:#fff;width:72mm;margin:0 auto;padding:4mm 3mm 8mm}
.c{text-align:center}.r{text-align:right}.bold{font-weight:700}
hr.dash{border:none;border-top:1px dashed #000;margin:4px 0}
.copia-mark{text-align:center;font-size:11px;font-weight:900;letter-spacing:3px;border:1.5px solid #000;padding:3px 4px;margin:4px 0}
table.prods{width:100%;border-collapse:collapse;font-size:10px;margin:2px 0}
table.prods thead th{border-top:2px solid #000;border-bottom:2px solid #000;padding:2px 1px;font-size:9.5px;font-weight:700}
table.prods tbody td{padding:2.5px 1px;vertical-align:top}
table.prods tbody tr:last-child td{border-bottom:2px solid #000}
.td-desc{width:38%}.td-cant{width:8%;text-align:center}
.td-pu{width:20%;text-align:right}.td-und{width:10%;text-align:center;font-size:9px;color:#444}
.td-tot{width:24%;text-align:right;font-weight:700}
.sku{display:block;font-size:8.5px;color:#555;font-style:italic}
table.tots{width:100%;border-collapse:collapse;font-size:10.5px}
table.tots td{padding:1px 2px;white-space:nowrap}
.tlbl{text-align:left;width:55%}.tval{text-align:right;font-weight:700;width:35%}
.tr-total td{font-size:13px;font-weight:900;padding:3px 2px}
.metodo{text-align:right;font-size:11px;font-weight:900;text-transform:uppercase;margin:2px 0}
.footer{text-align:center;font-size:9.5px;line-height:1.55;margin-top:6px}
@media print{html,body{width:72mm}@page{size:80mm auto;margin:0}}
</style></head><body>

<p class="c bold" style="font-size:26px;letter-spacing:-1px;line-height:1">mkapu</p>
<p class="c" style="font-size:9px;letter-spacing:5px;text-transform:uppercase">import</p>
<hr class="dash">

${copiaBlock}

<p class="c bold" style="font-size:12px">${s.tipoComprobante ?? 'Comprobante'}</p>
<hr class="dash">

<p class="c bold">MKAPU IMPORT S.A.C.</p>
<p class="c">MKAPU</p>
<hr class="dash">

<p class="c" style="font-size:10px">MKAPU IMPORT SAC</p>
<p class="c" style="font-size:9.5px">AV LAS FLORES DE LA PRIMAVERA 1838</p>
<p class="c" style="font-size:9.5px">15 DE LAS FLORES - SAN JUAN DE LURIGANCHO</p>
<p class="c" style="font-size:9.5px">LIMA - LIMA &nbsp; celular: 903019610</p>
<hr class="dash">

<p class="c" style="font-size:10.5px">${fecha}</p>
<p class="c bold" style="font-size:12px">${s.numeroComprobante}</p>
<hr class="dash">

<p class="c bold">${s.clienteNombre}</p>
<p class="c">${s.clienteDoc}</p>
${s.clienteTelefono && s.clienteTelefono !== '—' ? `<p class="c">Tel: ${s.clienteTelefono}</p>` : ''}
<hr class="dash">

<p class="c bold">${tipoEntregaLabel}</p>
${entregaDirBlock}
<hr class="dash">

<table class="prods">
  <thead><tr>
    <th class="td-desc">Descripcion</th>
    <th class="td-cant">Cant</th>
    <th class="td-pu">P.Und</th>
    <th class="td-und">Und</th>
    <th class="td-tot">P.Total</th>
  </tr></thead>
  <tbody>${filasProd}</tbody>
</table>

<table class="tots"><tbody>${totalesHTML}</tbody></table>
<hr class="dash">

<p class="metodo">${(s.metodoPago && s.metodoPago !== '—' ? s.metodoPago : 'CONTADO').toUpperCase()}</p>
<hr class="dash">

${s.responsableNombre && s.responsableNombre !== '—'
  ? `<p class="c" style="font-size:10.5px">Atendido por:</p>
     <p class="c bold">${s.responsableNombre.toUpperCase()}</p>
     <hr class="dash">` : ''}

<div class="footer">
  <p class="bold" style="font-size:11px">**GRACIAS POR SU COMPRA**</p>
  <p>Todo falla de fábrica tiene garantía hasta</p>
  <p>2 meses después de su compra (solo venta</p>
  <p>por unidad). Debe acercarse a nuestro</p>
  <p>establecimiento para presentar su</p>
  <p>solicitud de garantía.</p>
</div>

<script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>
</body></html>`;

    const win = window.open('', '_blank', 'width=430,height=800');
    if (!win) { alert('Activa las ventanas emergentes para imprimir.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}
import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

import { AuctionService, CreateAuctionDto } from '../../../../services/auction.service';
import { ProductoService } from '../../../../services/producto.service';
import { AuthService } from '../../../../../auth/services/auth.service';
import { SedeService } from '../../../../services/sede.service';

interface Producto {
  id_producto:      number;
  id_categoria?:    number;
  categoriaNombre?: string;
  codigo:           string;
  anexo:            string;
  descripcion?:     string;
  pre_unit:         number;
  estado?:          boolean;
  stock?:           number;
  id_almacen?:      number | null;
}

interface MotivoOption {
  label:        string;
  value:        number;
  descripcion?: string;
}

@Component({
  selector: 'app-remates-registro',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, InputTextModule,
    TextareaModule, ToastModule, InputNumberModule,
    Select, CheckboxModule, TagModule,
  ],
  templateUrl: './remates-registro.html',
  styleUrl: './remates-registro.css',
  providers: [MessageService],
})
export class RematesRegistro implements OnInit {
  private readonly messageService  = inject(MessageService);
  private readonly router          = inject(Router);
  private readonly auctionService  = inject(AuctionService);
  private readonly productoService = inject(ProductoService);
  private readonly authService     = inject(AuthService);
  private readonly sedeService     = inject(SedeService);
  private readonly cdr             = inject(ChangeDetectorRef);

  // ── Autocomplete ──────────────────────────────────────────────────────────
  queryBusqueda      = signal('');
  productosSugeridos = signal<any[]>([]);
  panelVisible       = signal(false);
  buscandoProductos  = signal(false);
  registrando        = signal(false);
  private searchTimeout: any = null;

  // ── Estado producto ───────────────────────────────────────────────────────
  productoSeleccionado: Producto | null = null;
  productoNoEncontrado = false;

  cantidad      = 1;
  codigoRemate  = '';
  precioRemate: number | null = null;
  observaciones = '';
  responsableNombre = 'Cargando...';
  generarCodigoAuto = true;

  id_usuario_ref = 0;
  id_sede_ref    = 0;
  id_sede_code: string | null = null;

  readonly motivosRemate: MotivoOption[] = [
    { label: 'Liquidación',          value: 1, descripcion: 'Promoción / Liquidación' },
    { label: 'Obsolescencia',        value: 2, descripcion: 'Fin de ciclo'            },
    { label: 'Rotura caja',          value: 3, descripcion: 'Presentación dañada'     },
    { label: 'Promoción estacional', value: 4, descripcion: 'Oferta temporal'         },
  ];

  motivo: number | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.sedeService.loadSedes().subscribe();
  }

  private cargarDatosUsuario(): void {
    const usuario: any = this.authService.getCurrentUser();
    if (!usuario) {
      this.messageService.add({ severity: 'error', summary: 'Sesión no válida', detail: 'No se pudo obtener la información del usuario.', life: 5000 });
      setTimeout(() => this.authService.logout(), 1200);
      return;
    }
    this.id_usuario_ref = Number(usuario.userId ?? usuario.id_usuario ?? 0) || 0;
    const sedeFromToken = usuario.id_sede ?? usuario.idSede ?? usuario.id_sede_ref ?? usuario.id_sede_code ?? null;
    if (sedeFromToken != null) {
      const sedeNum = Number(sedeFromToken);
      if (!Number.isNaN(sedeNum) && sedeNum > 0) {
        this.id_sede_ref  = sedeNum;
        this.id_sede_code = null;
      } else {
        this.id_sede_ref  = 0;
        this.id_sede_code = String(sedeFromToken);
      }
    }
    const nombres = String(usuario.nombres ?? usuario.nombre ?? usuario.username ?? '').trim();
    const ape_pat = String(usuario.ape_pat ?? usuario.apellidos ?? '').trim();
    const ape_mat = String(usuario.ape_mat ?? '').trim();
    this.responsableNombre = [nombres, ape_pat, ape_mat].filter(Boolean).join(' ').trim() || 'Usuario';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getNombreSede(): string {
    if (!this.id_sede_ref) return 'Sin sede';
    const sede = this.sedeService.sedes().find(s => s.id_sede === this.id_sede_ref);
    return sede ? sede.nombre : `Sede #${this.id_sede_ref}`;
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────
  onQueryChange(value: string): void {
    this.queryBusqueda.set(value);
    this.productosSugeridos.set([]);
    this.panelVisible.set(false);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (this.productoSeleccionado) {
      this.productoSeleccionado = null;
      this.cantidad = 1;
      this.precioRemate = null;
    }

    if (!value || value.trim().length < 3) return;

    const sede = this.id_sede_ref > 0 ? this.id_sede_ref : 0;
    if (!sede) {
      this.messageService.add({ severity: 'warn', summary: 'Sede no definida', detail: 'No se pudo determinar la sede del usuario.', life: 3000 });
      return;
    }

    this.buscandoProductos.set(true);
    this.searchTimeout = setTimeout(() => {
    this.productoService.getProductosAutocompleteConPrecio(value.trim(), sede).subscribe({
      next: (res: any) => {
        const items = (res?.data ?? res ?? []).map((p: any) => ({
          id:          p.id_producto,
          codigo:      p.codigo,
          nombre:      p.nombre,
          stock:       Number(p.stock ?? 0),
          pre_unit:    Number(p.precio_unitario ?? 0),  // ← viene del endpoint ventas
          id_almacen:  p.id_almacen ?? null,
          categoria:   p.familia ?? p.categoriaNombre ?? '',
          categoriaId: p.id_categoria ?? null,
        }));
        this.productosSugeridos.set(items);
        this.panelVisible.set(items.length > 0);
        this.buscandoProductos.set(false);
      },
      error: () => {
        this.productosSugeridos.set([]);
        this.buscandoProductos.set(false);
      },
    });
    }, 300);
  }

  seleccionarProducto(p: any): void {
    if (p.stock <= 0) {
      this.messageService.add({
        severity: 'warn', summary: 'Sin stock',
        detail: `${p.nombre} no tiene stock disponible en esta sede.`, life: 3000,
      });
      return;
    }

    // Selección inmediata con datos del autocomplete
    this.productoSeleccionado = {
      id_producto:     p.id,
      id_categoria:    p.categoriaId ?? 0,
      categoriaNombre: p.categoria   ?? '',
      codigo:          p.codigo,
      anexo:           p.nombre,
      descripcion:     p.nombre,
      pre_unit:        p.pre_unit,
      estado:          true,
      stock:           p.stock,
      id_almacen:      null,  // se resuelve abajo
    };
    this.cantidad             = 1;
    this.precioRemate         = Math.round(p.pre_unit * 0.5 * 100) / 100;
    this.productoNoEncontrado = false;
    this.queryBusqueda.set(`${p.codigo} — ${p.nombre}`);
    this.panelVisible.set(false);
    this.productosSugeridos.set([]);
    this.cdr.detectChanges();

    // Segunda llamada para resolver id_almacen
    const sede = this.id_sede_ref > 0 ? this.id_sede_ref : 0;
    this.productoService.getProductoByCodigoConStock(p.codigo, sede).subscribe({
      next: (resp: any) => {
        console.log('🔍 stock resp:', JSON.stringify(resp));
        const idAlmacen = resp?.stock?.id_almacen
          ?? resp?.almacen?.id_almacen
          ?? resp?.id_almacen
          ?? null;
        if (this.productoSeleccionado) {
          this.productoSeleccionado = {
            ...this.productoSeleccionado,
            id_almacen: idAlmacen ? Number(idAlmacen) : null,
          };
        }
        this.cdr.detectChanges();
        this.messageService.add({
          severity: 'success', summary: 'Producto seleccionado',
          detail: `${p.codigo} — ${p.nombre}`, life: 2000,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'warn', summary: 'Producto seleccionado',
          detail: `No se pudo obtener el almacén. Intente nuevamente.`, life: 3000,
        });
      },
    });
  }

  cerrarPanelConDelay(): void {
    setTimeout(() => this.panelVisible.set(false), 200);
  }

  limpiarBusqueda(): void {
    this.queryBusqueda.set('');
    this.productoSeleccionado = null;
    this.productoNoEncontrado = false;
    this.productosSugeridos.set([]);
    this.panelVisible.set(false);
    this.cantidad     = 1;
    this.precioRemate = null;
  }

  calcularPorcentajeDescuento(): number {
    if (!this.productoSeleccionado?.pre_unit || !this.precioRemate) return 0;
    const orig = Number(this.productoSeleccionado.pre_unit);
    const rem  = Number(this.precioRemate);
    if (orig <= 0) return 0;
    return Math.round(((orig - rem) / orig) * 100);
  }

  validarFormulario(): boolean {
    if (!this.productoSeleccionado) {
      this.messageService.add({ severity: 'error', summary: 'Producto requerido', detail: 'Debe buscar y seleccionar un producto.', life: 3000 });
      return false;
    }
    if (!this.productoSeleccionado.id_almacen) {
      this.messageService.add({ severity: 'error', summary: 'Almacén no identificado', detail: 'No se pudo determinar el almacén del producto.', life: 3000 });
      return false;
    }
    if (!this.cantidad || this.cantidad <= 0) {
      this.messageService.add({ severity: 'error', summary: 'Cantidad inválida', detail: 'La cantidad debe ser mayor a 0.', life: 3000 });
      return false;
    }
    if ((this.productoSeleccionado.stock ?? 0) < this.cantidad) {
      this.messageService.add({ severity: 'error', summary: 'Stock insuficiente', detail: `Stock disponible: ${this.productoSeleccionado.stock}`, life: 3000 });
      return false;
    }
    if (!this.generarCodigoAuto && !this.codigoRemate?.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Código requerido', detail: 'Debe indicar un código de remate.', life: 3000 });
      return false;
    }
    if (!this.precioRemate || this.precioRemate <= 0) {
      this.messageService.add({ severity: 'error', summary: 'Precio inválido', detail: 'Indique un precio de remate mayor a 0.', life: 3000 });
      return false;
    }
    if (!this.motivo) {
      this.messageService.add({ severity: 'error', summary: 'Motivo requerido', detail: 'Seleccione un motivo.', life: 3000 });
      return false;
    }
    return true;
  }

  registrar(): void {
    if (this.registrando()) return; 
    if (!this.validarFormulario()) return;

    this.registrando.set(true);

    const dto: CreateAuctionDto = {
      descripcion:    this.productoSeleccionado!.anexo,
      estado:         'ACTIVO',
      id_almacen_ref: Number(this.productoSeleccionado!.id_almacen),
      detalles: [{
        id_producto:  this.productoSeleccionado!.id_producto,
        pre_original: Number(this.productoSeleccionado!.pre_unit || 0),
        pre_remate:   Number(this.precioRemate || 0),
        stock_remate: Number(this.cantidad),
        observacion:  this.observaciones || undefined,
      }],
    };

    if (!this.generarCodigoAuto && this.codigoRemate?.trim()) {
      dto.cod_remate = this.codigoRemate.trim();
    }

    this.auctionService.createAuction(dto).subscribe({
      next: (created) => {
        this.messageService.add({
          severity: 'success', summary: '✓ Remate creado',
          detail: `Remate ${created.cod_remate} creado exitosamente.`, life: 3000,
        });
        setTimeout(() => this.router.navigate(['/admin/remates']), 1500);
      },
      error: (err) => {
        this.registrando.set(false); 
        this.messageService.add({
          severity: 'error', summary: 'Error al crear remate',
          detail: err?.error?.message || 'No se pudo crear el remate.', life: 5000,
        });
      },
    });
  }

  cancelar(): void { this.router.navigate(['/admin/remates']); }

  limpiarFormulario(): void {
    this.limpiarBusqueda();
    this.codigoRemate  = '';
    this.observaciones = '';
    this.motivo        = null;
    this.messageService.add({ severity: 'info', summary: 'Formulario limpiado', detail: 'Puede iniciar un nuevo registro.', life: 2000 });
  }

  getMotivoLabel(id: number | null): string {
    if (!id) return '';
    return this.motivosRemate.find(x => x.value === id)?.label ?? '';
  }
}
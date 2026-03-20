import { Component, OnInit, inject, ChangeDetectorRef, computed } from '@angular/core';
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

import { WastageService, CreateWastageDto, WastageDetail, WastageTypeDto } from '../../../../services/wastage.service';
import { ProductoService } from '../../../../services/producto.service';
import { AuthService } from '../../../../../auth/services/auth.service';

interface Producto {
  id_producto:     number;
  id_categoria:    number;
  categoriaNombre: string;
  codigo:          string;
  anexo:           string;
  descripcion:     string;
  pre_unit:        number;
  estado:          boolean;
  stock?:          number;
  id_almacen?:     number | null;
}

@Component({
  selector: 'app-mermas-registro',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, InputTextModule,
    TextareaModule, ToastModule, InputNumberModule, Select,
  ],
  templateUrl: './mermas-registro.html',
  styleUrl: './mermas-registro.css',
  providers: [MessageService],
})
export class MermasRegistro implements OnInit {
  private readonly messageService  = inject(MessageService);
  private readonly router          = inject(Router);
  private readonly wastageService  = inject(WastageService);
  private readonly productoService = inject(ProductoService);
  private readonly authService     = inject(AuthService);
  private readonly cdr             = inject(ChangeDetectorRef);

  readonly loading = this.wastageService.loading;
  readonly error   = this.wastageService.error;

  // ── Tipos de merma desde la API ───────────────────────────────────────────
  readonly motivosMerma = computed(() =>
    this.wastageService.tiposMerma().map((t: WastageTypeDto) => ({
      label:       t.tipo,
      value:       t.id_tipo,
      descripcion: t.motivo_merma,
    }))
  );

  codigoProducto       = '';
  productoSeleccionado: Producto | null = null;
  productoNoEncontrado = false;

  cantidad      = 1;
  motivo:        number | null = null;
  observaciones = '';
  responsableNombre = 'Cargando...';

  id_usuario_ref   = 0;
  id_sede_ref      = 0;
  id_sede_code: string | null = null;

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.cargarTiposMerma();
  }

  // ── Carga tipos desde el endpoint ─────────────────────────────────────────
  private cargarTiposMerma(): void {
    this.wastageService.loadTiposMerma().subscribe({
      error: () => this.messageService.add({
        severity: 'warn', summary: 'Aviso',
        detail: 'No se pudieron cargar los tipos de merma.', life: 3000,
      }),
    });
  }

  private cargarDatosUsuario(): void {
    const usuario: any = this.authService.getCurrentUser();

    if (!usuario) {
      this.messageService.add({
        severity: 'error', summary: 'Sesión no válida',
        detail: 'No se pudo obtener la información del usuario.', life: 5000,
      });
      setTimeout(() => this.authService.logout(), 2000);
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
    this.responsableNombre = [nombres, ape_pat, ape_mat].filter(Boolean).join(' ').trim()
      || String(usuario.usuario ?? usuario.username ?? 'Usuario');
  }

  private isProductoValido(data: any): data is Producto {
    return !!data && typeof data === 'object'
      && typeof data.id_producto === 'number'
      && typeof data.codigo      === 'string'
      && typeof data.anexo       === 'string'
      && typeof data.pre_unit    === 'number';
  }

  private mapDetailWithStockToProducto(resp: any): Producto | null {
    const p = resp?.producto;
    const s = resp?.stock;
    if (!p || typeof p !== 'object') return null;
    const id_producto = Number(p.id_producto);
    if (!id_producto || Number.isNaN(id_producto)) return null;

    return {
      id_producto,
      id_categoria:    Number(p.categoria?.id_categoria ?? 0),
      categoriaNombre: String(p.categoria?.nombre ?? ''),
      codigo:          String(p.codigo ?? ''),
      anexo:           String(p.nombre ?? ''),
      descripcion:     String(p.descripcion ?? ''),
      pre_unit:        Number(p.precio_unitario ?? 0),
      estado:          Number(p.estado ?? 0) === 1,
      stock:           Number(s?.cantidad ?? 0),
      id_almacen:      s?.id_almacen != null ? Number(s.id_almacen) : null,
    };
  }

  private applyStateSafe(fn: () => void): void {
    setTimeout(() => { fn(); this.cdr.detectChanges(); }, 50);
  }

  buscarProductoPorCodigo(): void {
    const codigo = (this.codigoProducto ?? '').trim().toUpperCase();
    this.productoNoEncontrado = false;
    this.productoSeleccionado = null;

    if (!codigo) {
      this.messageService.add({ severity: 'warn', summary: 'Código requerido', detail: 'Ingrese el código del producto.', life: 2500 });
      return;
    }

    const sedeCandidate = this.id_sede_ref > 0 ? this.id_sede_ref : (this.id_sede_code ?? 0);
    const sedeParam = Number(sedeCandidate);

    if (Number.isNaN(sedeParam) || sedeParam === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sede no definida', detail: 'No se pudo determinar la sede del usuario.', life: 3000 });
      this.applyStateSafe(() => { this.productoNoEncontrado = true; });
      return;
    }

    this.productoService.getProductoByCodigoConStock(codigo, sedeParam).subscribe({
      next: (resp: any) => {
        const producto = this.mapDetailWithStockToProducto(resp);
        if (!producto || !this.isProductoValido(producto)) {
          this.applyStateSafe(() => { this.productoNoEncontrado = true; this.productoSeleccionado = null; });
          return;
        }
        this.applyStateSafe(() => { this.productoSeleccionado = producto; this.productoNoEncontrado = false; this.cantidad = 1; });
        this.messageService.add({ severity: 'success', summary: 'Producto encontrado', detail: `${producto.codigo} - ${producto.anexo}`, life: 2000 });
      },
      error: (err: any) => {
        const detail = err?.status === 404
          ? `No hay stock del producto ${codigo} en la sede.`
          : 'Error al buscar producto. Intente nuevamente.';
        this.messageService.add({ severity: err?.status === 404 ? 'warn' : 'error', summary: err?.status === 404 ? 'Sin stock' : 'Error', detail, life: 3500 });
        this.applyStateSafe(() => { this.productoNoEncontrado = true; this.productoSeleccionado = null; });
      },
    });
  }

  validarFormulario(): boolean {
    if (!this.id_usuario_ref) {
      this.messageService.add({ severity: 'error', summary: 'Error de sesión', detail: 'No se pudo identificar al usuario.', life: 3000 });
      return false;
    }
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
    if (this.cantidad > (this.productoSeleccionado.stock ?? 0)) {
      this.messageService.add({ severity: 'error', summary: 'Stock insuficiente', detail: `Stock disponible: ${this.productoSeleccionado.stock} unidades.`, life: 3000 });
      return false;
    }
    if (!this.motivo) {
      this.messageService.add({ severity: 'error', summary: 'Tipo de merma requerido', detail: 'Debe seleccionar un tipo de merma.', life: 3000 });
      return false;
    }
    return true;
  }

  registrar(): void {
    if (!this.validarFormulario()) return;

    const sedeCandidate = this.id_sede_ref > 0 ? this.id_sede_ref : (this.id_sede_code ?? 0);
    const idSedeNumber  = Number(sedeCandidate);

    if (Number.isNaN(idSedeNumber) || idSedeNumber === 0) {
      this.messageService.add({ severity: 'error', summary: 'Sede inválida', detail: 'No se pudo determinar una sede válida.', life: 3000 });
      return;
    }

    const detalle: WastageDetail = {
      id_producto:   this.productoSeleccionado!.id_producto,
      cod_prod:      this.productoSeleccionado!.codigo,
      desc_prod:     this.productoSeleccionado!.anexo,
      cantidad:      this.cantidad,
      pre_unit:      this.productoSeleccionado!.pre_unit,
      id_tipo_merma: this.motivo!,
      observacion:   this.observaciones || undefined,
    };

    const dto: CreateWastageDto = {
      id_usuario_ref: this.id_usuario_ref,
      id_sede_ref:    idSedeNumber,
      id_almacen_ref: Number(this.productoSeleccionado!.id_almacen),
      motivo:         this.getMotivoLabel(),
      id_tipo_merma:  this.motivo!,
      detalles:       [detalle],
    };

    this.wastageService.createWastage(dto).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: '✓ Merma registrada', detail: `Merma #${res.id_merma} registrada exitosamente.`, life: 3000 });
        setTimeout(() => this.router.navigate(['/admin/mermas']), 1500);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error al registrar', detail: err?.error?.message ?? 'No se pudo registrar la merma.', life: 5000 });
      },
    });
  }

  cancelar(): void { this.router.navigate(['/admin/mermas']); }

  limpiarFormulario(): void {
    this.codigoProducto      = '';
    this.productoSeleccionado = null;
    this.productoNoEncontrado = false;
    this.cantidad             = 1;
    this.motivo               = null;
    this.observaciones        = '';
    this.messageService.add({ severity: 'info', summary: 'Formulario limpiado', detail: 'Puede iniciar un nuevo registro.', life: 2000 });
  }

  getMotivoLabel(): string {
    if (!this.motivo) return '';
    return this.motivosMerma().find(m => m.value === this.motivo)?.label ?? '';
  }
}
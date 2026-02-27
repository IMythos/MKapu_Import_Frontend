import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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

import { AuctionService, CreateAuctionDto } from '../../../../services/auction.service';
import { ProductoService } from '../../../../services/producto.service';
import { AuthService } from '../../../../../auth/services/auth.service';

interface Producto {
  id_producto: number;
  id_categoria?: number;
  categoriaNombre?: string;
  codigo: string;
  anexo: string;
  descripcion?: string;
  pre_unit: number;
  estado?: boolean;
  stock?: number;
  id_almacen?: number | null;
}

interface MotivoOption {
  label: string;
  value: number;
  descripcion?: string;
}

@Component({
  selector: 'app-remates-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    InputNumberModule,
    Select,
    CheckboxModule,
  ],
  templateUrl: './remates-registro.html',
  styleUrl: './remates-registro.css',
  providers: [MessageService],
})
export class RematesRegistro implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly auctionService = inject(AuctionService);
  private readonly productoService = inject(ProductoService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  codigoProducto = '';
  productoSeleccionado: Producto | null = null;
  productoNoEncontrado = false;

  cantidad = 1;
  codigoRemate = '';
  precioRemate: number | null = null;
  observaciones = '';
  responsableNombre = 'Cargando...';

  fecInicioStr: string | null = null;
  fecFinStr: string | null = null;

  generarCodigoAuto = true; 

  id_usuario_ref = 0;
  id_sede_ref = 0;
  id_sede_code: string | null = null;

  motivosRemate: MotivoOption[] = [
    { label: 'Liquidación', value: 1, descripcion: 'Promoción / Liquidación' },
    { label: 'Obsolescencia', value: 2, descripcion: 'Fin de ciclo' },
    { label: 'Rotura caja', value: 3, descripcion: 'Presentación dañada' },
    { label: 'Promoción estacional', value: 4, descripcion: 'Oferta temporal' }
  ];

  motivo: number | null = null;

  ngOnInit(): void {
    this.cargarDatosUsuario();
    const now = new Date();
    this.fecInicioStr = this.formatDateToDatetimeLocal(now);
    this.fecFinStr = this.formatDateToDatetimeLocal(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  }

  private applyStateSafe(fn: () => void): void {
    setTimeout(() => {
      fn();
      this.cdr.detectChanges();
    }, 50);
  }

  private cargarDatosUsuario(): void {
    const usuario: any = this.authService.getCurrentUser();

    if (!usuario) {
      this.messageService.add({
        severity: 'error',
        summary: 'Sesión no válida',
        detail: 'No se pudo obtener la información del usuario.',
        life: 5000,
      });
      setTimeout(() => this.authService.logout(), 1200);
      return;
    }

    this.id_usuario_ref = Number(usuario.userId ?? usuario.id_usuario ?? 0) || 0;
    const sedeFromToken = usuario.id_sede ?? usuario.idSede ?? usuario.id_sede_ref ?? usuario.id_sede_code ?? null;

    if (sedeFromToken != null) {
      const sedeNum = Number(sedeFromToken);
      if (!Number.isNaN(sedeNum) && sedeNum > 0) {
        this.id_sede_ref = sedeNum;
        this.id_sede_code = null;
      } else {
        this.id_sede_ref = 0;
        this.id_sede_code = String(sedeFromToken);
      }
    }

    const nombres = String(usuario.nombres ?? usuario.nombre ?? usuario.username ?? '').trim();
    const ape_pat = String(usuario.ape_pat ?? usuario.apellidos ?? '').trim();
    const ape_mat = String(usuario.ape_mat ?? '').trim();
    this.responsableNombre = [nombres, ape_pat, ape_mat].filter(Boolean).join(' ').trim() || 'Usuario';
  }

  private isProductoValido(data: any): data is Producto {
    return !!data && typeof data === 'object' && typeof data.id_producto === 'number' && typeof data.codigo === 'string';
  }

  private mapDetailWithStockToProducto(resp: any): Producto | null {
    const p = resp?.producto;
    const s = resp?.stock;

    if (!p || typeof p !== 'object') return null;
    const id_producto = Number(p.id_producto);
    if (!id_producto || Number.isNaN(id_producto)) return null;

    return {
      id_producto,
      id_categoria: Number(p.categoria?.id_categoria ?? 0),
      categoriaNombre: String(p.categoria?.nombre ?? ''),
      codigo: String(p.codigo ?? ''),
      anexo: String(p.nombre ?? p.anexo ?? ''),
      descripcion: String(p.descripcion ?? ''),
      pre_unit: Number(p.precio_unitario ?? p.pre_unit ?? 0),
      estado: Number(p.estado ?? 0) === 1,
      stock: Number(s?.cantidad ?? 0),
      id_almacen: s?.id_almacen != null ? Number(s.id_almacen) : null,
    };
  }

  buscarProductoPorCodigo(): void {
    const codigo = (this.codigoProducto ?? '').trim().toUpperCase();
    this.productoNoEncontrado = false;
    this.productoSeleccionado = null;

    if (!codigo) {
      this.messageService.add({ severity: 'warn', summary: 'Código requerido', detail: 'Ingrese el código del producto.', life: 2000 });
      return;
    }

    const sedeCandidate: number | string = (this.id_sede_ref && this.id_sede_ref > 0) ? this.id_sede_ref : (this.id_sede_code ?? 0);
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
          this.applyStateSafe(() => { this.productoSeleccionado = null; this.productoNoEncontrado = true; });
          this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'Producto no encontrado o sin stock.', life: 2500 });
          return;
        }
        this.applyStateSafe(() => { 
          this.productoSeleccionado = producto; 
          this.productoNoEncontrado = false; 
          this.cantidad = 1; 
          this.precioRemate = Math.round(producto.pre_unit * 0.5 * 100) / 100;
        });
        this.messageService.add({ severity: 'success', summary: 'Producto encontrado', detail: `${producto.codigo} - ${producto.anexo}`, life: 2000 });
      },
      error: (err: any) => {
        console.error('Error buscarProductoPorCodigo:', err);
        this.applyStateSafe(() => { this.productoSeleccionado = null; this.productoNoEncontrado = true; });
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar producto.', life: 3500 });
      }
    });
  }

  calcularPorcentajeDescuento(): number {
    if (!this.productoSeleccionado || !this.productoSeleccionado.pre_unit || !this.precioRemate) return 0;
    const orig = Number(this.productoSeleccionado.pre_unit);
    const rem = Number(this.precioRemate);
    if (orig <= 0) return 0;
    return Math.round(((orig - rem) / orig) * 100);
  }

  private formatDateToDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  private parseDatetimeLocalToISOString(s: string | null): string | null {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
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

    if (!this.generarCodigoAuto) {
      if (!this.codigoRemate || !this.codigoRemate.trim()) {
        this.messageService.add({ severity: 'error', summary: 'Código remate requerido', detail: 'Debe indicar un código de remate.', life: 3000 });
        return false;
      }
    }

    if (!this.precioRemate || this.precioRemate <= 0) {
      this.messageService.add({ severity: 'error', summary: 'Precio inválido', detail: 'Indique un precio de remate mayor a 0.', life: 3000 });
      return false;
    }
    if (!this.motivo) {
      this.messageService.add({ severity: 'error', summary: 'Motivo requerido', detail: 'Seleccione un motivo.', life: 3000 });
      return false;
    }

    if (!this.fecInicioStr) {
      this.messageService.add({ severity: 'error', summary: 'Fecha inicio requerida', detail: 'Seleccione fecha de inicio.', life: 3000 });
      return false;
    }
    if (!this.fecFinStr) {
      this.messageService.add({ severity: 'error', summary: 'Fecha fin requerida', detail: 'Seleccione fecha de fin.', life: 3000 });
      return false;
    }

    const inicio = new Date(this.fecInicioStr);
    const fin = new Date(this.fecFinStr);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      this.messageService.add({ severity: 'error', summary: 'Fecha inválida', detail: 'Formato de fecha incorrecto.', life: 3000 });
      return false;
    }
    if (fin <= inicio) {
      this.messageService.add({ severity: 'error', summary: 'Fechas inválidas', detail: 'La fecha de fin debe ser posterior a la de inicio.', life: 3500 });
      return false;
    }

    return true;
  }

  registrar(): void {
    if (!this.validarFormulario()) return;

    const almacenId = Number(this.productoSeleccionado!.id_almacen);
    
    const dto: CreateAuctionDto = {
      descripcion: this.productoSeleccionado!.anexo,
      fec_fin: this.parseDatetimeLocalToISOString(this.fecFinStr!) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      estado: 'ACTIVO',
      id_almacen_ref: almacenId,
      detalles: [
        {
          id_producto: this.productoSeleccionado!.id_producto,
          pre_original: Number(this.productoSeleccionado!.pre_unit || 0),
          pre_remate: Number(this.precioRemate || 0),
          stock_remate: Number(this.cantidad),
          observacion: this.observaciones || undefined
        }
      ]
    };

    const fecInicioIso = this.parseDatetimeLocalToISOString(this.fecInicioStr!);
    if (fecInicioIso) {
      dto.fec_inicio = fecInicioIso;
    }

    if (!this.generarCodigoAuto && this.codigoRemate && this.codigoRemate.trim()) {
      dto.cod_remate = this.codigoRemate.trim();
    }

    console.log('✅ CreateAuctionDto:', JSON.stringify(dto, null, 2));

    this.auctionService.createAuction(dto).subscribe({
      next: (created) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: '✓ Remate creado', 
          detail: `Remate ${created.cod_remate} creado exitosamente.`, 
          life: 3000 
        });
        setTimeout(() => this.router.navigate(['/admin/remates']), 1500);
      },
      error: (err) => {
        console.error('❌ Error creando remate:', err);
        const errorMsg = err?.error?.message || err?.message || 'No se pudo crear el remate.';
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error al crear remate', 
          detail: errorMsg, 
          life: 5000 
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/remates']);
  }

  limpiarFormulario(): void {
    this.codigoProducto = '';
    this.productoSeleccionado = null;
    this.productoNoEncontrado = false;
    this.cantidad = 1;
    this.codigoRemate = '';
    this.precioRemate = null;
    this.observaciones = '';
    this.motivo = null;
    
    const now = new Date();
    this.fecInicioStr = this.formatDateToDatetimeLocal(now);
    this.fecFinStr = this.formatDateToDatetimeLocal(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    this.messageService.add({
      severity: 'info',
      summary: 'Formulario limpiado',
      detail: 'Puede iniciar un nuevo registro.',
      life: 2000
    });
  }

  getMotivoLabel(id: number | null): string {
    if (!id) return '';
    const m = this.motivosRemate.find(x => x.value === id);
    return m ? m.label : '';
  }
}
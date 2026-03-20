import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SedeService } from '../../../../services/sede.service';

import { AuctionService, AuctionResponseDto, PatchAuctionDto } from '../../../../services/auction.service';

interface RemateForm {
  codigo:         string;
  descripcion:    string;
  estado:         'ACTIVO' | 'FINALIZADO';
  precioOriginal: number;
  precioRemate:   number;
  stockRemate:    number;
}

interface FormErrores {
  descripcion?:  string;
  precioRemate?: string;
  stockRemate?:  string;
}

@Component({
  selector: 'app-editar-remate',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, ButtonModule, InputTextModule,
    InputNumberModule, SelectModule, ToastModule,
  ],
  templateUrl: './editar-remate.html',
  styleUrl: './editar-remate.css',
  providers: [MessageService],
})
export class EditarRemateComponent implements OnInit {

  private readonly auctionService = inject(AuctionService);
  private readonly messageService = inject(MessageService);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly sedeService     = inject(SedeService);

  cargando  = signal(true);
  guardando = signal(false);

  private idRemate: number | null = null;

  form = signal<RemateForm>({
    codigo:         '',
    descripcion:    '',
    estado:         'ACTIVO',
    precioOriginal: 0,
    precioRemate:   0,
    stockRemate:    0,
  });

  errores = signal<FormErrores>({});

  readonly estadoOptions = [
    { label: 'Activo',     value: 'ACTIVO'     },
    { label: 'Finalizado', value: 'FINALIZADO' },
  ];

  descuentoCalculado = computed(() => {
    const { precioOriginal, precioRemate } = this.form();
    if (!precioOriginal || precioOriginal <= 0) return 0;
    return Math.max(0, Math.round(((precioOriginal - precioRemate) / precioOriginal) * 100));
  });

  formularioValido = computed(() => {
    const f = this.form();
    return (
      f.descripcion.trim().length > 0 &&
      f.precioRemate > 0              &&
      f.stockRemate  >= 0             &&
      Object.keys(this.errores()).length === 0
    );
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de remate no encontrado.', life: 3000 });
      this.volver();
      return;
    }
    this.idRemate = Number(idParam);
    this.cargarRemate(this.idRemate);
    this.sedeService.loadSedes().subscribe();
  }

  private cargarRemate(id: number): void {
    this.cargando.set(true);
    this.auctionService.loadAuctions(1, 100).subscribe({
      next: () => {
        const auction = this.auctionService.auctions().find(a => a.id_remate === id);
        if (!auction) {
          this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: `No se encontró el remate con ID ${id}.`, life: 4000 });
          this.volver();
          return;
        }
        this.mapearAuction(auction);
        this.cargando.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el remate.', life: 3000 });
        this.cargando.set(false);
      },
    });
  }

  // Agrega computed:
  readonly nombreSede = computed(() => {
    const auction = this.auctionService.auctions()
      .find(a => a.id_remate === this.idRemate);
    const id_sede = auction?.id_sede_ref ?? 0;
    if (!id_sede) return '—';
    return this.sedeService.sedes().find(s => s.id_sede === id_sede)?.nombre ?? `Sede #${id_sede}`;
  });
  
  private mapearAuction(a: AuctionResponseDto): void {
    const detalle = a.detalles?.[0];
    this.form.set({
      codigo:         a.cod_remate,
      descripcion:    a.descripcion,
      estado:         (a.estado as 'ACTIVO' | 'FINALIZADO') ?? 'ACTIVO',
      precioOriginal: detalle?.pre_original ?? 0,
      precioRemate:   detalle?.pre_remate   ?? 0,
      stockRemate:    detalle?.stock_remate ?? 0,
    });
  }

  setField<K extends keyof RemateForm>(key: K, value: RemateForm[K]): void {
    this.form.update(f => ({ ...f, [key]: value }));
    this.validarCampo(key);
  }

  private validarCampo(key: keyof RemateForm): void {
    const f    = this.form();
    const errs = { ...this.errores() };

    switch (key) {
      case 'descripcion':
        if (!f.descripcion.trim()) errs.descripcion = 'La descripción es obligatoria.';
        else delete errs.descripcion;
        break;
      case 'precioRemate':
        if (!f.precioRemate || f.precioRemate <= 0) {
          errs.precioRemate = 'El precio de remate debe ser mayor a 0.';
        } else if (f.precioOriginal > 0 && f.precioRemate > f.precioOriginal) {
          errs.precioRemate = 'El precio de remate no puede superar el original.';
        } else {
          delete errs.precioRemate;
        }
        break;
      case 'stockRemate':
        if (f.stockRemate < 0) errs.stockRemate = 'El stock no puede ser negativo.';
        else delete errs.stockRemate;
        break;
    }

    this.errores.set(errs);
  }

  private validarTodo(): boolean {
    (['descripcion', 'precioRemate', 'stockRemate'] as (keyof RemateForm)[])
      .forEach(c => this.validarCampo(c));
    return Object.keys(this.errores()).length === 0;
  }

  guardar(): void {
    if (!this.validarTodo() || !this.idRemate) return;

    this.guardando.set(true);
    const f = this.form();

    const payload: PatchAuctionDto = {
      descripcion: f.descripcion.trim(),
      estado:      f.estado,
      detalles:    [{ pre_remate: f.precioRemate, stock_remate: f.stockRemate }],
    };

    this.auctionService.patchAuction(this.idRemate, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'El remate fue actualizado correctamente.', life: 3000 });
        setTimeout(() => this.volver(), 1500);
      },
      error: (err) => {
        this.guardando.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: err?.error?.message ?? 'No se pudo actualizar el remate.', life: 4000 });
      },
    });
  }

  volver(): void {
    this.router.navigate(['/admin', 'remates']);
  }
}
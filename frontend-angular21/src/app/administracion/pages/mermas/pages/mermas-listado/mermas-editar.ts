import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { WastageService, WastageResponseDto, WastageTypeDto } from '../../../../services/wastage.service';

@Component({
  selector: 'app-mermas-editar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, InputTextModule,
    TextareaModule, ToastModule, Select, ProgressSpinnerModule,
  ],
  templateUrl: './mermas-editar.html',
  styleUrl: './mermas-editar.css',
  providers: [MessageService],
})
export class MermasEditar implements OnInit {
  private readonly wastageService  = inject(WastageService);
  private readonly messageService  = inject(MessageService);
  private readonly router          = inject(Router);
  private readonly route           = inject(ActivatedRoute);

  // ── Estado ────────────────────────────────────────────────────────────────
  readonly cargando  = this.wastageService.loading;
  readonly guardando = signal(false);
  readonly merma     = signal<WastageResponseDto | null>(null);

  // ── Campos editables ──────────────────────────────────────────────────────
  motivoEdit       = '';
  tipoMermaEdit:   number | null = null;
  observacionesEdit = '';

  // ── Opciones tipos de merma ───────────────────────────────────────────────
  readonly tiposMermaOpciones = computed(() =>
    this.wastageService.tiposMerma().map((t: WastageTypeDto) => ({
      label:       t.tipo,
      value:       t.id_tipo,
      descripcion: t.motivo_merma,
    }))
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.messageService.add({
        severity: 'error', summary: 'ID inválido',
        detail: 'El ID de la merma no es válido.', life: 3000,
      });
      return;
    }

    this.cargarTiposMerma();
    this.cargarMerma(id);
  }

  private cargarTiposMerma(): void {
    this.wastageService.loadTiposMerma().subscribe({
      error: () => this.messageService.add({
        severity: 'warn', summary: 'Aviso',
        detail: 'No se pudieron cargar los tipos de merma.', life: 3000,
      }),
    });
  }

  private cargarMerma(id: number): void {
    this.wastageService.getWastageById(id).subscribe({
      next: (data) => {
        this.merma.set(data);
        // Precarga los campos editables con los valores actuales
        this.motivoEdit        = data.motivo ?? '';
        this.tipoMermaEdit     = data.tipo_merma_id ?? null;
        this.observacionesEdit = data.detalles?.[0]?.observacion ?? '';
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la merma.', life: 3000,
        });
        this.merma.set(null);
      },
    });
  }

  guardar(): void {
    if (!this.motivoEdit?.trim()) {
      this.messageService.add({
        severity: 'error', summary: 'Motivo requerido',
        detail: 'Debe ingresar un motivo para la merma.', life: 3000,
      });
      return;
    }
    if (!this.tipoMermaEdit) {
      this.messageService.add({
        severity: 'error', summary: 'Tipo requerido',
        detail: 'Debe seleccionar un tipo de merma.', life: 3000,
      });
      return;
    }

    this.guardando.set(true);

    const payload = {
      motivo:        this.motivoEdit.trim(),
      id_tipo_merma: this.tipoMermaEdit,
      observacion:   this.observacionesEdit?.trim() || undefined,
    };

    this.wastageService.updateWastage(this.merma()!.id_merma, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: '✓ Merma actualizada',
          detail: 'Los cambios fueron guardados correctamente.', life: 3000,
        });
        setTimeout(() => this.router.navigate(['/admin/mermas']), 1500);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error', summary: 'Error al guardar',
          detail: err?.error?.message ?? 'No se pudo guardar los cambios.', life: 5000,
        });
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/mermas']);
  }
}
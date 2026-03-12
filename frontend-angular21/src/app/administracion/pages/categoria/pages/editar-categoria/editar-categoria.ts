import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Message } from 'primeng/message';

import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';
import { CategoriaService } from '../../../../services/categoria.service';

@Component({
  selector: 'app-editar-categoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    Message,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './editar-categoria.html',
  styleUrl: './editar-categoria.css',
})
export class EditarCategoria implements OnInit, CanComponentDeactivate {
  @ViewChild('categoriaForm') categoriaForm?: NgForm;

  private allowNavigate = false;
  submitted             = false;
  categoriaId: number | null = null;

  categoria = {
    nombre:      '',
    descripcion: '' as string | null,
  };

  private readonly categoriaService   = inject(CategoriaService);
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService     = inject(MessageService);

  readonly loading = this.categoriaService.loading;
  readonly error   = this.categoriaService.error;

  ngOnInit(): void {
    const idFromParam = this.route.snapshot.paramMap.get('id');
    const idFromQuery = this.route.snapshot.queryParamMap.get('id');
    const idStr       = idFromParam ?? idFromQuery;

    if (idStr) {
      this.categoriaId = parseInt(idStr, 10);
      this.loadCategoria();
    } else {
      this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   'No se recibió el ID de la categoría.',
      });
    }
  }

  private loadCategoria(): void {
    if (!this.categoriaId) return;

    this.categoriaService.getCategoriaById(this.categoriaId).subscribe({
      next: (data) => {
        this.categoria = {
          nombre:      data.nombre      ?? '',
          descripcion: data.descripcion ?? '',
        };
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   'No se pudo cargar la categoría.',
        });
      },
    });
  }

  toUpperCase(field: 'nombre'): void {
    this.categoria[field] = this.categoria[field].toUpperCase();
  }

  updateCategoria(): void {
    this.submitted = true;

    if (!this.categoriaId) {
      this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   'No se encontró el ID de la categoría.',
      });
      return;
    }

    if (!this.categoria.nombre.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Campo requerido',
        detail:   'El nombre de la categoría es obligatorio.',
      });
      return;
    }

    const payload = {
      nombre:      this.categoria.nombre.trim().toUpperCase(),
      descripcion: this.categoria.descripcion?.trim() ?? '',
    };

    this.categoriaService.updateCategoria(this.categoriaId, payload, 'Administrador').subscribe({
      next: () => {
        this.allowNavigate = true;
        this.messageService.add({
          severity: 'success',
          summary:  'Categoría actualizada',
          detail:   'La categoría se actualizó correctamente.',
        });
        setTimeout(() => this.router.navigate(['/admin/categoria']), 1500);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   'No se pudo actualizar la categoría.',
        });
      },
    });
  }

  confirmCancel(): void {
    if (!this.categoriaForm?.dirty) {
      this.navigateWithToast();
      return;
    }

    this.confirmDiscardChanges().subscribe((confirmed) => {
      if (confirmed) {
        this.allowNavigate = true;
        this.navigateWithToast();
      }
    });
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.allowNavigate || !this.categoriaForm?.dirty) return true;
    return this.confirmDiscardChanges();
  }

  private confirmDiscardChanges(): Observable<boolean> {
    const result = new Subject<boolean>();

    this.confirmationService.confirm({
      header:      'Cambios sin guardar',
      message:     'Tienes cambios sin guardar. ¿Deseas salir?',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Salir',
      rejectLabel: 'Continuar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => { result.next(true);  result.complete(); },
      reject: () => { result.next(false); result.complete(); },
    });

    return result.asObservable();
  }

  private navigateWithToast(): void {
    this.messageService.add({
      severity: 'info',
      summary:  'Cancelado',
      detail:   'Se canceló la edición de la categoría.',
    });
    setTimeout(() => this.router.navigate(['/admin/categoria']), 1500);
  }
}
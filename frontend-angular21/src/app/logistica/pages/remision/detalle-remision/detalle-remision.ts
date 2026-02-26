import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RemissionService } from '../../../services/remission.service';
import { RemissionResponse } from '../../../interfaces/remision.interface';

@Component({
  selector: 'app-detalle-remision',
  imports: [
    CommonModule, 
    ButtonModule, 
    CardModule, 
    TableModule, 
    ProgressSpinnerModule, 
    DividerModule, 
    TagModule
  ],
  templateUrl: './detalle-remision.html',
  styleUrl: './detalle-remision.css',
})
export class DetalleRemision {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly remissionService = inject(RemissionService);

  remision = signal<RemissionResponse | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    // 1. Obtener el ID de la URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    } else {
      this.volver(); // Si no hay ID, lo regresamos
    }
  }

  cargarDetalle(id: string) {
    this.loading.set(true);
    this.remissionService.getRemisionById(id).subscribe({
      next: (data) => {
        console.log(data);
        this.remision.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando detalles', err);
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/logistica/remision']);
  }
}

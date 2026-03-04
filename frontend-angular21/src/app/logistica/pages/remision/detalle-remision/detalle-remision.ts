import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RemissionService } from '../../../services/remission.service';

@Component({
  selector: 'app-detalle-remision',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    ProgressSpinnerModule,
    TooltipModule,
    DividerModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './detalle-remision.html',
  styleUrl: './detalle-remision.css'
})
export class DetalleRemision implements OnInit {
  private remissionService = inject(RemissionService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  remision = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    }
  }

  cargarDetalle(id: string) {
    this.loading.set(true);
    this.remissionService.getRemisionById(id).subscribe({
      next: (data) => {
        this.remision.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle' });
        this.loading.set(false);
      }
    });
  }

  descargarPdf() {
    const data = this.remision();
    if (!data) return;

    this.messageService.add({ severity: 'info', summary: 'Generando PDF', detail: 'Iniciando descarga...' });
    
    this.remissionService.exportPdf(data.id_guia).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Guia_${data.serie}-${data.numero}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF' });
      }
    });
  }

  descargarExcel() {
    const data = this.remision();
    if (!data) return;

    this.messageService.add({ severity: 'info', summary: 'Generando Excel', detail: 'Iniciando descarga...' });

    this.remissionService.exportExcel(data.id_guia).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Guia_${data.serie}-${data.numero}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el Excel' });
      }
    });
  }

  volver() {
    this.router.navigate(['/logistica/remision']);
  }
}

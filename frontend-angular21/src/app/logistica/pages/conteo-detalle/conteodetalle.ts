import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';

import { ConteoInventarioService } from '../../../logistica/services/conteo-inventario.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-conteo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    RouterModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './conteodetalle.html',
  styleUrls: ['./conteodetalle.css'],
})
export class ConteoDetalle implements OnInit {
  private conteoService = inject(ConteoInventarioService);
  private messageService = inject(MessageService);
  idConteoActual = signal<number | null>(null);
  isDownloadingPdf = signal<boolean>(false);
  isDownloadingExcel = signal<boolean>(false);
  listaDetalles = signal<any[]>([]);
  conteoCabecera = signal<any>(null);

  conteo = this.conteoService.conteoOperacion;
  loading = this.conteoService.loading;
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  totalSistema = computed(() => {
    const detalles = this.conteo()?.detalles || [];
    return detalles.reduce((acc: number, item: any) => acc + Number(item.stockSistema || 0), 0);
  });

  totalReal = computed(() => {
    const detalles = this.conteo()?.detalles || [];
    return detalles.reduce((acc: number, item: any) => acc + Number(item.stockConteo || 0), 0);
  });

  diferenciaNeta = computed(() => {
    return this.totalReal() - this.totalSistema();
  });

  exactitud = computed(() => {
    const sis = this.totalSistema();
    if (sis === 0) return 100;

    const porcentaje = (this.totalReal() / sis) * 100;
    return porcentaje > 100 ? 100 : Math.round(porcentaje);
  });

  ngOnInit() {
    const idUrl = this.route.snapshot.paramMap.get('id');
    if (idUrl) {
      const id = Number(idUrl);
      this.idConteoActual.set(id); 
      this.cargarDatosDelConteo(id); 
    } else {
      this.regresar();
    }
  }
  cargarDatosDelConteo(id: number) {
    this.conteoService.obtenerDetalle(id).subscribe({
      next: (res) => {
        this.conteoCabecera.set(res);
        this.listaDetalles.set(res.detalles);
      },
      error: (err) => {
        console.error('Error cargando los productos del conteo', err);
      }
    });
  }
  regresar() {
    this.conteoService.conteoOperacion.set(null);
    this.router.navigate(['/logistica/conteo-inventario']);
  }

  descargarPDF() {
    const id = this.conteo()?.idConteo;
    console.log(`Iniciando generación de PDF para el conteo #${id}`);
  }
  retomarConteo() {
    const id = this.conteo()?.idConteo || this.conteo()?.id_conteo;
    if (id) {
      this.router.navigate(['/logistica/conteo-crear'], { queryParams: { idRetomar: id } });
    }
  }
  anularConteo() {
    const id = this.conteo()?.idConteo || this.conteo()?.id_conteo;
    if (!id) return;
    const confirmar = confirm(
      '¿Estás seguro de que deseas anular este conteo? Esta acción cerrará el registro sin modificar el stock.',
    );

    if (confirmar) {
      this.conteoService.loading.set(true);

      this.conteoService.finalizarYajustar(id, 'ANULADO').subscribe({
        next: () => {
          this.conteoService.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Anulado',
            detail: 'El conteo fue anulado correctamente.',
          });

          this.conteoService.obtenerDetalle(id);
        },
        error: () => {
          this.conteoService.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo anular el conteo.',
          });
        },
      });
    }
    this.router.navigate(['/logistica/conteo-inventario']);
  }
  descargarExcel() {
    const id = this.idConteoActual();
    if (!id) {
      console.warn('No hay un conteo seleccionado para exportar.');
      return;
    }
    this.isDownloadingExcel.set(true); 

    this.conteoService.exportarExcel(id).subscribe({
      next: (blob: Blob) => {
        this.descargarArchivo(blob, `Conteo_Inventario_${id}.xlsx`);
        this.isDownloadingExcel.set(false);
      },
      error: (err) => {
        console.error('Error al descargar Excel', err);
        this.isDownloadingExcel.set(false);
      },
    });
  }

  descargarPdf() {
    const id = this.idConteoActual();
    if (!id) return;

    this.isDownloadingPdf.set(true);

    this.conteoService.exportarPdf(id).subscribe({
      next: (blob: Blob) => {
        this.descargarArchivo(blob, `Conteo_Inventario_${id}.pdf`);
        this.isDownloadingPdf.set(false);
      },
      error: (err) => {
        console.error('Error al descargar PDF', err);
        this.isDownloadingPdf.set(false);
      },
    });
  }

  private descargarArchivo(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

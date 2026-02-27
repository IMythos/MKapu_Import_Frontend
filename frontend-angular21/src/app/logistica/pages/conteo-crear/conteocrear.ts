import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { ConteoInventarioService } from '../../../logistica/services/conteo-inventario.service';
import { CategoriaService } from '../../../administracion/services/categoria.service';
import { SedeService } from '../../../administracion/services/sede.service';

@Component({
  selector: 'app-conteo-crear',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    ToastModule,
    RouterModule,
  ],
  providers: [MessageService],
  templateUrl: './conteocrear.html',
  styleUrls: ['./conteocrear.css'],
})
export class ConteoCrear implements OnInit {
  private router = inject(Router);
  private conteoService = inject(ConteoInventarioService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);

  loading = this.conteoService.loading;
  conteoActual = this.conteoService.conteoOperacion;

  sedes = signal<any[]>([]);
  familias = signal<any[]>([]);
  sedeSeleccionada = signal<any>(null);
  familiaSeleccionada = signal<any>(null);
  private sedeService = inject(SedeService);
  private categoriaService = inject(CategoriaService);
  idUsuario = signal<number>(2);

  filtroNombre = signal<string>('');

  productosFiltrados = computed(() => {
    const detalles = this.conteoActual()?.detalles || [];
    const term = this.filtroNombre().toLowerCase();

    if (!term) return detalles;
    return detalles.filter(
      (det: any) =>
        det.descripcion?.toLowerCase().includes(term) || det.codProd?.toLowerCase().includes(term),
    );
  });

  totalPendientes = computed(() => {
    return (this.conteoActual()?.detalles || []).filter(
      (d: any) => d.stockConteo === null || d.stockConteo === undefined,
    ).length;
  });

  totalCuadrados = computed(() => {
    return (this.conteoActual()?.detalles || []).filter(
      (d: any) => d.stockConteo !== null && d.diferencia === 0,
    ).length;
  });

  totalDesviaciones = computed(() => {
    return (this.conteoActual()?.detalles || []).filter(
      (d: any) => d.stockConteo !== null && d.diferencia !== 0,
    ).length;
  });

  ngOnInit() {
    const idRetomar = this.route.snapshot.queryParamMap.get('idRetomar');

    if (idRetomar) {
      this.conteoService.obtenerDetalle(Number(idRetomar)).subscribe({
        next: (res: any) =>{
          const detalle = res.data || res;
          this.conteoService.conteoOperacion.set(detalle);
          this.conteoService.loading.set(false);
        },
        error: (err) =>{
          console.error('Error al retomar conteo', err);
          this.conteoService.loading.set(false);
        }
      })
    } else {
      this.conteoService.conteoOperacion.set(null);
      this.cargarCatalogos();
    }
  }

  iniciarSnapshot() {
    const sede = this.sedeSeleccionada();
    if (!sede) return;

    const familia = this.familiaSeleccionada();
    const idCat = familia && familia.value ? Number(familia.value) : undefined;
    const nomCat = familia && familia.value ? familia.label : undefined;

    this.conteoService.loading.set(true);

    this.conteoService
      .iniciarNuevoConteo({
        idSede: sede.value,
        nomSede: sede.label,
        idUsuario: this.idUsuario(),
        idCategoria: idCat,
        nomCategoria: nomCat,
      })
      .subscribe({
        next: (res) => {
          const nuevoConteo = res.data ? res.data : res;
          const idGenerado = nuevoConteo.idConteo;
          if (idGenerado) {
            this.conteoService.obtenerDetalle(idGenerado).subscribe({
            next: (detalle) => {
              this.conteoService.conteoOperacion.set(detalle); 
              this.conteoService.loading.set(false);
              this.messageService.add({ 
                severity: 'info', 
                summary: 'Iniciado', 
                detail: 'Snapshot generado. Ya puedes contar.' 
              });
            },
            error: () => this.conteoService.loading.set(false)
            });
          } else {
            console.warn(
              'No se detectó ID generado, forzando vista con la data del POST',
              nuevoConteo,
            );
            this.conteoService.conteoOperacion.set(nuevoConteo);
            this.conteoService.loading.set(false);
          }
        },
        error: (err) => {
          this.conteoService.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo generar el snapshot del stock.',
          });
        },
      });
  }

  actualizarConteoFisico(idDetalle: number, nuevoValor: number | null) {
    if (nuevoValor === null) return;
    this.conteoService.conteoOperacion.update((conteo) => {
      if (!conteo) return conteo;
      const detalle = conteo.detalles.find((d: any) => d.idDetalle === idDetalle);
      if (detalle) {
        detalle.stockConteo = nuevoValor;
        detalle.diferencia = nuevoValor - Number(detalle.stockSistema || 0);
      }
      return { ...conteo };
    });
  }

  guardarConteo() {
    const id = this.conteoActual()?.idConteo;
    if (!id) return;
    if (this.totalPendientes() > 0) {
      if (
        !confirm('Aún hay ítems sin contar. Se asumirá cantidad 0 para ellos. ¿Deseas continuar?')
      )
        return;
    }
    this.conteoService.loading.set(true);

    this.conteoService.finalizarYajustar(id, 'AJUSTADO').subscribe({
      next: () => {
        this.conteoService.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Completado',
          detail: 'Stock ajustado correctamente.',
        });
        setTimeout(() => this.router.navigate(['/logistica/conteo-inventario']), 1500);
      },
      error: () => {
        this.conteoService.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Fallo al procesar los ajustes de stock.',
        });
      },
    });
    this.router.navigate(['/logistica/conteo-inventario']);
  }

  cargarCatalogos() {
    this.sedeService.getSedes().subscribe({
      next: (res: any) => {
        const listaSedes = res.headquarters || [];

        const sedesFormateadas = listaSedes.map((s: any) => ({
          label: s.nombre,
          value: s.id_sede,
        }));

        this.sedes.set(sedesFormateadas);

        if (sedesFormateadas.length > 0) {
          this.sedeSeleccionada.set(sedesFormateadas[0]);
        }
      },
      error: (err) => console.error('Error cargando sedes:', err),
    });

    this.categoriaService.getCategorias(true).subscribe({
      next: (res: any) => {
        let arrayBruto = [];

        if (res && Array.isArray(res)) {
          arrayBruto = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          arrayBruto = res.data;
        } else if (res && res.categories && Array.isArray(res.categories)) {
          arrayBruto = res.categories;
        }

        const categoriasBD = arrayBruto.map((c: any) => ({
          label: c.nombre || c.name || 'Sin nombre',
          value: c.id_categoria || c.idCategoria || c.id,
        }));

        const familiasCompletas = [{ label: 'Todas las Familias', value: null }, ...categoriasBD];

        this.familias.set(familiasCompletas);
        this.familiaSeleccionada.set(familiasCompletas[0]);
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las familias.',
        });
      },
    });
  }

  cancelar() {
    this.router.navigate(['/logistica/conteo-inventario']);
  }
}

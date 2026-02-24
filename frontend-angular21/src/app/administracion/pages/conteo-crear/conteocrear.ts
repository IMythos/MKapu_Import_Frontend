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
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './conteocrear.html',
  styleUrls: ['./conteocrear.css']
})
export class ConteoCrear implements OnInit {

  private router = inject(Router);
  private conteoService = inject(ConteoInventarioService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);

  loading = this.conteoService.loading;
  conteoActual = this.conteoService.conteoOperacion;

  sedes = [
    { label: 'SJL - Las Flores', value: 1 },
    { label: 'Surco - Principal', value: 2 }
  ];
  sedeSeleccionada = signal<any>(this.sedes[0]);
  idUsuario = signal<number>(2);

  filtroNombre = signal<string>('');

  
  productosFiltrados = computed(() => {
    const detalles = this.conteoActual()?.detalles || [];
    const term = this.filtroNombre().toLowerCase();
    
    if (!term) return detalles;
    return detalles.filter((det: any) => 
      det.descripcion?.toLowerCase().includes(term) || 
      det.codProd?.toLowerCase().includes(term)
    );
  });

  totalPendientes = computed(() => {
    return (this.conteoActual()?.detalles || []).filter((d: any) => d.stockConteo === null || d.stockConteo === undefined).length;
  });

  totalCuadrados = computed(() => {
    return (this.conteoActual()?.detalles || []).filter((d: any) => d.stockConteo !== null && d.diferencia === 0).length;
  });

  totalDesviaciones = computed(() => {
    return (this.conteoActual()?.detalles || []).filter((d: any) => d.stockConteo !== null && d.diferencia !== 0).length;
  });

  ngOnInit() {
    const idRetomar = this.route.snapshot.queryParamMap.get('idRetomar');
    if (idRetomar) {
      this.conteoService.loading.set(true);
      this.conteoService.obtenerDetalle(Number(idRetomar));
      this.messageService.add({ severity: 'info', summary: 'Retomando', detail: 'Has retomado un conteo pendiente.' });
      
    } else {
    const idRetomar = this.route.snapshot.queryParamMap.get('idRetomar');
    this.conteoService.conteoOperacion.set(null);
    }
  }


  iniciarSnapshot() {
    const sede = this.sedeSeleccionada();
    if (!sede) return;

    this.conteoService.loading.set(true);

    this.conteoService.iniciarNuevoConteo({
      idSede: sede.value,
      nomSede: sede.label,
      idUsuario: this.idUsuario()
    }).subscribe({
      next: (res) => {
        const nuevoConteo = res.data ? res.data : res;
        const idGenerado = nuevoConteo.idConteo; 
        if (idGenerado) {
          this.conteoService.obtenerDetalle(idGenerado);
          this.messageService.add({ severity: 'info', summary: 'Iniciado', detail: 'Ya puedes registrar las cantidades físicas.' });
        } else {
          console.warn("No se detectó ID generado, forzando vista con la data del POST", nuevoConteo);
          this.conteoService.conteoOperacion.set(nuevoConteo);
          this.conteoService.loading.set(false);
        }
      },
      error: (err) => {
        this.conteoService.loading.set(false); 
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el snapshot del stock.' });
      }
    });
  }

  actualizarConteoFisico(idDetalle: number, nuevoValor: number | null) {
    if (nuevoValor === null) return;
    this.conteoService.conteoOperacion.update(conteo => {
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
      if(!confirm('Aún hay ítems sin contar. Se asumirá cantidad 0 para ellos. ¿Deseas continuar?')) return;
    }

    this.conteoService.loading.set(true); 

    this.conteoService.finalizarYajustar(id, 'AJUSTADO').subscribe({
      next: () => {
        this.conteoService.loading.set(false); 

        this.messageService.add({ severity: 'success', summary: 'Completado', detail: 'Stock ajustado correctamente.' });
        setTimeout(() => this.router.navigate(['/admin/conteo-inventario']), 1500);
      },
      error: () => {
        this.conteoService.loading.set(false); 

        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al procesar los ajustes de stock.' });
      }
    });
    this.router.navigate(['admin/conteo-inventario']);
  }

  cancelar() {
    this.router.navigate(['/admin/conteo-inventario']);
  }
}

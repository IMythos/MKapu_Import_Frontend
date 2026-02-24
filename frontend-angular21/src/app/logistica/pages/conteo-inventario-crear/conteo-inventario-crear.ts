import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
interface ItemConteo {
  id: number;
  codigo: string;
  nombre: string;
  familia: string;
  stockSistema: number;
  conteoFisico: number | null;
  diferencia: number;
  ubicacion: string;
  estado: 'PENDIENTE' | 'CUADRADO' | 'DESVIACION';
}
@Component({
  selector: 'app-conteo-inventario-crear',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputNumberModule, TagModule, CardModule, ToastModule],
  templateUrl: './conteo-inventario-crear.html',
  styleUrl: './conteo-inventario-crear.css',
})
export class ConteoInventarioCrear {
private messageService = inject(MessageService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  inventario = signal<ItemConteo[]>([]);

  totalPendientes = computed(() => this.inventario().filter(i => i.estado === 'PENDIENTE').length);
  totalCuadrados = computed(() => this.inventario().filter(i => i.estado === 'CUADRADO').length);
  totalDesviaciones = computed(() => this.inventario().filter(i => i.estado === 'DESVIACION').length);

  ngOnInit() {
    this.iniciarProcesoDeConteo();
  }

  iniciarProcesoDeConteo() {
    this.loading.set(true);
    setTimeout(() => {
      this.inventario.set([
        { id: 1, codigo: 'GRIF-001', nombre: 'Grifería Monocomando', familia: 'Grifería', stockSistema: 50, conteoFisico: null, diferencia: 0, ubicacion: 'Pasillo A-01', estado: 'PENDIENTE' },
        { id: 2, codigo: 'TUB-PVC-2', nombre: 'Tubo PVC 2 Pulgadas', familia: 'Tuberías', stockSistema: 120, conteoFisico: null, diferencia: 0, ubicacion: 'Patio Externo', estado: 'PENDIENTE' },
        { id: 3, codigo: 'VAL-ESF-1', nombre: 'Válvula Esférica 1"', familia: 'Válvulas', stockSistema: 30, conteoFisico: null, diferencia: 0, ubicacion: 'Estante B-03', estado: 'PENDIENTE' }
      ]);
      this.loading.set(false);
      this.messageService.add({ severity: 'info', summary: 'Conteo Iniciado', detail: 'Ingresa las cantidades físicas.' });
    }, 500);
  }

  actualizarDiferencia(item: ItemConteo, nuevoConteoFisico: number | null) {
    this.inventario.update(inv =>
      inv.map(i => {
        if (i.id === item.id) {
          const diferencia = nuevoConteoFisico === null ? 0 : nuevoConteoFisico - i.stockSistema;
          const estado = nuevoConteoFisico === null ? 'PENDIENTE' : (diferencia === 0 ? 'CUADRADO' : 'DESVIACION');
          return { ...i, conteoFisico: nuevoConteoFisico, diferencia, estado };
        }
        return i;
      })
    );
  }

  cancelarYSalir() {
    // Aquí se llama a un PATCH
    this.router.navigate(['/administracion/conteo-inventario']);
  }

  finalizarConteo() {
    if (this.totalPendientes() > 0) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Aún hay items sin contar.' });
      return;
    }
    this.loading.set(true);
    // Simula el PATCH para finalizar y aplicar ajuste 501/502
    setTimeout(() => {
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Conteo guardado y stock actualizado.' });
      setTimeout(() => this.router.navigate(['/administracion/conteo-inventario']), 1500);
    }, 1000);
  }
  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    return estado === 'CUADRADO' ? 'success' : estado === 'DESVIACION' ? 'danger' : 'warn';
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

interface ProductoConteo {
  codigo: string;
  nombre: string;
  familia: string;
  sede: string;
  stockSistema: number;
  conteoPropio: number;
}

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
    SelectModule,
    RouterModule
  ],
  templateUrl: './conteocrear.html',
  styleUrls: ['./conteocrear.css']
})
export class ConteoCrear implements OnInit {

  private router = inject(Router);

  productos = signal<ProductoConteo[]>([]);

  filtroCodigo = signal<string>('');
  filtroNombre = signal<string>('');
  familiaSeleccionada = signal<string>('');
  sedeSeleccionada = signal<string>('SJL');

  familias = [
    { label: 'Todas las familias', value: '' },
    { label: 'Cafeteras', value: 'Cafeteras' }
  ];

  sedes = [
    { label: 'SJL', value: 'SJL' },
    { label: 'Miraflores', value: 'Miraflores' }
  ];

  
  productosFiltrados = computed(() => {
    const pCodigo = this.filtroCodigo().toLowerCase();
    const pNombre = this.filtroNombre().toLowerCase();
    const pFamilia = this.familiaSeleccionada();
    const pSede = this.sedeSeleccionada();

    return this.productos().filter(p => {
      const coincideCodigo = p.codigo.toLowerCase().includes(pCodigo);
      const coincideNombre = p.nombre.toLowerCase().includes(pNombre);
      const coincideFamilia = !pFamilia || p.familia === pFamilia;
      const coincideSede = !pSede || p.sede === pSede;

      return coincideCodigo && coincideNombre && coincideFamilia && coincideSede;
    });
  });


  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    // Usamos .set() para inicializar la señal
    this.productos.set([
      { codigo: 'CP-1029', nombre: 'Cafetera Espresso Pro', familia: 'Cafeteras', sede: 'SJL', stockSistema: 2, conteoPropio: 2 },
      { codigo: 'CP-1030', nombre: 'Cafetera Goteo XL', familia: 'Cafeteras', sede: 'SJL', stockSistema: 6, conteoPropio: 5 },
      { codigo: 'CP-1035', nombre: 'Prensa Francesa 1L', familia: 'Cafeteras', sede: 'SJL', stockSistema: 13, conteoPropio: 14 },
      { codigo: 'CP-1036', nombre: 'Molinillo Eléctrico', familia: 'Cafeteras', sede: 'SJL', stockSistema: 15, conteoPropio: 15 }
    ]);
  }


  // IMPORTANTE: Este método se debe llamar desde el HTML cuando el usuario cambia la cantidad
  actualizarConteoFisico(codigo: string, nuevoValor: number) {
    this.productos.update(prods =>
      prods.map(p => 
        p.codigo === codigo ? { ...p, conteoPropio: nuevoValor } : p
      )
    );
  }

  calcularDiferencia(p: ProductoConteo): number {
    return p.conteoPropio - p.stockSistema;
  }


  cancelar() {
    this.router.navigate(['/administracion/conteo-inventario']);
  }

  guardarConteo() {
    console.log('Conteo guardado:', this.productosFiltrados());
    this.router.navigate(['/administracion/conteo-inventario']);
  }

  exportar() {
    console.log('Exportar conteo');
  }
}
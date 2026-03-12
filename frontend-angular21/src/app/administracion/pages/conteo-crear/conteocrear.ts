import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';

/* SERVICES */
import { ProductoService } from '../../services/producto.service';
import { SedeService } from '../../services/sede.service';
import { ConteoService } from '../../services/conteo.service';

/* INTERFACES */
import { ProductoInterface, ProductoResponse } from '../../interfaces/producto.interface';

interface ProductoConteo {
  id: number;
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
    AutoCompleteModule,
    RouterModule
  ],
  templateUrl: './conteocrear.html',
})
export class ConteoCrear implements OnInit {

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private sedeService: SedeService,
    private conteoService: ConteoService
  ) {}

  filtroCodigo: string = '';
  productoSeleccionado: ProductoConteo | null = null;
  productosSugeridos: any[] = [];

  familias: any[] = [{ label: 'Todas', value: '' }];
  sedes: any[] = [{ label: 'Todas', value: '' }];

  familiaSeleccionada: string = '';
  sedeSeleccionada: string = '';

  productos: ProductoConteo[] = [];
  productosFiltrados: ProductoConteo[] = [];

  ngOnInit() {
    this.cargarSedes();
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.getProductos(1, 100).subscribe({
      next: (response: ProductoResponse) => {

        this.productos = response.products.map((p: ProductoInterface) => ({
          id: p.id_producto,
          codigo: p.codigo,
          nombre: p.anexo,
          familia: p.categoriaNombre,
          sede: '',
          stockSistema: 0,
          conteoPropio: 0
        }));

        this.generarFamilias();
        this.aplicarFiltros();
      }
    });
  }

  cargarSedes() {
    this.sedeService.getSedes().subscribe({
      next: (response: any) => {

        const lista = response?.headquarters || response;

        this.sedes = [
          { label: 'Todas', value: '' },
          ...lista.map((s: any) => ({
            label: s.nombre || s.name,
            value: s.nombre || s.name
          }))
        ];
      }
    });
  }

  buscarProducto(event: any) {
    const query = event.query.toLowerCase();

    this.productosSugeridos = this.productos
      .filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.codigo.toLowerCase().includes(query)
      )
      .map(p => ({
        ...p,
        displayLabel: `${p.codigo} - ${p.nombre}`
      }));
  }

  seleccionarProducto(event: any) {
    const producto = event.value;
    this.filtroCodigo = producto.codigo;
    this.productoSeleccionado = producto;
    this.aplicarFiltros();
  }

  generarFamilias() {
    const familiasUnicas = [...new Set(this.productos.map(p => p.familia))];

    this.familias = [
      { label: 'Todas', value: '' },
      ...familiasUnicas.map(f => ({ label: f, value: f }))
    ];
  }

  aplicarFiltros() {
    this.productosFiltrados = this.productos.filter(p => {

      const coincideCodigo =
        !this.filtroCodigo ||
        p.codigo.toLowerCase().includes(this.filtroCodigo.toLowerCase());

      const coincideFamilia =
        !this.familiaSeleccionada ||
        p.familia === this.familiaSeleccionada;

      return coincideCodigo && coincideFamilia;
    });
  }

  calcularDiferencia(p: ProductoConteo): number {
    return p.stockSistema - p.conteoPropio;
  }

  cancelar() {
    this.router.navigate(['/admin/conteo-inventario']);
  }

  /* 🔥 GUARDAR CON PRODUCTOS */
  guardarConteo() {

    const productosContados = this.productosFiltrados
      .filter(p => p.conteoPropio > 0)
      .map(p => ({
        codigo: p.codigo,
        producto: p.nombre,
        categoria: p.familia,
        stockSistema: p.stockSistema,
        conteoReal: p.conteoPropio
      }));

    if (productosContados.length === 0) {
      alert('Debe ingresar al menos un conteo.');
      return;
    }

    const fechaFormateada = new Date().toLocaleDateString('es-PE');

    const nuevoConteo = {
      fecha: fechaFormateada,
      detalle: `Conteo ${this.familiaSeleccionada || 'General'} - ${this.sedeSeleccionada || 'Todas las sedes'}`,
      estado: 'Inicio',
      familia: this.familiaSeleccionada || 'General',
      productos: productosContados // 🔥 IMPORTANTE
    };

    this.conteoService.crearConteo(nuevoConteo);

    this.router.navigate(['/admin/conteo-inventario']);
  }

  exportar() {
    console.log('Exportar conteo');
  }
}

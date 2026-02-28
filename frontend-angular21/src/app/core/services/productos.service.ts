import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VarianteProducto {
  id?: number;
  sede: string;
  stock: number;
}

export interface Producto {
  id?: number;
  codigo: string;
  anexo?: string;
  nombre: string;
  descripcion?: string;
  familia: string;
  precioCompra: number;
  precioVenta: number;
  precioUnidad: number;
  precioCaja: number;
  precioMayorista: number;
  unidadMedida: string;
  estado: 'Activo' | 'Eliminado';
  fechaCreacion: Date;
  fechaActualizacion: Date;
  variantes?: VarianteProducto[];
  stockTotal?: number;
  cantidadSedes?: number;
  sede?: string;
  stock?: number;
}

export interface ComparativaProducto {
  codigo: string;
  nombre: string;
  familia: string;
  variantes: {
    id: number;
    sede: string;
    precioCompra: number;
    precioVenta: number;
    precioUnidad: number;
    precioCaja: number;
    precioMayorista: number;
    estado: 'Activo' | 'Eliminado';
    diferenciaPrecioCompra?: number;
    diferenciaPrecioVenta?: number;
    diferenciaPrecioUnidad?: number;
    diferenciaPrecioCaja?: number;
    diferenciaPrecioMayorista?: number;
    porcentajeDiferencia?: number;
  }[];
  precioPromedioCompra: number;
  precioPromedioVenta: number;
  precioPromedioUnidad: number;
  precioCajaPromedio: number;
  precioMayoristaPromedio: number;
  precioMinimoVenta: number;
  precioMaximoVenta: number;
  sedeMasBarata: string;
  sedeMasCara: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  public productos$ = this.productosSubject.asObservable();

  constructor() {
    this.inicializarDatos();
  }

  private inicializarDatos(): void {
    const datosIniciales: Producto[] = [
      {
        id: 1,
        codigo: 'RAF-TV55',
        anexo: 'TV-001',
        nombre: 'Smart TV LED 55" 4K RAF',
        descripcion: 'Televisor LED 55 pulgadas 4K UHD Smart TV con WiFi integrado',
        familia: 'Televisores',
        precioCompra: 1200.0,
        precioVenta: 1599.0,
        precioUnidad: 1599.0,
        precioCaja: 15200.0,
        precioMayorista: 1450.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-01-15'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 45 },
          { sede: 'LURIN', stock: 20 },
          { sede: 'VES', stock: 8 }
        ]
      },
      {
        id: 2,
        codigo: 'RAF-LG32',
        anexo: 'LAV-001',
        nombre: 'Lavarropas Automático 10kg RAF',
        descripcion: 'Lavadora automática carga frontal 10kg con 15 programas',
        familia: 'Lavarropas',
        precioCompra: 650.0,
        precioVenta: 899.0,
        precioUnidad: 899.0,
        precioCaja: 8500.0,
        precioMayorista: 820.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-02-10'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 20 },
          { sede: 'LURIN', stock: 15 }
        ]
      },
      {
        id: 3,
        codigo: 'RAF-RF45',
        anexo: 'REF-001',
        nombre: 'Refrigerador No Frost 12 pies RAF',
        descripcion: 'Refrigeradora No Frost 12 pies cúbicos con dispensador',
        familia: 'Refrigeradores',
        precioCompra: 950.0,
        precioVenta: 1299.0,
        precioUnidad: 1299.0,
        precioCaja: 12300.0,
        precioMayorista: 1180.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-01-20'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 12 }
        ]
      },
      {
        id: 4,
        codigo: 'RAF-MW900',
        anexo: 'MW-001',
        nombre: 'Microondas Inverter 900W RAF',
        descripcion: 'Horno microondas con tecnología inverter 900W',
        familia: 'Microondas',
        precioCompra: 220.0,
        precioVenta: 299.0,
        precioUnidad: 299.0,
        precioCaja: 2800.0,
        precioMayorista: 275.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-03-05'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 30 }
        ]
      },
      {
        id: 5,
        codigo: 'RAF-ASP2000',
        anexo: 'ASP-001',
        nombre: 'Aspiradora Industrial 2000W RAF',
        descripcion: 'Aspiradora industrial potencia 2000W con filtro HEPA',
        familia: 'Electrodomésticos',
        precioCompra: 400.0,
        precioVenta: 549.0,
        precioUnidad: 549.0,
        precioCaja: 5200.0,
        precioMayorista: 500.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-02-25'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LURIN', stock: 18 }
        ]
      },
      {
        id: 6,
        codigo: 'RAF-COF800',
        anexo: 'COF-001',
        nombre: 'Cafetera Automática 800W RAF',
        descripcion: 'Cafetera automática programable 12 tazas',
        familia: 'Cocina',
        precioCompra: 280.0,
        precioVenta: 379.0,
        precioUnidad: 379.0,
        precioCaja: 3600.0,
        precioMayorista: 345.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-03-12'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 25 }
        ]
      },
      {
        id: 7,
        codigo: 'RAF-LIC500',
        anexo: 'LIC-001',
        nombre: 'Licuadora Profesional 500W RAF',
        descripcion: 'Licuadora profesional 5 velocidades jarra de vidrio',
        familia: 'Cocina',
        precioCompra: 135.0,
        precioVenta: 189.0,
        precioUnidad: 189.0,
        precioCaja: 1800.0,
        precioMayorista: 170.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-04-01'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 40 },
          { sede: 'VES', stock: 15 }
        ]
      },
      {
        id: 8,
        codigo: 'RAF-HOR1800',
        anexo: 'HOR-001',
        nombre: 'Horno Eléctrico 1800W RAF',
        descripcion: 'Horno eléctrico 45L con control de temperatura',
        familia: 'Cocina',
        precioCompra: 370.0,
        precioVenta: 499.0,
        precioUnidad: 499.0,
        precioCaja: 4700.0,
        precioMayorista: 460.0,
        unidadMedida: 'UND',
        estado: 'Activo',
        fechaCreacion: new Date('2024-03-18'),
        fechaActualizacion: new Date('2026-01-10'),
        variantes: [
          { sede: 'LAS FLORES', stock: 15 }
        ]
      }
    ];

    this.productosSubject.next(datosIniciales);
  }

  private calcularPropiedadesDerivadas(producto: Producto): Producto {
    if (producto.variantes && producto.variantes.length > 0) {
      producto.stockTotal = producto.variantes.reduce((sum, v) => sum + v.stock, 0);
      producto.cantidadSedes = producto.variantes.length;
      producto.stock = producto.stockTotal;
    }
    return producto;
  }

  getProductos(sede?: string, estado: 'Activo' | 'Eliminado' = 'Activo'): Producto[] {
    let productos = this.productosSubject.value
      .filter((p) => p.estado === estado)
      .map(p => this.calcularPropiedadesDerivadas({...p}));
    
    if (sede) {
      productos = productos.filter((p) => 
        p.variantes?.some(v => v.sede === sede)
      );
    }
    return productos;
  }

  getProductoPorId(id: number): Producto | null {
    const producto = this.productosSubject.value.find((p) => p.id === id);
    return producto ? this.calcularPropiedadesDerivadas({...producto}) : null;
  }

  getProductoById(id: number): Producto | null {
    return this.getProductoPorId(id);
  }

  getProductoPorCodigo(codigo: string): Producto | undefined {
    const producto = this.productosSubject.value.find((p) => p.codigo === codigo && p.estado === 'Activo');
    return producto ? this.calcularPropiedadesDerivadas({...producto}) : undefined;
  }

  getProductosPorCodigo(codigo: string, incluirEliminados: boolean = false): Producto[] {
    let productos = this.productosSubject.value.filter((p) => p.codigo === codigo);
    if (!incluirEliminados) {
      productos = productos.filter((p) => p.estado === 'Activo');
    }
    return productos.map(p => this.calcularPropiedadesDerivadas({...p}));
  }

  buscarProductos(termino: string, sede?: string): Producto[] {
    const busqueda = termino.toLowerCase();
    let productos = this.productosSubject.value.filter(
      (p) =>
        p.estado === 'Activo' &&
        (p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda)),
    );

    if (sede) {
      productos = productos.filter((p) => p.variantes?.some(v => v.sede === sede));
    }

    return productos.map(p => this.calcularPropiedadesDerivadas({...p}));
  }

  getProductosEliminados(sede?: string): Producto[] {
    return this.getProductos(sede, 'Eliminado');
  }

  getSedes(): string[] {
    const sedesSet = new Set<string>();
    this.productosSubject.value.forEach(p => {
      p.variantes?.forEach(v => sedesSet.add(v.sede));
    });
    return Array.from(sedesSet).sort();
  }

  getFamilias(sede?: string): string[] {
    const productos = sede ? this.getProductos(sede) : this.getProductos();
    return [...new Set(productos.map((p) => p.familia))].sort();
  }

  getProductosPorFamilia(familia: string, sede?: string): Producto[] {
    let productos = this.productosSubject.value.filter(
      (p) => p.familia === familia && p.estado === 'Activo',
    );

    if (sede) {
      productos = productos.filter((p) => p.variantes?.some(v => v.sede === sede));
    }

    return productos.map(p => this.calcularPropiedadesDerivadas({...p}));
  }

  getUnidadesMedida(): string[] {
    return ['UND', 'KG', 'LT', 'MT', 'CJ', 'PQ'];
  }

  crearProducto(productoData: Omit<Producto, 'id'>): Producto {
    const productos = [...this.productosSubject.value];
    const nuevoId = Math.max(...productos.map((p) => p.id || 0), 0) + 1;

    const nuevoProducto: Producto = {
      ...productoData,
      id: nuevoId,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      estado: 'Activo',
    };

    const productoConPropiedades = this.calcularPropiedadesDerivadas(nuevoProducto);
    productos.push(productoConPropiedades);
    this.productosSubject.next(productos);
    return productoConPropiedades;
  }

  crearProductoBoolean(productoData: Omit<Producto, 'id'>): boolean {
    try {
      this.crearProducto(productoData);
      return true;
    } catch (error) {
      console.error('Error al crear producto:', error);
      return false;
    }
  }

  actualizarProducto(id: number, cambios: Partial<Producto>): boolean {
    const productos = [...this.productosSubject.value];
    const index = productos.findIndex((p) => p.id === id);

    if (index !== -1) {
      productos[index] = {
        ...productos[index],
        ...cambios,
        fechaActualizacion: new Date(),
      };
      productos[index] = this.calcularPropiedadesDerivadas(productos[index]);
      this.productosSubject.next(productos);
      return true;
    }
    return false;
  }

  actualizarProductoCompleto(id: number, producto: Producto): boolean {
    return this.actualizarProducto(id, producto);
  }

  eliminarProducto(id: number): boolean {
    return this.actualizarProducto(id, { estado: 'Eliminado' });
  }

  restaurarProducto(id: number): boolean {
    return this.actualizarProducto(id, { estado: 'Activo' });
  }

  actualizarStock(id: number, cantidad: number): boolean {
    const producto = this.productosSubject.value.find((p) => p.id === id);
    if (producto && (producto.stock || 0) >= cantidad) {
      return this.actualizarProducto(id, { stock: (producto.stock || 0) - cantidad });
    }
    return false;
  }

  descontarStock(id: number, cantidad: number): boolean {
    const producto = this.productosSubject.value.find((p) => p.id === id);
    if (!producto) return false;

    const stockActual = producto.stock || 0;
    if (stockActual < cantidad) return false;

    return this.actualizarProducto(id, { stock: stockActual - cantidad });
  }

  devolverStock(id: number, cantidad: number): boolean {
    const producto = this.productosSubject.value.find((p) => p.id === id);
    if (!producto) return false;

    const stockActual = producto.stock || 0;
    return this.actualizarProducto(id, { stock: stockActual + cantidad });
  }

  incrementarStock(id: number, cantidad: number): boolean {
    return this.devolverStock(id, cantidad);
  }

  establecerStock(id: number, nuevoStock: number): boolean {
    if (nuevoStock < 0) return false;
    return this.actualizarProducto(id, { stock: nuevoStock });
  }

  getStockDisponible(id: number): number {
    const producto = this.productosSubject.value.find((p) => p.id === id);
    return producto?.stock || 0;
  }

  verificarStockDisponible(id: number, cantidadRequerida: number): boolean {
    const stockActual = this.getStockDisponible(id);
    return stockActual >= cantidadRequerida;
  }

  getProductosBajoStock(limite: number = 10, sede?: string): Producto[] {
    let productos = this.getProductos(sede, 'Activo');
    return productos.filter((p) => (p.stock || 0) <= limite);
  }

  getProductosSinStock(sede?: string): Producto[] {
    return this.getProductosBajoStock(0, sede);
  }

  actualizarStockMultiple(actualizaciones: { id: number; cantidad: number }[]): boolean {
    try {
      actualizaciones.forEach(({ id, cantidad }) => {
        if (!this.descontarStock(id, cantidad)) {
          throw new Error(`No se pudo descontar stock del producto ${id}`);
        }
      });
      return true;
    } catch (error) {
      console.error('Error al actualizar stock múltiple:', error);
      return false;
    }
  }

  devolverStockMultiple(devoluciones: { id: number; cantidad: number }[]): boolean {
    try {
      devoluciones.forEach(({ id, cantidad }) => {
        if (!this.devolverStock(id, cantidad)) {
          throw new Error(`No se pudo devolver stock del producto ${id}`);
        }
      });
      return true;
    } catch (error) {
      console.error('Error al devolver stock múltiple:', error);
      return false;
    }
  }

  existeCodigo(codigo: string, sede?: string): boolean {
    if (sede) {
      return this.productosSubject.value.some((p) => 
        p.codigo === codigo && p.variantes?.some(v => v.sede === sede)
      );
    }
    return this.productosSubject.value.some((p) => p.codigo === codigo);
  }

  getTotalProductos(estado: 'Activo' | 'Eliminado' = 'Activo'): number {
    return this.getProductos(undefined, estado).length;
  }

  getTotalProductosActivos(): number {
    return this.getTotalProductos('Activo');
  }

  getTotalProductosEliminados(): number {
    return this.getTotalProductos('Eliminado');
  }

  getTotalProductosPorSede(sede: string, estado: 'Activo' | 'Eliminado' = 'Activo'): number {
    return this.getProductos(sede, estado).length;
  }

  getTotalProductosActivosPorSede(sede: string): number {
    return this.getTotalProductosPorSede(sede, 'Activo');
  }

  getTotalProductosEliminadosPorSede(sede: string): number {
    return this.getTotalProductosPorSede(sede, 'Eliminado');
  }

  getResumenPorSedes(): { sede: string; activos: number; eliminados: number; total: number }[] {
    const sedes = this.getSedes();
    return sedes.map((sede) => ({
      sede,
      activos: this.getTotalProductosActivosPorSede(sede),
      eliminados: this.getTotalProductosEliminadosPorSede(sede),
      total: this.getTotalProductosPorSede(sede),
    }));
  }

  getProductosConVariasSedes(): string[] {
    const codigosPorSedes = new Map<string, Set<string>>();

    this.productosSubject.value
      .filter((p) => p.estado === 'Activo')
      .forEach((p) => {
        if (!codigosPorSedes.has(p.codigo)) {
          codigosPorSedes.set(p.codigo, new Set());
        }
        p.variantes?.forEach(v => codigosPorSedes.get(p.codigo)!.add(v.sede));
      });

    return Array.from(codigosPorSedes.entries())
      .filter(([_, sedes]) => sedes.size > 1)
      .map(([codigo, _]) => codigo);
  }

  getTotalProductosConVariasSedes(): number {
    return this.getProductosConVariasSedes().length;
  }

  getComparativaPorCodigo(codigo: string): ComparativaProducto | null {
    const variantes = this.getProductosPorCodigo(codigo);

    if (variantes.length === 0) return null;

    const preciosCompra = variantes.map((v) => v.precioCompra);
    const preciosVenta = variantes.map((v) => v.precioVenta);
    const preciosUnidad = variantes.map((v) => v.precioUnidad);
    const preciosCaja = variantes.map((v) => v.precioCaja);
    const preciosMayorista = variantes.map((v) => v.precioMayorista);

    const precioPromedioCompra = preciosCompra.reduce((a, b) => a + b, 0) / preciosCompra.length;
    const precioPromedioVenta = preciosVenta.reduce((a, b) => a + b, 0) / preciosVenta.length;
    const precioPromedioUnidad = preciosUnidad.reduce((a, b) => a + b, 0) / preciosUnidad.length;
    const precioCajaPromedio = preciosCaja.reduce((a, b) => a + b, 0) / preciosCaja.length;
    const precioMayoristaPromedio =
      preciosMayorista.reduce((a, b) => a + b, 0) / preciosMayorista.length;

    const precioMinimoVenta = Math.min(...preciosVenta);
    const precioMaximoVenta = Math.max(...preciosVenta);

    const varianteMasBarata = variantes.find((v) => v.precioVenta === precioMinimoVenta)!;
    const varianteMasCara = variantes.find((v) => v.precioVenta === precioMaximoVenta)!;

    const variantesConDiferencia = variantes.map((v) => ({
      id: v.id || 0,
      sede: v.sede || '',
      precioCompra: v.precioCompra,
      precioVenta: v.precioVenta,
      precioUnidad: v.precioUnidad,
      precioCaja: v.precioCaja,
      precioMayorista: v.precioMayorista,
      estado: v.estado,
      diferenciaPrecioCompra: v.precioCompra - precioPromedioCompra,
      diferenciaPrecioVenta: v.precioVenta - precioPromedioVenta,
      diferenciaPrecioUnidad: v.precioUnidad - precioPromedioUnidad,
      diferenciaPrecioCaja: v.precioCaja - precioCajaPromedio,
      diferenciaPrecioMayorista: v.precioMayorista - precioMayoristaPromedio,
      porcentajeDiferencia:
        precioPromedioVenta > 0
          ? ((v.precioVenta - precioPromedioVenta) / precioPromedioVenta) * 100
          : 0,
    }));

    return {
      codigo: variantes[0].codigo,
      nombre: variantes[0].nombre,
      familia: variantes[0].familia,
      variantes: variantesConDiferencia,
      precioPromedioCompra,
      precioPromedioVenta,
      precioPromedioUnidad,
      precioCajaPromedio,
      precioMayoristaPromedio,
      precioMinimoVenta,
      precioMaximoVenta,
      sedeMasBarata: varianteMasBarata.sede || '',
      sedeMasCara: varianteMasCara.sede || '',
    };
  }

  getComparativaPorProducto(codigo: string): Producto[] {
    return this.getProductosPorCodigo(codigo);
  }

  getPrecioPromedioPorProducto(codigo: string): number {
    const productos = this.getComparativaPorProducto(codigo);
    return productos.length > 0
      ? productos.reduce((sum, p) => sum + p.precioVenta, 0) / productos.length
      : 0;
  }

  getMargenGanancia(producto: Producto): number {
    return producto.precioVenta - producto.precioCompra;
  }

  getPorcentajeMargen(producto: Producto): number {
    return producto.precioCompra > 0
      ? ((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100
      : 0;
  }

  getFamiliasOptions() {
    return [
      { label: 'Todas', value: null },
      { label: 'Televisores', value: 'Televisores' },
      { label: 'Lavarropas', value: 'Lavarropas' },
      { label: 'Refrigeradores', value: 'Refrigeradores' },
      { label: 'Microondas', value: 'Microondas' },
      { label: 'Electrodomésticos', value: 'Electrodomésticos' },
      { label: 'Cocina', value: 'Cocina' },
      { label: 'Climatización', value: 'Climatización' },
    ];
  }

  getFamiliasDisponibles(sede?: string): { label: string; value: string | null }[] {
    const familiasUnicas = this.getFamilias(sede);

    return [
      { label: 'Todas', value: null },
      ...familiasUnicas.map((f) => ({ label: f, value: f })),
    ];
  }
  
}

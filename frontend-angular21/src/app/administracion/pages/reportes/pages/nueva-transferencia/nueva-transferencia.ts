import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SedeService } from '../../../../services/sede.service';
import { Headquarter } from '../../../../interfaces/sedes.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransferStore } from '../../../../services/transfer.store';
import { SedeAlmacenService } from '../../../../services/sede-almacen.service';
import { TransferUserContextService } from '../../../../services/transfer-user-context.service';
import { TransferenciaService } from '../../../../services/transferencia.service';
import { ProductoService } from '../../../../../administracion/services/producto.service';
import { ProductoInterface } from '../../../../../administracion/interfaces/producto.interface';
import {
  RequestTransferAggregatedDto,
  TransferProductStockBase,
  TransferProductStockListItem,
} from '../../../../interfaces/transferencia.interface';

interface TransferProducto {
  id: number;
  nombre: string;
  sku: string;
  categoria: string;
  marca: string;
  stockPorSede: Record<string, number>;
}

interface SelectOption<T = string> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-nueva-transferencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SelectModule,
    InputNumberModule,
    ButtonModule,
    DatePickerModule,
    TextareaModule,
    CardModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    AutoCompleteModule,
  ],
  templateUrl: './nueva-transferencia.html',
  styleUrl: './nueva-transferencia.css',
  providers: [MessageService, ConfirmationService],
})
export class NuevaTransferencia implements OnInit {
  private static readonly MAX_PRODUCT_FETCH_SIZE = 1000;
  private static readonly AUTOCOMPLETE_LIMIT = 20;

  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly transferenciaService = inject(TransferenciaService);
  private readonly sedeService = inject(SedeService);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private readonly transferStore = inject(TransferStore);
  private readonly transferUserContext = inject(TransferUserContextService);

  // private readonly almacenOrigenId = signal<number | null>(null);
  private readonly productoService = inject(ProductoService);
  private readonly idSedeSig = signal(1);
  private readonly productosAutocompleteSig = signal<TransferProducto[]>([]);
  private readonly activeStepSig = signal(0);
  private readonly sedesSig = signal<SelectOption<string>[]>([]);
  private readonly sedesRawSig = signal<Headquarter[]>([]);
  private readonly almacenesOrigenSig = signal<SelectOption<number>[]>([]);
  private readonly almacenesDestinoSig = signal<SelectOption<number>[]>([]);
  private readonly loadingAlmacenesOrigenSig = signal(false);
  private readonly loadingAlmacenesDestinoSig = signal(false);
  private readonly productoIdSig = signal<number | null>(null);
  private readonly productoQuerySig = signal<TransferProducto | null>(null);
  private readonly productosSig = signal<TransferProducto[]>([]);
  private readonly sedeOrigenSig = signal<string | null>(null);
  private readonly sedeDestinoSig = signal<string | null>(null);
  private readonly userDestinationHeadquarterIdSig = signal<string | null>(null);
  private readonly destinationSedeLockedSig = signal(false);
  private readonly almacenOrigenIdSig = signal<number | null>(null);
  private readonly almacenDestinoIdSig = signal<number | null>(null);
  private readonly cantidadSig = signal(1);
  private readonly motivoSig = signal<string | null>(null);
  private readonly observacionSig = signal('');
  private readonly fechaEnvioSig = signal<Date | null>(null);
  private readonly fechaLlegadaSig = signal<Date | null>(null);
  private readonly responsableSig = signal<string | null>(null);
  private readonly submittingSig = signal(false);
  private readonly lastErrorShownSig = signal<string | null>(null);
  private readonly warehouseFilterSedeByType: Record<'origen' | 'destino', string> = {
    origen: '',
    destino: '',
  };

  private readonly productoSeleccionadoSig = computed<TransferProducto | null>(() => {
    const id = this.productoIdSig();
    if (!id) return null;
    return this.productosSig().find((producto) => producto.id === id) || null;
  });

  private readonly stockDisponibleSig = computed(() => {
    const producto = this.productoSeleccionadoSig();
    const sede = this.sedeOrigenSig();
    const almacenOrigenId = this.almacenOrigenIdSig();
    if (!producto || !sede || !almacenOrigenId) return 0;
    return producto.stockPorSede[sede] || 0;
  });

  readonly totalQuantitySig = computed(() => this.transferStore.totalQuantity());
  readonly canSubmitSig = computed(() => this.transferStore.canSubmit() && this.validarResumen());

  readonly tituloKicker = 'ADMINISTRACION - REPORTES';
  readonly subtituloKicker = 'NUEVA TRANSFERENCIA';
  readonly iconoCabecera = 'pi pi-sync';
  readonly steps = ['Producto y Sedes', 'Cantidad y Motivo', 'Fechas', 'Confirmacion'];
  readonly motivos = [
    { label: 'Reposicion', value: 'reposicion' },
    { label: 'Ajuste de stock', value: 'ajuste' },
    { label: 'Solicitud interna', value: 'solicitud' },
    { label: 'Transferencia programada', value: 'programada' },
  ];
  readonly responsables = [
    { label: 'Jefatura de almacen', value: 'jefatura' },
    { label: 'Supervisor de sede', value: 'supervisor' },
    { label: 'Encargado de despacho', value: 'despacho' },
  ];
  readonly today = this.getToday();

  constructor() {
    effect(() => {
      const error = this.transferStore.error();
      if (!error || this.lastErrorShownSig() === error) {
        return;
      }

      this.lastErrorShownSig.set(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    });
  }

  get idSede(): number {
    return this.idSedeSig();
  }

  set idSede(value: number) {
    this.idSedeSig.set(value);
  }

  get productosAutocomplete(): TransferProducto[] {
    return this.productosAutocompleteSig();
  }

  set productosAutocomplete(value: TransferProducto[]) {
    this.productosAutocompleteSig.set(value ?? []);
  }

  get activeStep(): number {
    return this.activeStepSig();
  }

  set activeStep(value: number) {
    this.activeStepSig.set(value);
  }

  get sedes(): SelectOption<string>[] {
    return this.sedesSig();
  }

  set sedes(value: SelectOption<string>[]) {
    this.sedesSig.set(value ?? []);
  }

  get sedesRaw(): Headquarter[] {
    return this.sedesRawSig();
  }

  set sedesRaw(value: Headquarter[]) {
    this.sedesRawSig.set(value ?? []);
  }

  get almacenesOrigen(): SelectOption<number>[] {
    return this.almacenesOrigenSig();
  }

  set almacenesOrigen(value: SelectOption<number>[]) {
    this.almacenesOrigenSig.set(value ?? []);
  }

  get almacenesDestino(): SelectOption<number>[] {
    return this.almacenesDestinoSig();
  }

  set almacenesDestino(value: SelectOption<number>[]) {
    this.almacenesDestinoSig.set(value ?? []);
  }

  get loadingAlmacenesOrigen(): boolean {
    return this.loadingAlmacenesOrigenSig();
  }

  set loadingAlmacenesOrigen(value: boolean) {
    this.loadingAlmacenesOrigenSig.set(value);
  }

  get loadingAlmacenesDestino(): boolean {
    return this.loadingAlmacenesDestinoSig();
  }

  set loadingAlmacenesDestino(value: boolean) {
    this.loadingAlmacenesDestinoSig.set(value);
  }

  get productoId(): number | null {
    return this.productoIdSig();
  }

  set productoId(value: number | null) {
    this.productoIdSig.set(value ?? null);
  }

  get productoQuery(): TransferProducto | null {
    return this.productoQuerySig();
  }

  set productoQuery(value: TransferProducto | null) {
    this.productoQuerySig.set(value ?? null);
  }

  get productos(): TransferProducto[] {
    return this.productosSig();
  }

  set productos(value: TransferProducto[]) {
    this.productosSig.set(value ?? []);
  }

  get sedeOrigen(): string | null {
    return this.sedeOrigenSig();
  }

  set sedeOrigen(value: string | null) {
    this.sedeOrigenSig.set(value ?? null);
  }

  get destinationSedeLocked(): boolean {
    return this.destinationSedeLockedSig();
  }

  get sedeDestino(): string | null {
    return this.sedeDestinoSig();
  }

  set sedeDestino(value: string | null) {
    this.sedeDestinoSig.set(value ?? null);
  }

  get almacenOrigenId(): number | null {
    return this.almacenOrigenIdSig();
  }

  set almacenOrigenId(value: number | null) {
    this.almacenOrigenIdSig.set(value ?? null);
  }

  get almacenDestinoId(): number | null {
    return this.almacenDestinoIdSig();
  }

  set almacenDestinoId(value: number | null) {
    this.almacenDestinoIdSig.set(value ?? null);
  }

  get cantidad(): number {
    return this.cantidadSig();
  }

  set cantidad(value: number) {
    this.cantidadSig.set(value);
    const productId = this.productoId;
    if (productId) {
      this.transferStore.setItemQuantity(productId, value);
    }
  }

  get motivo(): string | null {
    return this.motivoSig();
  }

  set motivo(value: string | null) {
    this.motivoSig.set(value ?? null);
  }

  get observacion(): string {
    return this.observacionSig();
  }

  set observacion(value: string) {
    this.observacionSig.set(value ?? '');
    this.transferStore.setDraftObservation(value ?? '');
  }

  get fechaEnvio(): Date | null {
    return this.fechaEnvioSig();
  }

  set fechaEnvio(value: Date | null) {
    this.fechaEnvioSig.set(value ?? null);
  }

  get fechaLlegada(): Date | null {
    return this.fechaLlegadaSig();
  }

  set fechaLlegada(value: Date | null) {
    this.fechaLlegadaSig.set(value ?? null);
  }

  get responsable(): string | null {
    return this.responsableSig();
  }

  set responsable(value: string | null) {
    this.responsableSig.set(value ?? null);
  }

  get submitting(): boolean {
    return this.submittingSig();
  }

  set submitting(value: boolean) {
    this.submittingSig.set(value);
  }

  get productoSeleccionado(): TransferProducto | null {
    return this.productoSeleccionadoSig();
  }

  get stockDisponible(): number {
    return this.stockDisponibleSig();
  }

  get totalQuantity(): number {
    return this.totalQuantitySig();
  }

  get conflictProductId(): number | null {
    return this.transferStore.conflictProductId();
  }

  ngOnInit(): void {
    this.transferStore.setDraftUserId(this.transferUserContext.getCurrentUserId());
    this.userDestinationHeadquarterIdSig.set(this.transferUserContext.getCurrentHeadquarterId());

    this.cargarSedes();
  }

  getSedeLabel(sedeId: string | null): string {
    return this.sedes.find((item) => item.value === sedeId)?.label || '-';
  }

  getMotivoLabel(motivo: string | null): string {
    return this.motivos.find((item) => item.value === motivo)?.label || '-';
  }

  getResponsableLabel(responsable: string | null): string {
    return this.responsables.find((item) => item.value === responsable)?.label || '-';
  }

  getAlmacenLabel(almacenId: number | null): string {
    if (!almacenId) {
      return '-';
    }

    return (
      this.almacenesOrigen.find((item) => item.value === almacenId)?.label ||
      this.almacenesDestino.find((item) => item.value === almacenId)?.label ||
      '-'
    );
  }

  getStockClassForSede(producto: TransferProducto | null, sedeId: string | null): string {
    if (!producto || !sedeId) {
      return '';
    }
    const stock = producto.stockPorSede[sedeId] ?? 0;
    return this.getStockClass(stock);
  }

  getStockForSede(producto: TransferProducto | null, sedeId: string | null): number {
    if (!producto || !sedeId) {
      return 0;
    }
    return producto.stockPorSede[sedeId] ?? 0;
  }

  onSedeOrigenChange(): void {
    this.resetProductoSeleccionado();
    this.productos = [];
    this.productosAutocomplete = [];
    this.almacenOrigenId = null;
    this.almacenesOrigen = [];
    this.transferStore.setDraftOriginWarehouse(0);

    const selectedSede = this.sedeOrigen;
    if (selectedSede) {
      this.idSede = Number(selectedSede);
      this.transferStore.setDraftOrigin(selectedSede);
      this.cargarAlmacenesPorSede(selectedSede, 'origen');
    } else {
      this.idSede = 0;
      this.transferStore.setDraftOrigin('');
    }
  }

  onSedeDestinoChange(): void {
    if (this.destinationSedeLocked) {
      this.sedeDestino = this.userDestinationHeadquarterIdSig();
      if (this.sedeDestino) {
        this.transferStore.setDraftDestination(this.sedeDestino);
        this.cargarAlmacenesPorSede(this.sedeDestino, 'destino');
      }
      return;
    }

    this.almacenDestinoId = null;
    this.almacenesDestino = [];
    this.transferStore.setDraftDestinationWarehouse(0);
    if (this.sedeDestino) {
      this.transferStore.setDraftDestination(this.sedeDestino);
      this.cargarAlmacenesPorSede(this.sedeDestino, 'destino');
    } else {
      this.transferStore.setDraftDestination('');
    }
    this.cargarStockProductoSeleccionadoEnSedes();
  }

  onAlmacenOrigenChange(): void {
    this.transferStore.setDraftOriginWarehouse(this.almacenOrigenId ?? 0);
    this.resetProductoSeleccionado();

    if (this.sedeOrigen && this.almacenOrigenId) {
      this.cargarProductos(this.sedeOrigen);
      return;
    }

    this.productos = [];
    this.productosAutocomplete = [];
  }

  onAlmacenDestinoChange(): void {
    this.transferStore.setDraftDestinationWarehouse(this.almacenDestinoId ?? 0);
  }

  buscarProductos(event: { query?: string }): void {
    const query = (event.query ?? '').trim();
    const sedeOrigen = this.sedeOrigen;
    const almacenOrigenId = this.almacenOrigenId;

    if (!sedeOrigen || !almacenOrigenId) {
      this.productosAutocomplete = [];
      return;
    }

    const localMatches = this.filtrarProductosLocales(query);
    if (query.length < 3 || localMatches.length > 0) {
      this.productosAutocomplete = localMatches.slice(
        0,
        NuevaTransferencia.AUTOCOMPLETE_LIMIT,
      );
      return;
    }

    this.buscarProductosRemotos(query, sedeOrigen, almacenOrigenId);
  }

  private buscarProductosRemotos(
    query: string,
    sedeOrigen: string,
    almacenOrigenId: number,
  ): void {
    this.transferenciaService
      .getProductsStock({
        id_sede: Number(sedeOrigen),
        id_almacen: almacenOrigenId,
        page: 1,
        size: 50,
        nombre: query,
        activo: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stockResponse) => {
          const stockMatches = this.mapProductos(stockResponse.data ?? [], sedeOrigen);
          if (stockMatches.length > 0) {
            this.productosAutocomplete = stockMatches.slice(
              0,
              NuevaTransferencia.AUTOCOMPLETE_LIMIT,
            );
            return;
          }

          this.transferenciaService
            .getProductsAutocomplete({
              search: query,
              id_sede: Number(sedeOrigen),
              id_almacen: almacenOrigenId,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (autocompleteResponse) => {
                this.productosAutocomplete = this.mapAutocompleteProductos(
                  autocompleteResponse.data ?? [],
                  sedeOrigen,
                );
              },
              error: () => {
                this.productosAutocomplete = [];
                this.showError('No se pudo cargar el autocomplete de productos.');
              },
            });
        },
        error: () => {
          this.productosAutocomplete = [];
          this.showError('No se pudo cargar el autocomplete de productos.');
        },
      });
  }

  onSelectProducto(event: { value: TransferProducto }): void {
    const producto = event.value;
    this.productoId = producto.id;
    this.productoQuery = producto;
    this.transferStore.conflictProductId.set(null);

    const normalizedCantidad = this.normalizeCantidad(this.cantidad, this.stockDisponible);
    this.cantidad = normalizedCantidad;
    this.transferStore.setItemQuantity(producto.id, normalizedCantidad);

    this.cargarStockProductoSeleccionadoEnSedes();
  }

  onClearProducto(): void {
    const currentId = this.productoId;
    if (currentId) {
      this.transferStore.removeItem(currentId);
    }

    this.productoId = null;
    this.productoQuery = null;
    this.cantidad = 1;
  }

  ajustarCantidad(delta: number): void {
    const nuevaCantidad = this.cantidad + delta;
    if (nuevaCantidad < 1) {
      return;
    }

    const normalizada = this.normalizeCantidad(nuevaCantidad, this.stockDisponible);
    this.cantidad = normalizada;

    const productId = this.productoId;
    if (productId) {
      this.transferStore.addOrUpdateItem(productId, delta);
      this.transferStore.setItemQuantity(productId, normalizada);
    }
  }

  onCantidadChange(valor: number | null): void {
    if (valor === null) {
      this.cantidad = this.stockDisponible > 0 ? 1 : 0;
      return;
    }

    const normalizado = this.normalizeCantidad(valor, this.stockDisponible);
    this.cantidad = normalizado;

    if (this.productoId) {
      this.transferStore.setItemQuantity(this.productoId, normalizado);
    }
  }

  nextStep(): void {
    if (this.validarStepActual()) {
      this.activeStep++;
    }
  }

  prevStep(): void {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  validarStepActual(): boolean {
    switch (this.activeStep) {
      case 0:
        if (!this.productoId) {
          this.showWarn('Producto requerido', 'Seleccione un producto para transferir');
          return false;
        }

        if (!this.sedeOrigen || !this.sedeDestino) {
          this.showWarn('Sedes requeridas', 'Seleccione sede de origen y destino');
          return false;
        }

        if (!this.almacenOrigenId || !this.almacenDestinoId) {
          this.showWarn('Almacenes requeridos', 'Seleccione almacén de origen y destino');
          return false;
        }

        if (
          this.sedeOrigen === this.sedeDestino &&
          this.almacenOrigenId === this.almacenDestinoId
        ) {
          this.showWarn('Ruta invalida', 'El origen y destino deben ser diferentes');
          return false;
        }

        if (this.stockDisponible <= 0) {
          this.showWarn(
            'Stock insuficiente',
            'El producto seleccionado no tiene stock en el almacén origen.',
          );
          return false;
        }

        return true;
      case 1:
        if (!this.motivo) {
          this.showWarn('Motivo requerido', 'Seleccione un motivo de transferencia');
          return false;
        }

        if (this.cantidad < 1 || this.cantidad > this.stockDisponible) {
          this.showWarn(
            'Cantidad invalida',
            'La cantidad debe ser menor o igual al stock disponible',
          );
          return false;
        }

        return true;
      case 2:
        if (!this.fechaEnvio || !this.fechaLlegada) {
          this.showWarn('Fechas requeridas', 'Ingrese fecha de envio y llegada');
          return false;
        }

        if (this.fechaEnvio < this.today || this.fechaLlegada < this.today) {
          this.showWarn('Fechas invalidas', 'Las fechas no pueden ser menores a hoy');
          return false;
        }

        if (this.fechaEnvio > this.fechaLlegada) {
          this.showWarn('Fechas invalidas', 'La fecha de llegada no puede ser menor a la de envio');
          return false;
        }

        if (!this.responsable) {
          this.showWarn('Responsable requerido', 'Seleccione un responsable');
          return false;
        }

        return true;
      default:
        return true;
    }
  }

  confirmarTransferencia(): void {
    if (!this.canSubmitSig()) {
      this.showWarn('Datos incompletos', 'Completa los datos obligatorios antes de confirmar.');
      return;
    }

    this.confirmationService.confirm({
      message: 'Desea confirmar esta transferencia?',
      header: 'Confirmar Transferencia',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'warning' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.registrarTransferencia(),
    });
  }

  isSelectedProductInConflict(): boolean {
    return (
      !!this.productoId &&
      !!this.conflictProductId &&
      Number(this.productoId) === Number(this.conflictProductId)
    );
  }

  resetForm(): void {
    this.activeStep = 0;
    this.productoId = null;
    this.productoQuery = null;
    this.sedeOrigen = null;
    this.sedeDestino = null;
    this.almacenesOrigen = [];
    this.almacenesDestino = [];
    this.almacenOrigenId = null;
    this.almacenDestinoId = null;
    this.loadingAlmacenesOrigen = false;
    this.loadingAlmacenesDestino = false;
    this.cantidad = 1;
    this.motivo = null;
    this.observacion = '';
    this.fechaEnvio = null;
    this.fechaLlegada = null;
    this.responsable = null;
    this.transferStore.resetDraft();
  }

  private registrarTransferencia(): void {
    if (this.submitting) return;

    const payload = this.buildAggregatedPayload();
    if (!payload) {
      return;
    }

    this.submitting = true;

    this.transferStore
      .createAggregated(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.submitting = false;

        if (!response) {
          return;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'La transferencia fue registrada correctamente',
          life: 3000,
        });

        this.transferStore.loadByHq(response.originHeadquartersId);
        this.router.navigate(['/admin/transferencia']);
        this.resetForm();
      });
  }

  private validarResumen(): boolean {
    return (
      !!this.productoId &&
      this.cantidad >= 1 &&
      this.cantidad <= this.stockDisponible &&
      !!this.motivo
    );
  }

  private buildAggregatedPayload(): RequestTransferAggregatedDto | null {
    if (
      !this.sedeOrigen ||
      !this.sedeDestino ||
      !this.almacenOrigenId ||
      !this.almacenDestinoId ||
      !this.productoId
    ) {
      this.showWarn('Datos incompletos', 'Selecciona origen, destino, almacenes y producto.');
      return null;
    }

    const enforcedDestinationHeadquarterId = this.userDestinationHeadquarterIdSig();
    if (!enforcedDestinationHeadquarterId) {
      this.showWarn('Sede no disponible', 'No se pudo identificar la sede del usuario logeado.');
      return null;
    }

    if (String(this.sedeDestino) !== String(enforcedDestinationHeadquarterId)) {
      this.sedeDestino = enforcedDestinationHeadquarterId;
      this.transferStore.setDraftDestination(enforcedDestinationHeadquarterId);
    }

    const userId = this.transferUserContext.getCurrentUserId();
    const quantity = Math.max(1, Math.floor(this.cantidad));

    if (quantity > this.stockDisponible) {
      this.showWarn('Cantidad inválida', 'La cantidad solicitada supera el stock disponible.');
      return null;
    }

    return {
      originHeadquartersId: this.sedeOrigen,
      originWarehouseId: this.almacenOrigenId,
      destinationHeadquartersId: enforcedDestinationHeadquarterId,
      destinationWarehouseId: this.almacenDestinoId,
      observation: this.observacion?.trim() || this.getMotivoLabel(this.motivo) || null,
      userId,
      items: [
        {
          productId: this.productoId,
          quantity,
        },
      ],
    };
  }

  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getStockClass(stock: number): string {
    if (stock >= 50) return 'stock-badge--high';
    if (stock >= 15) return 'stock-badge--mid';
    return 'stock-badge--low';
  }

  private cargarSedes(): void {
    this.sedeService
      .getSedes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.sedesRaw = response.headquarters ?? [];
          this.sedes = (response.headquarters ?? []).map((sede) => ({
            label: sede.nombre,
            value: String(sede.id_sede),
          }));

          const currentUserSedeId = this.transferUserContext.getCurrentHeadquarterId();
          const currentUserSede = this.sedesRaw.find(
            (sede) => String(sede.id_sede) === String(currentUserSedeId ?? ''),
          );

          if (currentUserSede) {
            const userSedeId = String(currentUserSede.id_sede);
            this.sedeDestino = userSedeId;
            this.userDestinationHeadquarterIdSig.set(userSedeId);
            this.destinationSedeLockedSig.set(true);
            this.transferStore.setDraftDestination(userSedeId);
            this.cargarAlmacenesPorSede(userSedeId, 'destino');
            this.sedeOrigen = null;
            this.idSede = 0;
            this.transferStore.setDraftOrigin('');
          } else {
            this.sedeDestino = null;
            this.userDestinationHeadquarterIdSig.set(null);
            this.destinationSedeLockedSig.set(true);
            this.transferStore.setDraftDestination('');
            this.almacenesDestino = [];
            this.transferStore.setDraftDestinationWarehouse(0);
            this.showWarn(
              'Sede de usuario no detectada',
              'No se pudo fijar la sede destino según el usuario logeado.',
            );
          }

          this.cargarProductos(this.sedeOrigen);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las sedes',
          });
          this.cargarProductos();
          this.sedes = [];
          this.almacenesOrigen = [];
          this.almacenesDestino = [];
        },
      });
  }

  private cargarAlmacenesPorSede(sedeId: string, tipo: 'origen' | 'destino'): void {
    const normalizedSedeId = String(sedeId ?? '').trim();
    this.warehouseFilterSedeByType[tipo] = normalizedSedeId;

    if (!normalizedSedeId) {
      this.applyWarehouseOptions(tipo, []);
      this.resetSelectedWarehouse(tipo);
      this.setWarehouseLoading(tipo, false);
      return;
    }

    const cachedOptions = this.sedeAlmacenService.getWarehouseOptionsBySede(normalizedSedeId);
    if (cachedOptions.length > 0) {
      this.applyWarehouseOptions(tipo, cachedOptions);
    }

    this.setWarehouseLoading(tipo, true);
    this.sedeAlmacenService
      .loadWarehouseOptionsBySede(normalizedSedeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          if (this.warehouseFilterSedeByType[tipo] !== normalizedSedeId) {
            return;
          }

          this.applyWarehouseOptions(tipo, options);
          this.resetSelectedWarehouse(tipo);
          this.setWarehouseLoading(tipo, false);
        },
        error: () => {
          if (this.warehouseFilterSedeByType[tipo] !== normalizedSedeId) {
            return;
          }

          this.applyWarehouseOptions(tipo, []);
          this.resetSelectedWarehouse(tipo);
          this.setWarehouseLoading(tipo, false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los almacenes de la sede seleccionada.',
          });
        },
      });
  }

  private applyWarehouseOptions(tipo: 'origen' | 'destino', options: SelectOption<number>[]): void {
    if (tipo === 'origen') {
      this.almacenesOrigen = options;
      return;
    }

    this.almacenesDestino = options;
  }

  private setWarehouseLoading(tipo: 'origen' | 'destino', loading: boolean): void {
    if (tipo === 'origen') {
      this.loadingAlmacenesOrigen = loading;
      return;
    }

    this.loadingAlmacenesDestino = loading;
  }

  private resetSelectedWarehouse(tipo: 'origen' | 'destino'): void {
    if (tipo === 'origen') {
      this.almacenOrigenId = null;
      this.transferStore.setDraftOriginWarehouse(0);
      return;
    }

    this.almacenDestinoId = null;
    this.transferStore.setDraftDestinationWarehouse(0);
  }

  private cargarProductos(sedeId?: string | null): void {
    const normalizedSedeId = String(sedeId ?? '').trim();
    const sedeNumber = Number(normalizedSedeId);
    const originWarehouseId = this.almacenOrigenId;

    if (sedeNumber > 0 && originWarehouseId) {
      this.transferenciaService
        .getProductsStock({
          id_sede: sedeNumber,
          id_almacen: originWarehouseId,
          page: 1,
          size: NuevaTransferencia.MAX_PRODUCT_FETCH_SIZE,
          activo: true,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.productos = this.mapProductos(response.data ?? [], normalizedSedeId);
            this.productosAutocomplete = this.productos.slice(
              0,
              NuevaTransferencia.AUTOCOMPLETE_LIMIT,
            );
          },
          error: () => {
            this.productos = [];
            this.productosAutocomplete = [];
            this.showError('No se pudo cargar productos por sede y almac?n.');
          },
        });
      return;
    }

    this.productoService
      .getProductos(1, 100, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.productos = this.mapProductos(response.products ?? [], normalizedSedeId);
          this.productosAutocomplete = this.productos.slice(
            0,
            NuevaTransferencia.AUTOCOMPLETE_LIMIT,
          );
        },
        error: () => {
          this.productos = [];
          this.productosAutocomplete = [];
          this.showError('No se pudo cargar productos por sede y almac?n.');
        },
      });
  }

  private mapProductos(
    productosBase: Array<TransferProductStockListItem | ProductoInterface>,
    sedeId?: string | null,
  ): TransferProducto[] {
    const normalizedSedeId = String(sedeId ?? '').trim();

    return productosBase.map((producto) => {
      const productId = Number(producto.id_producto);
      const productCode = String(producto.codigo ?? '').trim();
      const productName = this.getProductoNombre(producto);
      const productCategory = this.getProductoCategoria(producto);
      const stock = this.getProductoStock(producto);

      return {
        id: productId,
        nombre: productName,
        sku: productCode,
        categoria: productCategory,
        marca: 'N/A',
        stockPorSede: normalizedSedeId ? { [normalizedSedeId]: stock } : {},
      };
    });
  }

  private getProductoNombre(
    producto: TransferProductStockListItem | ProductoInterface,
  ): string {
    if ('nombre' in producto && typeof producto.nombre === 'string') {
      const normalized = producto.nombre.trim();
      if (normalized) {
        return normalized;
      }
    }

    const anexo = String((producto as ProductoInterface).anexo ?? '').trim();
    if (anexo) {
      return anexo;
    }

    const descripcion = String((producto as ProductoInterface).descripcion ?? '').trim();
    if (descripcion) {
      return descripcion;
    }

    const codigo = String(producto.codigo ?? '').trim();
    return codigo || `Producto ${String(producto.id_producto ?? '')}`.trim();
  }

  private getProductoCategoria(
    producto: TransferProductStockListItem | ProductoInterface,
  ): string {
    if ('familia' in producto && typeof producto.familia === 'string') {
      return producto.familia.trim();
    }

    return String((producto as ProductoInterface).categoriaNombre ?? '').trim();
  }

  private getProductoStock(
    producto: TransferProductStockListItem | ProductoInterface,
  ): number {
    if ('stock' in producto) {
      return Number((producto as TransferProductStockListItem).stock ?? 0);
    }

    return 0;
  }

  private mapAutocompleteProductos(
    productos: TransferProductStockBase[],
    sedeId: string,
  ): TransferProducto[] {
    return productos.map((producto) => ({
      id: Number(producto.id_producto),
      nombre: producto.nombre,
      sku: producto.codigo,
      categoria: '',
      marca: 'N/A',
      stockPorSede: { [sedeId]: Number(producto.stock ?? 0) },
      }));
  }

  private filtrarProductosLocales(query: string): TransferProducto[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.productos;
    }

    return this.productos.filter((producto) => {
      const productName = producto.nombre.toLowerCase();
      const productSku = producto.sku.toLowerCase();
      const productCategory = producto.categoria.toLowerCase();
      return (
        productName.includes(normalizedQuery) ||
        productSku.includes(normalizedQuery) ||
        productCategory.includes(normalizedQuery)
      );
    });
  }

  private cargarStockProductoSeleccionadoEnSedes(): void {
    if (!this.productoId) return;

    this.cargarStockProductoEnSede(this.productoId, this.sedeOrigen, this.almacenOrigenId);
    this.cargarStockProductoEnSede(this.productoId, this.sedeDestino, this.almacenDestinoId);
  }

  private cargarStockProductoEnSede(
    productoId: number,
    sedeId: string | null,
    almacenId?: number | null,
  ): void {
    if (!sedeId || !almacenId) return;

    const sedeNumberId = Number(sedeId);
    if (!sedeNumberId) return;

    this.transferenciaService
      .getProductStockById(productoId, {
        id_sede: sedeNumberId,
        id_almacen: almacenId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const stock = resp?.stock?.cantidad ?? 0;
          this.actualizarStockProductoEnMemoria(productoId, sedeId, stock);
        },
        error: () => {
          this.actualizarStockProductoEnMemoria(productoId, sedeId, 0);
        },
      });
  }

  private resetProductoSeleccionado(): void {
    const currentId = this.productoId;
    if (currentId) {
      this.transferStore.removeItem(currentId);
    }

    this.productoId = null;
    this.productoQuery = null;
    this.cantidad = 1;
    this.transferStore.conflictProductId.set(null);
  }

  private normalizeCantidad(value: number, stockDisponible: number): number {
    const stockMax = Math.max(0, Math.floor(stockDisponible));
    const normalizedValue = Math.max(0, Math.floor(value));
    if (stockMax === 0) {
      return 0;
    }
    return Math.max(1, Math.min(normalizedValue, stockMax));
  }

  private showError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }

  private actualizarStockProductoEnMemoria(
    productoId: number,
    sedeId: string,
    stock: number,
  ): void {
    this.productos = this.productos.map((producto) => {
      if (producto.id !== productoId) return producto;
      return {
        ...producto,
        stockPorSede: {
          ...producto.stockPorSede,
          [sedeId]: stock,
        },
      };
    });

    this.productosAutocomplete = this.productosAutocomplete.map((producto) => {
      if (producto.id !== productoId) return producto;
      return {
        ...producto,
        stockPorSede: {
          ...producto.stockPorSede,
          [sedeId]: stock,
        },
      };
    });
  }

  private showWarn(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
    });
  }
}

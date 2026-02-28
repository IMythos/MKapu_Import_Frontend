import { Injectable } from '@angular/core';

export type MedioPagoCode =
  | 'EFECTIVO'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'TRANSFERENCIA_FONDOS'
  | 'DEPOSITO_CUENTA';

export interface TipoPagoOption {
  label:  string;
  value:  string | null;
  icon?:  string;
}

export interface Pago {
  id_pago:        number;
  id_comprobante: string;
  fec_pago:       Date;
  med_pago:       MedioPagoCode | string;
  monto:          number;
  banco?:         string;
  num_operacion?: string;
  voucher?:       string;
}

@Injectable({ providedIn: 'root' })
export class PosService {

  private readonly MEDIOS: Record<string, {
    label:    string;
    icon:     string;
    severity: 'success' | 'info' | 'warn' | 'secondary';
  }> = {
    EFECTIVO:             { label: 'Efectivo',                      icon: 'pi pi-money-bill',             severity: 'success'   },
    TARJETA_DEBITO:       { label: 'Tarjeta de Débito',             icon: 'pi pi-credit-card',            severity: 'info'      },
    TARJETA_CREDITO:      { label: 'Tarjeta de Crédito',            icon: 'pi pi-credit-card',            severity: 'warn'      },
    TRANSFERENCIA_FONDOS: { label: 'Transferencia de Fondos',       icon: 'pi pi-arrow-right-arrow-left', severity: 'info'      },
    DEPOSITO_CUENTA:      { label: 'Depósito en Cuenta',            icon: 'pi pi-building',               severity: 'secondary' },
    // Aliases legacy
    TARJETA:              { label: 'Tarjeta de Débito',             icon: 'pi pi-credit-card',            severity: 'info'      },
    YAPE:                 { label: 'Transferencia de Fondos',       icon: 'pi pi-arrow-right-arrow-left', severity: 'info'      },
    PLIN:                 { label: 'Transferencia de Fondos',       icon: 'pi pi-arrow-right-arrow-left', severity: 'info'      },
    TRANSFERENCIA:        { label: 'Transferencia de Fondos',       icon: 'pi pi-arrow-right-arrow-left', severity: 'info'      },
    DEPOSITO:             { label: 'Depósito en Cuenta',            icon: 'pi pi-building',               severity: 'secondary' },
  };

  private pagos: Pago[] = [];

  private normalizar(medio: string): string {
    return medio?.toUpperCase().trim() ?? '';
  }

  // ─── Labels / Icons / Severity ───────────────────────────────────
  getTipoPagoLabel(medio: string): string {
    return this.MEDIOS[this.normalizar(medio)]?.label ?? medio;
  }

  getIconoMedioPago(medio: string): string {
    return this.MEDIOS[this.normalizar(medio)]?.icon ?? 'pi pi-wallet';
  }

  getSeverityTipoPago(medio: string): 'success' | 'info' | 'warn' | 'secondary' {
    return this.MEDIOS[this.normalizar(medio)]?.severity ?? 'secondary';
  }

  // ─── Options para selects ────────────────────────────────────────
  getTiposPagoOptions(): TipoPagoOption[] {
    return [
      { label: 'Todos',                   value: null                   },
      { label: 'Efectivo',                value: 'EFECTIVO'             },
      { label: 'Tarjeta de Débito',       value: 'TARJETA_DEBITO'       },
      { label: 'Tarjeta de Crédito',      value: 'TARJETA_CREDITO'      },
      { label: 'Transferencia de Fondos', value: 'TRANSFERENCIA_FONDOS' },
      { label: 'Depósito en Cuenta',      value: 'DEPOSITO_CUENTA'      },
    ];
  }

  getTiposPagoOptionsConIconos(): TipoPagoOption[] {
    return this.getTiposPagoOptions()
      .filter(o => o.value !== null)
      .map(o => ({ ...o, icon: this.getIconoMedioPago(o.value!) }));
  }

  // ─── Validaciones ────────────────────────────────────────────────
  requiereBanco(medio: string): boolean {
    return ['TARJETA_DEBITO', 'TARJETA_CREDITO', 'DEPOSITO_CUENTA', 'TARJETA']
      .includes(this.normalizar(medio));
  }

  requiereNumeroOperacion(medio: string): boolean {
    return this.normalizar(medio) !== 'EFECTIVO';
  }

  calcularVuelto(montoRecibido: number, total: number): number {
    const v = montoRecibido - total;
    return v > 0 ? Number(v.toFixed(2)) : 0;
  }

  validarMontoSuficiente(montoRecibido: number, total: number): boolean {
    return montoRecibido >= total;
  }

  validarMonto(monto: number): boolean {
    return monto > 0 && isFinite(monto);
  }

  validarNumeroOperacion(numero: string): boolean {
    const n = numero.trim();
    return n.length >= 6 && n.length <= 20;
  }

  validarPago(pago: Partial<Pago>): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    if (!pago.med_pago)                                           errores.push('Debe seleccionar un medio de pago');
    if (!pago.monto || !this.validarMonto(pago.monto))           errores.push('Monto inválido');
    if (this.requiereBanco(pago.med_pago!) && !pago.banco)        errores.push('Debe seleccionar un banco');
    if (this.requiereNumeroOperacion(pago.med_pago!) && !pago.num_operacion)
                                                                  errores.push('Debe ingresar número de operación');
    return { valido: errores.length === 0, errores };
  }

  // ─── Utilidades ──────────────────────────────────────────────────
  getBancosDisponibles(): string[] {
    return [
      'BCP', 'BBVA', 'Interbank', 'Scotiabank',
      'Banco de la Nación', 'Banco Pichincha',
      'BANBIF', 'Falabella', 'Ripley',
    ];
  }

  calcularDesgloseBilletes(monto: number): Record<string, number> {
    const denominaciones = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];
    const desglose: Record<string, number> = {};
    let restante = monto;
    for (const denom of denominaciones) {
      const cantidad = Math.floor(restante / denom);
      if (cantidad > 0) {
        desglose[`S/. ${denom}`] = cantidad;
        restante = Number((restante - cantidad * denom).toFixed(2));
      }
    }
    return desglose;
  }

  formatearMonto(monto: number): string {
    return `S/. ${monto.toFixed(2)}`;
  }

  // ─── Stubs de pagos (sin backend — compatibilidad con administración) ──
  getPagos(): Pago[] {
    return this.pagos;
  }

  getPagosPorComprobante(idComprobante: string): Pago[] {
    return this.pagos.filter(p => p.id_comprobante === idComprobante);
  }

  registrarPago(pago: Omit<Pago, 'id_pago'>): Pago {
    const nuevo: Pago = {
      ...pago,
      id_pago:  this.pagos.length > 0
                  ? Math.max(...this.pagos.map(p => p.id_pago)) + 1
                  : 1,
      fec_pago: new Date(),
    };
    this.pagos = [...this.pagos, nuevo];
    return nuevo;
  }
}

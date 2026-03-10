/**
 * Utilidades de fecha para zona horaria de Perú (UTC-5).
 * Perú no usa horario de verano, siempre UTC-5.
 *
 * Uso:
 *   import { getHoyPeru, ahoraEnPeru, formatFechaPeru } from '@shared/utils/date-peru.utils';
 */

const OFFSET_PERU_MINUTOS = -5 * 60; // UTC-5, sin horario de verano

/**
 * Retorna un objeto Date representando el inicio del día actual en Perú (00:00:00.000).
 * Útil para inicializar filtros de fecha.
 */
export function getHoyPeru(): Date {
  const ahora = new Date();
  const offsetLocal = ahora.getTimezoneOffset(); // en minutos
  const diferencia  = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
  const horaPeruana = new Date(ahora.getTime() + diferencia);
  horaPeruana.setHours(0, 0, 0, 0);
  return horaPeruana;
}

/**
 * Retorna un objeto Date con la fecha y hora actuales en Perú.
 */
export function ahoraEnPeru(): Date {
  const ahora = new Date();
  const offsetLocal = ahora.getTimezoneOffset();
  const diferencia  = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
  return new Date(ahora.getTime() + diferencia);
}

/**
 * Retorna el fin del día actual en Perú (23:59:59.999).
 * Útil para rangos de fecha "hasta hoy".
 */
export function getFinDiaHoyPeru(): Date {
  const hoy = getHoyPeru();
  hoy.setHours(23, 59, 59, 999);
  return hoy;
}

/**
 * Dado un Date, retorna un string en formato dd/MM/yyyy usando hora peruana.
 */
export function formatFechaPeru(fecha: Date | string | null): string {
  if (!fecha) return '';
  const ahora = new Date();
  const offsetLocal = ahora.getTimezoneOffset();
  const diferencia  = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
  const d = new Date(new Date(fecha).getTime() + diferencia);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Retorna true si la fecha dada (en hora peruana) es hoy.
 */
export function esHoyEnPeru(fecha: Date | string | null): boolean {
  if (!fecha) return false;
  const hoy = getHoyPeru();
  const d   = new Date(fecha);
  return (
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth()    === hoy.getMonth()    &&
    d.getDate()     === hoy.getDate()
  );
}


/**
 * Retorna el lunes de la semana actual a las 00:00:00 hora peruana.
 * Cada lunes a las 00:00 se reinicia el rango semanal.
 */
export function getLunesSemanaActualPeru(): Date {
  const ahora       = new Date();
  const offsetLocal = ahora.getTimezoneOffset();
  const diferencia  = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;

  const ahoraPerú   = new Date(ahora.getTime() + diferencia);
  const diaSemana   = ahoraPerú.getDay();                     // 0=Dom, 1=Lun ... 6=Sáb
  const diffLunes   = diaSemana === 0 ? 6 : diaSemana - 1;   // días a retroceder al lunes

  const lunes = new Date(ahoraPerú);
  lunes.setDate(ahoraPerú.getDate() - diffLunes);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

/**
 * Retorna el domingo de la semana actual a las 23:59:59.999 hora peruana.
 */
export function getDomingoSemanaActualPeru(): Date {
  const lunes   = getLunesSemanaActualPeru();
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return domingo;
}

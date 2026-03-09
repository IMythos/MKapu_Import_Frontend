"use strict";
/**
 * Utilidades de fecha para zona horaria de Perú (UTC-5).
 * Perú no usa horario de verano, siempre UTC-5.
 *
 * Uso:
 *   import { getHoyPeru, ahoraEnPeru, formatFechaPeru } from '@shared/utils/date-peru.utils';
 */
exports.__esModule = true;
exports.getDomingoSemanaActualPeru = exports.getLunesSemanaActualPeru = exports.esHoyEnPeru = exports.formatFechaPeru = exports.getFinDiaHoyPeru = exports.ahoraEnPeru = exports.getHoyPeru = void 0;
var OFFSET_PERU_MINUTOS = -5 * 60; // UTC-5, sin horario de verano
/**
 * Retorna un objeto Date representando el inicio del día actual en Perú (00:00:00.000).
 * Útil para inicializar filtros de fecha.
 */
function getHoyPeru() {
    var ahora = new Date();
    var offsetLocal = ahora.getTimezoneOffset(); // en minutos
    var diferencia = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
    var horaPeruana = new Date(ahora.getTime() + diferencia);
    horaPeruana.setHours(0, 0, 0, 0);
    return horaPeruana;
}
exports.getHoyPeru = getHoyPeru;
/**
 * Retorna un objeto Date con la fecha y hora actuales en Perú.
 */
function ahoraEnPeru() {
    var ahora = new Date();
    var offsetLocal = ahora.getTimezoneOffset();
    var diferencia = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
    return new Date(ahora.getTime() + diferencia);
}
exports.ahoraEnPeru = ahoraEnPeru;
/**
 * Retorna el fin del día actual en Perú (23:59:59.999).
 * Útil para rangos de fecha "hasta hoy".
 */
function getFinDiaHoyPeru() {
    var hoy = getHoyPeru();
    hoy.setHours(23, 59, 59, 999);
    return hoy;
}
exports.getFinDiaHoyPeru = getFinDiaHoyPeru;
/**
 * Dado un Date, retorna un string en formato dd/MM/yyyy usando hora peruana.
 */
function formatFechaPeru(fecha) {
    if (!fecha)
        return '';
    var ahora = new Date();
    var offsetLocal = ahora.getTimezoneOffset();
    var diferencia = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
    var d = new Date(new Date(fecha).getTime() + diferencia);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
}
exports.formatFechaPeru = formatFechaPeru;
/**
 * Retorna true si la fecha dada (en hora peruana) es hoy.
 */
function esHoyEnPeru(fecha) {
    if (!fecha)
        return false;
    var hoy = getHoyPeru();
    var d = new Date(fecha);
    return (d.getFullYear() === hoy.getFullYear() &&
        d.getMonth() === hoy.getMonth() &&
        d.getDate() === hoy.getDate());
}
exports.esHoyEnPeru = esHoyEnPeru;
/**
 * Retorna el lunes de la semana actual a las 00:00:00 hora peruana.
 * Cada lunes a las 00:00 se reinicia el rango semanal.
 */
function getLunesSemanaActualPeru() {
    var ahora = new Date();
    var offsetLocal = ahora.getTimezoneOffset();
    var diferencia = (offsetLocal - OFFSET_PERU_MINUTOS) * 60 * 1000;
    var ahoraPerú = new Date(ahora.getTime() + diferencia);
    var diaSemana = ahoraPerú.getDay(); // 0=Dom, 1=Lun ... 6=Sáb
    var diffLunes = diaSemana === 0 ? 6 : diaSemana - 1; // días a retroceder al lunes
    var lunes = new Date(ahoraPerú);
    lunes.setDate(ahoraPerú.getDate() - diffLunes);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
}
exports.getLunesSemanaActualPeru = getLunesSemanaActualPeru;
/**
 * Retorna el domingo de la semana actual a las 23:59:59.999 hora peruana.
 */
function getDomingoSemanaActualPeru() {
    var lunes = getLunesSemanaActualPeru();
    var domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);
    return domingo;
}
exports.getDomingoSemanaActualPeru = getDomingoSemanaActualPeru;

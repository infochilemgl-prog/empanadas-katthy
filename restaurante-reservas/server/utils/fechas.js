'use strict';

/**
 * Utilidades de fechas en español rioplatense + generación de horarios (slots)
 * para el sistema de reservas del restaurante.
 */

const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const TZ_DEFAULT = process.env.TZ_RESTAURANTE || 'America/Montevideo';

/**
 * Devuelve la fecha/hora actual en la zona horaria del restaurante como objeto
 * con los componentes ya separados (evita líos de UTC vs local).
 */
function obtenerAhoraEnZona(timeZone = TZ_DEFAULT) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const partes = formatter.formatToParts(new Date());
  const obj = {};
  for (const p of partes) {
    if (p.type !== 'literal') obj[p.type] = p.value;
  }
  // hour puede venir como "24" en algunos runtimes -> normalizar a 0
  let hora = parseInt(obj.hour, 10);
  if (hora === 24) hora = 0;
  return {
    anio: parseInt(obj.year, 10),
    mes: parseInt(obj.month, 10),
    dia: parseInt(obj.day, 10),
    hora,
    minuto: parseInt(obj.minute, 10),
    segundo: parseInt(obj.second, 10),
  };
}

/** Fecha/hora actual como Date de JS (para comparaciones), tomando la zona del restaurante. */
function ahoraComoDate(timeZone = TZ_DEFAULT) {
  const a = obtenerAhoraEnZona(timeZone);
  return new Date(a.anio, a.mes - 1, a.dia, a.hora, a.minuto, a.segundo);
}

/** Formatea la fecha de hoy en español, ej: "sábado 19 de julio de 2026". */
function formatearHoyEnEspanol(timeZone = TZ_DEFAULT) {
  const a = obtenerAhoraEnZona(timeZone);
  const fecha = new Date(a.anio, a.mes - 1, a.dia);
  const diaSemana = DIAS_SEMANA[fecha.getDay()];
  const mes = MESES[a.mes - 1];
  return `${diaSemana} ${a.dia} de ${mes} de ${a.anio}`;
}

/** Devuelve el día de la semana (0=domingo..6=sábado) de un ISO "YYYY-MM-DDTHH:MM:SS". */
function diaSemanaDeISO(fechaISO) {
  const [fechaParte] = fechaISO.split('T');
  const [anio, mes, dia] = fechaParte.split('-').map(Number);
  return new Date(anio, mes - 1, dia).getDay();
}

/** Formatea un ISO "YYYY-MM-DDTHH:MM:SS" en español, ej: "viernes 8 de agosto a las 21:00". */
function formatearISOEnEspanol(fechaISO) {
  const [fechaParte, horaParte] = fechaISO.split('T');
  const [anio, mes, dia] = fechaParte.split('-').map(Number);
  const [hh, mm] = (horaParte || '00:00').split(':');
  const fecha = new Date(anio, mes - 1, dia);
  const diaSemana = DIAS_SEMANA[fecha.getDay()];
  const nombreMes = MESES[mes - 1];
  return `${diaSemana} ${dia} de ${nombreMes} a las ${hh}:${mm}`;
}

/** Suma minutos a un ISO "YYYY-MM-DDTHH:MM:SS" y devuelve otro ISO en el mismo formato. */
function sumarMinutosISO(fechaISO, minutos) {
  const [fechaParte, horaParte] = fechaISO.split('T');
  const [anio, mes, dia] = fechaParte.split('-').map(Number);
  const [hh, mm, ss] = (horaParte || '00:00:00').split(':').map(Number);
  const fecha = new Date(anio, mes - 1, dia, hh, mm || 0, ss || 0);
  fecha.setMinutes(fecha.getMinutes() + minutos);
  return dateAISOLocal(fecha);
}

/** Convierte un Date de JS (en horario local del proceso) a "YYYY-MM-DDTHH:MM:SS". */
function dateAISOLocal(fecha) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(
    fecha.getHours()
  )}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

/** Compone un ISO "YYYY-MM-DDTHH:MM:SS" a partir de fecha "YYYY-MM-DD" y hora "HH:MM". */
function combinarFechaHora(fechaYMD, horaHM) {
  return `${fechaYMD}T${horaHM}:00`;
}

/**
 * Genera los horarios (slots) posibles entre horaInicio y horaFin (formato "HH:MM"),
 * separados por intervaloMin minutos, de forma que el slot + duracionMin no pase horaFin.
 * Devuelve un array de strings "HH:MM".
 */
function generarSlots(horaInicio, horaFin, intervaloMin, duracionMin) {
  const slots = [];
  const [hIni, mIni] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  let minutosActual = hIni * 60 + mIni;
  const minutosFin = hFin * 60 + mFin;
  while (minutosActual + duracionMin <= minutosFin) {
    const h = Math.floor(minutosActual / 60);
    const m = minutosActual % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    minutosActual += intervaloMin;
  }
  return slots;
}

/**
 * Determina si dos intervalos [inicioA, finA) y [inicioB, finB) (ISO strings) se superponen.
 */
function seSuperponen(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

/** Valida rápidamente el formato "YYYY-MM-DDTHH:MM:SS" (o con minutos:segundos opcionales). */
function esISOValido(fechaISO) {
  if (typeof fechaISO !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(fechaISO);
}

module.exports = {
  TZ_DEFAULT,
  DIAS_SEMANA,
  MESES,
  obtenerAhoraEnZona,
  ahoraComoDate,
  formatearHoyEnEspanol,
  diaSemanaDeISO,
  formatearISOEnEspanol,
  sumarMinutosISO,
  dateAISOLocal,
  combinarFechaHora,
  generarSlots,
  seSuperponen,
  esISOValido,
};

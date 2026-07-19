'use strict';

const { google } = require('googleapis');
const db = require('../db');
const { sumarMinutosISO, TZ_DEFAULT } = require('../utils/fechas');

/**
 * Construye un cliente OAuth2 autenticado a partir de la fila guardada en
 * `google_oauth`. Si no hay ninguna fila (no conectado), devuelve null:
 * las funciones que llaman a esto deben tolerar ese caso sin explotar,
 * porque las reservas tienen que poder guardarse igual sin Google Calendar.
 */
function getAuthClient() {
  const fila = db.prepare('SELECT * FROM google_oauth ORDER BY id DESC LIMIT 1').get();
  if (!fila || !fila.refresh_token) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: fila.access_token,
    refresh_token: fila.refresh_token,
    expiry_date: fila.expiry_date,
    scope: fila.scope,
  });

  // Cuando la librería refresca el access_token automáticamente, lo persistimos.
  oauth2Client.on('tokens', (tokens) => {
    try {
      const actual = db.prepare('SELECT * FROM google_oauth ORDER BY id DESC LIMIT 1').get();
      if (!actual) return;
      db.prepare(
        `UPDATE google_oauth SET
           access_token = COALESCE(?, access_token),
           refresh_token = COALESCE(?, refresh_token),
           expiry_date = COALESCE(?, expiry_date)
         WHERE id = ?`
      ).run(tokens.access_token || null, tokens.refresh_token || null, tokens.expiry_date || null, actual.id);
      console.log('[googleCalendar] Tokens de Google refrescados y persistidos.');
    } catch (err) {
      console.warn('[googleCalendar] No se pudo persistir el refresh de tokens:', err.message);
    }
  });

  return oauth2Client;
}

function getCalendarId() {
  const fila = db.prepare('SELECT calendar_id FROM google_oauth ORDER BY id DESC LIMIT 1').get();
  return (fila && fila.calendar_id) || 'primary';
}

function construirEvento(reserva, configRestaurante) {
  const inicio = reserva.fecha_reserva;
  const fin = sumarMinutosISO(reserva.fecha_reserva, configRestaurante.duracion_reserva_min || 120);
  const especificaciones = reserva.especificaciones ? `\nEspecificaciones: ${reserva.especificaciones}` : '';

  return {
    summary: `Reserva: ${reserva.nombre_cliente} (${reserva.cantidad_personas} pers)`,
    description: `Teléfono: ${reserva.numero_telefono}${especificaciones}\nID de reserva: ${reserva.id || ''}`,
    location: configRestaurante ? configRestaurante.direccion : undefined,
    start: { dateTime: inicio, timeZone: process.env.TZ_RESTAURANTE || TZ_DEFAULT },
    end: { dateTime: fin, timeZone: process.env.TZ_RESTAURANTE || TZ_DEFAULT },
  };
}

/** Crea un evento en Google Calendar para una reserva. Lanza si no hay cuenta conectada. */
async function crearEvento(reserva, configRestaurante) {
  const auth = getAuthClient();
  if (!auth) {
    throw new Error('Google Calendar no está conectado (no hay tokens guardados).');
  }
  const calendar = google.calendar({ version: 'v3', auth });
  const evento = construirEvento(reserva, configRestaurante);
  const respuesta = await calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: evento,
  });
  return respuesta.data.id;
}

/** Actualiza un evento existente. Lanza si no hay cuenta conectada. */
async function actualizarEvento(googleEventId, reserva, configRestaurante) {
  const auth = getAuthClient();
  if (!auth) {
    throw new Error('Google Calendar no está conectado (no hay tokens guardados).');
  }
  const calendar = google.calendar({ version: 'v3', auth });
  const evento = construirEvento(reserva, configRestaurante);
  await calendar.events.update({
    calendarId: getCalendarId(),
    eventId: googleEventId,
    requestBody: evento,
  });
}

/** Borra un evento. Tolera 404/410 (evento ya no existe) sin lanzar. */
async function borrarEvento(googleEventId) {
  const auth = getAuthClient();
  if (!auth) {
    console.warn('[googleCalendar] Se pidió borrar un evento pero Google no está conectado.');
    return;
  }
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({ calendarId: getCalendarId(), eventId: googleEventId });
  } catch (err) {
    const status = err && err.code ? err.code : err && err.response && err.response.status;
    if (status === 404 || status === 410) {
      console.warn(`[googleCalendar] Evento ${googleEventId} ya no existía en Calendar (status ${status}).`);
      return;
    }
    throw err;
  }
}

module.exports = {
  getAuthClient,
  getCalendarId,
  crearEvento,
  actualizarEvento,
  borrarEvento,
};

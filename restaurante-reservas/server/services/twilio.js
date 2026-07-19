'use strict';

const { MessagingResponse } = require('twilio').twiml;

/** Escapa caracteres especiales de XML para no romper el TwiML. */
function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Construye el TwiML de respuesta con un único mensaje de texto. */
function construirRespuestaTwiML(mensaje) {
  const twiml = new MessagingResponse();
  twiml.message(escaparXml(mensaje));
  return twiml.toString();
}

/** TwiML vacío (sin mensaje de respuesta), para cuando no corresponde contestar nada. */
function respuestaVaciaTwiML() {
  const twiml = new MessagingResponse();
  return twiml.toString();
}

/** Quita el prefijo "whatsapp:" que agrega Twilio al número de teléfono. */
function limpiarNumeroTelefono(numero) {
  if (!numero) return numero;
  return numero.replace(/^whatsapp:/i, '').trim();
}

module.exports = {
  construirRespuestaTwiML,
  respuestaVaciaTwiML,
  limpiarNumeroTelefono,
};

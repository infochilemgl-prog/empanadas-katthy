'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { generarRespuestaValentina } = require('../services/openai');
const { construirRespuestaTwiML, respuestaVaciaTwiML, limpiarNumeroTelefono } = require('../services/twilio');

const router = express.Router();

const MAX_CARACTERES_ENTRADA = 1500;
const MENSAJES_DE_HISTORIAL = 10;

// 30 mensajes por minuto por número de teléfono ("From").
const limitadorPorNumero = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.body && req.body.From) || req.ip,
  handler: (req, res) => {
    res.set('Content-Type', 'text/xml');
    res.status(200).send(respuestaVaciaTwiML());
  },
});

router.post('/whatsapp', express.urlencoded({ extended: false }), limitadorPorNumero, async (req, res) => {
  // TODO: validar X-Twilio-Signature en producción
  try {
    // Nos aseguramos de que la base esté migrada acá adentro (y no en un middleware global) para
    // poder capturar cualquier falla de base de datos con el mismo try/catch que ya devuelve
    // TwiML de fallback: el webhook SIEMPRE tiene que responder 200 y nunca hacer que Twilio
    // reintente el mensaje.
    await db.asegurarMigrado();

    const from = req.body && req.body.From;
    const body = req.body && req.body.Body;

    if (!from || !body) {
      res.set('Content-Type', 'text/xml');
      return res.status(200).send(respuestaVaciaTwiML());
    }

    const numeroTelefono = limpiarNumeroTelefono(from);
    const textoRecibido = String(body).slice(0, MAX_CARACTERES_ENTRADA);

    await db.query(
      `INSERT INTO mensajes_whatsapp (numero_telefono, contenido_mensaje, remitente, tipo_mensaje)
       VALUES ($1, $2, 'usuario', 'texto')`,
      [numeroTelefono, textoRecibido]
    );

    const { rows: filasHistorialDesc } = await db.query(
      `SELECT contenido_mensaje, remitente FROM mensajes_whatsapp
       WHERE numero_telefono = $1
       ORDER BY recibido_en DESC, id DESC
       LIMIT $2`,
      [numeroTelefono, MENSAJES_DE_HISTORIAL]
    );
    const filasHistorial = filasHistorialDesc.slice().reverse();

    const historial = filasHistorial.map((m) => ({
      role: m.remitente === 'agente' ? 'assistant' : 'user',
      content: m.contenido_mensaje,
    }));

    let respuestaTexto;
    try {
      respuestaTexto = await generarRespuestaValentina(numeroTelefono, historial);
    } catch (err) {
      console.error('[webhook] Error llamando a OpenAI:', err.message);
      let telefono = 'el restaurante';
      try {
        const { rows } = await db.query('SELECT telefono FROM configuracion_restaurante ORDER BY id LIMIT 1');
        if (rows[0] && rows[0].telefono) telefono = rows[0].telefono;
      } catch (e) {
        // ignorar, ya estamos en el peor caso
      }
      respuestaTexto = `Disculpá, tuve un problema técnico en este momento. Por favor llamá directamente al ${telefono} para hacer tu reserva. 🙏`;
    }

    await db.query(
      `INSERT INTO mensajes_whatsapp (numero_telefono, contenido_mensaje, remitente, tipo_mensaje, procesado)
       VALUES ($1, $2, 'agente', 'texto', 1)`,
      [numeroTelefono, respuestaTexto]
    );

    await db.query(
      `UPDATE mensajes_whatsapp SET procesado = 1 WHERE numero_telefono = $1 AND remitente = 'usuario' AND procesado = 0`,
      [numeroTelefono]
    );

    res.set('Content-Type', 'text/xml');
    return res.status(200).send(construirRespuestaTwiML(respuestaTexto));
  } catch (err) {
    console.error('[webhook] Error inesperado en el webhook de WhatsApp:', err);
    let telefono = 'el restaurante';
    try {
      const { rows } = await db.query('SELECT telefono FROM configuracion_restaurante ORDER BY id LIMIT 1');
      if (rows[0] && rows[0].telefono) telefono = rows[0].telefono;
    } catch (e) {
      // ignorar, ya estamos en el peor caso
    }
    res.set('Content-Type', 'text/xml');
    return res
      .status(200)
      .send(construirRespuestaTwiML(`Disculpá, tuvimos un problema técnico. Por favor llamá al ${telefono}. 🙏`));
  }
});

module.exports = router;

'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/mensajes — últimas conversaciones agrupadas por número de teléfono. */
router.get('/', (req, res) => {
  try {
    const numeros = db
      .prepare(
        `SELECT numero_telefono, MAX(recibido_en) AS ultimo_mensaje_en, COUNT(*) AS cantidad_mensajes
         FROM mensajes_whatsapp
         GROUP BY numero_telefono
         ORDER BY ultimo_mensaje_en DESC`
      )
      .all();

    const conversaciones = numeros.map((n) => {
      const ultimo = db
        .prepare(
          `SELECT contenido_mensaje, remitente, recibido_en FROM mensajes_whatsapp
           WHERE numero_telefono = ? ORDER BY recibido_en DESC, id DESC LIMIT 1`
        )
        .get(n.numero_telefono);
      return {
        numero_telefono: n.numero_telefono,
        cantidad_mensajes: n.cantidad_mensajes,
        ultimo_mensaje: ultimo ? ultimo.contenido_mensaje : null,
        ultimo_remitente: ultimo ? ultimo.remitente : null,
        ultimo_mensaje_en: n.ultimo_mensaje_en,
      };
    });

    res.json(conversaciones);
  } catch (err) {
    console.error('[mensajes] Error listando conversaciones:', err);
    res.status(500).json({ error: 'No se pudieron obtener los mensajes.' });
  }
});

/** GET /api/mensajes/:numero — historial completo de un número. */
router.get('/:numero', (req, res) => {
  try {
    const mensajes = db
      .prepare(
        `SELECT * FROM mensajes_whatsapp WHERE numero_telefono = ? ORDER BY recibido_en ASC, id ASC`
      )
      .all(req.params.numero);
    res.json(mensajes);
  } catch (err) {
    console.error('[mensajes] Error obteniendo historial:', err);
    res.status(500).json({ error: 'No se pudo obtener el historial de mensajes.' });
  }
});

module.exports = router;

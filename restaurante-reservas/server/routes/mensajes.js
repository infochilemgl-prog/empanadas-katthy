'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/mensajes — últimas conversaciones agrupadas por número de teléfono. */
router.get('/', async (req, res) => {
  try {
    const { rows: numeros } = await db.query(
      `SELECT numero_telefono, MAX(recibido_en) AS ultimo_mensaje_en, COUNT(*) AS cantidad_mensajes
       FROM mensajes_whatsapp
       GROUP BY numero_telefono
       ORDER BY ultimo_mensaje_en DESC`
    );

    const conversaciones = await Promise.all(
      numeros.map(async (n) => {
        const { rows } = await db.query(
          `SELECT contenido_mensaje, remitente, recibido_en FROM mensajes_whatsapp
           WHERE numero_telefono = $1 ORDER BY recibido_en DESC, id DESC LIMIT 1`,
          [n.numero_telefono]
        );
        const ultimo = rows[0];
        return {
          numero_telefono: n.numero_telefono,
          cantidad_mensajes: Number(n.cantidad_mensajes),
          ultimo_mensaje: ultimo ? ultimo.contenido_mensaje : null,
          ultimo_remitente: ultimo ? ultimo.remitente : null,
          ultimo_mensaje_en: n.ultimo_mensaje_en,
        };
      })
    );

    res.json(conversaciones);
  } catch (err) {
    console.error('[mensajes] Error listando conversaciones:', err);
    res.status(500).json({ error: 'No se pudieron obtener los mensajes.' });
  }
});

/** GET /api/mensajes/:numero — historial completo de un número. */
router.get('/:numero', async (req, res) => {
  try {
    const { rows: mensajes } = await db.query(
      `SELECT * FROM mensajes_whatsapp WHERE numero_telefono = $1 ORDER BY recibido_en ASC, id ASC`,
      [req.params.numero]
    );
    res.json(mensajes);
  } catch (err) {
    console.error('[mensajes] Error obteniendo historial:', err);
    res.status(500).json({ error: 'No se pudo obtener el historial de mensajes.' });
  }
});

module.exports = router;

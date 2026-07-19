'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

const CAMPOS_EDITABLES = [
  'nombre_restaurante',
  'direccion',
  'telefono',
  'email',
  'horarios',
  'tipo_cocina',
  'sobre_restaurante',
  'capacidad_total',
  'duracion_reserva_min',
  'hora_apertura_almuerzo',
  'hora_cierre_almuerzo',
  'hora_apertura_cena',
  'hora_cierre_cena',
  'intervalo_slots_min',
  'dias_cerrado',
  'webhook_url',
];

/** GET /api/configuracion */
router.get('/', (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1').get();
    if (!config) return res.status(404).json({ error: 'No hay configuración cargada.' });
    res.json(config);
  } catch (err) {
    console.error('[configuracion] Error obteniendo configuración:', err);
    res.status(500).json({ error: 'No se pudo obtener la configuración.' });
  }
});

/** PUT /api/configuracion */
router.put('/', (req, res) => {
  try {
    const actual = db.prepare('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1').get();
    if (!actual) return res.status(404).json({ error: 'No hay configuración cargada.' });

    const actualizaciones = {};
    for (const campo of CAMPOS_EDITABLES) {
      if (req.body[campo] !== undefined) {
        actualizaciones[campo] =
          campo === 'dias_cerrado' && typeof req.body[campo] !== 'string'
            ? JSON.stringify(req.body[campo])
            : req.body[campo];
      }
    }

    const claves = Object.keys(actualizaciones);
    if (claves.length === 0) return res.status(400).json({ error: 'No se enviaron campos para actualizar.' });

    const set = claves.map((c) => `${c} = ?`).join(', ');
    const valores = claves.map((c) => actualizaciones[c]);
    db.prepare(
      `UPDATE configuracion_restaurante SET ${set}, actualizado_en = datetime('now','localtime') WHERE id = ?`
    ).run(...valores, actual.id);

    const actualizada = db.prepare('SELECT * FROM configuracion_restaurante WHERE id = ?').get(actual.id);
    res.json(actualizada);
  } catch (err) {
    console.error('[configuracion] Error actualizando configuración:', err);
    res.status(500).json({ error: 'No se pudo actualizar la configuración.' });
  }
});

module.exports = router;

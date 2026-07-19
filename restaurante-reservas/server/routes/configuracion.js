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
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1');
    if (!rows[0]) return res.status(404).json({ error: 'No hay configuración cargada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[configuracion] Error obteniendo configuración:', err);
    res.status(500).json({ error: 'No se pudo obtener la configuración.' });
  }
});

/** PUT /api/configuracion */
router.put('/', async (req, res) => {
  try {
    const { rows: filasActuales } = await db.query('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1');
    const actual = filasActuales[0];
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

    const valores = claves.map((c) => actualizaciones[c]);
    const set = claves.map((c, i) => `${c} = $${i + 1}`).join(', ');
    valores.push(actual.id);
    await db.query(
      `UPDATE configuracion_restaurante SET ${set}, actualizado_en = now() WHERE id = $${valores.length}`,
      valores
    );

    const { rows: filasActualizada } = await db.query('SELECT * FROM configuracion_restaurante WHERE id = $1', [actual.id]);
    res.json(filasActualizada[0]);
  } catch (err) {
    console.error('[configuracion] Error actualizando configuración:', err);
    res.status(500).json({ error: 'No se pudo actualizar la configuración.' });
  }
});

module.exports = router;

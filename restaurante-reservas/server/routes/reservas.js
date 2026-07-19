'use strict';

const express = require('express');
const db = require('../db');
const googleCalendar = require('../services/googleCalendar');

const router = express.Router();

/** GET /api/reservas — lista todas las reservas, opcionalmente filtradas por ?estado= y ?desde=&hasta= */
router.get('/', async (req, res) => {
  try {
    const { estado, desde, hasta } = req.query;
    let sql = 'SELECT * FROM reservas WHERE 1=1';
    const params = [];
    if (estado) {
      params.push(estado);
      sql += ` AND estado = $${params.length}`;
    }
    if (desde) {
      params.push(desde);
      sql += ` AND fecha_reserva::date >= $${params.length}::date`;
    }
    if (hasta) {
      params.push(hasta);
      sql += ` AND fecha_reserva::date <= $${params.length}::date`;
    }
    sql += ' ORDER BY fecha_reserva ASC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[reservas] Error listando reservas:', err);
    res.status(500).json({ error: 'No se pudieron obtener las reservas.' });
  }
});

/** GET /api/reservas/:id */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Reserva no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[reservas] Error obteniendo reserva:', err);
    res.status(500).json({ error: 'No se pudo obtener la reserva.' });
  }
});

/** POST /api/reservas — crear reserva manualmente desde el dashboard. */
router.post('/', async (req, res) => {
  try {
    const { numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones, notas } = req.body;
    if (!numero_telefono || !nombre_cliente || !fecha_reserva || !cantidad_personas) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    const { rows } = await db.query(
      `INSERT INTO reservas (numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones, notas, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')
       RETURNING *`,
      [numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones || null, notas || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[reservas] Error creando reserva:', err);
    res.status(500).json({ error: 'No se pudo crear la reserva.' });
  }
});

/** PUT /api/reservas/:id/estado — cambia el estado (confirmada|cancelada|completada). */
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['confirmada', 'cancelada', 'completada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` });
    }
    const { rows: filasActuales } = await db.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    const reserva = filasActuales[0];
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' });

    await db.query(`UPDATE reservas SET estado = $1, actualizado_en = now() WHERE id = $2`, [estado, req.params.id]);

    if (estado === 'cancelada' && reserva.google_event_id) {
      try {
        await googleCalendar.borrarEvento(reserva.google_event_id);
      } catch (err) {
        console.warn(`[reservas] No se pudo borrar el evento de Calendar de la reserva ${req.params.id}:`, err.message);
      }
    }

    const { rows: filasActualizada } = await db.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    res.json(filasActualizada[0]);
  } catch (err) {
    console.error('[reservas] Error actualizando estado:', err);
    res.status(500).json({ error: 'No se pudo actualizar el estado de la reserva.' });
  }
});

/** PUT /api/reservas/:id — edición general de una reserva. */
router.put('/:id', async (req, res) => {
  try {
    const { rows: filasActuales } = await db.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    const reserva = filasActuales[0];
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' });

    const campos = ['nombre_cliente', 'fecha_reserva', 'cantidad_personas', 'especificaciones', 'notas'];
    const actualizaciones = {};
    for (const campo of campos) {
      if (req.body[campo] !== undefined) actualizaciones[campo] = req.body[campo];
    }
    const claves = Object.keys(actualizaciones);
    if (claves.length === 0) return res.status(400).json({ error: 'No se enviaron campos para actualizar.' });

    const valores = claves.map((c) => actualizaciones[c]);
    const set = claves.map((c, i) => `${c} = $${i + 1}`).join(', ');
    valores.push(req.params.id);
    await db.query(`UPDATE reservas SET ${set}, actualizado_en = now() WHERE id = $${valores.length}`, valores);

    const { rows: filasActualizada } = await db.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    const actualizada = filasActualizada[0];

    if (actualizada.google_event_id) {
      try {
        const { rows: filasConfig } = await db.query('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1');
        await googleCalendar.actualizarEvento(actualizada.google_event_id, actualizada, filasConfig[0]);
      } catch (err) {
        console.warn(`[reservas] No se pudo actualizar el evento de Calendar de la reserva ${req.params.id}:`, err.message);
      }
    }

    res.json(actualizada);
  } catch (err) {
    console.error('[reservas] Error editando reserva:', err);
    res.status(500).json({ error: 'No se pudo editar la reserva.' });
  }
});

/** DELETE /api/reservas/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rows: filasActuales } = await db.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    const reserva = filasActuales[0];
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' });

    await db.query('DELETE FROM reservas WHERE id = $1', [req.params.id]);

    if (reserva.google_event_id) {
      try {
        await googleCalendar.borrarEvento(reserva.google_event_id);
      } catch (err) {
        console.warn(`[reservas] No se pudo borrar el evento de Calendar de la reserva ${req.params.id}:`, err.message);
      }
    }

    res.status(204).send();
  } catch (err) {
    console.error('[reservas] Error borrando reserva:', err);
    res.status(500).json({ error: 'No se pudo borrar la reserva.' });
  }
});

module.exports = router;

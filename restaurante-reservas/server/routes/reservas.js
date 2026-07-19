'use strict';

const express = require('express');
const db = require('../db');
const googleCalendar = require('../services/googleCalendar');

const router = express.Router();

/** GET /api/reservas — lista todas las reservas, opcionalmente filtradas por ?estado= y ?desde=&hasta= */
router.get('/', (req, res) => {
  try {
    const { estado, desde, hasta } = req.query;
    let sql = 'SELECT * FROM reservas WHERE 1=1';
    const params = [];
    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    if (desde) {
      sql += ' AND date(fecha_reserva) >= date(?)';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND date(fecha_reserva) <= date(?)';
      params.push(hasta);
    }
    sql += ' ORDER BY fecha_reserva ASC';
    const filas = db.prepare(sql).all(...params);
    res.json(filas);
  } catch (err) {
    console.error('[reservas] Error listando reservas:', err);
    res.status(500).json({ error: 'No se pudieron obtener las reservas.' });
  }
});

/** GET /api/reservas/:id */
router.get('/:id', (req, res) => {
  const fila = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
  if (!fila) return res.status(404).json({ error: 'Reserva no encontrada.' });
  res.json(fila);
});

/** POST /api/reservas — crear reserva manualmente desde el dashboard. */
router.post('/', (req, res) => {
  try {
    const { numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones, notas } = req.body;
    if (!numero_telefono || !nombre_cliente || !fecha_reserva || !cantidad_personas) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    const resultado = db
      .prepare(
        `INSERT INTO reservas (numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones, notas, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmada')`
      )
      .run(numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones || null, notas || null);
    const nueva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(nueva);
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
    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' });

    db.prepare(`UPDATE reservas SET estado = ?, actualizado_en = datetime('now','localtime') WHERE id = ?`).run(
      estado,
      req.params.id
    );

    if (estado === 'cancelada' && reserva.google_event_id) {
      try {
        await googleCalendar.borrarEvento(reserva.google_event_id);
      } catch (err) {
        console.warn(`[reservas] No se pudo borrar el evento de Calendar de la reserva ${req.params.id}:`, err.message);
      }
    }

    const actualizada = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    res.json(actualizada);
  } catch (err) {
    console.error('[reservas] Error actualizando estado:', err);
    res.status(500).json({ error: 'No se pudo actualizar el estado de la reserva.' });
  }
});

/** PUT /api/reservas/:id — edición general de una reserva. */
router.put('/:id', async (req, res) => {
  try {
    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' });

    const campos = ['nombre_cliente', 'fecha_reserva', 'cantidad_personas', 'especificaciones', 'notas'];
    const actualizaciones = {};
    for (const campo of campos) {
      if (req.body[campo] !== undefined) actualizaciones[campo] = req.body[campo];
    }
    const claves = Object.keys(actualizaciones);
    if (claves.length === 0) return res.status(400).json({ error: 'No se enviaron campos para actualizar.' });

    const set = claves.map((c) => `${c} = ?`).join(', ');
    const valores = claves.map((c) => actualizaciones[c]);
    db.prepare(`UPDATE reservas SET ${set}, actualizado_en = datetime('now','localtime') WHERE id = ?`).run(
      ...valores,
      req.params.id
    );

    const actualizada = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);

    if (actualizada.google_event_id) {
      try {
        const config = db.prepare('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1').get();
        await googleCalendar.actualizarEvento(actualizada.google_event_id, actualizada, config);
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
    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' });

    db.prepare('DELETE FROM reservas WHERE id = ?').run(req.params.id);

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

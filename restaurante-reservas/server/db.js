'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'restaurante.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Migraciones idempotentes: todas usan CREATE TABLE IF NOT EXISTS,
 * así que correr esto muchas veces (cada arranque del server) es seguro.
 */
function migrar() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_restaurante (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_restaurante TEXT NOT NULL DEFAULT 'Mi Restaurante',
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      horarios TEXT,
      tipo_cocina TEXT,
      sobre_restaurante TEXT,
      capacidad_total INTEGER NOT NULL DEFAULT 40,
      duracion_reserva_min INTEGER NOT NULL DEFAULT 120,
      hora_apertura_almuerzo TEXT DEFAULT '12:00',
      hora_cierre_almuerzo TEXT DEFAULT '15:30',
      hora_apertura_cena TEXT DEFAULT '19:30',
      hora_cierre_cena TEXT DEFAULT '23:30',
      intervalo_slots_min INTEGER NOT NULL DEFAULT 30,
      dias_cerrado TEXT DEFAULT '[1]',
      webhook_url TEXT,
      actualizado_en DATETIME DEFAULT (datetime('now','localtime'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_telefono TEXT NOT NULL,
      nombre_cliente TEXT NOT NULL,
      fecha_reserva TEXT NOT NULL,
      cantidad_personas INTEGER NOT NULL,
      especificaciones TEXT,
      estado TEXT NOT NULL DEFAULT 'confirmada',
      google_event_id TEXT,
      notas TEXT,
      creado_en DATETIME DEFAULT (datetime('now','localtime')),
      actualizado_en DATETIME DEFAULT (datetime('now','localtime'))
    );
  `);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_reservas_numero_telefono ON reservas (numero_telefono);`
  );
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_fecha_reserva ON reservas (fecha_reserva);`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_telefono TEXT NOT NULL,
      contenido_mensaje TEXT NOT NULL,
      remitente TEXT NOT NULL,
      tipo_mensaje TEXT,
      procesado INTEGER DEFAULT 0,
      recibido_en DATETIME DEFAULT (datetime('now','localtime'))
    );
  `);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_mensajes_numero_recibido ON mensajes_whatsapp (numero_telefono, recibido_en DESC);`
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS google_oauth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_token TEXT,
      refresh_token TEXT,
      expiry_date INTEGER,
      scope TEXT,
      email_cuenta TEXT,
      calendar_id TEXT DEFAULT 'primary',
      conectado_en DATETIME DEFAULT (datetime('now','localtime'))
    );
  `);

  const fila = db.prepare('SELECT COUNT(*) AS cantidad FROM configuracion_restaurante').get();
  if (fila.cantidad === 0) {
    db.prepare(
      `INSERT INTO configuracion_restaurante (
        nombre_restaurante, direccion, telefono, email, horarios, tipo_cocina, sobre_restaurante,
        capacidad_total, duracion_reserva_min,
        hora_apertura_almuerzo, hora_cierre_almuerzo, hora_apertura_cena, hora_cierre_cena,
        intervalo_slots_min, dias_cerrado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'Katty Empanadas',
      'Av. Principal 1234, Montevideo',
      '+598 99 123 456',
      'contacto@katty.com',
      'Almuerzo 12:00-15:30 · Cena 19:30-23:30',
      'Empanadas artesanales y cocina uruguaya',
      'Katty es un restaurante familiar especializado en empanadas artesanales, con más de 20 años de tradición.',
      40,
      120,
      '12:00',
      '15:30',
      '19:30',
      '23:30',
      30,
      '[1]'
    );
    console.log('[db] Fila de configuración por defecto creada.');
  }

  console.log(`[db] Migraciones aplicadas correctamente. Base de datos en: ${DB_PATH}`);
}

migrar();

module.exports = db;

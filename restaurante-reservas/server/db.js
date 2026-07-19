'use strict';

const { Pool } = require('pg');

/**
 * Vercel Postgres (Storage → Create Database → Postgres, backed por Neon) inyecta
 * `POSTGRES_URL` automáticamente en el proyecto. Para desarrollo local (o cualquier otro
 * proveedor de Postgres) soportamos también `DATABASE_URL` como alternativa.
 */
const CONNECTION_STRING = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.warn(
    '[db] ⚠️  No está definida POSTGRES_URL ni DATABASE_URL. La app no va a poder conectarse a la base de datos.'
  );
}

// Postgres local (ej. docker en localhost) normalmente no expone SSL. Vercel Postgres / Neon y la
// mayoría de los proveedores remotos sí lo requieren. Usamos el host como heurística.
const requiereSSL = Boolean(CONNECTION_STRING) && !/localhost|127\.0\.0\.1/.test(CONNECTION_STRING);

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: requiereSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // Errores en clientes ociosos del pool (ej. conexión cortada por el proveedor) no deben tirar
  // abajo el proceso entero.
  console.error('[db] Error inesperado en un cliente ocioso del pool de Postgres:', err.message);
});

/** Atajo para queries simples (sin transacción). */
function query(texto, params) {
  return pool.query(texto, params);
}

/** Checkout de un cliente dedicado del pool, para transacciones (BEGIN/COMMIT/ROLLBACK). */
function getClient() {
  return pool.connect();
}

/**
 * Migraciones idempotentes: todas usan CREATE TABLE IF NOT EXISTS, así que correrlas muchas veces
 * (cada cold start de la función serverless, o cada arranque del server local) es seguro.
 */
async function migrar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracion_restaurante (
      id SERIAL PRIMARY KEY,
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
      actualizado_en TIMESTAMP DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      numero_telefono TEXT NOT NULL,
      nombre_cliente TEXT NOT NULL,
      fecha_reserva TEXT NOT NULL,
      cantidad_personas INTEGER NOT NULL,
      especificaciones TEXT,
      estado TEXT NOT NULL DEFAULT 'confirmada',
      google_event_id TEXT,
      notas TEXT,
      creado_en TIMESTAMP DEFAULT now(),
      actualizado_en TIMESTAMP DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_reservas_numero_telefono ON reservas (numero_telefono);`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reservas_fecha_reserva ON reservas (fecha_reserva);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
      id SERIAL PRIMARY KEY,
      numero_telefono TEXT NOT NULL,
      contenido_mensaje TEXT NOT NULL,
      remitente TEXT NOT NULL,
      tipo_mensaje TEXT,
      procesado INTEGER DEFAULT 0,
      recibido_en TIMESTAMP DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_mensajes_numero_recibido ON mensajes_whatsapp (numero_telefono, recibido_en DESC);`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_oauth (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expiry_date BIGINT,
      scope TEXT,
      email_cuenta TEXT,
      calendar_id TEXT DEFAULT 'primary',
      conectado_en TIMESTAMP DEFAULT now()
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) AS cantidad FROM configuracion_restaurante');
  if (Number(rows[0].cantidad) === 0) {
    await pool.query(
      `INSERT INTO configuracion_restaurante (
        nombre_restaurante, direccion, telefono, email, horarios, tipo_cocina, sobre_restaurante,
        capacidad_total, duracion_reserva_min,
        hora_apertura_almuerzo, hora_cierre_almuerzo, hora_apertura_cena, hora_cierre_cena,
        intervalo_slots_min, dias_cerrado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
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
        '[1]',
      ]
    );
    console.log('[db] Fila de configuración por defecto creada.');
  }

  console.log('[db] Migraciones aplicadas correctamente contra Postgres.');
}

// En serverless (Vercel) cada invocación puede reutilizar la misma instancia "caliente" del
// proceso; cacheamos la promesa de migración para no volver a correr los CREATE TABLE en cada
// request, pero si falló, permitimos reintentar en la siguiente.
let migradoPromise = null;
function asegurarMigrado() {
  if (!migradoPromise) {
    migradoPromise = migrar().catch((err) => {
      migradoPromise = null;
      throw err;
    });
  }
  return migradoPromise;
}

module.exports = {
  pool,
  query,
  getClient,
  migrar,
  asegurarMigrado,
};

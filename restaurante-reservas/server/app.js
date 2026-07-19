'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');

// Validaciones "amigables" de entorno: nunca crashear por falta de variables
// opcionales, pero avisar bien claro en consola.
if (!process.env.OPENAI_API_KEY) {
  console.warn('[config] ⚠️  OPENAI_API_KEY no está definida. Valentina no va a poder responder hasta que la configures en .env');
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('[config] ⚠️  Credenciales de Google (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) no configuradas. La integración con Google Calendar quedará deshabilitada hasta que las cargues en .env');
}
if (!process.env.TZ_RESTAURANTE) {
  console.warn('[config] ⚠️  TZ_RESTAURANTE no está definida, usando America/Montevideo por defecto.');
}
if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.warn('[config] ⚠️  POSTGRES_URL / DATABASE_URL no está definida. Configurala para poder conectarte a la base de datos.');
}

const db = require('./db');

const webhookRouter = require('./routes/webhook');
const mensajesRouter = require('./routes/mensajes');
const reservasRouter = require('./routes/reservas');
const configuracionRouter = require('./routes/configuracion');
const googleRouter = require('./routes/google');

const app = express();

app.use(express.json());

// El health check no depende de la base de datos: así, si Postgres está caído, igual podemos
// distinguir "la app está arriba" de "la base de datos no responde".
app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'restaurante-reservas', hora: new Date().toISOString() });
});

// El webhook de WhatsApp corre sus propias migraciones/tolerancia a fallos dentro de su try/catch
// (siempre debe devolver 200 a Twilio, nunca un 503), así que no pasa por este middleware.
app.use('/api/webhook', webhookRouter);

// Para el resto de las rutas de administración (dashboard), nos aseguramos de que las tablas
// existan antes de atender el pedido. En serverless esto solo hace trabajo real en el cold start
// del proceso (la promesa de migración queda cacheada).
async function asegurarBaseDeDatos(req, res, next) {
  try {
    await db.asegurarMigrado();
    next();
  } catch (err) {
    console.error('[app] No se pudo preparar la base de datos:', err.message);
    res.status(503).json({ error: 'La base de datos no está disponible en este momento. Probá de nuevo en unos segundos.' });
  }
}

app.use('/api/mensajes', asegurarBaseDeDatos, mensajesRouter);
app.use('/api/reservas', asegurarBaseDeDatos, reservasRouter);
app.use('/api/configuracion', asegurarBaseDeDatos, configuracionRouter);
app.use('/api/google', asegurarBaseDeDatos, googleRouter);

// En producción, servimos el build de React (client/dist). En Vercel esto lo maneja el propio
// hosting estático (ver vercel.json), pero lo dejamos también acá para que `npm start` local en
// modo producción siga funcionando igual que antes.
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Manejador de errores genérico (último recurso).
app.use((err, req, res, next) => {
  console.error('[server] Error no controlado:', err);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

module.exports = app;

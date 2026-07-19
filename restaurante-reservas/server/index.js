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

// db.js corre las migraciones apenas se importa.
require('./db');

const webhookRouter = require('./routes/webhook');
const mensajesRouter = require('./routes/mensajes');
const reservasRouter = require('./routes/reservas');
const configuracionRouter = require('./routes/configuracion');
const googleRouter = require('./routes/google');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'restaurante-reservas', hora: new Date().toISOString() });
});

app.use('/api/webhook', webhookRouter);
app.use('/api/mensajes', mensajesRouter);
app.use('/api/reservas', reservasRouter);
app.use('/api/configuracion', configuracionRouter);
app.use('/api/google', googleRouter);

// En producción, servimos el build de React (client/dist).
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

app.listen(PORT, () => {
  console.log(`[server] Servidor de reservas escuchando en el puerto ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;

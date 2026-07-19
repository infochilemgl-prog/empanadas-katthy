'use strict';

const express = require('express');
const { google } = require('googleapis');
const db = require('../db');

const router = express.Router();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function credencialesConfiguradas() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

function construirOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/** GET /api/google/auth — devuelve la URL de consentimiento de Google. */
router.get('/auth', (req, res) => {
  if (!credencialesConfiguradas()) {
    return res.status(400).json({
      error: 'Google Calendar no está configurado. Definí GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI en el .env.',
    });
  }
  try {
    const oauth2Client = construirOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });
    res.json({ url });
  } catch (err) {
    console.error('[google] Error generando URL de autenticación:', err);
    res.status(500).json({ error: 'No se pudo generar la URL de autenticación de Google.' });
  }
});

/** GET /api/google/callback — intercambia el code por tokens y guarda la conexión. */
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('<html><body><h3>Falta el parámetro "code".</h3></body></html>');
  }
  try {
    const oauth2Client = construirOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: infoUsuario } = await oauth2.userinfo.get();

    // Upsert: borramos cualquier fila previa e insertamos la nueva (una sola cuenta conectada a la vez).
    db.prepare('DELETE FROM google_oauth').run();
    db.prepare(
      `INSERT INTO google_oauth (access_token, refresh_token, expiry_date, scope, email_cuenta, calendar_id)
       VALUES (?, ?, ?, ?, ?, 'primary')`
    ).run(
      tokens.access_token || null,
      tokens.refresh_token || null,
      tokens.expiry_date || null,
      tokens.scope || null,
      infoUsuario.email || null
    );

    console.log(`[google] Cuenta de Google Calendar conectada: ${infoUsuario.email}`);

    res.set('Content-Type', 'text/html');
    res.send(`<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Google Calendar conectado</title></head>
<body style="font-family: sans-serif; text-align:center; padding-top: 80px;">
  <h2>Conectado correctamente, podés cerrar esta pestaña ✅</h2>
  <p>Tu cuenta de Google Calendar (${infoUsuario.email}) ya está sincronizada con Valentina.</p>
</body>
</html>`);
  } catch (err) {
    console.error('[google] Error en el callback de OAuth:', err);
    res.status(500).send('<html><body><h3>Ocurrió un error conectando con Google. Intentá de nuevo.</h3></body></html>');
  }
});

/** GET /api/google/status */
router.get('/status', (req, res) => {
  try {
    const fila = db.prepare('SELECT * FROM google_oauth ORDER BY id DESC LIMIT 1').get();
    if (!fila) {
      return res.json({ conectado: false, email_cuenta: null, calendar_id: null, conectado_en: null });
    }
    res.json({
      conectado: true,
      email_cuenta: fila.email_cuenta,
      calendar_id: fila.calendar_id,
      conectado_en: fila.conectado_en,
    });
  } catch (err) {
    console.error('[google] Error obteniendo estado:', err);
    res.status(500).json({ error: 'No se pudo obtener el estado de la conexión con Google.' });
  }
});

/** POST /api/google/disconnect */
router.post('/disconnect', (req, res) => {
  try {
    db.prepare('DELETE FROM google_oauth').run();
    res.json({ desconectado: true });
  } catch (err) {
    console.error('[google] Error desconectando:', err);
    res.status(500).json({ error: 'No se pudo desconectar la cuenta de Google.' });
  }
});

module.exports = router;

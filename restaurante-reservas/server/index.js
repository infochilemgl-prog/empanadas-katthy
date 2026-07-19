'use strict';

// Entrypoint de desarrollo/local (`npm run dev:server` / `npm start`). En Vercel, la función
// serverless usa `api/index.js`, que importa el mismo `app` de `./app.js` sin llamar a listen().

const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    await db.asegurarMigrado();
  } catch (err) {
    console.error('[server] No se pudo migrar la base de datos al arrancar:', err.message);
    console.error('[server] Verificá que POSTGRES_URL / DATABASE_URL apunte a una base Postgres accesible.');
  }

  app.listen(PORT, () => {
    console.log(`[server] Servidor de reservas escuchando en el puerto ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

iniciar();

module.exports = app;

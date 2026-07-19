# Reservas por WhatsApp con Valentina 🍽️

Sistema completo de reservas para restaurantes: una anfitriona virtual con IA (**Valentina**,
GPT-4o) que atiende a tus clientes por WhatsApp, agenda reservas automáticamente, las sincroniza
con Google Calendar, y un panel de control en React para que el dueño del restaurante gestione
todo desde el navegador.

Todo el sistema está en español rioplatense (vos / querés / podés).

## Stack

- **Backend**: Node.js + Express (deployable como servidor local o como función serverless en Vercel)
- **Base de datos**: PostgreSQL (`pg`), pensada para Vercel Postgres (Neon) pero funciona con
  cualquier Postgres accesible por red (local, Docker, Supabase, RDS, etc.)
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + React Query
- **WhatsApp**: Twilio (webhook + TwiML)
- **IA**: OpenAI GPT-4o con function calling
- **Calendario**: Google Calendar (OAuth2 vía `googleapis`)

## Estructura del proyecto

```
restaurante-reservas/
├── api/index.js       # Handler serverless para Vercel (reexporta server/app.js)
├── server/
│   ├── app.js          # App de Express configurada (rutas, middlewares) — sin app.listen()
│   ├── index.js         # Entrypoint local (npm run dev / npm start) — hace app.listen()
│   ├── db.js             # Pool de Postgres + migraciones idempotentes
│   └── ...
├── client/            # Panel de control en React (Vite)
├── vercel.json         # Config de build/rewrites/función serverless para Vercel
├── .env.example
└── package.json
```

## Instalación

```bash
cd restaurante-reservas
npm run setup          # instala dependencias del server y del client
cp .env.example .env   # completá tus credenciales (ver más abajo)
```

## Base de datos: necesitás un Postgres accesible

Este proyecto usa PostgreSQL (antes usaba SQLite local). Para desarrollo local, levantá un Postgres
con Docker:

```bash
docker run -d --name katty-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine
```

y en tu `.env` poné:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
```

Las tablas se crean solas (migraciones idempotentes con `CREATE TABLE IF NOT EXISTS`) la primera
vez que arranca el servidor o se atiende un request — no hace falta correr nada a mano.

## Desarrollo

```bash
npm run dev             # levanta server (puerto 3001) y client (Vite, con proxy /api) a la vez
npm run dev:server      # solo el backend, con nodemon
npm run dev:client      # solo el frontend
```

Abrí `http://localhost:5173` para el panel (en dev) — el `index.html` de marketing del restaurante
sigue viviendo en la raíz del repo, sin relación con esta app.

## Producción (servidor propio, sin Vercel)

```bash
npm run build   # genera client/dist
npm start        # NODE_ENV=production node server/index.js — sirve la API y el build de React
```

## Desplegar en Vercel

El proyecto está preparado para desplegarse en Vercel como una función serverless (`api/index.js`,
la misma app de Express) + el build estático del panel (`client/dist`). Pasos en el dashboard de
Vercel (esto no se puede hacer desde el código, lo tiene que hacer quien tenga la cuenta):

1. **Crear la base de datos Postgres**: en el proyecto de Vercel, andá a **Storage → Create
   Database → Postgres** (funciona con Neon por debajo) y conectala al proyecto. Vercel inyecta
   automáticamente la variable `POSTGRES_URL` — no hace falta cargarla vos a mano.
2. **Importar el repo**: **Add New… → Project → Import Git Repository**, elegí este repo de
   GitHub. Como el repo tiene también un `index.html` de marketing en la raíz sin relación con
   esta app, en **Root Directory** de la configuración del proyecto tenés que poner
   **`restaurante-reservas`** (así Vercel usa el `vercel.json`, el `package.json` y el `api/` de
   esta carpeta, no la raíz del repo).
3. **Variables de entorno**: en **Settings → Environment Variables** del proyecto, cargá al menos
   `OPENAI_API_KEY`. Opcionalmente `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_REDIRECT_URI` y `TZ_RESTAURANTE` (ver más abajo). `POSTGRES_URL` ya la puso Vercel en el
   paso 1.
4. **Deploy**: Vercel va a correr el `installCommand` / `buildCommand` / `outputDirectory`
   definidos en `vercel.json` (instala dependencias de raíz y de `client/`, corre `vite build`, y
   sirve `client/dist`). La función `api/index.js` queda con `maxDuration: 60` segundos, porque el
   loop de tool-calling de Valentina con OpenAI puede tardar varios segundos en resolver una
   conversación con múltiples herramientas.
5. **Configurar el webhook de Twilio con la URL real**: una vez que tengas la URL del deploy (por
   ejemplo `https://mi-proyecto.vercel.app`), usá
   `https://mi-proyecto.vercel.app/api/webhook/whatsapp` como la URL de WhatsApp en Twilio (ver
   sección 2 más abajo) — reemplaza a la URL de ngrok que se usa en desarrollo local.
6. **Google Calendar (opcional)**: si vas a usar la integración, una vez que tengas la URL de
   producción, actualizá `GOOGLE_REDIRECT_URI` en las variables de entorno de Vercel para que
   apunte a `https://mi-proyecto.vercel.app/api/google/callback` (no a `localhost`), y agregá esa
   misma URL en **URIs de redireccionamiento autorizados** en Google Cloud Console (ver sección 1).
   Volvé a desplegar después de cambiar la variable.

Notas técnicas de la migración a Vercel:

- `server/app.js` tiene la app de Express configurada (rutas, middlewares) sin `app.listen()`.
  `server/index.js` la usa para desarrollo/local (`npm run dev`, `npm start`) y sí llama a
  `app.listen()`. `api/index.js` la reexporta tal cual para que Vercel la invoque como función
  serverless por request — no hace falta ningún adaptador extra, una app de Express ya es
  compatible con la firma `(req, res)` que espera Vercel.
- Las migraciones (`CREATE TABLE IF NOT EXISTS`) corren de forma perezosa y cacheada: la primera
  vez que una función serverless "fría" atiende un request se asegura de que las tablas existan;
  en invocaciones posteriores sobre la misma instancia no se repite el trabajo.
- El webhook de WhatsApp (`/api/webhook/whatsapp`) SIEMPRE devuelve `200` con TwiML, incluso si
  Postgres, OpenAI o Google Calendar fallan — así Twilio nunca reintenta el mensaje en loop.

## Variables de entorno (`.env` / Vercel)

```
OPENAI_API_KEY=tu_api_key_de_openai_aqui
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001

# Postgres: en Vercel, POSTGRES_URL la inyecta el propio integration de Vercel Postgres.
# En local (o cualquier otro proveedor), usá DATABASE_URL. El código soporta las dos variables
# (POSTGRES_URL tiene prioridad si están las dos definidas).
POSTGRES_URL=
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres

GOOGLE_CLIENT_ID=tu_client_id_de_google_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google_aqui
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
TZ_RESTAURANTE=America/Montevideo
```

- `OPENAI_API_KEY` es obligatoria para que Valentina pueda responder. Si falta, el server igual
  arranca, pero el webhook responde con un mensaje de error genérico pidiendo llamar al restaurante.
- Las variables de Google son opcionales: si no están, la integración con Calendar queda
  deshabilitada (se loguea un warning claro) pero las reservas se siguen guardando igual.
- `POSTGRES_URL` / `DATABASE_URL` es obligatoria para que la app pueda leer/escribir datos (sin
  ella, el server arranca pero cualquier ruta que toque la base va a fallar).

---

## 1. Configurar Google Calendar (Google Cloud Console)

Seguí estos pasos para que Valentina pueda crear eventos en tu Google Calendar cuando confirme una
reserva:

1. Entrá a [console.cloud.google.com](https://console.cloud.google.com/) y creá un proyecto nuevo
   (o usá uno existente).
2. En el menú, andá a **APIs y servicios → Biblioteca** y buscá **Google Calendar API**. Hacé clic
   en **Habilitar**.
3. Andá a **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Elegí tipo de usuario **Externo**.
   - Completá nombre de la app, tu email de soporte y tu email de contacto de desarrollador.
   - En **Permisos (scopes)**, agregá:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/userinfo.email`
   - En **Usuarios de prueba** (mientras la app esté en modo "Testing"), agregá el email de Google
     que vas a usar para conectar el calendario del restaurante.
4. Andá a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - En **URIs de redireccionamiento autorizados**, agregá:
     - `http://localhost:3001/api/google/callback` (para desarrollo)
     - la URL de producción equivalente, por ejemplo `https://tu-dominio.com/api/google/callback`
5. Copiá el **Client ID** y el **Client secret** generados y pegalos en tu `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
6. Con el server corriendo, entrá al panel → pestaña **Integraciones** → **Conectar Google
   Calendar**. Se abre una ventana con el login de Google; una vez que aceptes los permisos, la
   ventana se cierra sola y el panel muestra la cuenta conectada.

A partir de ese momento, cada vez que Valentina confirme una reserva se crea automáticamente un
evento en ese calendario (y se borra/actualiza si la reserva se cancela o reprograma).

## 2. Configurar Twilio (WhatsApp)

1. Entrá a [console.twilio.com](https://console.twilio.com/).
2. En el menú lateral, andá a **Messaging → Try it out → Send a WhatsApp message**.
3. Seguí las instrucciones para **unirte al sandbox de WhatsApp** (vas a mandar un mensaje tipo
   `join <palabra-código>` desde tu WhatsApp al número de Twilio).
4. Andá a **Sandbox settings** (dentro de la misma sección de WhatsApp).
5. En el campo **"When a message comes in"**, pegá la URL de tu webhook:
   ```
   {PUBLIC_BASE_URL}/api/webhook/whatsapp
   ```
   con método **POST**. Por ejemplo, si `PUBLIC_BASE_URL=https://mi-restaurante.com`, la URL sería
   `https://mi-restaurante.com/api/webhook/whatsapp`.
6. Para probar en desarrollo local, exponé tu puerto 3001 con **ngrok**:
   ```bash
   ngrok http 3001
   ```
   Copiá la URL pública que te da ngrok (algo como `https://xxxx.ngrok-free.app`) y pegala en el
   campo de Twilio como `https://xxxx.ngrok-free.app/api/webhook/whatsapp`. Si ya desplegaste en
   Vercel, usá directamente la URL del deploy en vez de ngrok (ver sección "Desplegar en Vercel"
   más arriba): `https://mi-proyecto.vercel.app/api/webhook/whatsapp`.
7. Mandale un WhatsApp al número del sandbox de Twilio y listo: Valentina te va a responder.

> Nota de seguridad: en este proyecto la validación de la firma `X-Twilio-Signature` está marcada
> como pendiente (ver comentario `TODO` en `server/routes/webhook.js`). Antes de pasar a producción
> con tráfico real, se recomienda implementarla para verificar que las peticiones vienen realmente
> de Twilio.

## Panel de control

El panel (`/dashboard`) tiene 4 pestañas:

- **Mensajes**: conversaciones de WhatsApp en tiempo real, agrupadas por número.
- **Reservas**: vista de calendario (con `react-day-picker`) o de lista, con filtros por estado y
  acciones para cancelar / marcar como completada.
- **Configuración**: datos del restaurante, capacidad, horarios de almuerzo/cena, días cerrados, y
  la URL del webhook lista para copiar.
- **Integraciones**: conexión/desconexión de Google Calendar.

## Base de datos

PostgreSQL con 4 tablas (`configuracion_restaurante`, `reservas`, `mensajes_whatsapp`,
`google_oauth`), migradas de forma idempotente (`server/db.js`, `CREATE TABLE IF NOT EXISTS`) la
primera vez que arranca el servidor local o que una función serverless "fría" atiende un request.
No hay ningún archivo de base de datos local que gestionar: toda la conexión va por
`POSTGRES_URL` / `DATABASE_URL`.

La re-validación de capacidad antes de confirmar o reprogramar una reserva corre dentro de una
transacción de Postgres con un `pg_advisory_xact_lock` scoped al día de la reserva, para evitar
que dos reservas concurrentes para el mismo horario se "pisen" y sobrepasen la capacidad total del
restaurante.

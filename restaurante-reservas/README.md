# Reservas por WhatsApp con Valentina 🍽️

Sistema completo de reservas para restaurantes: una anfitriona virtual con IA (**Valentina**,
GPT-4o) que atiende a tus clientes por WhatsApp, agenda reservas automáticamente, las sincroniza
con Google Calendar, y un panel de control en React para que el dueño del restaurante gestione
todo desde el navegador.

Todo el sistema está en español rioplatense (vos / querés / podés).

## Stack

- **Backend**: Node.js + Express
- **Base de datos**: SQLite (`better-sqlite3`, sin servidor externo)
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + React Query
- **WhatsApp**: Twilio (webhook + TwiML)
- **IA**: OpenAI GPT-4o con function calling
- **Calendario**: Google Calendar (OAuth2 vía `googleapis`)

## Estructura del proyecto

```
restaurante-reservas/
├── server/            # API Express, base de datos, agente de IA
├── client/            # Panel de control en React (Vite)
├── restaurante.db     # Se crea automáticamente al arrancar el server (gitignored)
├── .env.example
└── package.json
```

## Instalación

```bash
cd restaurante-reservas
npm run setup          # instala dependencias del server y del client
cp .env.example .env   # completá tus credenciales (ver más abajo)
```

## Desarrollo

```bash
npm run dev             # levanta server (puerto 3001) y client (Vite, con proxy /api) a la vez
npm run dev:server      # solo el backend, con nodemon
npm run dev:client      # solo el frontend
```

Abrí `http://localhost:5173` para el panel (en dev) — el `index.html` de marketing del restaurante
sigue viviendo en la raíz del repo, sin relación con esta app.

## Producción

```bash
npm run build   # genera client/dist
npm start        # NODE_ENV=production node server/index.js — sirve la API y el build de React
```

## Variables de entorno (`.env`)

```
OPENAI_API_KEY=tu_api_key_de_openai_aqui
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
GOOGLE_CLIENT_ID=tu_client_id_de_google_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google_aqui
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
TZ_RESTAURANTE=America/Montevideo
```

- `OPENAI_API_KEY` es obligatoria para que Valentina pueda responder. Si falta, el server igual
  arranca, pero el webhook responde con un mensaje de error genérico pidiendo llamar al restaurante.
- Las variables de Google son opcionales: si no están, la integración con Calendar queda
  deshabilitada (se loguea un warning claro) pero las reservas se siguen guardando igual.

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
   campo de Twilio como `https://xxxx.ngrok-free.app/api/webhook/whatsapp`.
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

SQLite con 4 tablas (`configuracion_restaurante`, `reservas`, `mensajes_whatsapp`,
`google_oauth`), migradas de forma idempotente en cada arranque del server
(`server/db.js`, `CREATE TABLE IF NOT EXISTS`). El archivo `restaurante.db` se crea solo y está
en `.gitignore`.

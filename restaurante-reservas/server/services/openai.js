'use strict';

const OpenAI = require('openai');
const db = require('../db');
const googleCalendar = require('./googleCalendar');
const {
  formatearHoyEnEspanol,
  formatearISOEnEspanol,
  diaSemanaDeISO,
  generarSlots,
  combinarFechaHora,
  sumarMinutosISO,
  seSuperponen,
  esISOValido,
  ahoraComoDate,
  TZ_DEFAULT,
} = require('../utils/fechas');

let openaiClient = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Falta OPENAI_API_KEY en el entorno.');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function obtenerConfig() {
  return db.prepare('SELECT * FROM configuracion_restaurante ORDER BY id LIMIT 1').get();
}

/* ------------------------------------------------------------------ */
/* Herramientas (tool calling)                                         */
/* ------------------------------------------------------------------ */

/**
 * 1. consultar_disponibilidad
 * Genera los slots de almuerzo y cena para un día dado y calcula, para cada
 * uno, si hay lugar para `cantidad_personas` sin superar la capacidad total.
 */
function consultarDisponibilidad({ fecha, cantidad_personas }) {
  const config = obtenerConfig();
  if (!esISOValido(`${fecha}T00:00`)) {
    return { disponible: false, motivo: 'fecha_invalida', mensaje: 'La fecha no tiene un formato válido (YYYY-MM-DD).' };
  }

  const diaSemana = diaSemanaDeISO(`${fecha}T00:00:00`);
  const diasCerrado = JSON.parse(config.dias_cerrado || '[]');
  if (diasCerrado.includes(diaSemana)) {
    return {
      disponible: false,
      motivo: 'cerrado',
      mensaje: `El restaurante está cerrado ese día. Probá con otra fecha.`,
    };
  }

  const duracion = config.duracion_reserva_min;
  const reservasDelDia = db
    .prepare(
      `SELECT fecha_reserva, cantidad_personas FROM reservas
       WHERE estado != 'cancelada' AND date(fecha_reserva) = date(?)`
    )
    .all(`${fecha}T00:00:00`);

  function ocupacionEnSlot(slotISO) {
    const slotFin = sumarMinutosISO(slotISO, duracion);
    let ocupacion = 0;
    for (const r of reservasDelDia) {
      const rFin = sumarMinutosISO(r.fecha_reserva, duracion);
      if (seSuperponen(slotISO, slotFin, r.fecha_reserva, rFin)) {
        ocupacion += r.cantidad_personas;
      }
    }
    return ocupacion;
  }

  function construirSlots(horaApertura, horaCierre) {
    const horas = generarSlots(horaApertura, horaCierre, config.intervalo_slots_min, duracion);
    return horas.map((hora) => {
      const slotISO = combinarFechaHora(fecha, hora);
      const ocupacion = ocupacionEnSlot(slotISO);
      const disponible = ocupacion + Number(cantidad_personas || 1) <= config.capacidad_total;
      return {
        horario: hora,
        disponible,
        ocupacion_actual: ocupacion,
        capacidad_total: config.capacidad_total,
      };
    });
  }

  const slotsAlmuerzo = construirSlots(config.hora_apertura_almuerzo, config.hora_cierre_almuerzo);
  const slotsCena = construirSlots(config.hora_apertura_cena, config.hora_cierre_cena);

  return {
    disponible: true,
    fecha,
    slots_almuerzo_disponibles: slotsAlmuerzo.filter((s) => s.disponible).map((s) => s.horario),
    slots_cena_disponibles: slotsCena.filter((s) => s.disponible).map((s) => s.horario),
    detalle_almuerzo: slotsAlmuerzo,
    detalle_cena: slotsCena,
  };
}

/**
 * 2. ver_reservas_cliente
 */
function verReservasCliente({ numero_telefono }) {
  const filas = db
    .prepare(
      `SELECT * FROM reservas WHERE numero_telefono = ? AND estado != 'cancelada'
       ORDER BY fecha_reserva ASC`
    )
    .all(numero_telefono);
  return {
    cantidad: filas.length,
    reservas: filas.map((r) => ({
      id: r.id,
      nombre_cliente: r.nombre_cliente,
      fecha_reserva: r.fecha_reserva,
      fecha_legible: formatearISOEnEspanol(r.fecha_reserva),
      cantidad_personas: r.cantidad_personas,
      especificaciones: r.especificaciones,
      estado: r.estado,
    })),
  };
}

/** Valida que una fecha/hora esté dentro de servicio (almuerzo o cena) y no en día cerrado. */
function validarVentanaDeServicio(fechaISO, config) {
  const diaSemana = diaSemanaDeISO(fechaISO);
  const diasCerrado = JSON.parse(config.dias_cerrado || '[]');
  if (diasCerrado.includes(diaSemana)) {
    return { ok: false, motivo: 'El restaurante está cerrado ese día.' };
  }
  const horaMin = fechaISO.split('T')[1].slice(0, 5);
  const dentroAlmuerzo = horaMin >= config.hora_apertura_almuerzo && horaMin < config.hora_cierre_almuerzo;
  const dentroCena = horaMin >= config.hora_apertura_cena && horaMin < config.hora_cierre_cena;
  if (!dentroAlmuerzo && !dentroCena) {
    return {
      ok: false,
      motivo: `Ese horario está fuera del horario de atención (almuerzo ${config.hora_apertura_almuerzo}-${config.hora_cierre_almuerzo}, cena ${config.hora_apertura_cena}-${config.hora_cierre_cena}).`,
    };
  }
  return { ok: true };
}

/** Suma la ocupación de una ventana [fechaISO, fechaISO+duracion) excluyendo opcionalmente una reserva. */
function ocupacionEnVentana(fechaISO, duracion, excluirId) {
  const fin = sumarMinutosISO(fechaISO, duracion);
  const reservasDelDia = db
    .prepare(
      `SELECT id, fecha_reserva, cantidad_personas FROM reservas
       WHERE estado != 'cancelada' AND date(fecha_reserva) = date(?)`
    )
    .all(fechaISO);
  let ocupacion = 0;
  for (const r of reservasDelDia) {
    if (excluirId && r.id === excluirId) continue;
    const rFin = sumarMinutosISO(r.fecha_reserva, duracion);
    if (seSuperponen(fechaISO, fin, r.fecha_reserva, rFin)) {
      ocupacion += r.cantidad_personas;
    }
  }
  return ocupacion;
}

/**
 * 3. agendar_reserva
 */
async function agendarReserva({ numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones }) {
  const config = obtenerConfig();

  if (!esISOValido(fecha_reserva)) {
    return { exito: false, mensaje: 'La fecha/hora de la reserva no tiene un formato válido.' };
  }

  const ahora = ahoraComoDate();
  const [fechaParte, horaParte] = fecha_reserva.split('T');
  const [anio, mes, dia] = fechaParte.split('-').map(Number);
  const [hh, mm] = (horaParte || '00:00').split(':').map(Number);
  const fechaSolicitada = new Date(anio, mes - 1, dia, hh, mm || 0);
  if (fechaSolicitada.getTime() < ahora.getTime()) {
    return { exito: false, mensaje: 'Esa fecha ya pasó. Elegí una fecha y horario futuros.' };
  }

  if (Number(cantidad_personas) > config.capacidad_total) {
    return {
      exito: false,
      mensaje: `Para grupos de más de ${config.capacidad_total} personas, llamá directamente al restaurante al ${config.telefono}.`,
    };
  }

  const ventana = validarVentanaDeServicio(fecha_reserva, config);
  if (!ventana.ok) {
    return { exito: false, mensaje: ventana.motivo };
  }

  // Re-validación de capacidad justo antes del INSERT (defensa contra condiciones de carrera),
  // todo dentro de una transacción.
  let reservaId;
  const transaccion = db.transaction(() => {
    const ocupacion = ocupacionEnVentana(fecha_reserva, config.duracion_reserva_min);
    if (ocupacion + Number(cantidad_personas) > config.capacidad_total) {
      throw new Error('SIN_CAPACIDAD');
    }
    const resultado = db
      .prepare(
        `INSERT INTO reservas (numero_telefono, nombre_cliente, fecha_reserva, cantidad_personas, especificaciones, estado)
         VALUES (?, ?, ?, ?, ?, 'confirmada')`
      )
      .run(
        numero_telefono,
        nombre_cliente,
        fecha_reserva,
        cantidad_personas,
        especificaciones && especificaciones.toLowerCase() !== 'ninguna' ? especificaciones : null
      );
    reservaId = resultado.lastInsertRowid;
  });

  try {
    transaccion();
  } catch (err) {
    if (err.message === 'SIN_CAPACIDAD') {
      return {
        exito: false,
        mensaje: 'Justo se ocupó ese horario mientras conversábamos. ¿Querés que busquemos otro horario cercano?',
      };
    }
    throw err;
  }

  const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(reservaId);

  let googleSincronizado = false;
  let errorGoogle = null;
  try {
    const eventId = await googleCalendar.crearEvento(reserva, config);
    db.prepare('UPDATE reservas SET google_event_id = ? WHERE id = ?').run(eventId, reservaId);
    googleSincronizado = true;
  } catch (err) {
    console.warn(`[openai] No se pudo sincronizar la reserva ${reservaId} con Google Calendar:`, err.message);
    errorGoogle = err.message;
  }

  return {
    exito: true,
    google_sincronizado: googleSincronizado,
    error_google: errorGoogle,
    reserva_id: reservaId,
    mensaje: `Reserva confirmada para ${nombre_cliente}, ${cantidad_personas} personas, el ${formatearISOEnEspanol(
      fecha_reserva
    )}. ¡Te esperamos! ✅`,
  };
}

/**
 * 4. cancelar_reserva
 */
async function cancelarReserva({ id }) {
  const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);
  if (!reserva) {
    return { exito: false, mensaje: 'No encontré ninguna reserva con ese número.' };
  }
  db.prepare(`UPDATE reservas SET estado = 'cancelada', actualizado_en = datetime('now','localtime') WHERE id = ?`).run(id);

  if (reserva.google_event_id) {
    try {
      await googleCalendar.borrarEvento(reserva.google_event_id);
    } catch (err) {
      console.warn(`[openai] No se pudo borrar el evento de Calendar de la reserva ${id}:`, err.message);
    }
  }

  return { exito: true, mensaje: `Listo, cancelé la reserva de ${reserva.nombre_cliente}. ¡Esperamos verte otro día! 🙌` };
}

/**
 * 5. reprogramar_reserva
 */
async function reprogramarReserva({ id, fecha_reserva, cantidad_personas }) {
  const reservaActual = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);
  if (!reservaActual) {
    return { exito: false, mensaje: 'No encontré ninguna reserva con ese número.' };
  }
  const config = obtenerConfig();

  const nuevaFecha = fecha_reserva || reservaActual.fecha_reserva;
  const nuevasPersonas = cantidad_personas != null ? cantidad_personas : reservaActual.cantidad_personas;

  if (!esISOValido(nuevaFecha)) {
    return { exito: false, mensaje: 'La nueva fecha/hora no tiene un formato válido.' };
  }
  if (Number(nuevasPersonas) > config.capacidad_total) {
    return {
      exito: false,
      mensaje: `Para grupos de más de ${config.capacidad_total} personas, llamá directamente al restaurante al ${config.telefono}.`,
    };
  }
  const ventana = validarVentanaDeServicio(nuevaFecha, config);
  if (!ventana.ok) {
    return { exito: false, mensaje: ventana.motivo };
  }

  const transaccion = db.transaction(() => {
    const ocupacion = ocupacionEnVentana(nuevaFecha, config.duracion_reserva_min, id);
    if (ocupacion + Number(nuevasPersonas) > config.capacidad_total) {
      throw new Error('SIN_CAPACIDAD');
    }
    db.prepare(
      `UPDATE reservas SET fecha_reserva = ?, cantidad_personas = ?, actualizado_en = datetime('now','localtime') WHERE id = ?`
    ).run(nuevaFecha, nuevasPersonas, id);
  });

  try {
    transaccion();
  } catch (err) {
    if (err.message === 'SIN_CAPACIDAD') {
      return { exito: false, mensaje: 'Ese nuevo horario no tiene lugar disponible. ¿Probamos con otro?' };
    }
    throw err;
  }

  const reservaActualizada = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);

  if (reservaActualizada.google_event_id) {
    try {
      await googleCalendar.actualizarEvento(reservaActualizada.google_event_id, reservaActualizada, config);
    } catch (err) {
      console.warn(`[openai] No se pudo actualizar el evento de Calendar de la reserva ${id}:`, err.message);
    }
  }

  return {
    exito: true,
    mensaje: `Listo, reprogramé tu reserva para el ${formatearISOEnEspanol(nuevaFecha)}, ${nuevasPersonas} personas. ✅`,
  };
}

/**
 * 6. obtener_info_restaurante
 */
function obtenerInfoRestaurante() {
  const config = obtenerConfig();
  return {
    nombre_restaurante: config.nombre_restaurante,
    direccion: config.direccion,
    telefono: config.telefono,
    email: config.email,
    horarios: config.horarios,
    tipo_cocina: config.tipo_cocina,
    sobre_restaurante: config.sobre_restaurante,
    capacidad_total: config.capacidad_total,
  };
}

/* ------------------------------------------------------------------ */
/* Definición de herramientas para OpenAI function calling             */
/* ------------------------------------------------------------------ */

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'consultar_disponibilidad',
      description:
        'Consulta los horarios disponibles (almuerzo y cena) para una fecha y una cantidad de personas dadas. Hay que llamarla SIEMPRE antes de prometer un horario.',
      parameters: {
        type: 'object',
        properties: {
          fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD.' },
          cantidad_personas: { type: 'integer', description: 'Cantidad de personas para la reserva.' },
        },
        required: ['fecha', 'cantidad_personas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ver_reservas_cliente',
      description: 'Devuelve las reservas activas (no canceladas) de un cliente dado su número de teléfono.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: { type: 'string', description: 'Número de teléfono del cliente.' },
        },
        required: ['numero_telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'agendar_reserva',
      description:
        'Crea una nueva reserva. Solo se debe llamar después de confirmar con el cliente los 5 datos (nombre, personas, día, horario, especificaciones) y haber recibido un "sí" explícito al resumen de confirmación.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: { type: 'string' },
          nombre_cliente: { type: 'string' },
          fecha_reserva: { type: 'string', description: 'Fecha y hora en formato ISO YYYY-MM-DDTHH:MM:SS.' },
          cantidad_personas: { type: 'integer' },
          especificaciones: {
            type: 'string',
            description: 'Alergias, restricciones, ocasión especial o preferencia de mesa. Usar "ninguna" si no aplica.',
          },
        },
        required: ['numero_telefono', 'nombre_cliente', 'fecha_reserva', 'cantidad_personas', 'especificaciones'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancelar_reserva',
      description: 'Cancela una reserva existente dado su ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la reserva a cancelar.' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reprogramar_reserva',
      description: 'Cambia la fecha/hora y/o la cantidad de personas de una reserva existente.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID de la reserva a reprogramar.' },
          fecha_reserva: { type: 'string', description: 'Nueva fecha y hora ISO YYYY-MM-DDTHH:MM:SS (opcional).' },
          cantidad_personas: { type: 'integer', description: 'Nueva cantidad de personas (opcional).' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_info_restaurante',
      description: 'Devuelve información general del restaurante (dirección, teléfono, horarios, tipo de cocina, etc.) para responder preguntas frecuentes.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

const IMPLEMENTACIONES = {
  consultar_disponibilidad: async (args) => consultarDisponibilidad(args),
  ver_reservas_cliente: async (args) => verReservasCliente(args),
  agendar_reserva: async (args) => agendarReserva(args),
  cancelar_reserva: async (args) => cancelarReserva(args),
  reprogramar_reserva: async (args) => reprogramarReserva(args),
  obtener_info_restaurante: async () => obtenerInfoRestaurante(),
};

/* ------------------------------------------------------------------ */
/* Prompt del sistema                                                   */
/* ------------------------------------------------------------------ */

function construirSystemPrompt(numeroTelefono) {
  const config = obtenerConfig();
  const hoy = formatearHoyEnEspanol(process.env.TZ_RESTAURANTE || TZ_DEFAULT);
  const tz = process.env.TZ_RESTAURANTE || TZ_DEFAULT;

  return `Sos Valentina, la anfitriona virtual de ${config.nombre_restaurante}. Atendés reservas por WhatsApp en español rioplatense (usá "vos", "querés", "podés" — nunca "tú" ni "usted").

DATOS DEL RESTAURANTE:
- Nombre: ${config.nombre_restaurante}
- Dirección: ${config.direccion || 'no especificada'}
- Teléfono: ${config.telefono || 'no especificado'}
- Email: ${config.email || 'no especificado'}
- Tipo de cocina: ${config.tipo_cocina || 'no especificado'}
- Horarios: ${config.horarios || 'no especificado'}
- Sobre nosotros: ${config.sobre_restaurante || 'no especificado'}
- Hoy es: ${hoy}
- Zona horaria: ${tz}
- Número de teléfono del cliente con el que estás hablando: ${numeroTelefono}

REGLAS DE CONVERSACIÓN (seguilas al pie de la letra):
1. Nunca pidas todos los datos de la reserva en un solo mensaje. Un dato por turno de conversación; esperá la respuesta antes de pedir el siguiente.
2. Orden ideal: nombre, cantidad de personas, día, horario, especificaciones. Nunca vuelvas a pedir un dato que el cliente ya te dio antes en la conversación.
3. Si el cliente te da varios datos juntos de una, aceptalos todos y pedí solamente lo que falte, un dato a la vez.
4. Solo llamá a la herramienta agendar_reserva cuando los 5 datos estén confirmados (las especificaciones pueden ser "ninguna") — nunca antes.
5. Antes de llamar a agendar_reserva, hacé un resumen breve de confirmación (por ejemplo: "Entonces te confirmo: Juan, 4 personas, viernes 8 de agosto a las 21:00, sin restricciones. ¿Lo dejo agendado?") y esperá un "sí" explícito.
6. SIEMPRE consultá la disponibilidad con consultar_disponibilidad antes de prometer un horario; si no hay lugar, ofrecé 2 o 3 alternativas reales del mismo día o de días cercanos.
7. Sé cálida pero concisa — máximo 2-3 oraciones por mensaje, uso moderado de emojis (🍽️ ✨ 📅 ✅).
8. La fecha de hoy te la doy arriba en español; resolvé expresiones como "mañana", "el viernes" o "este sábado" a fechas reales.
9. Si algo no se puede resolver por acá, ofrecé el número de teléfono del restaurante.
10. Además, recordá pedir explícitamente: "¿alguna alergia, restricción o pedido especial que tengamos que tener en cuenta?" y aceptar "ninguna" como respuesta válida.`;
}

/* ------------------------------------------------------------------ */
/* Loop principal del agente con tool calling multi-ronda               */
/* ------------------------------------------------------------------ */

/**
 * Ejecuta la conversación con Valentina.
 * @param {string} numeroTelefono
 * @param {Array<{role: string, content: string}>} historial - mensajes previos (sin el system prompt)
 * @returns {Promise<string>} la respuesta final en texto plano
 */
async function generarRespuestaValentina(numeroTelefono, historial) {
  const client = getClient();
  const systemPrompt = construirSystemPrompt(numeroTelefono);

  let mensajes = [{ role: 'system', content: systemPrompt }, ...historial];

  const MAX_RONDAS = 5;
  for (let ronda = 0; ronda < MAX_RONDAS; ronda++) {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: mensajes,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: 1000,
    });

    const mensaje = completion.choices[0].message;

    if (!mensaje.tool_calls || mensaje.tool_calls.length === 0) {
      return mensaje.content || 'Disculpá, ¿me lo podés repetir?';
    }

    // Guardamos el mensaje del assistant con sus tool_calls.
    mensajes.push(mensaje);

    for (const toolCall of mensaje.tool_calls) {
      const nombreHerramienta = toolCall.function.name;
      let args = {};
      try {
        args = JSON.parse(toolCall.function.arguments || '{}');
      } catch (err) {
        log(`⚠️  No se pudieron parsear los argumentos de ${nombreHerramienta}:`, err.message);
      }

      log(`🔧 Ejecutando herramienta: ${nombreHerramienta}`, JSON.stringify(args));

      let resultado;
      try {
        const implementacion = IMPLEMENTACIONES[nombreHerramienta];
        if (!implementacion) {
          resultado = { error: `Herramienta desconocida: ${nombreHerramienta}` };
        } else {
          // agendar_reserva necesita el número real del que escribe si el modelo no lo mandó bien.
          if (
            (nombreHerramienta === 'agendar_reserva' || nombreHerramienta === 'ver_reservas_cliente') &&
            !args.numero_telefono
          ) {
            args.numero_telefono = numeroTelefono;
          }
          resultado = await implementacion(args);
        }
      } catch (err) {
        log(`❌ Error ejecutando ${nombreHerramienta}:`, err.message);
        resultado = { error: true, mensaje: 'Ocurrió un error interno procesando esta acción.' };
      }

      mensajes.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(resultado),
      });
    }
  }

  return 'Disculpá, tuve un problema procesando tu pedido. ¿Podés intentar de nuevo en un momento?';
}

module.exports = {
  generarRespuestaValentina,
  construirSystemPrompt,
  TOOLS,
  // exportadas para poder testear/usar desde otros módulos si hace falta
  consultarDisponibilidad,
  verReservasCliente,
  agendarReserva,
  cancelarReserva,
  reprogramarReserva,
  obtenerInfoRestaurante,
};

const BASE_URL = '/api';

async function manejarRespuesta(res) {
  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) mensaje = data.error;
    } catch (e) {
      // el cuerpo no era JSON, usamos el mensaje genérico
    }
    throw new Error(mensaje);
  }
  if (res.status === 204) return null;
  const tipo = res.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return res.json();
  return res.text();
}

async function solicitud(path, opciones = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    ...opciones,
  });
  return manejarRespuesta(res);
}

export const api = {
  get: (path) => solicitud(path),
  post: (path, body) => solicitud(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => solicitud(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => solicitud(path, { method: 'DELETE' }),
};

export default api;

import { API_BASE_URL } from './apiConfig';
import { fetchJson } from './serviceUtils';

const USERS_URL = `${API_BASE_URL}/usuarios`;

export async function loginUsuario(email, password) {
  return fetchJson(`${USERS_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

}


export async function registrarEspectador({ email, password, apodo }) {
  return fetchJson(USERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      apodo,
      rol: 'ESPECTADOR',
    }),
  });

}


export async function actualizarUsuario(id, { email, password, apodo, rol, fechaRegistro }) {
  return fetchJson(`${USERS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      apodo,
      rol,
      fechaRegistro,
    }),
  });

}


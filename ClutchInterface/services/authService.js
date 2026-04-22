import { API_BASE_URL, parseResponse } from './apiConfig';

const USERS_URL = `${API_BASE_URL}/usuarios`;

export async function loginUsuario(email, password) {
  const response = await fetch(`${USERS_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse(response);
}

export async function registrarEspectador({ email, password, apodo }) {
  const response = await fetch(USERS_URL, {
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

  return parseResponse(response);
}
